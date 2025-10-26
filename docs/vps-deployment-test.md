# 🚀 Быстрая Инструкция: Деплой на VPS без SSL

Упрощенная инструкция для развертывания ChecklyTool на тестовом VPS в РФ **БЕЗ SSL/домена** (только HTTP).

---

## ✅ Что вам понадобится

- VPS с Ubuntu 20.04+ (минимум 2GB RAM)
- Статический IP адрес
- SSH root-доступ
- Открытый порт 80

---

## 📝 Шаг 1: Изменения в nginx.conf

Откройте файл `nginx.conf` и **удалите или закомментируйте**:

### 1.1. Удалите весь HTTPS server block (строки 55-117):

```nginx
# Удалите этот блок полностью:
# server {
#     listen 443 ssl http2;
#     server_name checklytool.com www.checklytool.com;
#     ... весь блок до закрывающей скобки
# }
```

### 1.2. Удалите HTTP редирект на HTTPS (строки 49-52):

```nginx
# Удалите эти строки:
# location / {
#     return 301 https://$server_name$request_uri;
# }
```

### 1.3. Измените server_name в HTTP server (строка 31):

```nginx
# Было:
server_name checklytool.com www.checklytool.com _;

# Стало:
server_name _;  # Принимаем любой IP/домен
```

### 1.4. Добавьте proxy для приложения в HTTP server (после строки 47):

```nginx
# Прокси на Next.js приложение
location / {
    proxy_pass http://nextjs;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection "";
    proxy_http_version 1.1;
    add_header Cache-Control "no-cache, must-revalidate";
}

# Кэширование статики
location /_next/static/ {
    proxy_pass http://nextjs;
    proxy_set_header Host $host;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Результат:** У вас останется ТОЛЬКО HTTP server на порту 80 без SSL.

---

## 📝 Шаг 2: Изменения в docker-compose.yml

### 2.1. Удалите SSL volume (строка 28):

```yaml
# Удалите эту строку:
# - ./ssl:/etc/nginx/ssl
```

### 2.2. Удалите порт 443 (строка 25):

```yaml
# Удалите эту строку:
# - "443:443"
```

**Результат:** nginx будет слушать только порт 80 без SSL.

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
