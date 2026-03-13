"""
Synapse Orchestrator — Phase 2

Manages the simulation loop:
  1. Load a scenario
  2. Instantiate participating agents (lightweight, api_powered, or heavyweight)
  3. Run turns — each turn, the current agent receives the shared state
     and returns an action
  4. Update state and pass it to the next agent
  5. Produce a final evaluation (cost, speed, accuracy)
"""

from __future__ import annotations

import importlib
import inspect
import json
import time
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
    duration_ms: float = 0.0  # How long the agent took to decide


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

            t0 = time.perf_counter()
            response = agent.decide(self.state)
            duration_ms = (time.perf_counter() - t0) * 1000

            record = TurnRecord(
                turn=turn_no,
                agent_name=agent.config.name,
                response=response,
                duration_ms=round(duration_ms, 2),
            )
            self.history.append(record)

            # Apply action data to shared state
            self.state.update(response.data)

        scores = self._evaluate()
        return SimulationResult(
            scenario_id=self.scenario.id,
            turns=self.history,
            scores=scores,
        )

    def _evaluate(self) -> dict[str, dict[str, float]]:
        """
        Score each agent on three axes, each normalized to 0.0–1.0:

        cost     → lower budget spent = higher score
                   1.0 = spent nothing, 0.0 = spent entire budget
        speed    → lower average decision time = higher score
                   1.0 = instant, 0.0 = >=5 000 ms average
        accuracy → combination of:
                     - production line still active at end (+0.5)
                     - no stockouts occurred during simulation (+0.5)
        """
        initial_budget: float = float(self.scenario.initial_state.get("budget", 1))
        final_budget: float = float(self.state.get("budget", initial_budget))
        budget_spent = max(initial_budget - final_budget, 0)
        cost_score = max(0.0, 1.0 - budget_spent / initial_budget) if initial_budget > 0 else 1.0

        # Check stockouts: any material hitting 0 is considered a stockout
        stockout_occurred = any(
            v <= 0
            for k, v in self.state.items()
            if k == "warehouse_stock" and isinstance(v, dict)
            for v in v.values()  # type: ignore[assignment]
        )
        production_active = bool(self.state.get("production_line_active", True))
        accuracy_score = (0.5 if production_active else 0.0) + (0.5 if not stockout_occurred else 0.0)

        scores: dict[str, dict[str, float]] = {}
        for agent in self.agents:
            agent_turns = [r for r in self.history if r.agent_name == agent.config.name]
            if agent_turns:
                avg_ms = sum(r.duration_ms for r in agent_turns) / len(agent_turns)
            else:
                avg_ms = 0.0

            # 5000 ms = score 0, 0 ms = score 1.0 (linear)
            speed_score = max(0.0, 1.0 - avg_ms / 5000.0)

            scores[agent.config.name] = {
                "cost": round(cost_score, 3),
                "speed": round(speed_score, 3),
                "accuracy": round(accuracy_score, 3),
                "total": round((cost_score + speed_score + accuracy_score) / 3, 3),
                "avg_decision_ms": round(avg_ms, 2),
            }

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
    # Exclude the base tier classes — we want the concrete implementation
    from backend.engine.base_agent import LightweightAgent, APIPoweredAgent, HeavyWeightAgent
    _base_classes = {BaseAgent, LightweightAgent, APIPoweredAgent, HeavyWeightAgent}
    agent_cls = None
    for attr_name in dir(mod):
        attr = getattr(mod, attr_name)
        if isinstance(attr, type) and issubclass(attr, BaseAgent) and attr not in _base_classes:
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
                "duration_ms": t.duration_ms,
            }
            for t in result.turns
        ],
        "scores": result.scores,
    }
