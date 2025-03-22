FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Install OS‑level dependencies for Playwright
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    wget ca-certificates libnss3 libatk1.0-0 libatk-bridge2.0-0 \
    libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
    libpango1.0-0 libasound2 libcups2 libdrm2 libfontconfig1 \
    libfreetype6 libglib2.0-0 libjpeg62-turbo libpng16-16 libstdc++6 \
    libxss1 libxtst6 \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Let Playwright install its own dependencies + Chromium
RUN playwright install-deps \
 && playwright install chromium

COPY . .

EXPOSE 8002

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
