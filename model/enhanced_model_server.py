from ultralytics import YOLO
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageDraw, ImageFont
import io
import os
import uuid
import cv2
import numpy as np
from taco_classes import TACO_CLASSES, get_waste_category, get_category_color, get_recycling_info

app = FastAPI(title="Enhanced Waste Detection API", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load multiple models for better detection
# Primary model: YOLOv8 for general object detection
primary_model = YOLO("yolov8n.pt")

# We'll create a custom waste detection model
class WasteDetectionModel:
    def __init__(self):
        self.yolo_model = YOLO("yolov8n.pt")
        self.waste_classes = TACO_CLASSES

        # Comprehensive mapping YOLO classes to waste categories
        self.yolo_to_waste_mapping = {
            # Containers and bottles
            'bottle': 'Plastic bottle',
            'wine glass': 'Glass cup',
            'cup': 'Plastic cup',
            'bowl': 'Plastic container',
            'vase': 'Glass jar',

            # Utensils and cutlery
            'fork': 'Plastic fork',
            'knife': 'Plastic knife', 
            'spoon': 'Plastic spoon',
            'scissors': 'Scrap metal',

            # Food items (organic waste)
            'banana': 'Banana peel',
            'apple': 'Apple',
            'orange': 'Orange peel',
            'sandwich': 'Food waste',
            'pizza': 'Food waste',
            'donut': 'Food waste',
            'cake': 'Food waste',
            'hot dog': 'Food waste',
            'broccoli': 'Vegetable',
            'carrot': 'Vegetable',

            # Electronics (hazardous/e-waste)
            'cell phone': 'Electronic waste',
            'laptop': 'Electronic waste',
            'mouse': 'Electronic waste',
            'keyboard': 'Electronic waste',
            'remote': 'Electronic waste',
            'tv': 'Electronic waste',
            'microwave': 'Electronic waste',
            'oven': 'Electronic waste',
            'toaster': 'Electronic waste',
            'refrigerator': 'Electronic waste',
            'hair drier': 'Electronic waste',
            'clock': 'Electronic waste',

            # Paper products
            'book': 'Book',

            # Clothing and textiles
            'teddy bear': 'Clothing',
            'tie': 'Clothing',
            'umbrella': 'Other litter',
            'backpack': 'Clothing',
            'handbag': 'Clothing',
            'suitcase': 'Other litter',

            # Furniture and large items
            'chair': 'Other litter',
            'couch': 'Other litter',
            'bed': 'Other litter',
            'dining table': 'Other litter',
            'toilet': 'Other litter',
            'bench': 'Other litter',

            # Sports equipment
            'frisbee': 'Plastic container',
            'sports ball': 'Other litter',
            'baseball bat': 'Other litter',
            'baseball glove': 'Clothing',
            'tennis racket': 'Other litter',
            'skateboard': 'Other litter',
            'surfboard': 'Other litter',
            'skis': 'Other litter',
            'snowboard': 'Other litter',
            'kite': 'Other litter',

            # Bathroom items
            'toothbrush': 'Other litter',
            'sink': 'Other litter',

            # Plants
            'potted plant': 'Vegetable',
        }

    def detect_waste(self, image):
        """Enhanced waste detection with specialized classification"""
        # Run YOLO detection with lower confidence threshold for better detection
        results = self.yolo_model(image, conf=0.3)  # Lower confidence threshold

        waste_detections = []

        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    # Get detection info
                    xyxy = box.xyxy[0].cpu().numpy()
                    confidence = box.conf[0].cpu().numpy()
                    class_id = int(box.cls[0].cpu().numpy())

                    # Get YOLO class name
                    yolo_class = self.yolo_model.names[class_id]

                    # Map to waste class - include original YOLO class if not mapped
                    if yolo_class in self.yolo_to_waste_mapping:
                        waste_class = self.yolo_to_waste_mapping[yolo_class]
                    else:
                        # Fallback: use YOLO class name but categorize as "Other litter"
                        waste_class = f"{yolo_class.title().replace('_', ' ')}"
                        if waste_class not in self.waste_classes:
                            waste_class = 'Other litter'

                    # Get waste category and recycling info
                    category = get_waste_category(waste_class)
                    recycling_info = get_recycling_info(waste_class)

                    waste_detections.append({
                        'bbox': xyxy.tolist(),
                        'confidence': float(confidence),
                        'waste_class': waste_class,
                        'category': category,
                        'recyclable': recycling_info['recyclable'],
                        'disposal_bin': recycling_info['bin'],
                        'note': recycling_info['note'],
                        'original_yolo_class': yolo_class  # Keep original for debugging
                    })

        return waste_detections

# Initialize the enhanced model
waste_model = WasteDetectionModel()

# Create output directory if it doesn't exist
if not os.path.exists("outputs"):
    os.makedirs("outputs")

def draw_enhanced_detections(image, detections):
    """Draw bounding boxes with waste classification and recycling info"""
    img_array = np.array(image)
    img_cv2 = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

    for detection in detections:
        bbox = detection['bbox']
        x1, y1, x2, y2 = map(int, bbox)

        # Get category color
        category_color = get_category_color(detection['waste_class'])

        # Draw bounding box
        cv2.rectangle(img_cv2, (x1, y1), (x2, y2), category_color, 2)

        # Prepare text
        confidence = detection['confidence']
        waste_class = detection['waste_class']
        category = detection['category']
        recyclable_status = "♻️ Recyclable" if detection['recyclable'] else "🗑️ Non-recyclable"

        # Draw labels
        label_text = f"{waste_class} ({confidence:.2f})"
        category_text = f"{category} - {recyclable_status}"

        # Calculate text size and position
        font_scale = 0.6
        thickness = 1

        # Draw background for text
        (text_width, text_height), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
        cv2.rectangle(img_cv2, (x1, y1 - 40), (x1 + max(text_width, len(category_text) * 8), y1), category_color, -1)

        # Draw text
        cv2.putText(img_cv2, label_text, (x1, y1 - 25), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), thickness)
        cv2.putText(img_cv2, category_text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)

    return cv2.cvtColor(img_cv2, cv2.COLOR_BGR2RGB)

