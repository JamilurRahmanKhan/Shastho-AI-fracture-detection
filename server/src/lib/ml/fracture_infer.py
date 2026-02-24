"""Fracture detection inference wrapper.

This script is called from the Node.js server (chat feature only).

Important implementation notes:
-------------------------------
Some copies of this project ship an *entire* `ultralytics/` source folder next
to the weights. That local folder can easily be a different version than the
one installed in the python environment (venv39), which leads to hard-to-debug
import errors (e.g. missing `AIFI`).

To make inference reliable, we **do not** require a local `ultralytics/` folder
next to the weights. Instead, we import Ultralytics from the active python
environment (venv39) and simply load the provided `.pt` weights.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import subprocess
from pathlib import Path


def _pip_install(packages: list[str]) -> None:
    """Best-effort install of missing python deps inside the active env.

    Many users unzip the project and restore venv39, but sometimes that venv is
    incomplete (e.g. missing `requests`). This helper installs only the missing
    lightweight packages automatically so the chat ML path works out-of-the-box.

    We intentionally avoid auto-installing heavy packages like torch here.
    """

    try:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "--quiet", "--no-input", *packages],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        # If install fails (no internet, permissions, etc.), we fall back to the
        # original import error message below.
        return


def _self_heal_import(err: ModuleNotFoundError) -> bool:
    """Try to auto-install a small set of common missing dependencies.

    Returns True if we attempted a fix.
    """

    msg = str(err)
    if "No module named 'requests'" in msg:
        _pip_install(["requests"])
        return True
    if "No module named 'tqdm'" in msg:
        _pip_install(["tqdm"])
        return True
    # Ultralytics (and some forks) still import pkg_resources.
    # Newer setuptools versions can omit it, so pin to a compatible release.
    if "No module named 'pkg_resources'" in msg:
        _pip_install(["setuptools==70.3.0"])
        return True
    return False


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", required=True, help="Path to input image")
    ap.add_argument("--weights", required=True, help="Path to model weights (.pt)")
    ap.add_argument("--conf", type=float, default=0.25, help="Confidence threshold")
    args = ap.parse_args()

    image_path = Path(args.image).expanduser().resolve()
    weights_path = Path(args.weights).expanduser().resolve()
    if not image_path.exists():
        print(json.dumps({"error": f"Image not found: {str(image_path)}"}))
        return 2
    if not weights_path.exists():
        print(json.dumps({"error": f"Weights not found: {str(weights_path)}"}))
        return 2

    # Import ultralytics from the active environment (venv39).
    try:
        from ultralytics import YOLO  # type: ignore
    except ModuleNotFoundError as e:
        if _self_heal_import(e):
            try:
                from ultralytics import YOLO  # type: ignore
            except Exception as e2:
                print(json.dumps({
                    "error": "Failed to import ultralytics after attempting dependency install.",
                    "details": str(e2),
                    "hint": "Activate venv39 and install requirements (ultralytics, torch, requests, tqdm).",
                }))
                return 4
        else:
            print(json.dumps({
                "error": "Missing python dependency.",
                "details": str(e),
                "hint": "Activate venv39 and install requirements (ultralytics, torch, requests, tqdm).",
            }))
            return 4
    except Exception as e:
        print(json.dumps({
            "error": "Failed to import ultralytics. Ensure venv39 (with torch/ultralytics) is present and used.",
            "details": str(e),
        }))
        return 4

    try:
        model = YOLO(str(weights_path))
        results = model.predict(source=str(image_path), conf=float(args.conf), verbose=False)
        if not results:
            out = {"fractureDetected": False, "probability": 0.0, "boxes": []}
            print(json.dumps(out))
            return 0

        r0 = results[0]
        boxes = []
        max_conf = 0.0
        if getattr(r0, "boxes", None) is not None and len(r0.boxes) > 0:
            for b in r0.boxes:
                try:
                    conf = float(b.conf[0])
                except Exception:
                    conf = float(getattr(b, "conf", 0.0))
                max_conf = max(max_conf, conf)

                xyxy = b.xyxy[0].tolist()  # [x1,y1,x2,y2]
                cls_id = int(b.cls[0]) if getattr(b, "cls", None) is not None else 0
                boxes.append(
                    {
                        "x1": float(xyxy[0]),
                        "y1": float(xyxy[1]),
                        "x2": float(xyxy[2]),
                        "y2": float(xyxy[3]),
                        "confidence": conf,
                        "classId": cls_id,
                    }
                )

        out = {
            "fractureDetected": len(boxes) > 0,
            "probability": max_conf,
            "boxes": boxes,
        }
        print(json.dumps(out))
        return 0
    except Exception as e:
        print(json.dumps({"error": "Inference failed", "details": str(e)}))
        return 5


if __name__ == "__main__":
    raise SystemExit(main())
