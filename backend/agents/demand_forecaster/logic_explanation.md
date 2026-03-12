# Decision Logic: Demand Forecaster LSTM

## Overview

This agent uses a **Long Short-Term Memory (LSTM)** neural network to predict
future material demand based on historical consumption patterns.  Instead of
reacting to shortages after they happen (like a rule-based agent), it
**predicts shortages before they occur** and takes pre-emptive action.

## Architecture

```
Input (7-day history)     LSTM Layer (hidden=64)     Fully Connected     Output
[stock_t-6 ... stock_t] ──────────────────────────► [FC 64→32→3] ────► [demand_t+1]
     (3 features)              2 layers                                  per material
```

## Input Features (per timestep)

| Feature | Description |
|---|---|
| `stock_level` | Current inventory quantity |
| `daily_consumption` | Units consumed that day |
| `supplier_reliability` | 0.0 (offline) to 1.0 (fully operational) |

## Training Details

- **Dataset:** 3 years of daily production data (1,095 samples × 3 materials)
- **Sequence length:** 7 days (the model looks at the last 7 days to predict day 8)
- **Loss function:** MSE (Mean Squared Error)
- **Optimizer:** Adam (lr=0.001)
- **Epochs:** 100 with early stopping (patience=10)
- **Validation split:** 80/20

## Decision Logic

```python
predicted_demand = model.predict(last_7_days)
days_remaining = current_stock / predicted_demand

if days_remaining < 2:
    action = "emergency_reorder"    # 5× daily predicted demand
elif days_remaining < 5:
    action = "reorder"              # 3× daily predicted demand
else:
    action = "monitor"
```

The key difference from a rule-based agent: `predicted_demand` comes from the
LSTM model, not from a static `daily_demand` field.  This means the agent can
detect **trends** (e.g. increasing consumption on Mondays) and **anomalies**
(e.g. sudden demand spikes) that simple averages would miss.

## Why LSTM?

LSTMs are designed for **sequential/time-series data**.  They maintain an
internal "memory cell" that can learn long-term patterns in demand cycles,
seasonal fluctuations, and supplier disruption impacts.

## Limitations

- Requires at least 7 days of history per material to make a prediction
- Trained on a specific data distribution; may underperform on unseen patterns
- CPU inference only in this version (GPU support planned)
