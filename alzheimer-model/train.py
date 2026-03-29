"""
Entrenamiento de ResNet-50 para clasificación de Alzheimer en MRI
Clases: No Demencia | Alzheimer Leve | Alzheimer Moderado | Alzheimer Avanzado

Mejoras v2:
- Data augmentation agresivo para clases con pocas imágenes
- WeightedRandomSampler para balancear batches
- Class weights en la función de pérdida
"""

import os
import copy
import time
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, WeightedRandomSampler
from torchvision import datasets, models, transforms
import matplotlib.pyplot as plt
import numpy as np

# ─────────────────────────────────────────────
# CONFIGURACIÓN
# ─────────────────────────────────────────────
DATA_DIR    = "data"
NUM_CLASSES = 4
BATCH_SIZE  = 64
NUM_EPOCHS  = 25
LR          = 1e-4
DEVICE      = torch.device("cuda" if torch.cuda.is_available() else "cpu")

CLASS_NAMES = [
    "No Demencia",
    "Alzheimer Leve",
    "Alzheimer Moderado",
    "Alzheimer Avanzado",
]

print(f"Usando dispositivo: {DEVICE}")


# ─────────────────────────────────────────────
# TRANSFORMACIONES
#
# Se definen DOS niveles de augmentation:
#
#   transform_normal  → clases con muchas imágenes
#                        (No Demencia, Moderado, Avanzado)
#
#   transform_heavy   → clases con pocas imágenes (Alzheimer Leve)
#                        Aplica más variaciones para "simular" más datos
#
# Para validación nunca se hace augmentation (solo resize + normalize).
# ─────────────────────────────────────────────

transform_normal = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomVerticalFlip(p=0.2),
    transforms.RandomRotation(degrees=15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])

transform_heavy = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.RandomCrop(224),                        # recorte aleatorio
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomVerticalFlip(p=0.5),
    transforms.RandomRotation(degrees=30),             # más rotación
    transforms.RandomAffine(
        degrees=0,
        translate=(0.1, 0.1),                          # desplazamiento leve
        scale=(0.85, 1.15),                            # zoom in/out
        shear=10,                                      # inclinación
    ),
    transforms.ColorJitter(
        brightness=0.3,
        contrast=0.3,
        saturation=0.2,
        hue=0.05,
    ),
    transforms.RandomGrayscale(p=0.1),                 # ocasionalmente escala de grises
    transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 1.5)),  # leve desenfoque
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])

transform_val = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])


# ─────────────────────────────────────────────
# DATASET CON AUGMENTATION POR CLASE
# ─────────────────────────────────────────────

class AugmentedDataset(torch.utils.data.Dataset):
    """
    Wrapper sobre ImageFolder que aplica un transform diferente
    según la clase de cada imagen.

    Las clases con pocas muestras reciben 'transform_heavy' para
    generar más variaciones. El resto recibe 'transform_normal'.
    """

    minority_indices: set = set()

    def __init__(self, root: str, transform_n, transform_h):
        self.dataset     = datasets.ImageFolder(root)
        self.transform_n = transform_n
        self.transform_h = transform_h

        # Detectar clases minoritarias (menos del 50% del promedio)
        counts    = np.bincount([label for _, label in self.dataset.samples])
        threshold = counts.mean() * 0.5

        AugmentedDataset.minority_indices = {
            i for i, c in enumerate(counts) if c < threshold
        }

        minority_names = [self.dataset.classes[i]
                          for i in AugmentedDataset.minority_indices]
        print(f"\nClases con augmentation agresivo: {minority_names}")
        for i, (name, count) in enumerate(zip(self.dataset.classes, counts)):
            tag = " <- MINORIA" if i in AugmentedDataset.minority_indices else ""
            print(f"  {name:30s}: {count:5d} imagenes{tag}")

    def __len__(self):
        return len(self.dataset)

    def __getitem__(self, idx):
        img, label = self.dataset[idx]
        if label in AugmentedDataset.minority_indices:
            img = self.transform_h(img)
        else:
            img = self.transform_n(img)
        return img, label


# ─────────────────────────────────────────────
# CARGA DEL DATASET + SAMPLER BALANCEADO
# ─────────────────────────────────────────────

def load_data(data_dir: str):
    train_dataset = AugmentedDataset(
        os.path.join(data_dir, "train"),
        transform_normal,
        transform_heavy,
    )

    val_dataset = datasets.ImageFolder(
        os.path.join(data_dir, "val"),
        transform=transform_val,
    )

    # WeightedRandomSampler: clases pequeñas aparecen más seguido en cada batch
    labels   = [label for _, label in train_dataset.dataset.samples]
    counts   = np.bincount(labels)
    weights  = 1.0 / counts
    sample_w = torch.tensor([weights[l] for l in labels], dtype=torch.float)

    sampler = WeightedRandomSampler(
        weights     = sample_w,
        num_samples = len(sample_w),
        replacement = True,
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size  = BATCH_SIZE,
        sampler     = sampler,
        num_workers = 4,
        pin_memory  = True,
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size  = BATCH_SIZE,
        shuffle     = False,
        num_workers = 4,
        pin_memory  = True,
    )

    dataloaders   = {"train": train_loader, "val": val_loader}
    dataset_sizes = {
        "train": len(train_dataset),
        "val":   len(val_dataset),
    }

    print(f"\nTamano train : {dataset_sizes['train']} imagenes")
    print(f"Tamano val   : {dataset_sizes['val']} imagenes\n")

    return dataloaders, dataset_sizes, train_dataset.dataset.classes, counts


