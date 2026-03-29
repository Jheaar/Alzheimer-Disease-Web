"""
Entrenamiento VGG16 para clasificación de Alzheimer en MRI
- Transfer Learning + Fine-Tuning
- Data augmentation por clase
- WeightedRandomSampler
- Class weights en loss
"""

import os
import copy
import time
import json
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
BATCH_SIZE  = 32    # VGG16 consume más VRAM que ResNet, bajamos a 32
NUM_EPOCHS  = 25
LR          = 1e-4
DEVICE      = torch.device("cuda" if torch.cuda.is_available() else "cpu")

FOLDER_TO_LABEL = {
    "MildDemented":     "Demencia Leve",
    "ModerateDemented": "Demencia Moderada",
    "NonDemented":      "No Demencia",
    "VeryMildDemented": "Demencia Muy Leve",
}

print(f"Usando dispositivo: {DEVICE}")
print(f"\nMapeo de clases:")
for folder, label in FOLDER_TO_LABEL.items():
    print(f"  {folder:25s} → {label}")

# ─────────────────────────────────────────────
# TRANSFORMACIONES
# VGG16 también usa 224x224
# ─────────────────────────────────────────────
transform_normal = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomVerticalFlip(p=0.2),
    transforms.RandomRotation(degrees=15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

transform_heavy = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.RandomCrop(224),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomVerticalFlip(p=0.5),
    transforms.RandomRotation(degrees=30),
    transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.85, 1.15), shear=10),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.05),
    transforms.RandomGrayscale(p=0.1),
    transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 1.5)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

transform_val = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

# ─────────────────────────────────────────────
# DATASET CON AUGMENTATION POR CLASE
# ─────────────────────────────────────────────
class AugmentedDataset(torch.utils.data.Dataset):
    minority_indices: set = set()

    def __init__(self, root, transform_n, transform_h):
        self.dataset     = datasets.ImageFolder(root)
        self.transform_n = transform_n
        self.transform_h = transform_h

        counts    = np.bincount([label for _, label in self.dataset.samples])
        threshold = counts.mean() * 0.5
        AugmentedDataset.minority_indices = {
            i for i, c in enumerate(counts) if c < threshold
        }

        print(f"\nClases cargadas:")
        for folder, idx in sorted(self.dataset.class_to_idx.items(), key=lambda x: x[1]):
            label = FOLDER_TO_LABEL.get(folder, folder)
            tag   = " <- augmentation agresivo" if idx in AugmentedDataset.minority_indices else ""
            print(f"  [{idx}] {folder:25s} → {label:20s} ({counts[idx]} imgs){tag}")

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
# CARGA DEL DATASET
# ─────────────────────────────────────────────
def load_data(data_dir):
    train_dataset = AugmentedDataset(
        os.path.join(data_dir, "train"),
        transform_normal, transform_heavy,
    )
    val_dataset = datasets.ImageFolder(
        os.path.join(data_dir, "val"),
        transform=transform_val,
    )

    labels   = [label for _, label in train_dataset.dataset.samples]
    counts   = np.bincount(labels)
    weights  = 1.0 / counts
    sample_w = torch.tensor([weights[l] for l in labels], dtype=torch.float)

    sampler = WeightedRandomSampler(
        weights=sample_w, num_samples=len(sample_w), replacement=True,
    )

    train_loader = DataLoader(
        train_dataset, batch_size=BATCH_SIZE,
        sampler=sampler, num_workers=4, pin_memory=True,
    )
    val_loader = DataLoader(
        val_dataset, batch_size=BATCH_SIZE,
        shuffle=False, num_workers=4, pin_memory=True,
    )

    dataloaders   = {"train": train_loader, "val": val_loader}
    dataset_sizes = {"train": len(train_dataset), "val": len(val_dataset)}

    idx_to_folder = {v: k for k, v in train_dataset.dataset.class_to_idx.items()}
    class_names   = [FOLDER_TO_LABEL[idx_to_folder[i]] for i in range(NUM_CLASSES)]

    print(f"\nTamano train : {dataset_sizes['train']} imagenes")
    print(f"Tamano val   : {dataset_sizes['val']} imagenes")
    print(f"\nCLASS_NAMES final:")
    for i, name in enumerate(class_names):
        print(f"  {i} → {name}")

    return dataloaders, dataset_sizes, class_names, counts

