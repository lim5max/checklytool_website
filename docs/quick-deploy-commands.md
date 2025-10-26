# ⚡ Шпаргалка: Быстрые команды для VPS

## 🚀 Первый деплой (с нуля)

```bash
# 1. Подключение к серверу
ssh root@YOUR_SERVER_IP

# 2. Клонирование проекта
mkdir -p /var/www && cd /var/www
git clone https://github.com/YOUR_USERNAME/checklytool_website.git
cd checklytool_website

# 3. Создание .env (скопировать из инструкции)
nano .env

# 4. Запуск
docker compose -f docker-compose.test.yml up -d --build

# 5. Проверка логов
docker logs -f checklytool_test
```

---

## 🔄 Быстрое обновление

```bash
# Одна команда для всего:
ssh root@YOUR_SERVER_IP '/var/www/checklytool_website/update.sh'

# Или вручную:
ssh root@YOUR_SERVER_IP
cd /var/www/checklytool_website
git pull
docker compose -f docker-compose.test.yml up -d --build
```

---

## 📊 Мониторинг

```bash
# Логи в реальном времени
docker logs -f checklytool_test

# Статус контейнеров
docker ps

# Ресурсы
docker stats

# Место на диске
df -h
```

---

## 🔧 Управление

```bash
# Перезапуск
docker compose -f docker-compose.test.yml restart

# Остановка
docker compose -f docker-compose.test.yml down

# Запуск
docker compose -f docker-compose.test.yml up -d

# Полная пересборка
docker compose -f docker-compose.test.yml down
docker compose -f docker-compose.test.yml build --no-cache
docker compose -f docker-compose.test.yml up -d
```

---

## 🐛 Отладка платежей

```bash
# Логи webhook
docker logs -f checklytool_test | grep -i "webhook"

# Логи платежей
docker logs -f checklytool_test | grep -i "payment"

# Логи Т-Банка
docker logs -f checklytool_test | grep -i "tbank\|t-bank"

# Все логи за последние 100 строк
docker logs --tail 100 checklytool_test
```

---

## 🌐 Получить IP сервера

```bash
curl ifconfig.me
```

---

## 🔐 URL для Т-Банка

```
http://YOUR_SERVER_IP/api/payment/webhook
```

Указать в: ЛК Т-Банк → Терминалы → DEMO → Уведомления → По протоколу HTTP
