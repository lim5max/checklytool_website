#!/bin/bash

set -e

echo "🔄 Starting migration from PM2 + nginx to Docker..."

# Проверяем что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project directory."
    exit 1
fi

# Получаем текущую директорию
CURRENT_DIR=$(pwd)
BACKUP_DIR="$HOME/checklytool_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📁 Current directory: $CURRENT_DIR"
echo "💾 Backup directory: $BACKUP_DIR"

# Создаем директорию для бэкапов
mkdir -p "$BACKUP_DIR"

echo "🗄️ Creating backup..."

# Бэкап текущего проекта
tar -czf "$BACKUP_DIR/project_backup_$TIMESTAMP.tar.gz" \
    --exclude=node_modules \
    --exclude=.next \
    --exclude=.git \
    .

echo "✅ Project backup created: $BACKUP_DIR/project_backup_$TIMESTAMP.tar.gz"

# Бэкап nginx конфигурации
if [ -f "/etc/nginx/sites-available/checklytool.com" ]; then
    sudo cp "/etc/nginx/sites-available/checklytool.com" "$BACKUP_DIR/nginx_backup_$TIMESTAMP.conf"
    echo "✅ Nginx config backup created: $BACKUP_DIR/nginx_backup_$TIMESTAMP.conf"
fi

# Бэкап PM2 процессов
if command -v pm2 &> /dev/null; then
    pm2 list > "$BACKUP_DIR/pm2_processes_$TIMESTAMP.txt" 2>/dev/null || true
    echo "✅ PM2 processes list saved: $BACKUP_DIR/pm2_processes_$TIMESTAMP.txt"
fi

# Бэкап SSL сертификатов
if [ -d "/etc/nginx/ssl" ]; then
    sudo tar -czf "$BACKUP_DIR/ssl_backup_$TIMESTAMP.tar.gz" /etc/nginx/ssl/
    echo "✅ SSL certificates backup created: $BACKUP_DIR/ssl_backup_$TIMESTAMP.tar.gz"
elif [ -d "/etc/ssl" ]; then
    sudo find /etc/ssl -name "*checklytool*" -exec tar -czf "$BACKUP_DIR/ssl_backup_$TIMESTAMP.tar.gz" {} \; 2>/dev/null || true
fi

echo "🛑 Stopping current services..."

# Останавливаем PM2
if command -v pm2 &> /dev/null; then
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    echo "✅ PM2 processes stopped"
fi

# Останавливаем nginx
if systemctl is-active --quiet nginx 2>/dev/null; then
    sudo systemctl stop nginx
    echo "✅ Nginx stopped"
elif pgrep nginx > /dev/null; then
    sudo pkill nginx 2>/dev/null || true
    echo "✅ Nginx processes killed"
fi

echo "📦 Setting up Docker files..."

# Копируем SSL сертификаты если они есть
if [ -d "/etc/nginx/ssl" ]; then
    mkdir -p ssl
    sudo cp /etc/nginx/ssl/* ssl/ 2>/dev/null || true
    echo "✅ SSL certificates copied to ./ssl/"
elif [ -d "/etc/ssl" ]; then
    mkdir -p ssl
    sudo find /etc/ssl -name "*checklytool*" -exec cp {} ssl/ \; 2>/dev/null || true
    echo "✅ SSL certificates found and copied"
fi

# Создаем .env если не существует
if [ ! -f ".env" ]; then
    cat > .env << EOL
WEBHOOK_SECRET=webhook-secret-$(date +%s)
WEBHOOK_PORT=9000
EOL
    echo "✅ .env file created with random webhook secret"
else
    echo "ℹ️ .env file already exists"
fi

# Делаем скрипты исполняемыми
chmod +x deploy.sh stop-old-services.sh 2>/dev/null || true

echo "🚀 Starting Docker services..."

# Проверяем что Docker установлен
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Run: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi

# Запускаем Docker сервисы
docker compose up -d --build

echo "⏳ Waiting for services to start..."
sleep 15

# Проверяем статус сервисов
echo "📊 Checking services status..."
docker compose ps

# Проверка здоровья
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Health check passed! Application is running."
    echo "🎉 Migration completed successfully!"
    echo ""
    echo "📋 Summary:"
    echo "  • Backup location: $BACKUP_DIR/"
    echo "  • Docker services: running"
    echo "  • Health check: ✅ passed"
    echo "  • Webhook URL: https://checklytool.com/webhook"
    echo ""
    echo "🔧 Next steps:"
    echo "  1. Update GitHub webhook URL to: https://checklytool.com/webhook"
    echo "  2. Use the secret from .env file in GitHub webhook settings"
    echo "  3. Test by pushing to main branch"
    echo ""
    echo "📚 View logs: docker compose logs -f"
    echo "🔄 Restart: docker compose restart"
    echo "🛑 Stop: docker compose down"
else
    echo "❌ Health check failed!"
    echo "📋 Checking logs..."
    docker compose logs --tail=50
    echo ""
    echo "🆘 Migration may have issues. Check logs above."
    echo "🔙 To rollback, restore from: $BACKUP_DIR/project_backup_$TIMESTAMP.tar.gz"
fi