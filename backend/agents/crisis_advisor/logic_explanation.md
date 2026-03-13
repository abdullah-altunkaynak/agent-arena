# Decision Logic: Crisis Advisor GPT

## Overview

An **API-powered** agent that uses large language models (GPT-4, Claude, Llama, etc.)
to analyze supply chain crises. Unlike rule-based agents that follow fixed thresholds,
this agent leverages natural language reasoning to consider multiple factors simultaneously.

## How It Works

```
Current scenario state (stock, demand, suppliers, budget, history)
         ↓
   Build structured prompt
         ↓
   Send to LLM (OpenAI / Anthropic / Ollama)
         ↓
   Parse JSON response
         ↓
   AgentResponse (action + reasoning + data)
```

## BYOK (Bring Your Own Key)

This agent does NOT include an API key. The user provides their own key
in the Arena UI before running a simulation. The key is:
- Passed at runtime only
- Never stored on disk
- Never logged

## Supported Backends

| Backend | Model | How to Use |
|---|---|---|
| `openai` | GPT-4o-mini (default) | Enter your OpenAI API key in Arena |
| `anthropic` | Claude 3 Haiku | Change config + enter Anthropic key |
| `ollama` | Llama 3, Mistral, etc. | Run Ollama locally, no key needed |
| `custom_endpoint` | Any OpenAI-compatible API | Set endpoint_url in config |

## Prompt Design

The agent sends a structured prompt containing:
1. **Warehouse status** — stock levels and days remaining per material
2. **Supplier status** — which suppliers are operational
3. **Budget** — remaining funds
4. **History** — what other agents did in previous turns

The LLM responds with a JSON containing: action, reasoning, ordered_item, ordered_quantity.

## Fallback Behavior

If the LLM call fails (no API key, network error, rate limit), the agent
automatically falls back to a simple heuristic similar to the Logistics Optimizer.
This ensures the simulation always completes, even without an API key.

## Strengths

- Can reason about multiple factors simultaneously
- Adapts to novel situations not covered by fixed rules
- Can consider what other agents did (history-aware)
- Explains its reasoning in natural language

## Weaknesses

- Requires API key or local LLM (not zero-cost by default)
- Response latency varies (100ms — 5s)
- Non-deterministic — same input may produce different outputs
- JSON parsing can fail with some models
