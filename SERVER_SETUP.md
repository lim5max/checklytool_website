# 🚀 Инструкция по установке на сервер

## 1. Подготовка сервера

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Docker и Docker Compose
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Добавляем пользователя в группу docker
sudo usermod -aG docker $USER

# Устанавливаем Git (если не установлен)
sudo apt install -y git
```

## 2. Клонирование проекта на сервер

```bash
# Создаем директорию и клонируем проект
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/your-username/checklytool_website.git
sudo chown -R $USER:$USER /var/www/checklytool_website
cd /var/www/checklytool_website
```

## 3. Настройка переменных окружения

```bash
# Создаем .env файл с вашим секретным ключом
cat > .env << EOL
WEBHOOK_SECRET=your-super-secret-webhook-key-2025
WEBHOOK_PORT=9000
EOL

# Обновляем docker-compose.yml с переменными из .env
```

## 4. Настройка SSL сертификатов

```bash
# Создаем папку для SSL
mkdir -p ssl

# Копируем ваши существующие SSL сертификаты
# Замените пути на ваши реальные сертификаты
sudo cp /path/to/your/existing/cert.crt ssl/checklytool.com.crt
sudo cp /path/to/your/existing/cert.key ssl/checklytool.com.key

# Или создаем самоподписанные для тестирования
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/checklytool.com.key \
    -out ssl/checklytool.com.crt \
    -subj "/CN=checklytool.com"
```

## 5. Остановка старых сервисов

```bash
# Останавливаем PM2 и старый nginx
./stop-old-services.sh

# Или вручную:
pm2 stop all && pm2 delete all
sudo systemctl stop nginx
sudo systemctl disable nginx
```

## 6. Запуск Docker контейнеров

```bash
# Делаем скрипты исполняемыми
chmod +x deploy.sh stop-old-services.sh

# Запускаем все сервисы
docker compose up -d --build

# Проверяем статус
docker compose ps
```

## 7. Настройка файрвола (firewall)

```bash
# Открываем необходимые порты
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS  
sudo ufw allow 22/tcp   # SSH

# Порт 9000 НЕ открываем - webhook идет через nginx
# sudo ufw enable  # если файрвол еще не включен
```

## 8. Настройка GitHub Webhook

1. Перейдите в настройки вашего репозитория на GitHub
2. **Settings → Webhooks → Add webhook**
3. Заполните:
   - **Payload URL**: `https://checklytool.com/webhook` (через nginx, не напрямую на порт)
   - **Content type**: `application/json`
   - **Secret**: `your-super-secret-webhook-key-2025` (тот же что в .env)
   - **Which events**: `Just the push event`
   - **Active**: ✅

## 8. Настройка systemd сервиса (альтернатива Docker webhook)

Если хотите запустить webhook отдельно от Docker:

```bash
# Копируем сервис файл
sudo cp webhook-deploy.service /etc/systemd/system/

# Перезагружаем systemd и запускаем сервис
sudo systemctl daemon-reload
sudo systemctl enable webhook-deploy
sudo systemctl start webhook-deploy

# Проверяем статус
sudo systemctl status webhook-deploy
```

## 9. Проверка работы

```bash
# Проверяем что все контейнеры работают
docker compose ps

# Проверяем здоровье приложения
curl http://localhost/health

# Проверяем логи
docker compose logs -f

# Проверяем webhook сервер
curl -X POST http://localhost:9000/webhook
```

## 10. Обновленный docker-compose.yml с .env

Убедитесь что ваш docker-compose.yml использует переменные окружения:

```yaml
version: '3.8'

services:
  checklytool:
    build: .
    container_name: checklytool_app
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    networks:
      - web

  nginx:
    image: nginx:alpine
    container_name: checklytool_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - checklytool
    networks:
      - web

  webhook:
    image: node:18-alpine
    container_name: checklytool_webhook
    restart: always
    ports:
      - "${WEBHOOK_PORT:-9000}:${WEBHOOK_PORT:-9000}"
    volumes:
      - ./webhook-server.js:/app/webhook-server.js
      - ./deploy.sh:/app/deploy.sh
      - /var/run/docker.sock:/var/run/docker.sock
      - ./:/app/project
    working_dir: /app
    command: node webhook-server.js
    environment:
      - NODE_ENV=production
      - WEBHOOK_PORT=${WEBHOOK_PORT:-9000}
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
    networks:
      - web

networks:
  web:
    driver: bridge
```

## 11. Мониторинг и логи

```bash
# Логи webhook
sudo tail -f /var/log/webhook-deploy.log

# Логи контейнеров
docker compose logs -f checklytool
docker compose logs -f nginx
docker compose logs -f webhook

# Статистика ресурсов
docker stats
```

## 12. Безопасность

- Поменяйте `WEBHOOK_SECRET` на уникальный
- Настройте файрвол для портов 80, 443, 9000
- Регулярно обновляйте Docker образы
- Мониторьте логи на подозрительную активность

## Готово! 🎉

Теперь при каждом push в main ветку GitHub ваш сайт будет автоматически обновляться через Docker.