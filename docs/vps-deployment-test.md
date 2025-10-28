# 🚀 Быстрая Инструкция: Деплой на VPS без SSL

Упрощенная инструкция для развертывания ChecklyTool на тестовом VPS в РФ **БЕЗ SSL/домена** (только HTTP).

---

## ✅ Что вам понадобится

- VPS с Ubuntu 20.04+ (минимум 2GB RAM + 4GB SWAP)
- Статический IP адрес
- SSH root-доступ
- Открытый порт 80
- Стабильное интернет-соединение

---

## 🔧 Шаг 0: Оптимизация сервера (КРИТИЧНО!)

### 0.1. Добавление SWAP памяти

```bash
# Создать 4GB SWAP (обязательно для сборки Next.js!)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Проверить
free -h

# Сделать постоянным
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Настроить swappiness (как часто использовать SWAP)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 0.2. Настройка DNS (для быстрой загрузки пакетов)

```bash
# Резервная копия
sudo cp /etc/resolv.conf /etc/resolv.conf.backup

# Установить Google DNS + Cloudflare
sudo tee /etc/resolv.conf > /dev/null <<EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
EOF

# Проверить
nslookup registry.npmjs.org
```

### 0.3. Настройка Docker зеркал (для РФ)

```bash
# Создать конфигурацию Docker
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<'DOCKEREOF'
{
  "registry-mirrors": [
    "https://mirror.gcr.io",
    "https://dockerhub.timeweb.cloud",
    "https://daocloud.io"
  ],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 10,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
DOCKEREOF

# Применить (после установки Docker на шаге 4)
sudo systemctl daemon-reload
sudo systemctl restart docker

# Проверить
docker info | grep -i mirror
```

---

## 📝 Шаг 1: Правильная конфигурация nginx.conf

Замените содержимое `nginx.conf` на эту оптимизированную версию для HTTP:

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Логи
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Производительность
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # Сжатие
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # Upstream для Next.js
    upstream nextjs {
        server checklytool:3000;
        keepalive 32;
    }

    # Upstream для webhook
    upstream webhook {
        server webhook:9000;
        keepalive 8;
    }

    # HTTP server (без SSL)
    server {
        listen 80;
        server_name _;  # Принимаем любой IP/домен

        # Webhook endpoint
        location /api/webhook {
            proxy_pass http://webhook;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
        }

        # Next.js приложение
        location / {
            proxy_pass http://nextjs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";
            proxy_http_version 1.1;

            # Для Next.js HMR (горячая перезагрузка)
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            proxy_buffering off;
            proxy_cache_bypass $http_upgrade;
        }

        # Статика Next.js с кешированием
        location /_next/static/ {
            proxy_pass http://nextjs;
            proxy_set_header Host $host;
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }

        # Публичные файлы
        location /favicon.ico {
            proxy_pass http://nextjs;
            expires 1y;
            access_log off;
        }

        location /robots.txt {
            proxy_pass http://nextjs;
            expires 1d;
            access_log off;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

**Ключевые особенности этой конфигурации:**
- ✅ Работает только по HTTP (порт 80)
- ✅ Оптимизированное сжатие gzip
- ✅ Правильный проксирование для Next.js
- ✅ Кеширование статики (_next/static)
- ✅ Отдельный upstream для webhook
- ✅ Health check endpoint

---

## 📝 Шаг 2: Изменения в docker-compose.yml

В секции `nginx` удалите:
- Порт `443:443`
- Volume `./ssl:/etc/nginx/ssl`

Должно остаться только:

```yaml
nginx:
  image: nginx:alpine
  container_name: checklytool_nginx
  restart: always
  ports:
    - "80:80"  # Только HTTP
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
  depends_on:
    - checklytool
  networks:
    - web
```

---

## 📝 Шаг 2.5: Оптимизация Dockerfile (для быстрой сборки)

Добавьте настройки npm в Dockerfile для ускорения установки пакетов:

В секции **deps** (строка ~12-15) и **builder** (строка ~21-24):

```dockerfile
RUN --mount=type=cache,target=/tmp/.npm \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set cache /tmp/.npm && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 10 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --only=production --verbose
```

Эти настройки добавляют:
- ✅ Увеличенный таймаут (10 минут)
- ✅ 10 попыток при ошибке
- ✅ Прогрессивное увеличение времени между попытками

---

## 📝 Шаг 3: Настройка .env

Измените в `.env`:

```env
# Было:
NEXTAUTH_URL=https://checklytool.com
NEXT_PUBLIC_SITE_URL=https://checklytool.com

# Стало (замените на ваш IP):
NEXTAUTH_URL=http://YOUR_SERVER_IP
NEXT_PUBLIC_SITE_URL=http://YOUR_SERVER_IP

# Режим T-Bank (для тестов):
TBANK_MODE=test
```

**❗ Не забудьте заменить `YOUR_SERVER_IP` на реальный IP!**

---

## 🐳 Шаг 4: Установка Docker на VPS

### 4.1. Подключитесь к серверу:

```bash
ssh root@YOUR_SERVER_IP
```

### 4.2. Установите Docker через Yandex Mirror (РФ):

```bash
# Обновляем систему
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg

# Добавляем GPG ключ через Yandex
mkdir -p /etc/apt/keyrings
curl -fsSL https://mirror.yandex.ru/mirrors/docker/linux/ubuntu/gpg | \
  gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Добавляем репозиторий
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://mirror.yandex.ru/mirrors/docker/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Устанавливаем Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Проверяем
docker --version
docker compose version
```

---

## 🚀 Шаг 5: Развертывание

```bash
# 1. Клонируем проект
mkdir -p /var/www && cd /var/www
git clone https://github.com/YOUR_USERNAME/checklytool_website.git
cd checklytool_website

# 2. Создаем .env (скопируйте из .env.example и заполните)
nano .env

# 3. Запускаем
docker compose up -d --build

# 4. Проверяем логи
docker logs -f checklytool_app
```

**Откройте в браузере:** `http://YOUR_SERVER_IP`

---

## 🔄 Быстрое обновление

Создайте `update.sh` в корне проекта:

```bash
nano update.sh
```

Вставьте:

```bash
#!/bin/bash
set -e

cd /var/www/checklytool_website
git pull
docker compose up -d --build

echo "✅ Обновлено!"
docker ps
```

Сделайте исполняемым:

```bash
chmod +x update.sh
```

**Использование:**

```bash
# Запуск обновления
./update.sh

# Или одной командой:
cd /var/www/checklytool_website && git pull && docker compose up -d --build
```

---

## 📊 Полезные команды

```bash
# Логи в реальном времени
docker logs -f checklytool_app

# Статус контейнеров
docker ps

# Использование ресурсов
docker stats

# Место на диске
df -h

# Перезапуск
docker compose restart

# Остановка
docker compose down

# Полная пересборка (очистка кеша)
docker compose down && docker compose build --no-cache && docker compose up -d
```

---

## 🐛 Отладка платежей T-Bank

```bash
# Логи webhook
docker logs -f checklytool_app | grep -i "webhook"

# Логи платежей
docker logs -f checklytool_app | grep -i "payment"

# Проверка endpoint
curl -I http://YOUR_SERVER_IP/api/payment/webhook
```

**URL для T-Bank:**

```
http://YOUR_SERVER_IP/api/payment/webhook
```

Указать в: **ЛК Т-Банк → Терминалы → DEMO → Уведомления → По протоколу HTTP**

---

## ⚠️ Важно

1. **Это тестовая конфигурация БЕЗ SSL!** Для production используйте HTTPS.
2. Убедитесь, что порт 80 открыт в firewall: `ufw allow 80/tcp`
3. После каждого изменения `.env` нужно перезапустить: `docker compose restart`

---

**Готово!** Ваш ChecklyTool доступен по адресу `http://YOUR_SERVER_IP`
