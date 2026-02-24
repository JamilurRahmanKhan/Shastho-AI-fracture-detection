import os
from ultralytics import YOLO
import cv2

# ---------------- CONFIG ----------------
IMAGE_DIR = "GRAZPEDWRI-DX/data/images"
LABEL_DIR = "GRAZPEDWRI-DX/data/labels"

CONF_THRES = 0.25
IMG_SIZE = 640

# Use pretrained YOLOv8 detector
MODEL_NAME = "yolov8n.pt"
# ---------------------------------------

os.makedirs(LABEL_DIR, exist_ok=True)

model = YOLO(MODEL_NAME)

images = [f for f in os.listdir(IMAGE_DIR) if f.endswith(".png")]

print(f"Found {len(images)} images. Generating pseudo-labels...")

for img_name in images:
    img_path = os.path.join(IMAGE_DIR, img_name)
    label_path = os.path.join(LABEL_DIR, img_name.replace(".png", ".txt"))

    img = cv2.imread(img_path)
    if img is None:
        continue

    h, w, _ = img.shape

    results = model(img, imgsz=IMG_SIZE, conf=CONF_THRES, verbose=False)

    with open(label_path, "w") as f:
        for r in results:
            if r.boxes is None:
                continue

            for box in r.boxes:
                cls = int(box.cls.item())
                x1, y1, x2, y2 = box.xyxy[0].tolist()

                # YOLO format (normalized)
                xc = ((x1 + x2) / 2) / w
                yc = ((y1 + y2) / 2) / h
                bw = (x2 - x1) / w
                bh = (y2 - y1) / h

                f.write(f"{cls} {xc} {yc} {bw} {bh}\n")

print("✅ Pseudo-label generation complete.")
