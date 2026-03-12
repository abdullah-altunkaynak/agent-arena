"""
Synapse Orchestrator — Phase 2

Manages the simulation loop:
  1. Load a scenario
  2. Instantiate participating agents (lightweight, api_powered, or heavyweight)
  3. Run turns — each turn, the current agent receives the shared state
     and returns an action
  4. Update state and pass it to the next agent
  5. Produce a final evaluation
"""

from __future__ import annotations

import importlib
import inspect
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.engine.base_agent import AgentConfig, AgentResponse, BaseAgent

router = APIRouter()

# ── Scenario loader ─────────────────────────────────────────────────────────

SCENARIOS_DIR = Path(__file__).parent.parent / "scenarios"
AGENTS_DIR = Path(__file__).parent.parent / "agents"


@dataclass
class Scenario:
    id: str
    name: str
    description: str
    initial_state: dict[str, Any]
    max_turns: int = 6
    eval_criteria: list[str] = field(default_factory=lambda: ["cost", "speed", "accuracy"])

    @classmethod
    def from_file(cls, path: Path) -> "Scenario":
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return cls(
            id=data["id"],
            name=data["name"],
            description=data["description"],
            initial_state=data["initial_state"],
            max_turns=data.get("max_turns", 6),
            eval_criteria=data.get("eval_criteria", ["cost", "speed", "accuracy"]),
        )


def list_scenarios() -> list[Scenario]:
    scenarios = []
    for p in sorted(SCENARIOS_DIR.glob("*.json")):
        scenarios.append(Scenario.from_file(p))
    return scenarios


# ── Simulation engine ───────────────────────────────────────────────────────


@dataclass
class TurnRecord:
    turn: int
    agent_name: str
    response: AgentResponse


@dataclass
class SimulationResult:
    scenario_id: str
    turns: list[TurnRecord] = field(default_factory=list)
    scores: dict[str, float] = field(default_factory=dict)


class SynapseEngine:
    """Core orchestrator that runs a scenario with a list of agents."""

    def __init__(self, scenario: Scenario, agents: list[BaseAgent]) -> None:
        self.scenario = scenario
        self.agents = agents
        self.state: dict[str, Any] = dict(scenario.initial_state)
        self.history: list[TurnRecord] = []

    def run(self) -> SimulationResult:
        for agent in self.agents:
            agent.setup()

        for turn_no in range(1, self.scenario.max_turns + 1):
            agent = self.agents[(turn_no - 1) % len(self.agents)]

            self.state["turn"] = turn_no
            self.state["history"] = [
                {"agent": r.agent_name, "action": r.response.action} for r in self.history
            ]

            response = agent.decide(self.state)

            record = TurnRecord(turn=turn_no, agent_name=agent.config.name, response=response)
            self.history.append(record)

            # Apply action data to shared state
            self.state.update(response.data)

        scores = self._evaluate()
        return SimulationResult(
            scenario_id=self.scenario.id,
            turns=self.history,
            scores=scores,
        )

    def _evaluate(self) -> dict[str, float]:
        """Placeholder evaluation — will be expanded with real metrics."""
        scores: dict[str, float] = {}
        for agent in self.agents:
            scores[agent.config.name] = 0.0
        return scores


# ── Agent loader ────────────────────────────────────────────────────────────


def load_agent(agent_slug: str, api_key: str = "") -> BaseAgent:
    """
    Dynamically load an agent by slug name from backend/agents/.
    Detects agent_type from config.json and passes api_key for BYOK agents.
    """
    agent_dir = AGENTS_DIR / agent_slug
    config_path = agent_dir / "config.json"
    if not config_path.exists():
        raise FileNotFoundError(f"Agent '{agent_slug}' not found")

    config = AgentConfig.from_file(config_path)

    # Import agent module and find the BaseAgent subclass
    mod = importlib.import_module(f"backend.agents.{agent_slug}.agent")
    agent_cls = None
    for attr_name in dir(mod):
        attr = getattr(mod, attr_name)
        if isinstance(attr, type) and issubclass(attr, BaseAgent) and attr is not BaseAgent:
            agent_cls = attr
            break

    if agent_cls is None:
        raise ValueError(f"No BaseAgent subclass found in {agent_slug}/agent.py")

    # If the agent's __init__ accepts api_key (API-powered), pass it
    init_params = inspect.signature(agent_cls.__init__).parameters
    if "api_key" in init_params:
        return agent_cls(config=config, api_key=api_key)
    return agent_cls(config=config)


# ── API routes ──────────────────────────────────────────────────────────────


@router.get("/scenarios")
async def get_scenarios():
    scenarios = list_scenarios()
    return [
        {"id": s.id, "name": s.name, "description": s.description, "max_turns": s.max_turns}
        for s in scenarios
    ]


class RunRequest(BaseModel):
    scenario_id: str
    agent_names: list[str]
    api_key: str = ""  # BYOK — user provides their own key from the browser


@router.post("/run")
async def run_arena(request: RunRequest):
    # Find scenario
    scenarios = {s.id: s for s in list_scenarios()}
    if request.scenario_id not in scenarios:
        raise HTTPException(status_code=404, detail="Scenario not found")

    scenario = scenarios[request.scenario_id]

    # Load agents
    agents: list[BaseAgent] = []
    for slug in request.agent_names:
        try:
            agent = load_agent(slug, api_key=request.api_key)
            agents.append(agent)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail=f"Agent '{slug}' not found")
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    # Run the simulation
    engine = SynapseEngine(scenario=scenario, agents=agents)
    result = engine.run()

    return {
        "scenario_id": result.scenario_id,
        "turns": [
            {
                "turn": t.turn,
                "agent": t.agent_name,
                "action": t.response.action,
                "reasoning": t.response.reasoning,
                "data": t.response.data,
            }
            for t in result.turns
        ],
        "scores": result.scores,
    }
