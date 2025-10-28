# 🚀 Деплой ChecklyTool БЕЗ Docker

Полная инструкция по развертыванию на чистом Ubuntu без Docker.

---

## 📋 Шаг 1: Подготовка сервера

### 1.1. Подключитесь к серверу:

```bash
ssh root@YOUR_SERVER_IP
```

### 1.2. Обновите систему:

```bash
apt update && apt upgrade -y
```

### 1.3. Добавьте SWAP (обязательно для сборки!):

```bash
# Создать 4GB SWAP
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Проверить
free -h

# Сделать постоянным
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Настроить swappiness
echo 'vm.swappiness=10' >> /etc/sysctl.conf
sysctl -p
```

### 1.4. Настройте DNS:

```bash
# Установить Google DNS
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo "nameserver 8.8.4.4" >> /etc/resolv.conf
echo "nameserver 1.1.1.1" >> /etc/resolv.conf
```

---

## 📦 Шаг 2: Установка Node.js 20

### Способ 1 (через wget - если проблемы с сетью):

```bash
# Скачать бинарники
cd /tmp
wget https://nodejs.org/dist/v20.19.1/node-v20.19.1-linux-x64.tar.xz

# Распаковать
tar -xf node-v20.19.1-linux-x64.tar.xz

# Установить
cp -r node-v20.19.1-linux-x64/{bin,include,lib,share} /usr/local/

# Проверить
node -v
npm -v
```

### Способ 2 (через nvm):

```bash
# Установить nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Активировать
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Установить Node.js 20
nvm install 20

# Проверить
node -v
npm -v
```

**Результат:** Должны появиться версии Node.js v20.x.x и npm 10.x.x

---

## 📁 Шаг 3: Клонирование проекта

```bash
# Создать папку
mkdir -p /var/www
cd /var/www

# Клонировать проект
git clone https://github.com/YOUR_USERNAME/checklytool_website.git
cd checklytool_website
```

---

## ⚙️ Шаг 4: Настройка окружения

### 4.1. Создайте .env файл:

```bash
nano .env
```

### 4.2. Вставьте и заполните (минимальная конфигурация):

```env
# База данных Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
AUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://YOUR_SERVER_IP
NEXT_PUBLIC_SITE_URL=http://YOUR_SERVER_IP

# OAuth провайдеры (опционально)
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_YANDEX_ID=
AUTH_YANDEX_SECRET=

# OpenRouter для AI (опционально)
OPENROUTER_API_KEY=

# T-Bank Payment (для тестов)
TBANK_MODE=test
TBANK_TERMINAL_KEY=
TBANK_SECRET_KEY=

# Email (Resend)
RESEND_API_KEY=
RESEND_AUDIENCE_ID=

# Режим
NODE_ENV=production
```

**Сохраните:** Ctrl+O → Enter → Ctrl+X

**❗ Замените:**
- `YOUR_SERVER_IP` на реальный IP вашего сервера (например, `91.229.10.157`)
- Supabase URL и ключи
- Остальные ключи по необходимости

---

## 🔨 Шаг 5: Сборка проекта

### 5.1. Настройте npm для стабильности:

```bash
npm config set fetch-timeout 600000
npm config set fetch-retries 10
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
```

### 5.2. Установите зависимости:

```bash
npm ci
```

**Это займет 5-10 минут!** Подождите, пока установятся все пакеты.

### 5.3. Сгенерируйте Prisma клиент:

```bash
npx prisma generate
```

### 5.4. Соберите проект:

```bash
npm run build
```

**Это займет 5-10 минут!** Если возникнут ошибки памяти - убедитесь, что SWAP включен (`free -h`).

---

## 🚀 Шаг 6: Установка и настройка PM2

### 6.1. Установите PM2 глобально:

```bash
npm install -g pm2
```

### 6.2. Запустите приложение:

```bash
cd /var/www/checklytool_website
pm2 start npm --name "checklytool" -- start
```

### 6.3. Настройте автозапуск:

```bash
# Создать startup скрипт
pm2 startup

# Выполните команду, которую покажет pm2 startup (она будет начинаться с sudo)
# Например: sudo env PATH=$PATH:/usr/local/bin pm2 startup systemd -u root --hp /root

# Сохранить текущие процессы
pm2 save
```

### 6.4. Проверьте статус:

```bash
pm2 status
pm2 logs checklytool
```

**Результат:** Приложение должно работать на `http://localhost:3000`

Проверьте:
```bash
curl http://localhost:3000
```

---

## 🌐 Шаг 7: Установка и настройка Nginx

### 7.1. Установите nginx:

```bash
apt-get install -y nginx
```

### 7.2. Создайте конфигурацию:

```bash
# Создать директории если их нет
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

# Создать конфиг
nano /etc/nginx/sites-available/checklytool
```

### 7.3. Вставьте конфигурацию:

```nginx
server {
    listen 80;
    server_name _;

    # Ограничение размера загружаемых файлов
    client_max_body_size 50M;

    # Основное приложение
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Статика Next.js
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

**Сохраните:** Ctrl+O → Enter → Ctrl+X

### 7.4. Активируйте конфигурацию:

```bash
# Создать симлинк
ln -s /etc/nginx/sites-available/checklytool /etc/nginx/sites-enabled/

