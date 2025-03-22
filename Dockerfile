# Stage 1 — build frontend
FROM node:18-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# Stage 2 — build backend + serve static
FROM python:3.10-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app

# OS deps for Playwright (if needed)
RUN apt-get update && apt-get install -y wget ca-certificates \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libx11-xcb1 libgbm1 libasound2 \
 && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN playwright install-deps && playwright install chromium

COPY backend ./

# Copy static build output
COPY --from=frontend /app/frontend/out ./static

EXPOSE 8002
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
