"""
Agent Validator — Phase 1 (Extended)

Validates that a contributed agent folder has the correct structure:
  - config.json exists and passes JSON Schema validation
  - agent_type determines which additional checks run
  - If tools are declared, functions.py exists and exports them
  - The agent module exposes a class that inherits BaseAgent
  - logic_explanation.md is recommended for all agents
  - For heavyweight: training/ and weights/ are checked
  - For heavyweight: data_sample/ is recommended
"""

from __future__ import annotations

import importlib
import json
from dataclasses import dataclass, field
from pathlib import Path

import jsonschema

_SCHEMA_PATH = Path(__file__).parent / "agent_config_schema.json"


@dataclass
class ValidationResult:
    valid: bool = True
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def fail(self, msg: str) -> None:
        self.valid = False
        self.errors.append(msg)

    def warn(self, msg: str) -> None:
        self.warnings.append(msg)


def _load_schema() -> dict:
    with open(_SCHEMA_PATH, encoding="utf-8") as f:
        return json.load(f)


def validate_agent_folder(agent_dir: Path) -> ValidationResult:
    """Run all validation checks on a single agent directory."""
    result = ValidationResult()

    # 1. config.json must exist
    config_path = agent_dir / "config.json"
    if not config_path.exists():
        result.fail(f"Missing config.json in {agent_dir.name}/")
        return result

    # 2. config.json must be valid JSON and match the schema
    try:
        with open(config_path, encoding="utf-8") as f:
            config_data = json.load(f)
    except json.JSONDecodeError as exc:
        result.fail(f"config.json is not valid JSON: {exc}")
        return result

    schema = _load_schema()
    try:
        jsonschema.validate(instance=config_data, schema=schema)
    except jsonschema.ValidationError as exc:
        result.fail(f"config.json schema error: {exc.message}")

    agent_type = config_data.get("agent_type", "lightweight")

    # 3. If tools are declared, functions.py must exist and export them
    declared_tools: list[str] = config_data.get("tools", [])
    if declared_tools:
        functions_path = agent_dir / "functions.py"
        if not functions_path.exists():
            result.fail(
                f"config.json declares tools {declared_tools} but functions.py is missing."
            )
        else:
            try:
                spec_name = f"backend.agents.{agent_dir.name}.functions"
                mod = importlib.import_module(spec_name)
                for tool_name in declared_tools:
                    if not hasattr(mod, tool_name):
                        result.fail(
                            f"Tool '{tool_name}' declared in config.json but not found in functions.py"
                        )
                    elif not callable(getattr(mod, tool_name)):
                        result.fail(f"'{tool_name}' exists in functions.py but is not callable")
            except ImportError as exc:
                result.fail(f"Could not import functions.py: {exc}")

    # 4. agent.py must exist and expose a BaseAgent subclass
    agent_module_path = agent_dir / "agent.py"
    if not agent_module_path.exists():
        result.fail(f"Missing agent.py in {agent_dir.name}/")
    else:
        try:
            spec_name = f"backend.agents.{agent_dir.name}.agent"
            mod = importlib.import_module(spec_name)
            from backend.engine.base_agent import BaseAgent

            agent_classes = [
                obj
                for name, obj in vars(mod).items()
                if isinstance(obj, type) and issubclass(obj, BaseAgent) and obj is not BaseAgent
            ]
            if not agent_classes:
                result.fail(
                    f"agent.py in {agent_dir.name}/ does not contain a BaseAgent subclass."
                )
        except ImportError as exc:
            result.fail(f"Could not import agent.py: {exc}")

    # 5. logic_explanation.md — recommended for all agents
    if not (agent_dir / "logic_explanation.md").exists():
        result.warn(
            f"Missing logic_explanation.md in {agent_dir.name}/. "
            f"Strongly recommended: explain your agent's decision-making logic."
        )

    # 6. Heavyweight-specific checks
    if agent_type == "heavyweight":
        # weights/ directory or weights file must exist
        model_cfg = config_data.get("model", {})
        weights_path = model_cfg.get("weights_path", "")
        if weights_path:
            full_weights_path = agent_dir / weights_path
            if not full_weights_path.exists():
                result.fail(
                    f"model.weights_path points to '{weights_path}' but file does not exist."
                )
        else:
            if not (agent_dir / "weights").exists():
                result.warn(
                    f"Heavyweight agent '{agent_dir.name}' has no weights/ directory. "
                    f"Add trained model weights or specify model.weights_path in config.json."
                )

        # training/ directory — recommended
        if not (agent_dir / "training").exists():
            result.warn(
                f"Missing training/ directory in {agent_dir.name}/. "
                f"Recommended: share your training scripts so others can learn."
            )

        # data_sample/ directory — recommended
        if not (agent_dir / "data_sample").exists():
            result.warn(
                f"Missing data_sample/ directory in {agent_dir.name}/. "
                f"Recommended: include sample data that shows the training data format."
            )

    return result
