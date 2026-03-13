"""
Crisis Advisor — API-Powered Agent Implementation

Uses external LLM APIs (OpenAI, Anthropic, Ollama, or custom endpoint) to
analyze supply chain crises and provide strategic decisions.

This agent demonstrates the BYOK (Bring Your Own Key) pattern:
  - User enters their API key in the Arena UI
  - Key is passed at runtime, never stored
  - Agent calls self.call_llm() to get LLM responses

If no API key is provided or the LLM call fails, the agent falls back
to a simple heuristic so the simulation can still complete.
"""

from __future__ import annotations

import json
from typing import Any

from engine.base_agent import AgentConfig, AgentResponse, APIPoweredAgent


class CrisisAdvisorAgent(APIPoweredAgent):
    """Agent that leverages LLMs for strategic supply chain crisis management."""

    def decide(self, scenario_state: dict[str, Any]) -> AgentResponse:
        warehouse = scenario_state.get("warehouse_stock", {})
        daily_demand = scenario_state.get("daily_demand", {})
        supplier_status = scenario_state.get("supplier_status", {})
        budget = scenario_state.get("budget", 0)
        turn = scenario_state.get("turn", 1)
        history = scenario_state.get("history", [])

        # Build a structured prompt for the LLM
        prompt = self._build_prompt(warehouse, daily_demand, supplier_status, budget, turn, history)

        try:
            raw_response = self.call_llm(prompt, temperature=0.2, max_tokens=400)
            return self._parse_llm_response(raw_response)
        except Exception:
            # Fallback to heuristic if LLM is unavailable
            return self._heuristic_fallback(warehouse, daily_demand)

    def _build_prompt(
        self,
        warehouse: dict,
        daily_demand: dict,
        supplier_status: dict,
        budget: float,
        turn: int,
        history: list,
    ) -> str:
        # Calculate days remaining per material
        stock_analysis = []
        for item, stock in warehouse.items():
            demand = daily_demand.get(item, 1)
            days_left = stock / demand if demand > 0 else 999
            stock_analysis.append(f"  - {item}: {stock:.0f} units in stock, {demand:.0f}/day demand, ~{days_left:.1f} days left")

        supplier_lines = [f"  - {name}: {status}" for name, status in supplier_status.items()]

        history_lines = []
        for h in history[-4:]:  # Last 4 actions
            history_lines.append(f"  - {h.get('agent','?')}: {h.get('action','?')}")

        return f"""SUPPLY CHAIN CRISIS — Turn {turn}

WAREHOUSE STATUS:
{chr(10).join(stock_analysis)}

SUPPLIER STATUS:
{chr(10).join(supplier_lines)}

REMAINING BUDGET: {budget:,.0f}

RECENT ACTIONS:
{chr(10).join(history_lines) if history_lines else '  (none yet)'}

Analyze the situation and respond with a JSON decision. Consider:
1. Which material is most critical?
2. Are suppliers available to fulfill orders?
3. Is the budget sufficient?
4. What did other agents do in previous turns?"""

    def _parse_llm_response(self, raw: str) -> AgentResponse:
        """Parse LLM JSON response into an AgentResponse."""
        # Try to extract JSON from the response
        text = raw.strip()

        # Handle markdown code blocks
        if "```" in text:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                text = text[start:end]

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            # If JSON parsing fails, treat the whole response as reasoning
            return AgentResponse(
                action="monitor",
                reasoning=f"LLM response (unparsed): {raw[:200]}",
                data={},
            )

        action = data.get("action", "monitor")
        reasoning = data.get("reasoning", "No reasoning provided")

        response_data = {}
        if data.get("ordered_item"):
            response_data["ordered_item"] = data["ordered_item"]
        if data.get("ordered_quantity"):
            response_data["ordered_quantity"] = int(data["ordered_quantity"])

        return AgentResponse(action=action, reasoning=reasoning, data=response_data)

    def _heuristic_fallback(self, warehouse: dict, daily_demand: dict) -> AgentResponse:
        """Simple fallback when LLM is unavailable."""
        critical_item = None
        min_days = float("inf")

        for item, stock in warehouse.items():
            demand = daily_demand.get(item, 1)
            days_left = stock / demand if demand > 0 else float("inf")
            if days_left < min_days:
                min_days = days_left
                critical_item = item

        if critical_item and min_days < 3:
            order_qty = int(daily_demand.get(critical_item, 50) * 4)
            return AgentResponse(
                action="emergency_reorder",
                reasoning=f"[Fallback mode — LLM unavailable] Critical: {critical_item} has {min_days:.1f} days of stock. Ordering {order_qty} units.",
                data={"ordered_item": critical_item, "ordered_quantity": order_qty},
            )

        return AgentResponse(
            action="monitor",
            reasoning=f"[Fallback mode — LLM unavailable] Stock levels adequate. Lowest: {critical_item} with {min_days:.1f} days.",
            data={},
        )
