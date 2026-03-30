"""
Backend FastAPI — Clasificador de Alzheimer en MRI
Modelo: VGG16
Deploy: Hugging Face Spaces
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import json

# ─────────────────────────────────────────────
# CONFIGURACIÓN
# ─────────────────────────────────────────────
MODEL_PATH   = "C:/Users/arnol/Desktop/Proyectos/Alzheimer Disease Project/alzheimer-backend/alzheimer_vgg16.pth"
MAPPING_PATH = "C:/Users/arnol/Desktop/Proyectos/Alzheimer Disease Project/alzheimer-backend/class_mapping.json"
DEVICE       = torch.device("cpu")

# Cargar mapeo de clases desde el JSON generado por train.py
with open(MAPPING_PATH, encoding="utf-8") as f:
    mapping = json.load(f)

CLASS_NAMES = [mapping[str(i)] for i in range(len(mapping))]
NUM_CLASSES = len(CLASS_NAMES)

print(f"Clases cargadas: {CLASS_NAMES}")

DESCRIPTIONS = {
    "No Demencia":        "No se detectaron patrones asociados a demencia en la imagen.",
    "Demencia Muy Leve":  "Se detectaron patrones muy leves. Se recomienda seguimiento médico.",
    "Demencia Leve":      "Se detectaron patrones leves. Se recomienda evaluación médica.",
    "Demencia Moderada":  "Se detectaron patrones moderados. Consulta médica urgente.",
}

# ─────────────────────────────────────────────
# CARGAR MODELO VGG16
# ─────────────────────────────────────────────
def load_model() -> nn.Module:
    model = models.vgg16(weights=None)
    in_features = model.classifier[6].in_features
    model.classifier[6] = nn.Sequential(
        nn.Linear(in_features, 256),
        nn.ReLU(),
        nn.Dropout(p=0.4),
        nn.Linear(256, NUM_CLASSES),
    )
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.eval()
    print("Modelo VGG16 cargado correctamente.")
    return model

model = load_model()

# ─────────────────────────────────────────────
# TRANSFORMACIÓN
# ─────────────────────────────────────────────
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])

# ─────────────────────────────────────────────
# APP FASTAPI
# ─────────────────────────────────────────────
app = FastAPI(
    title="Alzheimer MRI Classifier",
    description="API para clasificar imágenes MRI de cerebro usando VGG16.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "model": "VGG16", "classes": CLASS_NAMES}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="El archivo debe ser una imagen (jpg, png, etc.)",
        )

    try:
        contents = await file.read()
        img      = Image.open(io.BytesIO(contents)).convert("RGB")
        tensor   = transform(img).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            logits = model(tensor)
            probs  = torch.softmax(logits, dim=1).squeeze().cpu().numpy()

        predicted_idx   = int(probs.argmax())
        predicted_class = CLASS_NAMES[predicted_idx]
        confidence      = round(float(probs[predicted_idx]) * 100, 2)

        probabilities = {
            name: round(float(p) * 100, 2)
            for name, p in zip(CLASS_NAMES, probs)
        }

        return JSONResponse({
            "class":         predicted_class,
            "confidence":    confidence,
            "description":   DESCRIPTIONS.get(predicted_class, ""),
            "probabilities": probabilities,
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar la imagen: {str(e)}")