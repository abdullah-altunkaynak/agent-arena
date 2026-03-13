"""
Agents API Router

Provides endpoints to list available agents and validate them.
"""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter

from engine.validator import validate_agent_folder

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


@router.get("/{agent_slug}")
async def get_agent_detail(agent_slug: str):
    """Return full agent profile: config, logic explanation, training info, data sample info."""
    import json

    agent_dir = AGENTS_DIR / agent_slug
    if not agent_dir.exists() or not (agent_dir / "config.json").exists():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Agent '{agent_slug}' not found.")

    with open(agent_dir / "config.json", encoding="utf-8") as f:
        cfg = json.load(f)

    # Logic explanation markdown
    logic_path = agent_dir / "logic_explanation.md"
    logic_md = logic_path.read_text(encoding="utf-8") if logic_path.exists() else None

    # Training files listing
    training_dir = agent_dir / "training"
    training_files = []
    if training_dir.is_dir():
        training_files = [f.name for f in sorted(training_dir.iterdir()) if f.is_file()]

    # Data sample info
    data_dir = agent_dir / "data_sample"
    data_files = []
    data_readme = None
    if data_dir.is_dir():
        for f in sorted(data_dir.iterdir()):
            if f.is_file():
                data_files.append({"name": f.name, "size_bytes": f.stat().st_size})
        readme_path = data_dir / "README.md"
        if readme_path.exists():
            data_readme = readme_path.read_text(encoding="utf-8")

    # Weights info
    weights_dir = agent_dir / "weights"
    weights_files = []
    has_weights = False
    if weights_dir.is_dir():
        for f in sorted(weights_dir.iterdir()):
            if f.is_file() and f.name != "README.md":
                weights_files.append({"name": f.name, "size_bytes": f.stat().st_size})
                has_weights = True

    # Validation
    result = validate_agent_folder(agent_dir)

    return {
        "slug": agent_slug,
        "config": cfg,
        "logic_explanation": logic_md,
        "training_files": training_files,
        "data_sample": {"files": data_files, "readme": data_readme},
        "weights": {"files": weights_files, "has_weights": has_weights},
        "validation": {"valid": result.valid, "errors": result.errors, "warnings": result.warnings},
    }
