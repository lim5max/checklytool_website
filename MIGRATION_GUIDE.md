# 🔄 Миграция с PM2 + nginx на Docker

## Вариант 1: Обновление существующей директории (РЕКОМЕНДУЕМЫЙ)

### 1. Подготовка и бэкап

```bash
# Заходим в существующую директорию проекта
cd /path/to/your/current/checklytool_website

# Создаем бэкап текущей версии
sudo tar -czf ~/checklytool_backup_$(date +%Y%m%d_%H%M%S).tar.gz .
sudo cp /etc/nginx/sites-available/checklytool.com ~/nginx_backup_$(date +%Y%m%d_%H%M%S).conf 2>/dev/null || true

# Останавливаем текущие сервисы
pm2 stop all
pm2 delete all
sudo systemctl stop nginx
```

### 2. Обновление проекта

```bash
# Пуллим последние изменения
git stash  # сохраняем локальные изменения если есть  
git pull origin main

# Добавляем новые Docker файлы (скопируйте из локальной разработки)
# Файлы для копирования:
# - Dockerfile
# - docker-compose.yml  
# - nginx.conf
# - webhook-server.js
# - deploy.sh
# - .env (с вашими секретами)
# - stop-old-services.sh

# Или клонируем обновления с GitHub:
git fetch origin
git reset --hard origin/main
```

### 3. Настройка Docker файлов

```bash
# Создаем .env с вашими данными
cat > .env << EOL
WEBHOOK_SECRET=your-super-secret-webhook-key-2025
WEBHOOK_PORT=9000
EOL

# Копируем SSL сертификаты в новую структуру
mkdir -p ssl
sudo cp /etc/nginx/ssl/* ssl/ 2>/dev/null || true
# ИЛИ копируем из старого nginx конфига
sudo cp /etc/ssl/certs/your-cert.crt ssl/checklytool.com.crt
sudo cp /etc/ssl/private/your-key.key ssl/checklytool.com.key

# Делаем скрипты исполняемыми
chmod +x deploy.sh stop-old-services.sh
```

### 4. Запуск новой версии

```bash
# Запускаем Docker сервисы
docker compose up -d --build

# Проверяем что всё работает
docker compose ps
curl http://localhost/health
```

### 5. Очистка старых файлов

```bash
# Удаляем старые конфиги nginx (после успешного запуска)
sudo rm /etc/nginx/sites-enabled/checklytool.com 2>/dev/null || true
sudo rm /etc/nginx/sites-available/checklytool.com 2>/dev/null || true

# Отключаем nginx из автозапуска (Docker nginx теперь главный)
sudo systemctl disable nginx
```

## Вариант 2: Создание новой директории (если боитесь сломать)

### Если хотите полную изоляцию:

```bash
# Переименовываем старую директорию
sudo mv /path/to/current/checklytool_website /path/to/current/checklytool_website_OLD

# Клонируем новую версию
cd /var/www
sudo git clone https://github.com/your-username/checklytool_website.git
cd checklytool_website

# Копируем важные файлы из старой версии
sudo cp ../checklytool_website_OLD/.env . 2>/dev/null || true
sudo cp -r ../checklytool_website_OLD/ssl . 2>/dev/null || true
sudo cp ../checklytool_website_OLD/uploads . 2>/dev/null || true  # если есть загруженные файлы

# Продолжаем с шага 3 из Варианта 1
```

## Проверочный чек-лист перед миграцией

```bash
# 1. Убедитесь что Docker установлен
docker --version
docker compose version

# 2. Создайте бэкап
tar -czf ~/backup_$(date +%Y%m%d).tar.gz /path/to/current/project

# 3. Проверьте что SSL сертификаты доступны
ls -la /etc/nginx/ssl/
ls -la /etc/ssl/certs/
ls -la /etc/ssl/private/

# 4. Сохраните список PM2 процессов
pm2 list > ~/pm2_processes_backup.txt

# 5. Сохраните конфиг nginx
sudo cp /etc/nginx/sites-available/* ~/
```

## После успешной миграции

```bash
# Удаляем PM2 если больше не нужен
npm uninstall -g pm2

# Настраиваем автозапуск Docker
sudo systemctl enable docker

# Тестируем webhook
curl -X POST https://checklytool.com/webhook \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=test" \
  -d '{"ref":"refs/heads/main"}'
```

## Откат в случае проблем

```bash
# Останавливаем Docker
docker compose down

# Восстанавливаем старую версию
sudo systemctl start nginx
pm2 start ecosystem.config.js  # или как у вас было настроено

# Или из бэкапа
cd /path/to/project
sudo rm -rf * .*
sudo tar -xzf ~/checklytool_backup_YYYYMMDD_HHMMSS.tar.gz
```

## ✅ Рекомендация

**Используйте Вариант 1** - обновление существующей директории. Это:
- Сохраняет ваши настройки
- Использует существующий Git репозиторий  
- Минимизирует изменения в путях
- Проще в обслуживании

**Вариант 2** только если очень боитесь сломать рабочую версию.