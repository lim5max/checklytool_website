# Развертывание ChecklyTool на VPS reg.ru

## Требования к серверу

- Ubuntu 20.04+ или CentOS 8+
- Docker и Docker Compose
- Минимум 2GB RAM, 20GB SSD
- Открытые порты: 80, 443

## Подготовка VPS

### 1. Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Установка Docker

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Настройка брандмауэра

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## Настройка домена checklytool.com

### 1. DNS записи в панели reg.ru

Добавьте следующие DNS записи:
- `A` запись: `@` → IP-адрес вашего VPS
- `A` запись: `www` → IP-адрес вашего VPS

### 2. Получение SSL сертификата

```bash
# Установка Certbot
sudo apt install certbot

# Получение сертификата (временно остановите nginx)
sudo certbot certonly --standalone -d checklytool.com -d www.checklytool.com

# Создание директории для SSL
sudo mkdir -p /etc/nginx/ssl

# Копирование сертификатов
sudo cp /etc/letsencrypt/live/checklytool.com/fullchain.pem /etc/nginx/ssl/checklytool.com.crt
sudo cp /etc/letsencrypt/live/checklytool.com/privkey.pem /etc/nginx/ssl/checklytool.com.key
```

## Развертывание приложения

### 1. Загрузка кода

```bash
# Создание директории
mkdir -p /home/checklytool
cd /home/checklytool

# Загрузка файлов проекта (используйте scp, git или другой способ)
# Пример с git:
# git clone https://github.com/your-repo/checklytool_website.git .
```

### 2. Создание SSL директории

```bash
sudo mkdir -p ssl
sudo cp /etc/letsencrypt/live/checklytool.com/fullchain.pem ssl/checklytool.com.crt
sudo cp /etc/letsencrypt/live/checklytool.com/privkey.pem ssl/checklytool.com.key
sudo chown -R $USER:$USER ssl/
```

### 3. Запуск приложения

```bash
# Сборка и запуск контейнеров
docker-compose up -d

# Проверка статуса
docker-compose ps
```

### 4. Проверка работы

- Откройте в браузере: https://checklytool.com
- Проверьте редирект с HTTP на HTTPS
- Убедитесь, что SSL сертификат корректный

## Мониторинг и обслуживание

### Логи

```bash
# Просмотр логов приложения
docker-compose logs checklytool

# Просмотр логов nginx
docker-compose logs nginx

# Следить за логами в реальном времени
docker-compose logs -f
```

### Обновление приложения

```bash
# Остановка контейнеров
docker-compose down

# Обновление кода
git pull # или загрузите новые файлы

# Пересборка и запуск
docker-compose up -d --build
```

### Резервное копирование

```bash
# Создание бэкапа
tar -czf backup-$(date +%Y%m%d).tar.gz /home/checklytool

# Настройка автоматического бэкапа (crontab)
echo "0 2 * * * tar -czf /backup/checklytool-\$(date +\%Y\%m\%d).tar.gz /home/checklytool" | sudo crontab -
```

### Автообновление SSL сертификатов

```bash
# Добавление в crontab
echo "0 3 * * 0 /usr/bin/certbot renew --quiet && cp /etc/letsencrypt/live/checklytool.com/fullchain.pem /home/checklytool/ssl/checklytool.com.crt && cp /etc/letsencrypt/live/checklytool.com/privkey.pem /home/checklytool/ssl/checklytool.com.key && docker-compose -f /home/checklytool/docker-compose.yml restart nginx" | sudo crontab -
```

## Производительность

### Оптимизация для продакшена

1. **Настройки nginx**: Файл `nginx.conf` уже содержит оптимизации:
   - Gzip сжатие
   - Кэширование статических файлов
   - Ограничение скорости запросов
   - Заголовки безопасности

2. **Docker оптимизации**:
   - Многоступенчатая сборка для уменьшения размера образа
   - Standalone режим Next.js для лучшей производительности

3. **Мониторинг ресурсов**:
```bash
# Использование ресурсов контейнерами
docker stats

# Проверка дискового пространства
df -h

# Проверка памяти
free -h
```

## Устранение неполадок

### Проблемы с SSL

```bash
# Проверка сертификата
openssl x509 -in ssl/checklytool.com.crt -text -noout

# Тест SSL конфигурации
nginx -t
```

### Проблемы с Docker

```bash
# Перезапуск всех контейнеров
docker-compose restart

# Очистка неиспользуемых ресурсов
docker system prune -a
```

### Проблемы с доменом

```bash
# Проверка DNS резолвинга
nslookup checklytool.com

# Проверка доступности портов
netstat -tulpn | grep :443
```

## Контакты для поддержки

- При возникновении проблем с развертыванием
- Для настройки дополнительных доменов или поддоменов
- Для оптимизации производительности