# Задача 7: Исправить редирект на localhost с мобильных устройств

## Описание проблемы
При работе с продакшен версией на мобильных устройствах пользователя иногда перенаправляет на localhost, хотя это серверная версия и такого не должно быть.

## Возможные причины
1. **Next.js конфигурация**: неправильная настройка `output: "standalone"`
2. **Переменные окружения**: неправильная настройка `NEXTAUTH_URL` или `NEXT_PUBLIC_SITE_URL`
3. **SSR/SSG проблемы**: различие между server и client URL
4. **Middleware**: неправильная обработка мобильных запросов

## Файлы для анализа
- `next.config.ts` (строки 3-4)
- `.env` файлы (переменные окружения)
- `middleware.ts`
- `lib/auth.ts` (NextAuth конфигурация)

## Анализ текущей конфигурации
`next.config.ts`:
```tsx
const nextConfig: NextConfig = {
  output: "standalone",
  images: { unoptimized: true },
  trailingSlash: false,
  serverExternalPackages: [],
}
```

## План исправления

### 7.1 Проверить переменные окружения
- Убедиться что `NEXTAUTH_URL` установлена корректно в production
- Проверить `NEXT_PUBLIC_SITE_URL` или аналогичные
- Добавить logging для отладки URL формирования

### 7.2 Next.js конфигурация
```tsx
const nextConfig: NextConfig = {
  output: "standalone",
  images: { unoptimized: true },
  trailingSlash: false,

  // Добавить explicit configuration
  publicRuntimeConfig: {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
  },

  // Убедиться в правильном базовом пути
  basePath: process.env.NODE_ENV === 'production' ? undefined : undefined,
}
```

### 7.3 Middleware проверки
- Добавить логирование запросов в middleware
- Проверить User-Agent мобильных устройств
- Убедиться что redirects корректны

### 7.4 Auth конфигурация
- Проверить NextAuth callbacks
- Убедиться что redirect URLs абсолютные
- Добавить fallback для production URLs

## Тестирование
- Проверить на разных мобильных устройствах
- Тест с различными браузерами (Safari, Chrome Mobile)
- Проверить в dev vs production режимах

## Приоритет
🔴 КРИТИЧЕСКИЙ - влияет на доступность продакшена

## Ожидаемый результат
- Стабильная работа на продакшене без редиректов на localhost
- Корректная работа на всех мобильных устройствах
- Правильная конфигурация для deployment