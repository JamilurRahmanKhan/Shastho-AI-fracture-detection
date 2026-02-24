# ShasthoAI — Chat Feature Setup (AI + X-ray ML)

This project’s **/chat** feature supports:

1) **General medical Q&A** using an online LLM provider (Groq recommended)
2) **X-ray analysis inside chat** using the provided YOLOv8 fracture detection model

## 1) Enable AI answers (Groq)

Create a Groq key in the Groq console and set it in your backend `.env` (the `.env` you use to run the server).

```env
GROQ_API_KEY=YOUR_KEY
GROQ_MODEL=llama3-8b-8192
```

Then restart the backend server.

> **Security:** never commit or share API keys.

## 2) Enable ML inference in Chat

Place the model venv folder back at:

`model/Fracture_Detection_Improved_YOLOv8/venv39/`

The server will automatically use this python executable if it exists:
- Windows: `.../venv39/Scripts/python.exe`
- Mac/Linux: `.../venv39/bin/python`

### Required dependencies in that venv
The python environment used for inference must have:
- `torch`
- `ultralytics`

If you see **ML inference failed**, check the error details shown in the chat UI or backend logs.

## 3) Notes

- Only the **/chat** feature uses the ML-integrated upload endpoint: `POST /api/chat/xrays/upload`.
- Other modules like `/upload` and `/reports` are unchanged.