# Удалить дефолтный конфиг
rm -f /etc/nginx/sites-enabled/default

# Проверить конфигурацию
nginx -t

# Если всё ОК, перезапустить nginx
systemctl restart nginx
systemctl enable nginx
```

### 7.5. Проверьте:

```bash
# Статус nginx
systemctl status nginx

# Проверить доступность через nginx
curl http://localhost
```

**Откройте в браузере:** `http://YOUR_SERVER_IP`

Ваш сайт должен быть доступен!

---

## 🔄 Обновление приложения

Создайте скрипт для быстрого обновления:

```bash
nano /var/www/checklytool_website/update.sh
```

Вставьте:

```bash
#!/bin/bash
set -e

echo "🔄 Обновление ChecklyTool..."

cd /var/www/checklytool_website

echo "📥 Получение изменений из Git..."
git pull

echo "📦 Установка зависимостей..."
npm ci

echo "🔨 Сборка проекта..."
npm run build

echo "♻️ Перезапуск приложения..."
pm2 restart checklytool

echo "✅ Обновление завершено!"
pm2 status
pm2 logs checklytool --lines 20
```

Сделайте исполняемым:

```bash
chmod +x /var/www/checklytool_website/update.sh
```

**Использование:**

```bash
cd /var/www/checklytool_website
./update.sh
```

---

## 📊 Полезные команды PM2

### Просмотр логов:

```bash
# Все логи в реальном времени
pm2 logs

# Только для checklytool
pm2 logs checklytool

# Последние 100 строк
pm2 logs checklytool --lines 100

# Только ошибки
pm2 logs checklytool --err
```

### Управление процессом:

```bash
# Статус
pm2 status

# Перезапуск
pm2 restart checklytool

# Остановка
pm2 stop checklytool

# Запуск
pm2 start checklytool

# Удалить из PM2
pm2 delete checklytool

# Перезагрузка (graceful reload без даунтайма)
pm2 reload checklytool
```

### Мониторинг:

```bash
# Интерактивный мониторинг
pm2 monit

# Использование ресурсов
pm2 status
```

### Очистка логов:

```bash
pm2 flush
```

---

## 🔧 Управление Nginx

### Основные команды:

```bash
# Проверить конфигурацию
nginx -t

# Перезапустить
systemctl restart nginx

# Перезагрузить конфиг (без остановки)
systemctl reload nginx

# Статус
systemctl status nginx

# Логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Изменение конфигурации:

```bash
# Редактировать конфиг
nano /etc/nginx/sites-available/checklytool

# Проверить
nginx -t

# Применить
systemctl reload nginx
```

---

## 🐛 Отладка проблем

### Приложение не запускается:

```bash
# Смотрим логи PM2
pm2 logs checklytool --lines 50

# Проверяем .env
cat /var/www/checklytool_website/.env

# Проверяем порт 3000
lsof -i :3000

# Проверяем память
free -h

# Пересобираем
cd /var/www/checklytool_website
npm run build
pm2 restart checklytool
```

### Nginx показывает 502 Bad Gateway:

```bash
# Проверить, запущено ли приложение
pm2 status

# Проверить, слушает ли приложение порт 3000
curl http://localhost:3000

# Посмотреть логи nginx
tail -f /var/log/nginx/error.log

# Перезапустить приложение
pm2 restart checklytool
```

### Медленная работа:

```bash
# Проверить память
free -h

# Проверить SWAP
swapon --show

# Мониторинг процессов
pm2 monit

# Увеличить SWAP если нужно
fallocate -l 8G /swapfile2
chmod 600 /swapfile2
mkswap /swapfile2
swapon /swapfile2
```

---

## 📝 Быстрая шпаргалка

```bash
# === Обновление приложения ===
cd /var/www/checklytool_website
git pull
npm ci
npm run build
pm2 restart checklytool

# === Просмотр логов ===
pm2 logs checklytool

# === Перезапуск всего ===
pm2 restart checklytool
systemctl restart nginx

# === Проверка статуса ===
pm2 status
systemctl status nginx
free -h

# === Быстрая диагностика ===
curl http://localhost:3000  # Проверка Next.js
curl http://localhost        # Проверка nginx
pm2 logs checklytool --lines 20
tail -f /var/log/nginx/error.log
```

---

## 🔒 Безопасность (опционально, но рекомендуется)

### Настройка Firewall:

```bash
# Установить ufw
apt-get install -y ufw

# Разрешить SSH
ufw allow 22/tcp

# Разрешить HTTP
ufw allow 80/tcp

# Включить
ufw enable

# Проверить
ufw status
```

### Автоматические обновления системы:

```bash
apt-get install -y unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades
```

---

## ✅ Готово!

Ваш ChecklyTool теперь работает по адресу: **http://YOUR_SERVER_IP**

Для обновления используйте:
```bash
/var/www/checklytool_website/update.sh
```

Для мониторинга:
```bash
pm2 monit
```

Логи приложения:
```bash
pm2 logs checklytool
```

Логи nginx:
```bash
tail -f /var/log/nginx/error.log
```
