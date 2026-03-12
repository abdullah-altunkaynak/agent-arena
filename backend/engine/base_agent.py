"""
Agent Base Classes — Phase 1 (Extended)

Three agent tiers:
  - BaseAgent          → Abstract foundation (all agents inherit this)
  - LightweightAgent   → Rule-based, no AI model, pure Python logic
  - APIPoweredAgent    → Calls external LLM APIs (OpenAI, Anthropic, etc.) via BYOK
  - HeavyWeightAgent   → Loads engineer's own trained model (PyTorch, Ollama, custom endpoint)

The Synapse orchestrator calls `decide()` on every agent regardless of type.
"""

from __future__ import annotations

import importlib
import json
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Callable


# ── Enums ───────────────────────────────────────────────────────────────────


class AgentType(str, Enum):
    LIGHTWEIGHT = "lightweight"
    API_POWERED = "api_powered"
    HEAVYWEIGHT = "heavyweight"


class InferenceBackend(str, Enum):
    LOCAL = "local"           # PyTorch / TensorFlow model loaded from weights/
    OLLAMA = "ollama"         # Local LLM via Ollama
    OPENAI = "openai"         # OpenAI API (BYOK)
    ANTHROPIC = "anthropic"   # Anthropic Claude API (BYOK)
    CUSTOM_ENDPOINT = "custom_endpoint"  # Engineer's own server


# ── Data classes ────────────────────────────────────────────────────────────


@dataclass
class ModelConfig:
    """Configuration for heavy-weight agents that bring their own model."""

    framework: str = ""            # "pytorch", "tensorflow", "onnx", "custom"
    weights_path: str = ""         # Relative path to weights file inside agent folder
    model_class: str = ""          # Class name to instantiate from agent's model code
    input_format: str = "json"     # How to serialise scenario state for the model


@dataclass
class InferenceConfig:
    """How the agent runs inference."""

    backend: InferenceBackend = InferenceBackend.LOCAL
    device: str = "cpu"            # "cpu", "cuda", "mps"
    api_key: str = ""              # Populated at runtime from BYOK (never stored)
    endpoint_url: str = ""         # For custom_endpoint backend
    ollama_model: str = ""         # e.g. "llama3", "mistral"


@dataclass
class AgentConfig:
    """Parsed representation of an agent's config.json."""

    name: str
    description: str
    system_prompt: str
    agent_type: AgentType = AgentType.LIGHTWEIGHT
    tools: list[str] = field(default_factory=list)
    model: ModelConfig = field(default_factory=ModelConfig)
    inference: InferenceConfig = field(default_factory=InferenceConfig)
    author: str = ""
    version: str = "0.1.0"

    @classmethod
    def from_file(cls, path: Path) -> "AgentConfig":
        with open(path, encoding="utf-8") as f:
            data = json.load(f)

        model_data = data.get("model", {})
        inference_data = data.get("inference", {})

        return cls(
            name=data["name"],
            description=data["description"],
            system_prompt=data.get("system_prompt", ""),
            agent_type=AgentType(data.get("agent_type", "lightweight")),
            tools=data.get("tools", []),
            model=ModelConfig(
                framework=model_data.get("framework", ""),
                weights_path=model_data.get("weights_path", ""),
                model_class=model_data.get("model_class", ""),
                input_format=model_data.get("input_format", "json"),
            ),
            inference=InferenceConfig(
                backend=InferenceBackend(inference_data.get("backend", "local")),
                device=inference_data.get("device", "cpu"),
                endpoint_url=inference_data.get("endpoint_url", ""),
                ollama_model=inference_data.get("ollama_model", ""),
            ),
            author=data.get("author", ""),
            version=data.get("version", "0.1.0"),
        )


@dataclass
class AgentResponse:
    """What an agent returns after each decision turn."""

    action: str                                          # Short label, e.g. "reorder_stock"
    reasoning: str                                       # Agent's chain-of-thought explanation
    data: dict[str, Any] = field(default_factory=dict)   # Arbitrary payload


# ── Base class ──────────────────────────────────────────────────────────────


class BaseAgent(ABC):
    """
    Abstract base that every agent must implement.

    Subclasses MUST override `decide`.
    Optionally override `setup` for one-time initialisation (e.g. loading model weights).
    """

    def __init__(self, config: AgentConfig) -> None:
        self.config = config
        self._tools: dict[str, Callable] = {}

    # -- lifecycle ------------------------------------------------------------

    def setup(self) -> None:
        """Called once before the first simulation turn. Override to load models/weights."""

    def load_tools(self, module_path: str) -> None:
        """Dynamically import the agent's tools module and register callables."""
        mod = importlib.import_module(module_path)
        for tool_name in self.config.tools:
            fn = getattr(mod, tool_name, None)
            if fn is not None and callable(fn):
                self._tools[tool_name] = fn

    def call_tool(self, name: str, **kwargs: Any) -> Any:
        """Invoke a registered tool by name."""
        if name not in self._tools:
            raise ValueError(f"Tool '{name}' is not registered for agent '{self.config.name}'")
        return self._tools[name](**kwargs)

    # -- core -----------------------------------------------------------------

    @abstractmethod
    def decide(self, scenario_state: dict[str, Any]) -> AgentResponse:
        """
        Given the current scenario state, return an AgentResponse describing
        the action this agent wants to take.

        Parameters
        ----------
        scenario_state : dict
            The shared simulation state including environment variables,
            previous actions by other agents, and remaining turns.

        Returns
        -------
        AgentResponse
        """
        ...


# ── Convenience base classes for each tier ──────────────────────────────────


class LightweightAgent(BaseAgent):
    """Base for rule-based agents. No model, no API — pure Python logic."""
    pass


class APIPoweredAgent(BaseAgent):
    """
    Base for agents that call external LLM APIs (OpenAI, Anthropic, etc.).
    The api_key is injected at runtime from the frontend (BYOK).
    """

    def __init__(self, config: AgentConfig, api_key: str = "") -> None:
        super().__init__(config)
        self.config.inference.api_key = api_key


class HeavyWeightAgent(BaseAgent):
    """
    Base for agents that bring their own trained model.
    Override `setup()` to load weights, and `decide()` to run inference.
    """

    def __init__(self, config: AgentConfig) -> None:
        super().__init__(config)
        self.model: Any = None  # Populated in setup()

    def setup(self) -> None:
        """Override this to load your model from self.config.model.weights_path."""
        raise NotImplementedError(
            f"HeavyWeightAgent '{self.config.name}' must implement setup() to load its model."
        )
        AgentResponse
        """
        ...
