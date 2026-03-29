"""
Evaluación del modelo entrenado:
- Accuracy general
- Matriz de confusión
- Reporte por clase (precision, recall, F1)
- Predicción de una imagen individual
"""

import torch
import torch.nn as nn
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from torchvision import models, transforms, datasets
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, confusion_matrix
from PIL import Image

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

CLASS_NAMES = [
    "No Demencia",
    "Alzheimer Leve",
    "Alzheimer Moderado",
    "Alzheimer Avanzado",
]


# ─────────────────────────────────────────────
# CARGAR MODELO
# ─────────────────────────────────────────────
def load_model(weights_path: str, num_classes: int = 4) -> nn.Module:
    model = models.resnet50(weights=None)
    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(p=0.4),
        nn.Linear(in_features, 256),
        nn.ReLU(),
        nn.Dropout(p=0.3),
        nn.Linear(256, num_classes),
    )
    model.load_state_dict(torch.load(weights_path, map_location=DEVICE))
    model.eval()
    return model.to(DEVICE)


# ─────────────────────────────────────────────
# EVALUACIÓN EN DATASET COMPLETO
# ─────────────────────────────────────────────
def evaluate(model: nn.Module, data_dir: str = "data/val"):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225]),
    ])

    dataset    = datasets.ImageFolder(data_dir, transform=transform)
    dataloader = DataLoader(dataset, batch_size=32, shuffle=False, num_workers=4)

    all_preds  = []
    all_labels = []

    with torch.no_grad():
        for inputs, labels in dataloader:
            inputs = inputs.to(DEVICE)
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())

    return np.array(all_labels), np.array(all_preds)


# ─────────────────────────────────────────────
# MATRIZ DE CONFUSIÓN
# ─────────────────────────────────────────────
def plot_confusion_matrix(y_true, y_pred, save_path="confusion_matrix.png"):
    cm = confusion_matrix(y_true, y_pred)
    cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)

    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(
        cm_norm,
        annot=cm,            # muestra el conteo real
        fmt="d",
        cmap="Blues",
        xticklabels=CLASS_NAMES,
        yticklabels=CLASS_NAMES,
        linewidths=0.5,
        ax=ax,
    )
    ax.set_xlabel("Predicción", fontsize=12)
    ax.set_ylabel("Real",       fontsize=12)
    ax.set_title("Matriz de confusión", fontsize=14)
    plt.xticks(rotation=30, ha="right")
    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    print(f"Matriz guardada en: {save_path}")


# ─────────────────────────────────────────────
# PREDICCIÓN DE UNA SOLA IMAGEN
# ─────────────────────────────────────────────
def predict_single(model: nn.Module, image_path: str) -> dict:
    """
    Retorna un dict con la clase predicha y las probabilidades.
    Esta función es la que usará el backend FastAPI.
    """
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225]),
    ])

    img    = Image.open(image_path).convert("RGB")
    tensor = transform(img).unsqueeze(0).to(DEVICE)   # shape: [1, 3, 224, 224]

    with torch.no_grad():
        logits = model(tensor)
        probs  = torch.softmax(logits, dim=1).squeeze().cpu().numpy()

    predicted_idx   = int(probs.argmax())
    predicted_class = CLASS_NAMES[predicted_idx]
    confidence      = float(probs[predicted_idx])

    result = {
        "class":       predicted_class,
        "confidence":  round(confidence * 100, 2),
        "probabilities": {
            name: round(float(p) * 100, 2)
            for name, p in zip(CLASS_NAMES, probs)
        },
    }

    return result


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
if __name__ == "__main__":
    model = load_model("saved_model/alzheimer_resnet50.pth")

    # Evaluación completa
    y_true, y_pred = evaluate(model, data_dir="data/val")

    print("\n=== REPORTE DE CLASIFICACIÓN ===")
    print(classification_report(y_true, y_pred, target_names=CLASS_NAMES))

    plot_confusion_matrix(y_true, y_pred)

    # Ejemplo de predicción individual
    # result = predict_single(model, "ejemplo_mri.jpg")
    # print(result)