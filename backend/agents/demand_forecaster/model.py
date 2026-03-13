"""
Demand Forecaster LSTM — Model Definition

This file defines the LSTM model architecture.  The trained weights are stored
in weights/demand_lstm.pt and loaded during agent.setup().
"""

import torch
import torch.nn as nn


class DemandLSTM(nn.Module):
    """
    LSTM-based demand forecaster.

    Input:  (batch, seq_len=7, features=9)  →  3 materials × [stock_level, daily_consumption, supplier_reliability]
    Output: (batch, 3)                      →  predicted next-day demand per material [steel, plastic, electronics]
    """

    def __init__(self, input_size: int = 9, hidden_size: int = 64, num_layers: int = 2, output_size: int = 3):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2,
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Linear(32, output_size),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (batch, seq_len, input_size)
        lstm_out, _ = self.lstm(x)
        # Take the output from the last timestep
        last_hidden = lstm_out[:, -1, :]
        return self.fc(last_hidden)
