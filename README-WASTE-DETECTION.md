# Waste Detection Feature

This document provides instructions for setting up and using the waste detection feature in the Eco Match application.

## Overview

The waste detection feature uses a machine learning model (YOLOv8) to detect and classify waste objects in images. The feature consists of two main components:

1. A Python model server that runs the waste detection algorithm
2. Java backend integration that communicates with the model server

## Setup Instructions

### 1. Start the Python Model Server

The waste detection model runs as a separate Python service. There are two ways to start the model server:

#### Option 1: Automatic Check and Start (Recommended)

Use the provided script that checks if the model server is running and starts it if needed:

```bash
# Navigate to the model directory
cd model

# Make the script executable (if needed)
chmod +x check_and_start_model_server.sh

# Run the check and start script
./check_and_start_model_server.sh
```

This will automatically check if the model server is already running on port 8000, and if not, it will start it in the background.

#### Option 2: Manual Start

If you prefer to start the model server manually:

```bash
# Navigate to the model directory
cd model

# Make the script executable (if needed)
chmod +x run_model_server.sh

# Run the model server
./run_model_server.sh
```

The model server script will:
- Install required Python dependencies
- Download the YOLOv8 model if needed
- Start the model server on port 8000

### 2. Configure the Java Application

The Java application is already configured to communicate with the model server running on `localhost:8000`. If you need to change this URL, you can set the following property in your `application.properties` file:

```properties
waste.detection.server.url=http://your-model-server-url:port
```

## Using the Waste Detection API

The waste detection feature provides two main endpoints:

### 1. Detect Waste Objects in an Image

**Endpoint:** `POST /api/waste-detection/detect`

**Request:**
- Content-Type: `multipart/form-data`
- Parameter: `file` (image file)

**Response:**
- Content-Type: `image/jpeg`
- Body: Processed image with waste objects detected and labeled

**Example:**
```javascript
// Using fetch API
const formData = new FormData();
formData.append('file', imageFile);

fetch('/api/waste-detection/detect', {
  method: 'POST',
  body: formData
})
.then(response => {
  if (response.ok) {
    return response.blob();
  }
  throw new Error('Network response was not ok');
})
.then(imageBlob => {
  const imageUrl = URL.createObjectURL(imageBlob);
  // Display the image
  document.getElementById('resultImage').src = imageUrl;
})
.catch(error => console.error('Error:', error));
```

### 2. Get Detailed Waste Detection Data

**Endpoint:** `POST /api/waste-detection/detect-data`

**Request:**
- Content-Type: `multipart/form-data`
- Parameter: `file` (image file)

**Response:**
- Content-Type: `application/json`
- Body: JSON data with detailed information about detected waste objects

**Example Response:**
```json
{
  "total_items_detected": 3,
  "recyclable_items": 2,
  "non_recyclable_items": 1,
  "categories": {
    "Plastic": 2,
    "Organic": 1
  },
  "detections": [
    {
      "bbox": [100, 150, 200, 250],
      "confidence": 0.92,
      "waste_class": "Plastic bottle",
      "category": "Plastic",
      "recyclable": true,
      "disposal_bin": "Recycling Bin",
      "note": "Clean before recycling. Remove caps and labels if possible."
    },
    {
      "bbox": [300, 200, 350, 280],
      "confidence": 0.85,
      "waste_class": "Plastic container",
      "category": "Plastic",
      "recyclable": true,
      "disposal_bin": "Recycling Bin",
      "note": "Clean before recycling."
    },
    {
      "bbox": [400, 300, 480, 380],
      "confidence": 0.78,
      "waste_class": "Banana peel",
      "category": "Organic",
      "recyclable": false,
      "disposal_bin": "Compost Bin",
      "note": "Compostable organic waste. Great for soil enrichment."
    }
  ],
  "sustainability_score": 66.7
}
```

## Waste Categories

The waste detection model can identify and classify waste into the following categories:

1. **Plastic** - Bottles, containers, utensils, etc.
2. **Paper** - Cardboard, paper bags, newspapers, etc.
3. **Metal** - Cans, foil, scrap metal, etc.
4. **Glass** - Bottles, jars, broken glass, etc.
5. **Organic** - Food waste, fruit peels, vegetables, etc.
6. **Hazardous** - Batteries, electronic waste, cigarettes, etc.
7. **Non-recyclable** - Other litter, foam containers, etc.

Each detected item includes information about whether it's recyclable and how it should be disposed of.

## Troubleshooting

If you encounter issues with the waste detection feature:

1. **Model server not running:**
   - Use the automatic check and start script: `./model/check_and_start_model_server.sh`
   - Ensure the Python model server is running on the expected port
   - Check the logs for any error messages
   - If using the automatic script doesn't work, try starting the server manually

2. **Connection errors:**
   - Verify the URL configuration in `application.properties`
   - Check network connectivity between the Java application and the model server

3. **Invalid image errors:**
   - Ensure you're uploading a valid image file (JPEG, PNG, etc.)
   - Check that the image is not corrupted or empty

4. **Slow performance:**
   - The waste detection model may take longer to process larger images
   - Consider resizing large images before uploading
