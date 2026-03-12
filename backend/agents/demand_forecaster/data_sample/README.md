# Sample Data Format — Demand Forecaster

This directory contains sample data showing the format used for training.

## File: `daily_production_sample.csv`

A small excerpt from the full 3-year dataset demonstrating the columns
and value ranges the LSTM model expects.

## Columns

| Column | Type | Range | Description |
|---|---|---|---|
| `date` | string | ISO 8601 | Production date |
| `material` | string | steel/plastic/electronics | Material type |
| `stock_level` | float | 0 - 1000 | Units in warehouse |
| `daily_consumption` | float | 0 - 200 | Units consumed that day |
| `supplier_reliability` | float | 0.0 - 1.0 | Average supplier score |
| `actual_demand` | float | 0 - 200 | Ground truth demand (training label) |

## Notes

- The full dataset is not included in the repo due to size
- Engineers can generate synthetic data using `training/train.py`
- To use your own data, format it as shown in the CSV sample
