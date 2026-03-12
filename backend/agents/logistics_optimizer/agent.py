"""
Logistics Optimizer — Lightweight (rule-based) agent implementation.

This serves as a reference for engineers who want to contribute their own agents.
It uses simple threshold logic with no AI model.
"""

from __future__ import annotations

from typing import Any

from backend.engine.base_agent import AgentConfig, AgentResponse, LightweightAgent


class LogisticsOptimizerAgent(LightweightAgent):
    """Sample rule-based agent that handles supply-chain crisis scenarios."""

    def decide(self, scenario_state: dict[str, Any]) -> AgentResponse:
        warehouse = scenario_state.get("warehouse_stock", {})
        daily_demand = scenario_state.get("daily_demand", {})
        budget = scenario_state.get("budget", 0)

        # Find the most critical item (fewest days of stock remaining)
        critical_item = None
        min_days = float("inf")
        for item, stock in warehouse.items():
            demand = daily_demand.get(item, 1)
            days_left = stock / demand if demand > 0 else float("inf")
            if days_left < min_days:
                min_days = days_left
                critical_item = item

        if critical_item is None:
            return AgentResponse(
                action="hold",
                reasoning="No inventory data available. Holding position.",
            )

        # Decide on action based on urgency
        if min_days < 2:
            order_qty = daily_demand.get(critical_item, 50) * 5
            return AgentResponse(
                action="emergency_reorder",
                reasoning=(
                    f"Critical shortage: {critical_item} has only {min_days:.1f} days of stock. "
                    f"Placing emergency order for {order_qty} units."
                ),
                data={"ordered_item": critical_item, "ordered_quantity": order_qty},
            )
        elif min_days < 5:
            order_qty = daily_demand.get(critical_item, 50) * 3
            return AgentResponse(
                action="reorder",
                reasoning=(
                    f"Low stock warning: {critical_item} has {min_days:.1f} days remaining. "
                    f"Ordering {order_qty} units from available supplier."
                ),
                data={"ordered_item": critical_item, "ordered_quantity": order_qty},
            )
        else:
            return AgentResponse(
                action="monitor",
                reasoning=f"Stock levels acceptable. Lowest item is {critical_item} with {min_days:.1f} days.",
            )
