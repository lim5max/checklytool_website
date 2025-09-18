# Задача 5: Исправить повторную проверку всех учеников при добавлении новых

## Описание проблемы
При добавлении новых учеников к существующей проверке, система заново проверяет всех учеников, включая уже проверенных, что приводит к:
- Лишним затратам на ИИ
- Увеличению времени обработки
- Возможности изменения уже полученных оценок

## Анализ кода
В `app/api/submissions/[id]/evaluate/route.ts:113-126` проверяется статус submission:
```tsx
if (submissionData.status === 'processing') {
  return NextResponse.json({ error: 'Submission is already being processed' }, { status: 409 })
}

if (submissionData.status === 'completed') {
  return NextResponse.json({ error: 'Submission already evaluated' }, { status: 409 })
}
```

Но это не предотвращает повторную отправку уже завершенных submissions.

## Файлы для изменения
- `app/api/submissions/[id]/evaluate/route.ts`
- `app/dashboard/checks/[id]/submit/page.tsx` (логика batch submission)
- `components/camera/CameraWorkInterface.tsx` (workflow отправки)

## План исправления

### 5.1 API улучшения
- Добавить проверку статуса перед началом batch оценки
- Пропускать submissions со статусом 'completed'
- Возвращать информацию о пропущенных submissions

### 5.2 Frontend логика
```tsx
const submissionsToEvaluate = submissions.filter(sub =>
  sub.status === 'pending' || sub.status === 'failed'
)

// Отправлять на оценку только новые/неудачные
const evaluationPromises = submissionsToEvaluate.map(submission =>
  fetch(`/api/submissions/${submission.id}/evaluate`, { method: 'POST' })
)
```

### 5.3 UI индикация
- Показывать пользователю сколько новых работ будет проверено
- "Отправить 2 новые работы на проверку" вместо "Отправить 5 работ"
- Информировать о уже проверенных: "3 работы уже проверены"

### 5.4 Оптимизация batch операций
- Группировать операции по статусу
- Параллельная обработка только новых submissions
- Прогресс-бар учитывающий уже выполненные

## Приоритет
🟡 ВЫСОКИЙ - экономия ресурсов и времени

## Ожидаемый результат
- Оценка только новых/неудачных submissions
- Сохранение существующих результатов
- Четкая индикация для пользователя
- Экономия затрат на ИИ-анализ