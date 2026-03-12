# Decision Logic: Logistics Optimizer

## Overview

A simple **rule-based** agent that makes restocking decisions based on
inventory thresholds. No AI model is used — purely Python `if/else` logic.

## Algorithm

```
For each material in the warehouse:
    days_remaining = current_stock / daily_demand

Find the material with the LOWEST days_remaining → this is the "critical item"

Decision:
    if days_remaining < 2  →  EMERGENCY REORDER (5× daily demand)
    if days_remaining < 5  →  STANDARD REORDER (3× daily demand)
    otherwise              →  MONITOR (do nothing)
```

## Why This Approach?

This is the simplest possible agent — it demonstrates the platform's structure
without requiring any ML knowledge.  It's a great baseline to compete against
AI-powered or heavyweight agents in the arena.

## Strengths

- Zero dependencies beyond Python
- Deterministic — same input always produces same output
- Fast — no model inference needed
- Easy to understand and modify

## Weaknesses

- Cannot predict **future** demand (only reacts to current stock)
- Ignores supplier reliability in decisions
- Fixed thresholds (2 days, 5 days) are not adaptive
- Cannot learn from historical patterns
