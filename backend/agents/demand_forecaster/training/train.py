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
INPUT_SIZE = 3          # stock_level, daily_consumption, supplier_reliability
HIDDEN_SIZE = 64
NUM_LAYERS = 2
OUTPUT_SIZE = 3         # Predicted demand for steel, plastic, electronics
BATCH_SIZE = 32
EPOCHS = 100
LEARNING_RATE = 0.001
EARLY_STOP_PATIENCE = 10


# ── Synthetic Data Generation (replace with real data) ──────────────────────

def generate_synthetic_data(num_days: int = 1095) -> tuple[torch.Tensor, torch.Tensor]:
    """
    Generate synthetic training data simulating 3 years of production.

    In a real scenario, this would load from CSV/database.
    See data_sample/ for the expected data format.
    """
    torch.manual_seed(42)

    # Base demand patterns with some noise and weekly seasonality
    t = torch.arange(num_days, dtype=torch.float32)
    weekly_pattern = 1.0 + 0.2 * torch.sin(2 * 3.14159 * t / 7)

    # Three materials with different base demands
    steel_demand = 50 * weekly_pattern + torch.randn(num_days) * 5
    plastic_demand = 30 * weekly_pattern + torch.randn(num_days) * 3
    electronics_demand = 80 * weekly_pattern + torch.randn(num_days) * 8

    # Simulate stock levels (simple: start high, consume, occasionally restock)
    stock = torch.zeros(num_days, 3)
    stock[0] = torch.tensor([500.0, 300.0, 800.0])
    for i in range(1, num_days):
        consumption = torch.tensor([steel_demand[i], plastic_demand[i], electronics_demand[i]])
        stock[i] = stock[i - 1] - consumption
        # Restock when stock drops below 100
        restock_mask = stock[i] < 100
        stock[i][restock_mask] += 500

    # Supplier reliability (random, mostly operational)
    supplier_rel = 0.7 + 0.3 * torch.rand(num_days, 1).expand(-1, 3)

    # Features: [stock, consumption, supplier_reliability] per material
    demand_all = torch.stack([steel_demand, plastic_demand, electronics_demand], dim=1)
    features = torch.stack([stock[:, 0], demand_all[:, 0], supplier_rel[:, 0]], dim=1)  # Simplified: use first material

    # Create sequences
    X, y = [], []
    for i in range(len(features) - SEQUENCE_LENGTH):
        X.append(features[i : i + SEQUENCE_LENGTH])
        y.append(demand_all[i + SEQUENCE_LENGTH])

    return torch.stack(X), torch.stack(y)


# ── Training Loop ───────────────────────────────────────────────────────────

def train():
    print("Generating synthetic training data...")
    X, y = generate_synthetic_data()

    # Train/val split (80/20)
    split_idx = int(0.8 * len(X))
    X_train, X_val = X[:split_idx], X[split_idx:]
    y_train, y_val = y[:split_idx], y[split_idx:]

    train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(TensorDataset(X_val, y_val), batch_size=BATCH_SIZE)

    print(f"Training samples: {len(X_train)}, Validation samples: {len(X_val)}")

    # Model
    model = DemandLSTM(INPUT_SIZE, HIDDEN_SIZE, NUM_LAYERS, OUTPUT_SIZE)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)

    # Training
    best_val_loss = float("inf")
    patience_counter = 0

    for epoch in range(1, EPOCHS + 1):
        model.train()
        train_loss = 0.0
        for batch_X, batch_y in train_loader:
            optimizer.zero_grad()
            predictions = model(batch_X)
            loss = criterion(predictions, batch_y)
            loss.backward()
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

        if epoch % 10 == 0:
            print(f"Epoch {epoch}/{EPOCHS} — Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")

        # Early stopping
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            # Save best model
            weights_dir = Path(__file__).parent.parent / "weights"
            weights_dir.mkdir(exist_ok=True)
            torch.save(model.state_dict(), weights_dir / "demand_lstm.pt")
        else:
            patience_counter += 1
            if patience_counter >= EARLY_STOP_PATIENCE:
                print(f"Early stopping at epoch {epoch}")
                break

    print(f"Training complete. Best validation loss: {best_val_loss:.4f}")
    print(f"Weights saved to weights/demand_lstm.pt")


if __name__ == "__main__":
    train()