@app.post("/detect")
async def detect_waste(file: UploadFile = File(...)):
    """Enhanced waste detection endpoint"""
    try:
        # Validate file size
        contents = await file.read()
        if len(contents) == 0:
            return JSONResponse(
                status_code=400,
                content={"error": "Empty file provided"}
            )

        # Validate file type
        try:
            image = Image.open(io.BytesIO(contents))
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"error": f"Invalid image file: {str(e)}"}
            )

        # Convert to RGB if necessary
        if image.mode != 'RGB':
            try:
                image = image.convert('RGB')
            except Exception as e:
                return JSONResponse(
                    status_code=400,
                    content={"error": f"Failed to convert image to RGB: {str(e)}"}
                )

        # Run enhanced waste detection
        try:
            detections = waste_model.detect_waste(image)
        except Exception as e:
            print(f"Detection error: {e}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Failed to detect waste objects: {str(e)}"}
            )

        # Check if any objects were detected
        if len(detections) == 0:
            print("No waste objects detected in the image")
            # Still proceed with empty detection, but log it

        # Draw enhanced visualization
        try:
            result_image = draw_enhanced_detections(image, detections)
        except Exception as e:
            print(f"Visualization error: {e}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Failed to visualize detection results: {str(e)}"}
            )

        # Save result image
        try:
            output_filename = f"outputs/waste_detection_{uuid.uuid4().hex}.jpg"
            result_pil = Image.fromarray(result_image)
            result_pil.save(output_filename, 'JPEG', quality=95)
        except Exception as e:
            print(f"Save error: {e}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Failed to save result image: {str(e)}"}
            )

        return FileResponse(
            output_filename, 
            media_type="image/jpeg",
            headers={
                "X-Detection-Count": str(len(detections)),
                "X-Detection-Status": "success"
            }
        )

    except Exception as e:
        print(f"Unexpected error in detect_waste: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Unexpected error: {str(e)}"}
        )

@app.post("/detect-json")
async def detect_waste_json(file: UploadFile = File(...)):
    """Get waste detection results as JSON"""
    try:
        # Validate file size
        contents = await file.read()
        if len(contents) == 0:
            return JSONResponse(
                status_code=400,
                content={"error": "Empty file provided"}
            )

        # Validate file type
        try:
            image = Image.open(io.BytesIO(contents))
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"error": f"Invalid image file: {str(e)}"}
            )

        # Convert to RGB if necessary
        if image.mode != 'RGB':
            try:
                image = image.convert('RGB')
            except Exception as e:
                return JSONResponse(
                    status_code=400,
                    content={"error": f"Failed to convert image to RGB: {str(e)}"}
                )

        # Run detection
        try:
            detections = waste_model.detect_waste(image)
        except Exception as e:
            print(f"Detection error: {e}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Failed to detect waste objects: {str(e)}"}
            )

        # Check if any objects were detected
        if len(detections) == 0:
            print("No waste objects detected in the image")
            # Still proceed with empty detection, but log it

        # Draw enhanced visualization
        try:
            result_image = draw_enhanced_detections(image, detections)
            # Convert the image to base64 for inclusion in JSON response
            result_pil = Image.fromarray(result_image)
            img_byte_arr = io.BytesIO()
            result_pil.save(img_byte_arr, format='JPEG', quality=95)
            img_byte_arr.seek(0)
            import base64
            img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
        except Exception as e:
            print(f"Visualization error: {e}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Failed to visualize detection results: {str(e)}"}
            )

        # Calculate statistics
        try:
            total_items = len(detections)
            recyclable_items = sum(1 for d in detections if d['recyclable'])
            categories = {}

            for detection in detections:
                category = detection['category']
                categories[category] = categories.get(category, 0) + 1

            result = {
                "total_items_detected": total_items,
                "recyclable_items": recyclable_items,
                "non_recyclable_items": total_items - recyclable_items,
                "categories": categories,
                "detections": detections,
                "sustainability_score": round((recyclable_items / total_items * 100) if total_items > 0 else 0, 1),
                "status": "success",
                "image_base64": img_base64  # Include the base64 encoded image in the response
            }
            return result
        except Exception as e:
            print(f"Statistics calculation error: {e}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Failed to calculate detection statistics: {str(e)}"}
            )

    except Exception as e:
        print(f"Unexpected error in detect_waste_json: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Unexpected error: {str(e)}"}
        )

@app.get("/")
async def root():
    return {
        "message": "Enhanced Waste Detection API is running",
        "version": "2.0.0",
        "features": [
            "60+ waste class detection",
            "Recycling classification",
            "Sustainability scoring",
            "Category-based visualization"
        ],
        "supported_classes": len(TACO_CLASSES)
    }

@app.get("/classes")
async def get_classes():
    """Get all supported waste classes"""
    return {
        "total_classes": len(TACO_CLASSES),
        "classes": TACO_CLASSES,
        "categories": list(set(get_waste_category(cls) for cls in TACO_CLASSES))
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
