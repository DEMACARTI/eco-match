#!/bin/bash

# Check if the model server is running
if ! lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "Model server is not running. Starting it..."
    cd "$(dirname "$0")"
    ./run_model_server.sh &
    echo "Model server started in the background."
else
    echo "Model server is already running."
fi