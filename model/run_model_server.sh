#!/bin/bash

# Script to run the enhanced waste detection model server

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not found. Please install Python 3."
    exit 1
fi

# Check if port 8000 is already in use
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "Port 8000 is already in use. Please close the application using this port or use a different port."
    exit 1
fi

# Install required dependencies if not already installed
echo "Installing required dependencies..."
pip3 install -q ultralytics fastapi uvicorn python-multipart pillow opencv-python numpy

# Check if the model file exists
if [ ! -f "yolov8n.pt" ]; then
    echo "Model file not found. Downloading YOLOv8n model..."
    python3 -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
    if [ ! -f "yolov8n.pt" ]; then
        echo "Failed to download the model. Please check your internet connection and try again."
        exit 1
    fi
fi

# Create outputs directory if it doesn't exist
mkdir -p outputs
if [ ! -d "outputs" ]; then
    echo "Failed to create outputs directory. Please check your permissions."
    exit 1
fi

# Clean up old output files to prevent disk space issues
find outputs -type f -name "waste_detection_*.jpg" -mtime +1 -delete 2>/dev/null

# Run the enhanced model server
echo "Starting enhanced waste detection model server..."
uvicorn enhanced_model_server:app --host 0.0.0.0 --port 8000 --reload

# Check if uvicorn started successfully
if [ $? -ne 0 ]; then
    echo "Failed to start the model server. Please check the error message above."
    exit 1
fi
