---
title: Alzheimer MRI Classifier API
emoji: 🧠
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# Alzheimer MRI Classifier — Backend API

Backend FastAPI que clasifica imágenes MRI de cerebro en 4 categorías:
- No Demencia
- Alzheimer Leve
- Alzheimer Moderado
- Alzheimer Avanzado

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Estado de la API |
| GET | `/health` | Health check |
| POST | `/predict` | Clasificar imagen MRI |

## Uso del endpoint /predict

```bash
curl -X POST "https://TU-SPACE.hf.space/predict" \
  -F "file=@imagen_mri.jpg"
```

## Deploy en Hugging Face Spaces

1. Crea un nuevo Space en https://huggingface.co/spaces
2. Selecciona SDK: **Docker**
3. Sube todos estos archivos + tu `alzheimer_resnet50.pth`
4. El Space arranca automáticamente

## Arrancar y parar

Desde el panel de tu Space en Hugging Face puedes:
- **Pausar** el Space (Settings → Pause)
- **Reanudar** cuando lo necesites

Mientras está pausado no consume recursos ni genera costos.