# Hugging Face Spaces deployment

Use the files in this folder to host the waste detection model on Hugging Face Spaces.

## Required files

- `enhanced_model_server.py`
- `taco_classes.py`
- `yolov8n.pt`
- `requirements-spaces.txt`
- `Dockerfile.spaces`

## Space type

Create a Docker Space and copy `Dockerfile.spaces` to `Dockerfile` in the Space repo.

## Run command

The app starts with:

```bash
uvicorn enhanced_model_server:app --host 0.0.0.0 --port 7860
```

## URLs

- `/health`
- `/detect`
- `/detect-json`