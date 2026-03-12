"""
Agents API Router

Provides endpoints to list available agents and validate them.
"""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter

from backend.engine.validator import validate_agent_folder

router = APIRouter()

AGENTS_DIR = Path(__file__).parent


def _agent_dirs() -> list[Path]:
    """Return all sub-directories in backend/agents/ that contain a config.json."""
    return sorted(
        d for d in AGENTS_DIR.iterdir() if d.is_dir() and (d / "config.json").exists()
    )


@router.get("/")
async def list_agents():
    """List all registered agents with basic info."""
    import json

    agents = []
    for d in _agent_dirs():
        with open(d / "config.json", encoding="utf-8") as f:
            cfg = json.load(f)
        agents.append(
            {
                "slug": d.name,
                "name": cfg.get("name"),
                "description": cfg.get("description"),
                "agent_type": cfg.get("agent_type", "lightweight"),
                "author": cfg.get("author", ""),
                "tools": cfg.get("tools", []),
                "has_training": (d / "training").is_dir(),
                "has_data_sample": (d / "data_sample").is_dir(),
                "has_logic_explanation": (d / "logic_explanation.md").exists(),
            }
        )
    return agents


@router.get("/{agent_slug}/validate")
async def validate_agent(agent_slug: str):
    """Run validation checks on a specific agent."""
    agent_dir = AGENTS_DIR / agent_slug
    if not agent_dir.exists():
        return {"valid": False, "errors": [f"Agent folder '{agent_slug}' not found."], "warnings": []}

    result = validate_agent_folder(agent_dir)
    return {"valid": result.valid, "errors": result.errors, "warnings": result.warnings}
