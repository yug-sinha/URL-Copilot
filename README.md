# URL Copilot

A **single‑container**, full‑stack URL‑chatbot that extracts text from any website (including JavaScript‑rendered pages), indexes its content (and its first‑level links), then lets you ask natural‑language questions about that site. Built with **FastAPI + Playwright** on the backend and **Next.js + Tailwind CSS** on the frontend — all served from one Docker image.

---

## 🚀 Features

- 📄 Fetch & scrape parent page + up to 30 same‑domain child links  
- 🤖 Query via Google Gemini (or your preferred LLM) on extracted content  
- ⚡️ Zero‑hallucination: uses only provided context; returns “I’m sorry…” if no answer  
- 🖥️ Responsive React/Next.js chat UI  
- 🐳 Single Dockerfile for unified deploy (no Compose needed)  

---

## 📁 Repository Structure

```
URL-chatbot-pj/
├── backend/                   # FastAPI + Playwright scraper + Gemini integration
│   ├── main.py
│   ├── utils.py
│   └── requirements.txt
├── frontend/                  # Next.js chat UI
│   ├── app/
│   ├── public/
│   ├── next.config.mjs
│   └── package.json
├── Dockerfile                 # Multi‑stage build for frontend + backend
└── README.md
```

---

## 🔧 Prerequisites

- Docker ≥ 20.10  
- Node.js ≥ 18 (for local dev)  
- Python ≥ 3.10 (for local dev)  
- Gemini API key (set in `.env`)

---

## ⚙️ Local Development

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
export GEMINI_API_KEY=<your-key>
uvicorn main:app --reload --host 0.0.0.0 --port 8002
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

> **Local URLs:**  
> - Frontend → http://localhost:3000  
> - Backend API → http://localhost:8002/extract & http://localhost:8002/chat  

---

## 📦 Docker (Single Container)

Build and run **both** services in one image:

```bash
docker build -t url-chatbot .
docker run -d -p 80:8002 --name url-chatbot url-chatbot
```

- Visit your app at **http://localhost/**  
- API endpoints live under the same host: `/extract`, `/chat`

---

## 🌐 Production Deployment

1. Push to your Git repo.  
2. Point your host’s Dockerfile path at the root `Dockerfile`, build context `.`.  
3. No custom command needed — it uses Uvicorn’s CMD.  

All traffic (static UI + API) served from a single domain.

---

## 🧪 API Reference

### POST `/extract`

Request JSON:
```json
{ "url": "https://example.com" }
```
Response:
```json
{ "text": "Full extracted content..." }
```

### POST `/chat`

Request JSON:
```json
{ "context": "...extracted text...", "question": "Your question?" }
```
Response:
```json
{ "response": "AI answer based on context" }
```

---

## 🎯 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| GEMINI_API_KEY | Google Gemini API key | — |
| NEXT_PUBLIC_EXTRACT_API_URL | Dev backend URL | `http://localhost:8002/extract` |
| NEXT_PUBLIC_CHAT_API_URL | Dev backend URL | `http://localhost:8002/chat` |

Production defaults to relative paths (`/extract`, `/chat`).

---

## 📜 License

MIT © Your Name