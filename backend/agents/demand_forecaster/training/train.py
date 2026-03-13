"""
Training Script — Demand Forecaster LSTM

This script demonstrates how the LSTM model was trained.
Engineers can use this as a reference to:
  1. Understand the data pipeline
  2. Reproduce the training
  3. Fine-tune with their own data

Usage:
    cd backend/agents/demand_forecaster
    python training/train.py

The trained weights will be saved to weights/demand_lstm.pt
"""

from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

# Add parent to path so we can import the model
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from model import DemandLSTM


# ── Hyperparameters ─────────────────────────────────────────────────────────

SEQUENCE_LENGTH = 7     # Look at last 7 days
INPUT_SIZE = 9          # 3 materials × [stock_level, daily_consumption, supplier_reliability]
HIDDEN_SIZE = 64
NUM_LAYERS = 2
OUTPUT_SIZE = 3         # Predicted demand for steel, plastic, electronics
BATCH_SIZE = 32
EPOCHS = 150
LEARNING_RATE = 0.001
EARLY_STOP_PATIENCE = 15


# ── Synthetic Data Generation ───────────────────────────────────────────────

def generate_synthetic_data(num_days: int = 1095) -> tuple[torch.Tensor, torch.Tensor]:
    """
    Generate realistic synthetic training data simulating 3 years of production.

    Improvements over v1:
      - All 3 materials used as features (9 input features)
      - Weekly + monthly + quarterly seasonality
      - Simulated crisis events (supply disruptions)
      - Correlated supplier reliability
      - Realistic stock dynamics with variable restock amounts
    """
    torch.manual_seed(42)

    t = torch.arange(num_days, dtype=torch.float32)

    # ── Multi-scale seasonality ──────────────────────────────────────────
    weekly  = 1.0 + 0.15 * torch.sin(2 * 3.14159 * t / 7)
    monthly = 1.0 + 0.10 * torch.sin(2 * 3.14159 * t / 30)
    quarterly = 1.0 + 0.08 * torch.sin(2 * 3.14159 * t / 90)
    seasonal = weekly * monthly * quarterly

    # ── Base demands with noise ──────────────────────────────────────────
    steel_base = 50.0
    plastic_base = 30.0
    electronics_base = 80.0

    steel_demand = steel_base * seasonal + torch.randn(num_days) * 6
    plastic_demand = plastic_base * seasonal + torch.randn(num_days) * 4
    electronics_demand = electronics_base * seasonal + torch.randn(num_days) * 10

    # Add a slow upward trend (growing factory)
    trend = 1.0 + 0.0002 * t  # ~+20% over 3 years
    steel_demand *= trend
    plastic_demand *= trend
    electronics_demand *= trend

    # Clamp to positive values
    steel_demand = steel_demand.clamp(min=5)
    plastic_demand = plastic_demand.clamp(min=3)
    electronics_demand = electronics_demand.clamp(min=8)

    demand_all = torch.stack([steel_demand, plastic_demand, electronics_demand], dim=1)

    # ── Crisis events (random disruptions) ───────────────────────────────
    # ~8 crisis events over 3 years, each lasting 5-15 days
    crisis_mask = torch.zeros(num_days)
    rng = torch.Generator().manual_seed(123)
    crisis_starts = torch.randint(50, num_days - 30, (8,), generator=rng)
    for start in crisis_starts:
        duration = torch.randint(5, 16, (1,), generator=rng).item()
        end = min(start.item() + duration, num_days)
        crisis_mask[start.item():end] = 1.0
        # Demand spikes during crises (panic ordering from customers)
        spike = 1.3 + 0.4 * torch.rand(1, generator=rng).item()
        demand_all[start.item():end] *= spike

    # ── Supplier reliability ─────────────────────────────────────────────
    # Base reliability per material, drops during crises
    supplier_base = torch.tensor([0.85, 0.80, 0.90]).unsqueeze(0).expand(num_days, -1)
    supplier_noise = 0.1 * torch.randn(num_days, 3)
    supplier_crisis_drop = crisis_mask.unsqueeze(1) * 0.4  # Reliability drops 40% during crises
    supplier_rel = (supplier_base + supplier_noise - supplier_crisis_drop).clamp(0.0, 1.0)

    # ── Stock simulation ─────────────────────────────────────────────────
    stock = torch.zeros(num_days, 3)
    stock[0] = torch.tensor([500.0, 300.0, 800.0])
    restock_thresholds = torch.tensor([150.0, 100.0, 200.0])
    restock_amounts = torch.tensor([400.0, 250.0, 600.0])

    for i in range(1, num_days):
        consumption = demand_all[i]
        stock[i] = stock[i - 1] - consumption

        # Variable restock amounts (±20% randomness)
        for m in range(3):
            if stock[i, m] < restock_thresholds[m]:
                # During crises, restock amounts are lower (supply chain issues)
                factor = 0.5 if crisis_mask[i] > 0 else 1.0
                noise = 0.8 + 0.4 * torch.rand(1).item()
                stock[i, m] += restock_amounts[m] * factor * noise

        stock[i] = stock[i].clamp(min=0)

    # ── Normalize features ───────────────────────────────────────────────
    # Normalize stock to 0-1 range (divide by max observed)
    stock_norm = stock / (stock.max(dim=0).values + 1e-8)
    # Normalize demand to 0-1 range
    demand_norm = demand_all / (demand_all.max(dim=0).values + 1e-8)
    # supplier_rel is already 0-1

    # ── Build feature matrix: 9 features ─────────────────────────────────
    # [steel_stock, steel_demand, steel_supplier, plastic_stock, plastic_demand, plastic_supplier, elec_stock, elec_demand, elec_supplier]
    features = torch.cat([stock_norm, demand_norm, supplier_rel], dim=1)  # (num_days, 9)

    # ── Create sequences ─────────────────────────────────────────────────
    X, y = [], []
    for i in range(len(features) - SEQUENCE_LENGTH):
        X.append(features[i : i + SEQUENCE_LENGTH])
        y.append(demand_all[i + SEQUENCE_LENGTH])  # Predict RAW demand (not normalized)

    return torch.stack(X), torch.stack(y)


