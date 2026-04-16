FROM python:3.9-slim

WORKDIR /app/backend

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Set PYTHONPATH to handle both deployment configurations
ENV PYTHONPATH=/app:/app/backend

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 10000

# Use gunicorn for production, or uvicorn for development
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000", "--workers", "4"]