FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

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

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Create supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
