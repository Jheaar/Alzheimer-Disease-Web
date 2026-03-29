"""
Backend FastAPI — Clasificador de Alzheimer en MRI
Deploy: Hugging Face Spaces (Gradio SDK = Docker)
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io

# ─────────────────────────────────────────────
# CONFIGURACIÓN
# ─────────────────────────────────────────────
MODEL_PATH  = "C:\\Users\\arnol\\Desktop\\Proyectos\\Alzheimer Disease Project\\alzheimer-model\\saved_model\\alzheimer_resnet50.pth"
NUM_CLASSES = 4
DEVICE      = torch.device("cpu")   # HF Spaces free = CPU

CLASS_NAMES = [
    "No Demencia",
    "Alzheimer Leve",
    "Alzheimer Moderado",
    "Alzheimer Avanzado",
]

DESCRIPTIONS = {
    "No Demencia":          "No se detectaron patrones asociados a demencia en la imagen.",
    "Alzheimer Leve":       "Se detectaron patrones leves. Se recomienda evaluación médica.",
    "Alzheimer Moderado":   "Se detectaron patrones moderados. Consulta médica urgente.",
    "Alzheimer Avanzado":   "Se detectaron patrones avanzados. Atención médica inmediata.",
}

# ─────────────────────────────────────────────
# CARGAR MODELO AL INICIAR
# ─────────────────────────────────────────────
def load_model() -> nn.Module:
    model = models.resnet50(weights=None)
    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(p=0.4),
        nn.Linear(in_features, 256),
        nn.ReLU(),
        nn.Dropout(p=0.3),
        nn.Linear(256, NUM_CLASSES),
    )
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.eval()
    print("Modelo cargado correctamente.")
    return model

model = load_model()

# ─────────────────────────────────────────────
# TRANSFORMACIÓN DE IMAGEN
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
    description="API para clasificar imágenes MRI de cerebro y detectar Alzheimer.",
    version="1.0.0",
)

# CORS: permite que el frontend en Vercel llame a esta API
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
    return {"status": "ok", "message": "Alzheimer MRI Classifier API activa."}


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
        img = Image.open(io.BytesIO(contents)).convert("RGB")

        tensor = transform(img).unsqueeze(0).to(DEVICE)

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
            "description":   DESCRIPTIONS[predicted_class],
            "probabilities": probabilities,
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar la imagen: {str(e)}")