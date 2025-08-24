# Docker Deployment Guide

## Переход с PM2 на Docker

### 1. Остановка текущих процессов

Сначала остановите текущие процессы PM2 и nginx:

```bash
# Остановка PM2 процессов
pm2 stop all
pm2 delete all

# Остановка nginx (если запущен как сервис)
sudo systemctl stop nginx
sudo systemctl disable nginx
```

### 2. Запуск Docker контейнеров

```bash
# Построить и запустить все сервисы
docker-compose up -d --build

# Проверить статус контейнеров
docker-compose ps

# Посмотреть логи
docker-compose logs -f
```

### 3. Настройка автоматического деплоя

#### Вариант 1: Webhook сервер (встроенный в Docker)

1. Установите секретный ключ в `.env`:
```bash
echo "WEBHOOK_SECRET=your-super-secret-key" > .env
```

2. Настройте webhook в GitHub:
   - Перейдите в Settings → Webhooks
   - URL: `http://your-server-ip:9000/webhook`
   - Content type: `application/json`
   - Secret: используйте тот же секрет из .env
   - Events: `Just the push event`

#### Вариант 2: Простой cron скрипт

Создайте cron задачу для проверки обновлений каждые 5 минут:

```bash
# Редактирование crontab
crontab -e

# Добавьте строку:
*/5 * * * * cd /path/to/your/project && git fetch && [ $(git rev-list HEAD...origin/main --count) != 0 ] && ./deploy.sh > /var/log/auto-deploy.log 2>&1
```

### 4. SSL сертификаты

Поместите ваши SSL сертификаты в папку `ssl/`:

```bash
mkdir ssl
# Скопируйте ваши сертификаты
cp /path/to/your/cert.crt ssl/checklytool.com.crt
cp /path/to/your/key.key ssl/checklytool.com.key
```

### 5. Полезные команды

```bash
# Пересборка после изменений
docker-compose up -d --build

# Просмотр логов конкретного сервиса
docker-compose logs -f checklytool
docker-compose logs -f nginx
docker-compose logs -f webhook

# Остановка всех сервисов
docker-compose down

# Очистка старых образов
docker image prune -f

# Мониторинг ресурсов
docker stats

# Вход в контейнер для отладки
docker exec -it checklytool_app sh
```

### 6. Мониторинг и логирование

Логи webhook сервера сохраняются в `/var/log/webhook-deploy.log`.

Для мониторинга состояния можно использовать:

```bash
# Проверка здоровья приложения
curl http://localhost/health

# Статус всех контейнеров
docker-compose ps

# Мониторинг ресурсов
docker stats --no-stream
```

### 7. Обновление секрета webhook

```bash
# Обновить .env файл
echo "WEBHOOK_SECRET=new-secret" > .env

# Перезапустить webhook сервис
docker-compose restart webhook
```

### 8. Отладка проблем

```bash
# Если приложение не запускается
docker-compose logs checklytool

# Если nginx не работает
docker-compose logs nginx

# Проверка конфигурации nginx
docker exec checklytool_nginx nginx -t

# Перезапуск отдельного сервиса
docker-compose restart checklytool
```

### 9. Backup и восстановление

```bash
# Создание backup базы данных (если используется)
docker-compose exec checklytool npm run backup

# Резервное копирование статических файлов
tar -czf backup-$(date +%Y%m%d).tar.gz public/
```

## Преимущества Docker подхода

1. **Изоляция**: Каждый сервис работает в своем контейнере
2. **Воспроизводимость**: Одинаковое окружение везде
3. **Масштабируемость**: Легко добавлять новые сервисы
4. **Автоматизация**: Простое автоматическое обновление
5. **Мониторинг**: Централизованное логирование и мониторинг