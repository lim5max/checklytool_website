#!/bin/bash

set -e

echo "🚀 Simple Docker deployment script"

# Проверяем что мы в директории проекта
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from your project directory"
    exit 1
fi

# Останавливаем старые сервисы
echo "🛑 Stopping old services..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

# Проверяем SSL сертификаты
if [ ! -f "ssl/checklytool.com.crt" ] || [ ! -f "ssl/checklytool.com.key" ]; then
    echo "⚠️  SSL certificates not found in ssl/ directory"
    echo "Please copy your certificates to:"
    echo "  ssl/checklytool.com.crt"
    echo "  ssl/checklytool.com.key"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Проверяем .env файл
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOL'
WEBHOOK_SECRET=webhook-secret-$(date +%s)
WEBHOOK_PORT=9000

# RESEND API (замените на ваши реальные ключи)
RESEND_API_KEY=your-resend-api-key-here
RESEND_AUDIENCE_ID=your-audience-id-here
EOL
    echo "✅ Created .env file. Please edit it with your real API keys."
fi

# Делаем скрипты исполняемыми
chmod +x deploy.sh 2>/dev/null || true

# Запускаем Docker
echo "🐳 Starting Docker services..."
docker compose up -d --build

# Ждём запуска
echo "⏳ Waiting for services..."
sleep 15

# Проверяем статус
docker compose ps

# Проверяем здоровье
echo "🏥 Health check..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ SUCCESS! Your site is running!"
    echo ""
    echo "🔗 Next steps:"
    echo "  1. Update GitHub webhook: https://checklytool.com/webhook"  
    echo "  2. Use webhook secret from .env file"
    echo "  3. Test with: curl https://checklytool.com/health"
    echo ""
    echo "📊 Logs: docker compose logs -f"
else
    echo "❌ Health check failed. Check logs:"
    docker compose logs --tail=20
fi