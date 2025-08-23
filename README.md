# Проверено - Система Проверки Работ Школьников

Веб-приложение для быстрой проверки работ школьников с автоматическим подсчетом баллов и оценок.

## 🚀 Локальная разработка

### Системные требования

- Node.js 18+ 
- npm, yarn, pnpm или bun

### Установка и запуск

1. **Клонирование репозитория:**
```bash
git clone <repository-url>
cd checklytool_website
```

2. **Установка зависимостей:**
```bash
npm install
# или
yarn install
# или
pnpm install
```

3. **Запуск в режиме разработки:**
```bash
npm run dev
# или
yarn dev
# или
pnpm dev
```

4. **Открыть в браузере:**
Перейдите по адресу [http://localhost:3000](http://localhost:3000)

## 🛠 Билд для продакшена

```bash
npm run build
npm start
```

## 📦 Деплой на сервере

### Использование Docker

1. **Создание Docker образа:**
```bash
docker build -t checkly-website .
```

2. **Запуск контейнера:**
```bash
docker run -p 3000:3000 checkly-website
```

### Использование Docker Compose

```bash
docker-compose up -d
```

### Деплой на VPS/Сервере

1. **Установка Node.js на сервере:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Клонирование и настройка:**
```bash
git clone <repository-url>
cd checklytool_website
npm install
npm run build
```

3. **Запуск через PM2 (рекомендуется):**
```bash
npm install -g pm2
pm2 start npm --name "checkly-website" -- start
pm2 startup
pm2 save
```

4. **Настройка Nginx (опционально):**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Деплой на Vercel (самый простой способ)

1. Подключите репозиторий к [Vercel](https://vercel.com)
2. Vercel автоматически деплоит при каждом push в main ветку

### Переменные окружения

Создайте файл `.env.local`:
```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 📁 Структура проекта

```
├── app/                    # App Router (Next.js 13+)
│   ├── page.tsx           # Главная страница
│   ├── layout.tsx         # Базовый layout
│   └── globals.css        # Глобальные стили
├── components/            # React компоненты
│   ├── TeachersRepetitorsBlock.tsx
│   ├── HowItWorksSection.tsx
│   └── StructuredData.tsx
├── public/               # Статические файлы
│   └── images/          # Изображения
├── Dockerfile           # Docker конфигурация
├── docker-compose.yml   # Docker Compose
└── nginx.conf          # Nginx конфигурация
```

## 🔧 Доступные команды

- `npm run dev` - Запуск в режиме разработки
- `npm run build` - Создание продакшн билда
- `npm run start` - Запуск продакшн версии
- `npm run lint` - Проверка кода линтером

## 📋 Основные технологии

- **Next.js 14** - React фреймворк
- **TypeScript** - Типизированный JavaScript
- **Tailwind CSS** - Utility-first CSS фреймворк
- **Docker** - Контейнеризация
