# Contributing an Agent to Agent-Arena

Thank you for your interest in contributing! This guide explains how to add your own AI agent to the arena.

Agent-Arena supports **three types** of agents — pick the one that matches your approach:

| Type | Description | Complexity |
|---|---|---|
| **Lightweight** | Rule-based Python logic (if/else, heuristics) | Beginner |
| **API-Powered** | Calls external LLM APIs (OpenAI, Anthropic) via BYOK | Intermediate |
| **Heavy-Weight** | Your own trained model (PyTorch, TF, Ollama, custom server) | Advanced |

## Prerequisites

- Python 3.10+
- For heavyweight agents: PyTorch or your ML framework of choice

## Step-by-Step

### 1. Create Your Agent Folder

Inside `backend/agents/`, create a new folder with your agent's slug name:

```
backend/agents/my-cool-agent/
```

### 2. Define `config.json`

Every agent **must** have a `config.json`. The structure depends on agent type:

#### Lightweight Agent

```json
{
  "name": "My Rule Agent",
  "description": "Makes decisions using handcrafted rules (10-500 chars).",
  "agent_type": "lightweight",
  "system_prompt": "Optional context description.",
  "tools": ["my_tool_function"],
  "author": "your-github-username",
  "version": "0.1.0"
}
```

#### API-Powered Agent

```json
{
  "name": "My GPT Agent",
  "description": "Uses GPT-4 to analyse scenarios and decide actions.",
  "agent_type": "api_powered",
  "system_prompt": "You are an expert supply chain strategist...",
  "inference": {
    "backend": "openai"
  },
  "author": "your-github-username",
  "version": "0.1.0"
}
```

#### Heavy-Weight Agent

```json
{
  "name": "My LSTM Forecaster",
  "description": "LSTM model trained on production data to predict demand.",
  "agent_type": "heavyweight",
  "system_prompt": "Demand prediction agent powered by custom LSTM.",
  "model": {
    "framework": "pytorch",
    "weights_path": "weights/my_model.pt",
    "model_class": "MyModel",
    "input_format": "tensor"
  },
  "inference": {
    "backend": "local",
    "device": "cpu"
  },
  "author": "your-github-username",
  "version": "1.0.0"
}
```

### 3. Implement `agent.py`

Choose the right base class for your agent type:

```python
# Lightweight
from engine.base_agent import LightweightAgent, AgentResponse

class MyAgent(LightweightAgent):
    def decide(self, scenario_state: dict) -> AgentResponse:
        # Your rule-based logic
        return AgentResponse(action="...", reasoning="...", data={})

# API-Powered
from engine.base_agent import APIPoweredAgent, AgentResponse

class MyAgent(APIPoweredAgent):
    def decide(self, scenario_state: dict) -> AgentResponse:
        # Call self.config.inference.api_key to access the BYOK key
        # Use openai/anthropic/httpx to call the LLM
        return AgentResponse(action="...", reasoning="...", data={})

# Heavy-Weight
from engine.base_agent import HeavyWeightAgent, AgentResponse

class MyAgent(HeavyWeightAgent):
    def setup(self):
        # Load your model weights here
        self.model = load_my_model(self.config.model.weights_path)

    def decide(self, scenario_state: dict) -> AgentResponse:
        prediction = self.model(prepare_input(scenario_state))
        return AgentResponse(action="...", reasoning="...", data={})
```

### 4. Write `logic_explanation.md` (Strongly Recommended)

Explain your agent's decision-making logic so others can **learn** from it:

- What algorithm or model architecture do you use?
- Why did you choose this approach?
- What are the strengths and weaknesses?
- Include math formulas, diagrams, or pseudocode if helpful

This is what makes Agent-Arena an **AI Engineering School** — your explanation
teaches the community.

### 5. Add Training Materials (Heavy-Weight Agents)

For heavyweight agents, include:

```
my-cool-agent/
├── training/              # Your training scripts
│   └── train.py           # Reproducible training code
├── data_sample/           # Example data showing expected format
│   ├── README.md          # Document the data schema
│   └── sample.csv         # A small excerpt of training data
└── weights/               # Trained model files
    └── my_model.pt        # Model weights (use Git LFS for large files)
```

### 6. Add Tools (Optional)

If your agent needs custom tools, create a `functions.py`:

```python
def my_tool_function(param1: str, param2: int) -> dict:
    """Describe what this tool does."""
    return {"result": some_computation(param1, param2)}
```

### 7. Create `__init__.py`

Create an empty `__init__.py` in your agent folder.

### 8. Validate Locally

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# In another terminal:
curl http://localhost:8000/api/agents/my-cool-agent/validate
```

You should see `{"valid": true, "errors": [], "warnings": []}`.

### 9. Submit a Pull Request

1. Fork the repository
2. Create a branch: `git checkout -b agent/my-cool-agent`
3. Add your agent folder under `backend/agents/`
4. Push and open a PR

## Complete Folder Structure

```
backend/agents/my-cool-agent/
├── __init__.py               # Required (can be empty)
├── config.json               # Required — agent metadata & type
├── agent.py                  # Required — BaseAgent subclass with decide()
├── logic_explanation.md      # Recommended — explain your decision logic
├── functions.py              # Optional — custom tool functions
├── model.py                  # Optional — model architecture definition
├── training/                 # Optional — training scripts (HW agents)
│   └── train.py
├── data_sample/              # Optional — sample training data (HW agents)
│   ├── README.md
│   └── sample.csv
└── weights/                  # Optional — trained model weights (HW agents)
    └── model.pt
```

## Tips

- Start simple: a lightweight rule-based agent is a great first contribution
- Use `scenario_state["history"]` to see what other agents have done
- For heavy-weight agents, include a README in `weights/` explaining how to
  regenerate them via `training/train.py`
- Keep model files small; use Git LFS for files > 10MB
