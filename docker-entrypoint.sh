#!/bin/bash
set -e

# Use PORT from environment or default to 8080
PORT=${PORT:-8080}

# Ensure data directory exists
mkdir -p /app/data /tmp

# Create nginx config with correct port
cat > /etc/nginx/nginx.conf << EOF
user www-data;
worker_processes auto;
error_log /tmp/nginx_error.log warn;
pid /tmp/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /tmp/nginx_access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    server {
        listen $PORT default_server;
        server_name _;

        client_max_body_size 100M;

        # Serve frontend
        location / {
            root /usr/share/nginx/html;
            try_files \$uri \$uri/ /index.html;
            expires 1h;
            add_header Cache-Control "public, max-age=3600";
        }

        # Proxy API to FastAPI backend
        location /api/ {
            proxy_pass http://localhost:8000/api/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "ok\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Update supervisord config with environment
cat > /etc/supervisor/conf.d/supervisord.conf << EOF
[supervisord]
nodaemon=true
logfile=/tmp/supervisord.log
pidfile=/tmp/supervisord.pid
user=root

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
startretries=3
stdout_logfile=/tmp/nginx.log
stderr_logfile=/tmp/nginx.err.log

[program:uvicorn]
command=python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --log-level info
directory=/app
autostart=true
autorestart=true
startretries=3
stdout_logfile=/tmp/uvicorn.log
stderr_logfile=/tmp/uvicorn.err.log
environment=PYTHONUNBUFFERED=1,DATABASE_URL=sqlite:////app/data/notes.db
EOF

# Start supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
