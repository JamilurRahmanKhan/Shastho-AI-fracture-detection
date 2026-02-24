# ShasthoAI Monorepo (client/server)

This repository contains:
- `client/` – Vite + React frontend
- `server/` – Node.js + Express API + MongoDB

## Prerequisites
- Node.js 18+
- A MongoDB Atlas connection string
- Firebase project (Auth) + Firebase Admin service account JSON

## Setup (Local)

### 1) Backend env
Create `server/.env` from `server/.env.example` and fill values.

Place your Firebase Admin service account JSON at:
- `server/secrets/firebase-admin.json`

Set:
- `FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-admin.json`

### 2) Install dependencies
From repo root:
```bash
npm install
npm --prefix client install
npm --prefix server install
```

### 3) Run dev
```bash
npm run dev
```
- Frontend: http://localhost:5173
- API: http://localhost:5001 (default)

If port 5001 is busy, change `PORT` in `server/.env`.

### MongoDB Atlas DNS/SRV troubleshooting
If the server prints an error like `querySrv ENOTFOUND _mongodb._tcp.<...>.mongodb.net`:

1. Copy the connection string again from Atlas (Cluster > Connect > Drivers) and paste it into `server/.env`.
2. Ensure Atlas **Network Access** allows your IP (for dev you can temporarily allow `0.0.0.0/0`).
3. Fix local DNS: set your system DNS to `1.1.1.1` (Cloudflare) or `8.8.8.8` (Google), or try a different network/VPN.

This repo starts the Express server even if MongoDB is down (in non-production mode) so you can still reach `/api/health`.

### Client proxy target
The Vite dev server proxies `/api` and `/uploads` to the backend.
By default it targets `http://localhost:5001`.
To override, create `client/.env` from `client/.env.example` and set:
`CLIENT_API_TARGET=http://localhost:5000` (or your chosen port).

## How auth works
Frontend uses Firebase Auth. For API calls, the client attaches a Firebase ID token in:
`Authorization: Bearer <token>`.

The server verifies the token using Firebase Admin SDK.

## AI Chat integration
`server/src/lib/aiChatProvider.js` contains a placeholder `generateAssistantReply()`.
Replace that function to call your AI model when ready.
