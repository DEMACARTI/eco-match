import os
from flask import Flask, request, jsonify, send_file
from ultralytics import YOLO
from PIL import Image
import io

app = Flask(__name__)

# Load YOLOv8 model
MODEL_PATH = "yolov8n.pt"
OUTPUT_DIR = "outputs"

try:
    model = YOLO(MODEL_PATH)
    print(f"Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Ensure output directory exists
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

@app.route('/health', methods=['GET'])
def health_check():
    return "OK", 200

@app.route('/detect', methods=['POST'])
def detect_objects():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    try:
        # Read the image
        image = Image.open(file.stream).convert("RGB")

        # Run detection
        results = model(image)

        # Save the processed image
        output_path = os.path.join(OUTPUT_DIR, f"processed_{file.filename}")
        results[0].plot()  # Draw bounding boxes on the image
        results[0].save(save_dir=OUTPUT_DIR)  # Save the image to the output directory

        return send_file(output_path, mimetype='image/jpeg')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/detect-json', methods=['POST'])
def detect_objects_json():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    try:
        # Read the image
        image = Image.open(file.stream).convert("RGB")

        # Run detection
        results = model(image)

        # Extract detection data
        detections = []
        for result in results:
            for box in result.boxes:
                detections.append({
                    "class": result.names[int(box.cls)],
                    "confidence": float(box.conf),
                    "box": box.xyxy.tolist()
                })

        return jsonify({"detections": detections}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)