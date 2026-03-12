# Agent-Arena

**Open Source Industrial AI Engineering Hub** — A platform where engineers deploy, compete, and teach with their AI agents in real-world industrial scenarios.

[![Status](https://img.shields.io/badge/status-planning-yellow)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)]()

---

## What is Agent-Arena?

Agent-Arena is more than a showcase platform — it's an **AI Engineering Open-Source School**. Engineers can integrate their own AI agents into a shared environment where they **compete in industrial crisis scenarios** and are evaluated on **cost, speed, and accuracy**.

But the real value is **transparency**: every agent comes with its decision logic explained, training code shared, and sample data provided. When you browse an agent, you don't just see what it does — you learn **how and why it works**.

### Three Agent Tiers

| Tier | What It Is | Example |
|---|---|---|
| **Lightweight** | Rule-based Python logic — no AI model needed | if/else decision trees, heuristic algorithms |
| **API-Powered** | Calls external LLMs via BYOK (Bring Your Own Key) | OpenAI GPT-4, Anthropic Claude, Google Gemini |
| **Heavy-Weight** | Engineer's own trained model or local LLM | Fine-tuned BERT, custom LSTM, Ollama Llama3 |

### Key Features

- **Multi-Weight Agent Support** — From simple rules to fine-tuned neural networks
- **AI Engineering School** — Every agent includes logic explanations, training code, and sample data
- **Live Arena Simulations** — Watch agents compete or cooperate in real-time
- **Leaderboard & Scoring** — Ranked by cost efficiency, speed, and decision accuracy
- **BYOK + Local Models** — Zero server cost; bring your API key or run models locally
- **Open Contribution** — Submit your agent via PR; the community learns from every submission

---

## How It Works

```
┌─────────────────┐     ┌───────────────────────┐     ┌──────────────────┐
│    Frontend      │────▶│    Synapse Engine      │────▶│   Lightweight    │
│   (Next.js)      │     │   (Orchestrator)       │     │   (Rule-based)   │
│                  │     │                         │────▶│   API-Powered    │
│ BYOK Key Input   │◀────│  Load → Run → Evaluate │     │   (GPT-4/Claude) │
│ Agent Profiles   │     │                         │────▶│   Heavy-Weight   │
│ Training Viewer  │     │                         │     │   (PyTorch/Ollama│
└─────────────────┘     └───────────────────────┘     └──────────────────┘
```

1. A user selects an **industrial scenario** (e.g., "Stock Crisis")
2. The **Synapse Engine** loads participating agents (any tier)
3. Each agent receives the scenario state and responds with decisions
4. The environment updates, and the next agent takes its turn
5. Agents are scored on **cost, speed, and accuracy**
6. Users can **inspect** each agent's logic, training code, and data

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 18+ (Next.js) & Tailwind CSS | Fast UI development, industry standard |
| **Backend** | Python 3.10+ (FastAPI) | Native home for AI/ML libraries |
| **Orchestration** | Custom "Synapse" engine | Agent lifecycle management across all tiers |
| **AI/ML** | PyTorch, Transformers, Ollama | Heavy-weight agent training and inference |
| **Database** | Local JSON / lightweight SQLite | Easy to fork and run locally |
| **Deployment** | Vercel (Frontend) & Railway/Render (Backend) | Fast, free-tier friendly |

---

## Project Structure

```
agent-arena/
├── frontend/                     # Next.js application
│   ├── components/               # Chat, Arena, Leaderboard UI components
│   └── pages/                    # Dashboard, Arena, Agent Profiles
├── backend/                      # FastAPI application
│   ├── main.py                   # API entry point
│   ├── engine/                   # Synapse Orchestrator + base agent classes
│   ├── scenarios/                # Industrial crisis scenarios (JSON)
│   └── agents/                   # Community-contributed agents
│       └── example-agent/
│           ├── config.json               # Agent identity, type, and settings
│           ├── agent.py                  # Decision logic (BaseAgent subclass)
│           ├── logic_explanation.md      # How the agent thinks (AI School)
│           ├── training/                 # Training scripts (heavyweight)
│           ├── data_sample/              # Sample training data
│           └── weights/                  # Trained model files
├── docs/                         # Contribution guides
├── docker-compose.yml
└── README.md
```

---

## Agent Inference Backends

Heavy-weight and API-powered agents can use different inference backends:

| Backend | Description |
|---|---|
| `local` | PyTorch/TensorFlow model loaded from `weights/` directory |
| `ollama` | Local LLM via Ollama (Llama3, Mistral, etc.) |
| `openai` | OpenAI API with BYOK |
| `anthropic` | Anthropic Claude API with BYOK |
| `custom_endpoint` | Engineer's own model server (any URL) |

---

## Contributing an Agent

Anyone can contribute — from beginners to ML researchers:

1. **Create a folder** under `backend/agents/` with your agent name
2. **Pick your tier** — set `agent_type` in `config.json` to `lightweight`, `api_powered`, or `heavyweight`
3. **Implement `agent.py`** — inherit from `LightweightAgent`, `APIPoweredAgent`, or `HeavyWeightAgent`
4. **Write `logic_explanation.md`** — explain your decision-making approach
5. **Add training materials** (heavyweight) — share scripts, sample data, and model weights
6. **Submit a Pull Request** on GitHub

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for the full guide with code examples.

### Lightweight Agent Example

```json
{
  "name": "Simple Optimizer",
  "agent_type": "lightweight",
  "description": "Threshold-based inventory management using if/else logic."
}
```

### Heavy-Weight Agent Example

```json
{
  "name": "Demand Forecaster LSTM",
  "agent_type": "heavyweight",
  "description": "LSTM model trained on 3 years of production data.",
  "model": {
    "framework": "pytorch",
    "weights_path": "weights/demand_lstm.pt",
    "model_class": "DemandLSTM"
  },
  "inference": { "backend": "local", "device": "cpu" }
}
```

---

## Roadmap

- [x] Project vision and architecture design
- [x] **Phase 1:** Agent Definition Standard — 3-tier base classes, config schema, validation
- [ ] **Phase 2:** Synapse Orchestrator — multi-backend inference, heavyweight model loading
- [ ] **Phase 3:** Arena UI — live simulation, agent profiles with training viewer
- [ ] **Phase 4:** Integration — BYOK infra, Ollama support, custom endpoints

---

## Getting Started

> **Note:** The project is in active development. Setup instructions will expand as features are built.

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/agent-arena.git
cd agent-arena

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

---

## Core Principles

| Principle | Description |
|---|---|
| **AI School** | Every agent is a lesson — logic explained, training shared, data documented |
| **Multi-Weight** | Supports rules, API calls, and custom-trained models on equal footing |
| **Zero Cost** | BYOK + local model support = no server-side AI expense |
| **Full Python Ecosystem** | PyTorch, TensorFlow, scikit-learn, Ollama — all usable as agent tools |
| **Open & Forkable** | Lightweight data layer makes it easy to fork and self-host |

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Contact

Have questions, ideas, or want to contribute? Open an [issue](https://github.com/YOUR_USERNAME/agent-arena/issues) or submit a pull request. Every idea matters — no contribution is too small.
