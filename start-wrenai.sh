#!/bin/bash

# WrenAI Startup Script
# This script starts all WrenAI services using Docker Compose

echo "Starting WrenAI services..."

# Set environment variables
export WREN_BOOTSTRAP_VERSION=latest
export WREN_ENGINE_VERSION=latest
export WREN_AI_SERVICE_VERSION=latest
export WREN_UI_VERSION=latest
export IBIS_SERVER_VERSION=latest
export PROJECT_DIR=/home/vish/WrenAI
export WREN_ENGINE_PORT=7432
export WREN_ENGINE_SQL_PORT=7433
export WREN_AI_SERVICE_PORT=8080
export AI_SERVICE_FORWARD_PORT=8080
export IBIS_SERVER_PORT=8000
export WREN_UI_PORT=3000
export HOST_PORT=3000
export GENERATION_MODEL=gpt-4o-mini
export USER_UUID=
export POSTHOG_API_KEY=
export POSTHOG_HOST=
export TELEMETRY_ENABLED=false
export EXPERIMENTAL_ENGINE_RUST_VERSION=
export WREN_PRODUCT_VERSION=latest
export LOCAL_STORAGE=.

# Start services
docker compose -f docker/docker-compose.yaml up -d --build

echo "WrenAI services started!"
echo "Access the UI at: http://localhost:3000"
echo "AI Service available at: http://localhost:8080"
echo ""
echo "To stop services, run: docker compose -f docker/docker-compose.yaml down"
