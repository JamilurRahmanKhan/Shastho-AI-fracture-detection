from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import tempfile, os
from ultralytics import YOLO

app = FastAPI()

MODEL_PATH = os.getenv("MODEL_PATH", "best.pt")
model = YOLO(MODEL_PATH)

@app.get("/")
def root():
    return {"ok": True, "service": "shasthoai-model"}

@app.post("/infer")
async def infer(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        path = tmp.name

    try:
        results = model(path)
        r = results[0]
        boxes = []
        if r.boxes is not None:
            for b in r.boxes:
                boxes.append({
                    "xyxy": b.xyxy[0].tolist(),
                    "conf": float(b.conf[0]),
                    "cls": int(b.cls[0])
                })
        return {"ok": True, "boxes": boxes}
    except Exception as e:
        return JSONResponse(status_code=500, content={"ok": False, "error": str(e)})
    finally:
        try: os.remove(path)
        except: pass