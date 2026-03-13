"""
Demand Forecaster — HeavyWeight Agent Implementation

Loads a trained LSTM model from weights/ and uses it to predict demand,
then makes restocking decisions based on predictions.

If weights are not found (e.g. training hasn't been run yet), the agent
falls back to using the scenario's daily_demand as the prediction.
Run `python training/train.py` from the demand_forecaster folder to produce weights.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import torch

from backend.engine.base_agent import AgentConfig, AgentResponse, HeavyWeightAgent


class DemandForecasterAgent(HeavyWeightAgent):
    """Agent powered by a trained LSTM demand prediction model."""

    def setup(self) -> None:
        """Load the trained model weights. Falls back gracefully if weights don't exist."""
        from backend.agents.demand_forecaster.model import DemandLSTM

        self.model = DemandLSTM(input_size=9, hidden_size=64, num_layers=2, output_size=3)
        self.materials = ["steel", "plastic", "electronics"]
        self._weights_loaded = False

        weights_path = Path(__file__).parent / self.config.model.weights_path
        if weights_path.exists():
            state_dict = torch.load(
                weights_path,
                map_location=self.config.inference.device,
                weights_only=True,
            )
            self.model.load_state_dict(state_dict)
            self._weights_loaded = True
        else:
            # No weights yet — model will use random initialisation as a fallback
            # This is intentional for demo purposes; run training/train.py to train
            pass

        self.model.eval()

    def decide(self, scenario_state: dict[str, Any]) -> AgentResponse:
        warehouse = scenario_state.get("warehouse_stock", {})
        daily_demand = scenario_state.get("daily_demand", {})
        supplier_status = scenario_state.get("supplier_status", {})

        # Build input tensor with 9 features: 3 materials × [stock_norm, demand_norm, supplier_rel]
        # Normalization ranges match training data
        stock_maxes = [900.0, 550.0, 1400.0]  # Approx max stock from training
        demand_maxes = [85.0, 55.0, 140.0]    # Approx max demand from training
        reliability = self._supplier_score(supplier_status)

        features = []
        for i, material in enumerate(self.materials):
            stock = float(warehouse.get(material, 0))
            demand = float(daily_demand.get(material, 0))
            stock_norm = min(stock / stock_maxes[i], 1.0)
            demand_norm = min(demand / demand_maxes[i], 1.0)
            features.extend([stock_norm, demand_norm, reliability])

        # Shape: (1, 7, 9) — repeat current state as a pseudo-sequence
        input_tensor = torch.tensor([features] * 7, dtype=torch.float32).unsqueeze(0)

        with torch.no_grad():
            predicted_demand = self.model(input_tensor).squeeze(0)  # (3,)

        # If weights were not loaded, fall back to known daily_demand values
        # (random init produces garbage predictions, so we substitute real demand)
        if not self._weights_loaded:
            fallback = [float(daily_demand.get(m, 1)) for m in self.materials]
            predicted_demand = torch.tensor(fallback)

        weights_note = "" if self._weights_loaded else " [untrained model — using daily_demand as fallback]"

        # Find the most critical material
        critical_idx = None
        min_days = float("inf")
        for i, material in enumerate(self.materials):
            stock = warehouse.get(material, 0)
            pred = max(predicted_demand[i].item(), 1.0)  # Prevent division by zero
            days_left = stock / pred
            if days_left < min_days:
                min_days = days_left
                critical_idx = i

        critical_material = self.materials[critical_idx] if critical_idx is not None else "unknown"
        pred_value = predicted_demand[critical_idx].item() if critical_idx is not None else 0

        if min_days < 2:
            order_qty = int(pred_value * 5)
            return AgentResponse(
                action="emergency_reorder",
                reasoning=(
                    f"LSTM predicts {critical_material} demand at {pred_value:.1f}/day.{weights_note} "
                    f"Only {min_days:.1f} days of stock remaining. Emergency order: {order_qty} units."
                ),
                data={"ordered_item": critical_material, "ordered_quantity": order_qty,
                      "predicted_demand": {m: round(predicted_demand[i].item(), 2) for i, m in enumerate(self.materials)}},
            )
        elif min_days < 5:
            order_qty = int(pred_value * 3)
            return AgentResponse(
                action="reorder",
                reasoning=(
                    f"LSTM predicts {critical_material} demand at {pred_value:.1f}/day.{weights_note} "
                    f"{min_days:.1f} days remaining. Standard reorder: {order_qty} units."
                ),
                data={"ordered_item": critical_material, "ordered_quantity": order_qty,
                      "predicted_demand": {m: round(predicted_demand[i].item(), 2) for i, m in enumerate(self.materials)}},
            )
        else:
            return AgentResponse(
                action="monitor",
                reasoning=(
                    f"LSTM predictions show adequate stock.{weights_note} "
                    f"Lowest: {critical_material} with {min_days:.1f} days."
                ),
                data={"predicted_demand": {m: round(predicted_demand[i].item(), 2) for i, m in enumerate(self.materials)}},
            )

    @staticmethod
    def _supplier_score(supplier_status: dict[str, str]) -> float:
        """Average supplier reliability as a float 0-1."""
        scores = {"operational": 1.0, "limited": 0.5, "offline": 0.0}
        if not supplier_status:
            return 0.5
        total = sum(scores.get(s, 0.5) for s in supplier_status.values())
        return total / len(supplier_status)
