"""
Script de preparación del dataset desde Kaggle.
Divide automáticamente en train / val (80% / 20%).

Dataset recomendado:
  https://www.kaggle.com/datasets/tourist55/alzheimers-dataset-4-class-of-images

Estructura esperada después de correr este script:
  data/
    train/
      NonDemented/         (~2560 imágenes)
      VeryMildDemented/    (~1792 imágenes)
      MildDemented/        (~448 imágenes)
      ModerateDemented/    (~64 imágenes)
    val/
      NonDemented/         (~640 imágenes)
      VeryMildDemented/    (~448 imágenes)
      MildDemented/        (~112 imágenes)
      ModerateDemented/    (~16 imágenes)
"""

import os
import shutil
import random
from pathlib import Path

# ─── Configuración ───────────────────────────
RAW_DIR   = "raw_dataset"   # donde descomprimiste el ZIP de Kaggle
OUT_DIR   = "data"          # carpeta de salida para train/val
VAL_RATIO = 0.20            # 20% para validación
SEED      = 42
# ─────────────────────────────────────────────

random.seed(SEED)


def split_dataset(raw_dir: str, out_dir: str, val_ratio: float):
    raw_path = Path(raw_dir)
    out_path = Path(out_dir)

    # Detectar subcarpetas de clases
    class_dirs = [d for d in raw_path.iterdir() if d.is_dir()]
    if not class_dirs:
        raise FileNotFoundError(f"No se encontraron carpetas en {raw_dir}")

    print(f"Clases encontradas: {[d.name for d in class_dirs]}\n")

    total_train, total_val = 0, 0

    for class_dir in class_dirs:
        images = list(class_dir.glob("*.jpg")) + \
                 list(class_dir.glob("*.jpeg")) + \
                 list(class_dir.glob("*.png"))

        random.shuffle(images)
        n_val = max(1, int(len(images) * val_ratio))
        val_images   = images[:n_val]
        train_images = images[n_val:]

        for split, imgs in [("train", train_images), ("val", val_images)]:
            dest = out_path / split / class_dir.name
            dest.mkdir(parents=True, exist_ok=True)
            for img in imgs:
                shutil.copy(img, dest / img.name)

        print(f"  {class_dir.name:25s} → train: {len(train_images):4d} | val: {len(val_images):4d}")
        total_train += len(train_images)
        total_val   += len(val_images)

    print(f"\nTotal → train: {total_train} | val: {total_val}")
    print(f"Dataset listo en: {out_dir}/")


if __name__ == "__main__":
    split_dataset(RAW_DIR, OUT_DIR, VAL_RATIO)