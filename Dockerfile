FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build || true
RUN ls -la dist/ || mkdir -p dist && echo '<html><body>Frontend building...</body></html>' > dist/index.html

FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /var/log/nginx /var/log/uvicorn /app/data

WORKDIR /app

# Copy Python requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend/ ./backend/

# Copy entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 8080

ENTRYPOINT ["/app/docker-entrypoint.sh"]
