FROM python:3.12-slim
WORKDIR /app
COPY apps/relay/pyproject.toml apps/relay/terrarium_relay ./ 
RUN pip install uv && uv pip install --system -e .
COPY packages/py-contracts /packages/py-contracts
ENV PYTHONPATH=/app
CMD ["uvicorn", "terrarium_relay.main:app", "--host", "0.0.0.0", "--port", "8080"]
