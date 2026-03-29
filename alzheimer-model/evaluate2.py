"""
Evaluación del modelo VGG16 para clasificación de Alzheimer en MRI
Lee el mapeo de clases desde class_mapping.json generado por train.py
"""

import torch
import torch.nn as nn
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import json
from torchvision import models, transforms, datasets
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, confusion_matrix
from PIL import Image

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Lee el mapeo real generado durante el entrenamiento
with open("saved_model/class_mapping.json", encoding="utf-8") as f:
    mapping = json.load(f)

CLASS_NAMES = [mapping[str(i)] for i in range(len(mapping))]
print(f"Clases cargadas: {CLASS_NAMES}")

# ─────────────────────────────────────────────
# CARGAR MODELO VGG16
# ─────────────────────────────────────────────
def load_model(weights_path="saved_model/alzheimer_vgg16.pth"):
    model = models.vgg16(weights=None)
    in_features = model.classifier[6].in_features
    model.classifier[6] = nn.Sequential(
        nn.Linear(in_features, 256),
        nn.ReLU(),
        nn.Dropout(p=0.4),
        nn.Linear(256, len(CLASS_NAMES)),
    )
    model.load_state_dict(torch.load(weights_path, map_location=DEVICE))
    model.eval()
    print("Modelo VGG16 cargado correctamente.")
    return model.to(DEVICE)

# ─────────────────────────────────────────────
# EVALUACIÓN COMPLETA
# ─────────────────────────────────────────────
def evaluate(model, data_dir="data/val"):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    dataset    = datasets.ImageFolder(data_dir, transform=transform)
    dataloader = DataLoader(dataset, batch_size=32, shuffle=False, num_workers=0)

    all_preds, all_labels = [], []
    with torch.no_grad():
        for inputs, labels in dataloader:
            outputs = model(inputs.to(DEVICE))
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())

    return np.array(all_labels), np.array(all_preds)

# ─────────────────────────────────────────────
# MATRIZ DE CONFUSIÓN
# ─────────────────────────────────────────────
def plot_confusion_matrix(y_true, y_pred, save_path="confusion_matrix.png"):
    cm      = confusion_matrix(y_true, y_pred)
    cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)

    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(
        cm_norm, annot=cm, fmt="d", cmap="Blues",
        xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES,
        linewidths=0.5, ax=ax,
    )
    ax.set_xlabel("Prediccion", fontsize=12)
    ax.set_ylabel("Real",       fontsize=12)
    ax.set_title("Matriz de confusion", fontsize=14)
    plt.xticks(rotation=30, ha="right")
    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    print(f"Matriz guardada en: {save_path}")

# ─────────────────────────────────────────────
# PREDICCIÓN INDIVIDUAL
# ─────────────────────────────────────────────
def predict_single(model, image_path):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    img    = Image.open(image_path).convert("RGB")
    tensor = transform(img).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        probs = torch.softmax(model(tensor), dim=1).squeeze().cpu().numpy()

    predicted_idx   = int(probs.argmax())
    predicted_class = CLASS_NAMES[predicted_idx]

    return {
        "class":      predicted_class,
        "confidence": round(float(probs[predicted_idx]) * 100, 2),
        "probabilities": {
            name: round(float(p) * 100, 2)
            for name, p in zip(CLASS_NAMES, probs)
        },
    }

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
if __name__ == "__main__":
    model = load_model()
    y_true, y_pred = evaluate(model)

    print("\n=== REPORTE DE CLASIFICACION ===")
    print(classification_report(y_true, y_pred, target_names=CLASS_NAMES))
    plot_confusion_matrix(y_true, y_pred)