"""
Sample tools for the Logistics Optimizer agent.

Each public function here can be declared in config.json under "tools"
and will be dynamically loaded by the BaseAgent.load_tools() mechanism.
"""

from __future__ import annotations

from typing import Any


def check_inventory(warehouse_stock: dict[str, int], item: str) -> dict[str, Any]:
    """Check current stock level for a specific item."""
    level = warehouse_stock.get(item, 0)
    status = "critical" if level < 50 else "low" if level < 100 else "ok"
    return {"item": item, "quantity": level, "status": status}


def calculate_shipping_cost(
    supplier: str,
    item: str,
    quantity: int,
    *,
    rush: bool = False,
) -> dict[str, Any]:
    """Estimate shipping cost from a supplier. Rush orders cost 2x."""
    base_rates = {
        "supplier_a": 2.5,
        "supplier_b": 3.0,
        "supplier_c": 4.0,
    }
    rate = base_rates.get(supplier, 3.5)
    cost = rate * quantity * (2 if rush else 1)
    return {
        "supplier": supplier,
        "item": item,
        "quantity": quantity,
        "rush": rush,
        "estimated_cost": round(cost, 2),
    }
