"""
Demand Forecaster — HeavyWeight Agent Implementation

Loads a trained LSTM model from weights/ and uses it to predict demand,
then makes restocking decisions based on predictions.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import torch

from backend.engine.base_agent import AgentConfig, AgentResponse, HeavyWeightAgent


class DemandForecasterAgent(HeavyWeightAgent):
    """Agent powered by a trained LSTM demand prediction model."""

    def setup(self) -> None:
        """Load the trained model weights."""
        from backend.agents.demand_forecaster.model import DemandLSTM

        self.model = DemandLSTM(input_size=3, hidden_size=64, num_layers=2, output_size=3)

        weights_path = Path(__file__).parent / self.config.model.weights_path
        if weights_path.exists():
            state_dict = torch.load(weights_path, map_location=self.config.inference.device, weights_only=True)
            self.model.load_state_dict(state_dict)

        self.model.eval()
        self.materials = ["steel", "plastic", "electronics"]

    def decide(self, scenario_state: dict[str, Any]) -> AgentResponse:
        warehouse = scenario_state.get("warehouse_stock", {})
        daily_demand = scenario_state.get("daily_demand", {})
        supplier_status = scenario_state.get("supplier_status", {})

        # Build input tensor from scenario state (simulated 7-day history)
        # In a real scenario, history would accumulate over turns
        features = []
        for material in self.materials:
            stock = warehouse.get(material, 0)
            demand = daily_demand.get(material, 0)
            # Convert supplier reliability to a numeric score
            reliability = self._supplier_score(supplier_status)
            features.append([float(stock), float(demand), reliability])

        # Shape: (1, 7, 3) — repeat current state as a pseudo-sequence for demo
        input_tensor = torch.tensor([features] * 7, dtype=torch.float32).unsqueeze(0)  # (1, 7, 3)

        # Run inference
        with torch.no_grad():
            predicted_demand = self.model(input_tensor).squeeze(0)  # (3,)

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
                    f"LSTM predicts {critical_material} demand at {pred_value:.1f}/day. "
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
                    f"LSTM predicts {critical_material} demand at {pred_value:.1f}/day. "
                    f"{min_days:.1f} days remaining. Standard reorder: {order_qty} units."
                ),
                data={"ordered_item": critical_material, "ordered_quantity": order_qty,
                      "predicted_demand": {m: round(predicted_demand[i].item(), 2) for i, m in enumerate(self.materials)}},
            )
        else:
            return AgentResponse(
                action="monitor",
                reasoning=(
                    f"LSTM predictions show adequate stock. "
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
