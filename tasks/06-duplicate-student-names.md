# Задача 6: Устранить дублирование имен учеников

## Описание проблемы
При создании учеников в системе drafts может возникать дублирование имен:
- При отправке "Ученик 1" по умолчанию и последующем добавлении еще одного "Ученик 1"
- Недостаточная проверка существующих имен в базе данных
- Временные неудачные отправки не учитываются при генерации имен

## Анализ кода
В `lib/drafts.ts:157-173` функция `generateUniqueStudentName`:
```tsx
function generateUniqueStudentName(checkId: string, existingStudents: DraftStudent[]): string {
  const existingNames = new Set(existingStudents.map(s => s.name.toLowerCase()))

  // Также проверяет failed submissions из temp storage
  const tempFailedNames = getTempFailedNames(checkId)
  tempFailedNames.forEach(name => existingNames.add(name.toLowerCase()))

  // ... генерация "Ученик N"
}
```

Но не проверяет существующие submissions в базе данных.

## Файлы для изменения
- `lib/drafts.ts` (строки 157-200)
- `components/camera/CameraWorkInterface.tsx` (логика добавления учеников)
- Возможно добавить API endpoint для проверки имен

## План исправления

### 6.1 Улучшить генерацию имен
- Проверять имена в базе данных через API
- Кэшировать результаты проверки существующих имен
- Учитывать все источники: drafts + temp failed + DB submissions

### 6.2 API для проверки имен
```tsx
// GET /api/checks/[id]/student-names
// Возвращает: { existingNames: string[] }
```

### 6.3 Локальная логика
```tsx
async function generateUniqueStudentName(checkId: string, existingStudents: DraftStudent[]): Promise<string> {
  const [draftNames, tempFailedNames, dbNames] = await Promise.all([
    existingStudents.map(s => s.name),
    getTempFailedNames(checkId),
    fetchExistingNamesFromDB(checkId)
  ])

  const allNames = new Set([...draftNames, ...tempFailedNames, ...dbNames].map(n => n.toLowerCase()))

  let counter = 1
  while (allNames.has(`ученик ${counter}`)) {
    counter++
  }

  return `Ученик ${counter}`
}
```

### 6.4 UI улучшения
- Показывать предупреждение о дублирующих именах
- Автоматическое исправление при обнаружении дубликатов
- Возможность переименования до отправки

## Приоритет
🟢 СРЕДНИЙ - улучшает UX и предотвращает путаницу

## Ожидаемый результат
- Уникальные имена учеников в рамках одной проверки
- Нет конфликтов между drafts и существующими submissions
- Понятная нумерация для пользователя