# ─────────────────────────────────────────────
# MODELO: ResNet-50 con fine-tuning
# ─────────────────────────────────────────────

def build_model(num_classes: int) -> nn.Module:
    model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)

    for name, param in model.named_parameters():
        if "layer4" not in name and "fc" not in name:
            param.requires_grad = False

    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(p=0.4),
        nn.Linear(in_features, 256),
        nn.ReLU(),
        nn.Dropout(p=0.3),
        nn.Linear(256, num_classes),
    )

    return model.to(DEVICE)


# ─────────────────────────────────────────────
# LOOP DE ENTRENAMIENTO
# ─────────────────────────────────────────────

def train_model(model, dataloaders, dataset_sizes, criterion, optimizer, scheduler, num_epochs):
    best_weights = copy.deepcopy(model.state_dict())
    best_acc     = 0.0
    history      = {"train_loss": [], "val_loss": [], "train_acc": [], "val_acc": []}

    for epoch in range(num_epochs):
        print(f"\nEpoca {epoch+1}/{num_epochs}  {'─'*40}")

        for phase in ["train", "val"]:
            model.train() if phase == "train" else model.eval()

            running_loss     = 0.0
            running_corrects = 0

            for inputs, labels in dataloaders[phase]:
                inputs = inputs.to(DEVICE)
                labels = labels.to(DEVICE)

                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == "train"):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    if phase == "train":
                        loss.backward()
                        optimizer.step()

                running_loss     += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            if phase == "train":
                scheduler.step()

            epoch_loss = running_loss / dataset_sizes[phase]
            epoch_acc  = running_corrects.double() / dataset_sizes[phase]

            print(f"  {phase.upper():5s} - Loss: {epoch_loss:.4f} | Acc: {epoch_acc:.4f}")

            history[f"{phase}_loss"].append(epoch_loss)
            history[f"{phase}_acc"].append(epoch_acc.item())

            if phase == "val" and epoch_acc > best_acc:
                best_acc     = epoch_acc
                best_weights = copy.deepcopy(model.state_dict())
                print(f"  Mejor modelo guardado (acc={best_acc:.4f})")

    print(f"\nEntrenamiento completo. Mejor val acc: {best_acc:.4f}")
    model.load_state_dict(best_weights)
    return model, history


# ─────────────────────────────────────────────
# CURVAS DE ENTRENAMIENTO
# ─────────────────────────────────────────────

def plot_history(history: dict, save_path: str = "training_curves.png"):
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))

    axes[0].plot(history["train_loss"], label="Train", marker="o")
    axes[0].plot(history["val_loss"],   label="Val",   marker="s")
    axes[0].set_title("Loss por epoca")
    axes[0].set_xlabel("Epoca")
    axes[0].set_ylabel("Loss")
    axes[0].legend()
    axes[0].grid(alpha=0.3)

    axes[1].plot(history["train_acc"], label="Train", marker="o")
    axes[1].plot(history["val_acc"],   label="Val",   marker="s")
    axes[1].set_title("Accuracy por epoca")
    axes[1].set_xlabel("Epoca")
    axes[1].set_ylabel("Accuracy")
    axes[1].legend()
    axes[1].grid(alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    print(f"Curvas guardadas en: {save_path}")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    # 1. Datos
    dataloaders, dataset_sizes, classes, counts = load_data(DATA_DIR)

    # 2. Modelo
    model = build_model(NUM_CLASSES)

    # 3. Class weights → penaliza más los errores en clases pequeñas
    class_weights = torch.tensor(1.0 / counts, dtype=torch.float)
    class_weights = class_weights / class_weights.sum()
    criterion = nn.CrossEntropyLoss(weight=class_weights.to(DEVICE))

    # 4. Optimizador y scheduler
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LR,
        weight_decay=1e-4,
    )
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.1)

    # 5. Entrenar
    start = time.time()
    model, history = train_model(
        model, dataloaders, dataset_sizes,
        criterion, optimizer, scheduler,
        NUM_EPOCHS,
    )
    elapsed = time.time() - start
    print(f"\nTiempo total: {elapsed/60:.1f} min")

    # 6. Guardar modelo
    os.makedirs("saved_model", exist_ok=True)
    torch.save(model.state_dict(), "saved_model/alzheimer_resnet50.pth")
    print("Modelo guardado en: saved_model/alzheimer_resnet50.pth")

    # 7. Curvas
    plot_history(history)


if __name__ == "__main__":
    main()