# ─────────────────────────────────────────────
# MODELO: VGG16 con fine-tuning
# ─────────────────────────────────────────────
def build_model(num_classes):
    model = models.vgg16(weights=models.VGG16_Weights.IMAGENET1K_V1)

    # Congelar todas las capas convolucionales
    for param in model.features.parameters():
        param.requires_grad = False

    # Descongelar los últimos 2 bloques convolucionales (features 24 en adelante)
    for layer in model.features[24:]:
        for param in layer.parameters():
            param.requires_grad = True

    # Reemplazar el clasificador final
    in_features = model.classifier[6].in_features
    model.classifier[6] = nn.Sequential(
        nn.Linear(in_features, 256),
        nn.ReLU(),
        nn.Dropout(p=0.4),
        nn.Linear(256, num_classes),
    )

    return model.to(DEVICE)

# ─────────────────────────────────────────────
# ENTRENAMIENTO
# ─────────────────────────────────────────────
def train_model(model, dataloaders, dataset_sizes, criterion, optimizer, scheduler, num_epochs):
    best_weights = copy.deepcopy(model.state_dict())
    best_acc     = 0.0
    history      = {"train_loss": [], "val_loss": [], "train_acc": [], "val_acc": []}

    for epoch in range(num_epochs):
        print(f"\nEpoca {epoch+1}/{num_epochs}  {'─'*40}")
        for phase in ["train", "val"]:
            model.train() if phase == "train" else model.eval()
            running_loss, running_corrects = 0.0, 0

            for inputs, labels in dataloaders[phase]:
                inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
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
# CURVAS
# ─────────────────────────────────────────────
def plot_history(history, save_path="training_curves.png"):
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    for ax, key, title in zip(axes, ["loss", "acc"], ["Loss", "Accuracy"]):
        ax.plot(history[f"train_{key}"], label="Train", marker="o")
        ax.plot(history[f"val_{key}"],   label="Val",   marker="s")
        ax.set_title(f"{title} por epoca")
        ax.set_xlabel("Epoca"); ax.set_ylabel(title)
        ax.legend(); ax.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    print(f"Curvas guardadas en: {save_path}")

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
def main():
    dataloaders, dataset_sizes, class_names, counts = load_data(DATA_DIR)

    model = build_model(NUM_CLASSES)

    class_weights = torch.tensor(1.0 / counts, dtype=torch.float)
    class_weights = class_weights / class_weights.sum()
    criterion     = nn.CrossEntropyLoss(weight=class_weights.to(DEVICE))

    # Solo optimizar parámetros que requieren gradiente
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LR, weight_decay=1e-4,
    )
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.1)

    start = time.time()
    model, history = train_model(
        model, dataloaders, dataset_sizes,
        criterion, optimizer, scheduler, NUM_EPOCHS,
    )
    print(f"\nTiempo total: {(time.time()-start)/60:.1f} min")

    os.makedirs("saved_model", exist_ok=True)
    torch.save(model.state_dict(), "saved_model/alzheimer_vgg16.pth")

    with open("saved_model/class_mapping.json", "w", encoding="utf-8") as f:
        json.dump({str(i): name for i, name in enumerate(class_names)}, f, ensure_ascii=False, indent=2)

    print("Modelo guardado en:  saved_model/alzheimer_vgg16.pth")
    print("Mapeo guardado en:   saved_model/class_mapping.json")
    plot_history(history)

if __name__ == "__main__":
    main()