# ── Training Loop ───────────────────────────────────────────────────────────

def train():
    print("=" * 60)
    print("  Demand Forecaster LSTM — Training")
    print("=" * 60)
    print()
    print("Generating synthetic training data (3 years, 1095 days)...")
    X, y = generate_synthetic_data()

    # Train/val split (80/20)
    split_idx = int(0.8 * len(X))
    X_train, X_val = X[:split_idx], X[split_idx:]
    y_train, y_val = y[:split_idx], y[split_idx:]

    train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(TensorDataset(X_val, y_val), batch_size=BATCH_SIZE)

    print(f"  Input features:    {INPUT_SIZE} (3 materials × 3 features)")
    print(f"  Sequence length:   {SEQUENCE_LENGTH} days")
    print(f"  Training samples:  {len(X_train)}")
    print(f"  Validation samples:{len(X_val)}")
    print(f"  Batch size:        {BATCH_SIZE}")
    print(f"  Max epochs:        {EPOCHS}")
    print(f"  Early stop:        patience={EARLY_STOP_PATIENCE}")
    print()

    # Model
    model = DemandLSTM(INPUT_SIZE, HIDDEN_SIZE, NUM_LAYERS, OUTPUT_SIZE)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"  Model parameters:  {total_params:,}")
    print()

    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", factor=0.5, patience=5
    )

    # Training
    best_val_loss = float("inf")
    patience_counter = 0

    print(f"{'Epoch':>6} {'Train Loss':>12} {'Val Loss':>12} {'LR':>10} {'Status':>10}")
    print("-" * 55)

    for epoch in range(1, EPOCHS + 1):
        model.train()
        train_loss = 0.0
        for batch_X, batch_y in train_loader:
            optimizer.zero_grad()
            predictions = model(batch_X)
            loss = criterion(predictions, batch_y)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            train_loss += loss.item()

        train_loss /= len(train_loader)

        # Validation
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for batch_X, batch_y in val_loader:
                predictions = model(batch_X)
                loss = criterion(predictions, batch_y)
                val_loss += loss.item()
        val_loss /= len(val_loader)

        current_lr = optimizer.param_groups[0]["lr"]
        scheduler.step(val_loss)

        status = ""
        if epoch % 5 == 0 or epoch == 1 or val_loss < best_val_loss:
            # Early stopping
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
                status = "★ best"
                # Save best model
                weights_dir = Path(__file__).parent.parent / "weights"
                weights_dir.mkdir(exist_ok=True)
                torch.save(model.state_dict(), weights_dir / "demand_lstm.pt")
            else:
                patience_counter += 1

            print(f"{epoch:>6} {train_loss:>12.4f} {val_loss:>12.4f} {current_lr:>10.6f} {status:>10}")

            if patience_counter >= EARLY_STOP_PATIENCE:
                print(f"\n  Early stopping at epoch {epoch} (no improvement for {EARLY_STOP_PATIENCE} epochs)")
                break
        else:
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
                weights_dir = Path(__file__).parent.parent / "weights"
                weights_dir.mkdir(exist_ok=True)
                torch.save(model.state_dict(), weights_dir / "demand_lstm.pt")
            else:
                patience_counter += 1
                if patience_counter >= EARLY_STOP_PATIENCE:
                    print(f"{epoch:>6} {train_loss:>12.4f} {val_loss:>12.4f} {current_lr:>10.6f}")
                    print(f"\n  Early stopping at epoch {epoch} (no improvement for {EARLY_STOP_PATIENCE} epochs)")
                    break

    print()
    print("=" * 60)
    print(f"  Training complete!")
    print(f"  Best validation loss: {best_val_loss:.4f}")
    print(f"  Weights saved to: weights/demand_lstm.pt")
    print("=" * 60)


if __name__ == "__main__":
    train()
