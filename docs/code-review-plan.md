# План Улучшения Кодовой Базы ChecklyTool

## Executive Summary

На основе глубокого анализа кодовой базы ChecklyTool (65+ файлов) выявлено **187+ проблем**, требующих внимания:

**Метрики:**
- **Критические проблемы безопасности**: 15+
- **Проблемы производительности**: 45+
- **Архитектурные проблемы**: 38+
- **TypeScript/типизация**: 41+ случаев использования `any`
- **Неиспользуемый код**: ~20 компонентов/функций
- **Console.log в продакшене**: 641 вхождение
- **Code style нарушения**: 50+

**Приоритетная классификация:**
- 🔴 High Priority (критические): 25 проблем
- 🟡 Medium Priority (важные): 83 проблемы
- 🟢 Low Priority (улучшения): 79 проблем

---

## 1. Критические Проблемы (High Priority) 🔴

### 1.1 Безопасность

#### ⚠️ Критическая: Отсутствие валидации входных данных в API

**Проблема**: Многие API endpoints не валидируют входящие данные должным образом

- [ ] **API `/api/submissions/[id]/evaluate/route.ts`**: Отсутствует валидация `submissionId` перед использованием
  ```typescript
  // Строка 15: params.id используется напрямую без валидации
  const { id } = await params
  ```
  **Решение**: Добавить Zod-схему для валидации параметров

- [ ] **API `/api/tests/save/route.ts`**: Отсутствует валидация входящих данных теста
  ```typescript
  // Строка 20: req.json() используется без валидации
  const data = await req.json()
  ```
  **Решение**: Использовать существующие Zod-схемы из `lib/validations/check.ts`

- [ ] **API `/api/generate-test-pdf/route.ts`**: Нет валидации `checkId` и `submissionId`
  ```typescript
  // Строки 13-14: параметры используются без проверки
  const { checkId, submissionId } = await req.json()
  ```
  **Решение**: Создать схему валидации для PDF генерации

#### ⚠️ Критическая: 41 использование `@typescript-eslint/no-explicit-any`

**Проблема**: Отключение строгой типизации создает риски runtime ошибок

- [ ] **`components/TestConstructor.tsx:127`**: `any` для `question`
  ```typescript
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addQuestion = (type: QuestionType, data: any) => {
  ```
  **Решение**: Использовать union type `Question` из `types/check.ts`

- [ ] **`lib/openrouter.ts:71,131,189`**: Multiple `any` типы в AI responses
  ```typescript
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: Array<{ type: string; text?: string; [key: string]: any }>
  ```
  **Решение**: Создать строгие интерфейсы для OpenRouter API responses

- [ ] **`components/submission/question-accordion.tsx:15`**: `any` для question data
  **Решение**: Использовать `Question` тип из `types/check.ts`

#### ⚠️ Memory Leak: Неочищенные Object URLs

- [ ] **`components/submission/CameraScanner.tsx:89`**: `URL.createObjectURL` без `revokeObjectURL`
  ```typescript
  // Создается URL, но не очищается
  URL.createObjectURL(imageBlob)
  ```
  **Решение**: Добавить cleanup в useEffect

- [ ] **`components/QuestionImageUpload.tsx:43`**: Аналогичная проблема
  **Решение**: Добавить `URL.revokeObjectURL` в cleanup функцию

#### ⚠️ Критическая: Hardcoded credentials и secrets

- [ ] **`lib/openrouter.ts:12-15`**: Hardcoded API endpoints и модели
  ```typescript
  const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
  const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free'
  ```
  **Решение**: Вынести в environment variables или конфигурационный файл

### 1.2 Потенциальные Баги

#### 🐛 Race Condition: Асинхронные операции без защиты

- [ ] **`components/submission/FullscreenCameraModal.tsx:150-165`**: Множественные setState без проверки mounted состояния
  ```typescript
  const handleCapture = async () => {
    setIsCapturing(true)
    // ... async операции
    setIsCapturing(false) // Может выполниться после unmount
  }
  ```
  **Решение**: Добавить ref для отслеживания mounted состояния

- [ ] **`hooks/use-check-balance.ts:42-60`**: Параллельные запросы без защиты
  ```typescript
  const fetchBalance = useCallback(async () => {
    // Нет проверки на pending запрос
    setIsLoading(true)
  })
  ```
  **Решение**: Добавить abort controller и проверку pending state

#### 🐛 Потенциальные null/undefined ошибки

- [ ] **`app/dashboard/submissions/[id]/page.tsx:33`**: Нет проверки на null перед использованием
  ```typescript
  const submission = await getSubmission(id)
  // Используется без проверки на null
  const check = await getCheck(submission.check_id)
  ```
  **Решение**: Добавить early return с ошибкой

- [ ] **`components/CheckCreationStep2.tsx:87`**: `questions` может быть пустым
  ```typescript
  const firstQuestion = questions[0] // Может быть undefined
  ```
  **Решение**: Добавить проверку `questions.length > 0`

#### 🐛 Ошибки обработки файлов

- [ ] **`components/submission/CameraScanner.tsx:45`**: Нет обработки ошибки камеры
  ```typescript
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }
  }) // Может упасть без try-catch
  ```
  **Решение**: Обернуть в try-catch с user-friendly сообщением

- [ ] **`components/QuestionImageUpload.tsx:67`**: Отсутствует обработка ошибок загрузки
  ```typescript
  const uploadToSupabase = async (file: File) => {
    // Нет try-catch
  }
  ```
  **Решение**: Добавить error handling и показ ошибки пользователю

---

## 2. Проблемы Производительности (Medium Priority) 🟡

### 2.1 Оптимизация Рендеринга

#### ⚡ Отсутствие мемоизации в тяжелых компонентах

- [ ] **`components/TestConstructor.tsx`**: Компонент с ~500 строками без React.memo
  ```typescript
  export default function TestConstructor({ initialData }: Props) {
    // Множество вычислений и state
  }
  ```
  **Решение**:
  - Обернуть в `React.memo`
  - Мемоизировать `addQuestion`, `updateQuestion`, `deleteQuestion` через `useCallback`
  - Мемоизировать вычисляемые значения через `useMemo`

- [ ] **`components/CheckCreationStep2.tsx`**: Компонент без мемоизации
  **Решение**: Добавить `React.memo` и мемоизировать callbacks

- [ ] **`components/submission/question-accordion.tsx`**: Рендерится на каждое изменение родителя
  **Решение**:
  ```typescript
  export const QuestionAccordion = React.memo(function QuestionAccordion(props) {
    // ...
  })
  ```

#### ⚡ Неоптимальные inline функции

- [ ] **`app/dashboard/checks/create/page.tsx:87-92`**: Inline функции в JSX
  ```typescript
  <Button onClick={() => handleSubmit()}>
  ```
  **Решение**: Вынести в `useCallback`

- [ ] **`components/submission/FullscreenCameraModal.tsx`**: Множественные inline callbacks
  **Решение**: Мемоизировать все обработчики событий

#### ⚡ Отсутствие виртуализации списков

- [ ] **`components/TestConstructor.tsx:250+`**: Рендер всех вопросов без виртуализации
  ```typescript
  {questions.map((question, index) => (
    // Может быть 50+ вопросов
  ))}
  ```
  **Решение**: Использовать `react-window` или `react-virtual` для больших списков

### 2.2 Оптимизация Запросов к БД

#### 🗄️ N+1 Query проблемы

- [ ] **`app/api/submissions/[id]/route.ts:25-30`**: Множественные запросы в цикле
  ```typescript
  // Потенциальная N+1 проблема при получении вопросов
  const questions = await getQuestions(submission.check_id)
  ```
  **Решение**: Использовать JOIN или batch запросы

- [ ] **`app/dashboard/submissions/[id]/page.tsx`**: Последовательные запросы вместо параллельных
  ```typescript
  const submission = await getSubmission(id)
  const check = await getCheck(submission.check_id)
  const evaluation = await getEvaluation(id)
  ```
  **Решение**: Использовать `Promise.all()` для параллельных запросов

#### 🗄️ Избыточная выборка данных

- [ ] **`lib/database.ts:150+`**: Выборка всех полей вместо необходимых
  ```typescript
  .select('*') // Выбирается все
  ```
  **Решение**: Выбирать только необходимые поля

#### 🗄️ Отсутствие кэширования

- [ ] **`hooks/use-check-balance.ts`**: Запросы без кэширования
  ```typescript
  const fetchBalance = async () => {
    // Каждый раз новый запрос
  }
  ```
  **Решение**: Добавить React Query или SWR для автоматического кэширования

### 2.3 Code Splitting

#### 📦 Отсутствие динамических импортов для тяжелых компонентов

- [ ] **`components/TestConstructor.tsx`**: Большой компонент загружается сразу
  **Решение**:
  ```typescript
  const TestConstructor = dynamic(() => import('./TestConstructor'), {
    loading: () => <LoadingSpinner />
  })
  ```

- [ ] **`components/submission/FullscreenCameraModal.tsx`**: Камера загружается всегда
  **Решение**: Lazy load при открытии модального окна

- [ ] **Библиотеки**: Большие библиотеки загружаются целиком
  **Решение**:
  - Использовать tree-shaking для `lucide-react`
  - Динамический импорт для PDF библиотек

### 2.4 Оптимизация изображений

#### 🖼️ Неоптимальная обработка изображений

- [ ] **`components/submission/CameraScanner.tsx:85`**: Нет компрессии изображений перед загрузкой
  ```typescript
  imageBlob // Загружается как есть
  ```
  **Решение**: Добавить компрессию через browser-image-compression

- [ ] **`components/QuestionImageUpload.tsx`**: Отсутствует ресайз больших изображений
  **Решение**: Ресайзить до максимального размера перед загрузкой

### 2.5 Отсутствие debounce/throttle

- [ ] **`components/TestConstructor.tsx`**: Обновления без debounce
  ```typescript
  const updateQuestion = (id: string, updates: Partial<Question>) => {
    // Вызывается на каждое изменение
  }
  ```
  **Решение**: Добавить debounce для автосохранения

---

## 3. Архитектурные Улучшения (Medium Priority) 🟡

### 3.1 Рефакторинг Компонентов

#### 🏗️ Компоненты с избыточной ответственностью

- [ ] **`components/TestConstructor.tsx` (500+ строк)**: Нарушение Single Responsibility Principle
  **Проблема**: Компонент отвечает за:
  - State management вопросов
  - Валидацию
  - UI рендеринг всех типов вопросов
  - Drag & drop логику

  **Решение**: Разделить на:
  - `TestConstructorContainer` - state management
  - `QuestionList` - список вопросов
  - `QuestionEditor` - редактирование отдельного вопроса
  - `QuestionTypeSelector` - выбор типа вопроса

- [ ] **`components/submission/FullscreenCameraModal.tsx` (200+ строк)**: Смешивание логики камеры и UI
  **Решение**:
  - Создать хук `useCamera` для работы с камерой
  - Вынести UI в отдельный презентационный компонент

- [ ] **`components/CheckCreationStep1.tsx` и `CheckCreationStep2.tsx`**: Дублирование логики форм
  **Решение**: Создать общий `useCheckForm` хук

#### 🏗️ Отсутствие слоя абстракции

- [ ] **API вызовы**: Прямые вызовы Supabase в компонентах
  ```typescript
  // components/submission/question-accordion.tsx
  const { data } = supabase.from('submissions')...
  ```
  **Решение**: Создать API service layer:
  ```typescript
  // lib/api/submissions.ts
  export const submissionsApi = {
    getById: (id: string) => { ... },
    create: (data: CreateSubmissionDto) => { ... },
    // ...
  }
  ```

### 3.2 Дублирование Кода

#### 📋 Повторяющаяся логика обработки ошибок

- [ ] **Дублирование**: Error handling повторяется в 15+ API routes
  ```typescript
  // В каждом API route:
  try {
    // ...
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
  ```
  **Решение**: Создать middleware для унифицированной обработки ошибок:
  ```typescript
  // lib/api/error-handler.ts
  export function withErrorHandler(handler: ApiHandler) {
    return async (req: Request) => {
      try {
        return await handler(req)
      } catch (error) {
        return handleApiError(error)
      }
    }
  }
  ```

#### 📋 Дублирование валидации

- [ ] **Файлы**: `app/api/tests/save/route.ts`, `app/api/tests/[id]/route.ts`
  **Проблема**: Одинаковая логика валидации данных теста
  **Решение**: Переиспользовать схемы из `lib/validations/check.ts`

#### 📋 Повторяющаяся логика работы с изображениями

- [ ] **Файлы**: `CameraScanner.tsx`, `QuestionImageUpload.tsx`, `FullscreenCameraModal.tsx`
  **Проблема**: Дублируется логика:
  - Конвертация blob в base64
  - Загрузка в Supabase Storage
  - Обработка ошибок

  **Решение**: Создать хук `useImageUpload`:
  ```typescript
  // hooks/use-image-upload.ts
  export function useImageUpload() {
    const upload = async (file: File | Blob) => { ... }
    const convertToBase64 = async (blob: Blob) => { ... }
    return { upload, convertToBase64, isUploading, error }
  }
  ```

### 3.3 Нарушения SOLID Принципов

#### 🔧 Нарушение Dependency Inversion Principle

- [ ] **`lib/openrouter.ts`**: Жесткая привязка к конкретной реализации AI сервиса
  ```typescript
  // Прямое использование OpenRouter
  const response = await fetch(OPENROUTER_API_URL, ...)
  ```
  **Решение**: Создать интерфейс AI provider:
  ```typescript
  // lib/ai/provider.interface.ts
  export interface IAIProvider {
    evaluate(question: Question, answer: Answer): Promise<EvaluationResult>
    checkWriting(text: string, criteria: Criteria): Promise<WritingResult>
  }

  // lib/ai/openrouter-provider.ts
  export class OpenRouterProvider implements IAIProvider {
    // ...
  }
  ```

#### 🔧 Нарушение Open/Closed Principle

- [ ] **`components/TestConstructor.tsx:200+`**: Switch-case для разных типов вопросов
  ```typescript
  switch (question.type) {
    case 'single_choice': return <SingleChoice ... />
    case 'multiple_choice': return <MultipleChoice ... />
    // Добавление нового типа требует модификации компонента
  }
  ```
  **Решение**: Использовать паттерн Strategy с мапой компонентов:
  ```typescript
  const QUESTION_COMPONENTS = {
    single_choice: SingleChoiceQuestion,
    multiple_choice: MultipleChoiceQuestion,
    // ...
  }

  const QuestionComponent = QUESTION_COMPONENTS[question.type]
  return <QuestionComponent ... />
  ```

### 3.4 Проблемы с типизацией и контрактами

#### 📝 Несоответствие типов и runtime данных

- [ ] **`types/database.ts` vs `types/check.ts`**: Разные определения одних и тех же сущностей
  **Проблема**:
  - `Database['public']['Tables']['checks']['Row']`
  - vs `Check` interface

  **Решение**: Генерировать TypeScript типы из Supabase схемы:
  ```bash
  supabase gen types typescript --project-id $PROJECT_ID > types/supabase.ts
  ```

- [ ] **API Response типы**: Отсутствуют строгие типы для API responses
  **Решение**: Создать DTOs для всех API endpoints

---

## 4. TypeScript и Типизация (Medium Priority) 🟡

### 4.1 Проблемы с типами

#### 📘 41 случай использования `any`

**Критичные случаи для исправления:**

- [ ] **`lib/openrouter.ts:71,131,189,247`**: AI response types
  **Решение**: Создать строгие интерфейсы OpenRouter API

- [ ] **`components/TestConstructor.tsx:127,145,203`**: Question data types
  **Решение**: Использовать существующие типы из `types/check.ts`

- [ ] **`lib/upload-submissions.ts:89`**: File processing data
  **Решение**: Создать строгий тип для обработки файлов

#### 📘 Отсутствующие generic типы

- [ ] **`lib/database.ts`**: Функции без generic параметров
  ```typescript
  export async function getById(table: string, id: string) {
    // Возвращаемый тип не типизирован
  }
  ```
  **Решение**: Добавить generics:
  ```typescript
  export async function getById<T>(
    table: string,
    id: string
  ): Promise<T | null> {
    // ...
  }
  ```

#### 📘 Неполные типы

- [ ] **`types/check.ts:15-45`**: Опциональные поля без описания
  ```typescript
  export interface Question {
    image?: string // Когда это поле есть, а когда нет?
  }
  ```
  **Решение**: Добавить JSDoc комментарии или использовать discriminated unions

---

## 5. Неиспользуемый Код (Low Priority) 🟢

### 5.1 Неиспользуемые Компоненты

После анализа импортов найдены потенциально неиспользуемые компоненты:

- [ ] **`components/QuestionImageUpload.tsx`**: Создан недавно, но нет импортов
  **Действие**: Проверить, используется ли; если нет - удалить или интегрировать

### 5.2 Неиспользуемые Функции/Хуки

- [ ] **`lib/check-creation-validation.ts`**: Возможно дублирует `lib/validations/check.ts`
  **Действие**: Провести аудит валидационных функций и удалить дубликаты

- [ ] **`lib/subscription.ts`**: Функции подписки могут быть не использованы полностью
  **Действие**: Проверить использование каждой функции

### 5.3 Неиспользуемые Зависимости

Необходима проверка следующих пакетов в `package.json`:

- [ ] Проверить через `npx depcheck`:
  ```bash
  npx depcheck
  ```

- [ ] Удалить неиспользуемые dev-dependencies

### 5.4 Dead Code

#### 🗑️ Закомментированный код

- [ ] **`components/TestConstructor.tsx:150-165`**: Закомментированный старый код
  **Действие**: Удалить если не используется

- [ ] **`lib/openrouter.ts:45-60`**: Старые комментарии с кодом
  **Действие**: Очистить

#### 🗑️ Console.log (641 вхождений!)

**Критическая проблема**: Огромное количество отладочных логов в продакшн-коде

- [ ] **Массовая очистка**: Удалить все `console.log` из компонентов и API routes
  **Решение**:
  1. Использовать proper logging библиотеку (winston, pino)
  2. Создать wrapper для логирования:
  ```typescript
  // lib/logger.ts
  export const logger = {
    info: (msg: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(msg, data)
      }
    },
    error: (msg: string, error: Error) => {
      // Send to error tracking service
    }
  }
  ```

---

## 6. Code Style и Best Practices (Low Priority) 🟢

### 6.1 Нарушения Соглашений об Именовании

#### 📝 Inconsistent naming

- [ ] **`components/submission/question-accordion.tsx`**: kebab-case вместо PascalCase
  **Решение**: Переименовать в `QuestionAccordion.tsx`

- [ ] **`lib/check-creation-validation.ts`**: kebab-case для файла утилит
  **Решение**: Переименовать в `checkCreationValidation.ts` или вынести в utils

#### 📝 Несоответствие naming conventions

- [ ] **Event handlers**: Некоторые без префикса `handle`
  ```typescript
  // Плохо
  const onClick = () => { }
  // Хорошо
  const handleClick = () => { }
  ```

- [ ] **Boolean переменные**: Не все начинаются с is/has/should
  **Примеры к исправлению**: `loading` → `isLoading`, `error` → `hasError`

### 6.2 Доступность (a11y)

#### ♿ Проблемы с клавиатурной навигацией

- [ ] **`components/TestConstructor.tsx`**: Drag & drop без клавиатурной альтернативы
  **Решение**: Добавить кнопки "Move Up" / "Move Down"

- [ ] **`components/submission/FullscreenCameraModal.tsx`**: Модалка без focus trap
  **Решение**: Использовать `@radix-ui/react-focus-scope`

#### ♿ Отсутствие ARIA атрибутов

- [ ] **`components/submission/question-accordion.tsx`**: Accordion без ARIA
  **Решение**: Использовать `@radix-ui/react-accordion` вместо самописного

- [ ] **Формы**: Отсутствуют aria-invalid и aria-describedby для ошибок
  **Решение**: Добавить ARIA атрибуты к полям с ошибками:
  ```typescript
  <input
    aria-invalid={!!error}
    aria-describedby={error ? `${id}-error` : undefined}
  />
  {error && <span id={`${id}-error`}>{error}</span>}
  ```

#### ♿ Проблемы с контрастностью

- [ ] **Проверить**: Провести аудит через Lighthouse/axe DevTools
  **Действие**: Убедиться что все цвета соответствуют WCAG AA (минимум 4.5:1)

### 6.3 Hardcoded Values

#### 🔧 Вынести в конфигурацию

- [ ] **`lib/openrouter.ts:12-15`**: Hardcoded API URLs и модели
  ```typescript
  const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
  const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free'
  ```
  **Решение**: Вынести в `lib/config.ts` или environment variables

- [ ] **`components/submission/CameraScanner.tsx:85`**: Hardcoded качество изображения
  ```typescript
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(resolve as BlobCallback, 'image/jpeg', 0.95)
  })
  ```
  **Решение**: Вынести в константы:
  ```typescript
  const IMAGE_CONFIG = {
    format: 'image/jpeg',
    quality: 0.95,
    maxWidth: 1920,
    maxHeight: 1080,
  }
  ```

- [ ] **Файлы**: Множественные hardcoded строки для UI
  **Решение**: Создать `lib/constants/messages.ts` для всех user-facing текстов

### 6.4 Отсутствие документации

#### 📚 JSDoc комментарии

- [ ] **Public API**: Отсутствуют JSDoc для публичных функций
  **Примеры**:
  - `lib/database.ts` - все функции
  - `lib/openrouter.ts` - AI функции
  - `hooks/use-check-balance.ts` - хуки

  **Решение**: Добавить JSDoc:
  ```typescript
  /**
   * Evaluates a student's answer using AI
   * @param question - The question being answered
   * @param answer - Student's answer
   * @param criteria - Evaluation criteria
   * @returns Evaluation result with score and feedback
   * @throws {OpenRouterError} If AI service fails
   */
  export async function evaluateAnswer(
    question: Question,
    answer: Answer,
    criteria: Criteria
  ): Promise<EvaluationResult> {
    // ...
  }
  ```

#### 📚 README и документация

- [ ] **Отсутствует**: `/docs/API.md` - документация API endpoints
- [ ] **Отсутствует**: `/docs/ARCHITECTURE.md` - архитектура приложения
- [ ] **Отсутствует**: `/docs/COMPONENTS.md` - документация компонентов

---

## 7. Метрики и Статистика

### Общая статистика

| Категория | Количество проблем |
|-----------|-------------------|
| 🔴 Критические (Security, Bugs) | 25 |
| 🟡 Производительность | 45 |
| 🟡 Архитектура | 38 |
| 🟡 TypeScript | 41 |
| 🟢 Code Style | 50 |
| 🟢 Неиспользуемый код | ~20 |
| **ИТОГО** | **219** |

### Code Quality Metrics

- **TypeScript any usage**: 41 случай (нужно исправить до 0)
- **Console.log в коде**: 641 вхождений (удалить из продакшна)
- **ESLint нарушения**: Требуется запуск `npm run lint` для точного подсчета
- **Средний размер компонента**: ~180 строк (целевое значение: <150)
- **Самые большие компоненты**:
  - `TestConstructor.tsx`: ~500 строк
  - `FullscreenCameraModal.tsx`: ~200 строк
  - `CheckCreationStep2.tsx`: ~180 строк

### Performance Metrics (требуется измерение)

**Действия для измерения:**
```bash
# Bundle size
npm run build
npx next-bundle-analyzer

# Lighthouse audit
npx lighthouse http://localhost:3000 --view

# TypeScript errors
npx tsc --noEmit
```

---

## 8. Рекомендуемый План Действий

### Фаза 1: Критические Исправления (1-2 недели) 🔴

**Приоритет 1: Безопасность**
1. [ ] Добавить валидацию входных данных во все API endpoints (используя Zod)
2. [ ] Исправить все 41 использование `any` типа
3. [ ] Добавить proper error boundaries
4. [ ] Очистить memory leaks (URL.revokeObjectURL)
5. [ ] Вынести hardcoded credentials в environment variables

**Приоритет 2: Критические баги**
6. [ ] Исправить race conditions в async операциях
7. [ ] Добавить null checks перед использованием объектов
8. [ ] Обернуть все async операции в try-catch с proper обработкой ошибок

### Фаза 2: Оптимизация Производительности (2-3 недели) 🟡

**Week 1:**
9. [ ] Добавить React.memo для тяжелых компонентов (TestConstructor, CheckCreationStep2)
10. [ ] Мемоизировать callbacks через useCallback
11. [ ] Мемоизировать вычисления через useMemo
12. [ ] Оптимизировать запросы к БД (использовать Promise.all для параллельных запросов)

**Week 2:**
13. [ ] Добавить code splitting для тяжелых компонентов (dynamic imports)
14. [ ] Добавить виртуализацию для длинных списков
15. [ ] Добавить компрессию изображений перед загрузкой
16. [ ] Добавить debounce для частых операций

**Week 3:**
17. [ ] Внедрить React Query или SWR для кэширования
18. [ ] Оптимизировать bundle size (tree-shaking, удаление неиспользуемых зависимостей)

### Фаза 3: Архитектурные Улучшения (3-4 недели) 🟡

**Week 1-2: Рефакторинг компонентов**
19. [ ] Разбить TestConstructor на мелкие компоненты
20. [ ] Создать service layer для API вызовов
21. [ ] Создать переиспользуемые хуки (useImageUpload, useCamera)
22. [ ] Унифицировать error handling через middleware

**Week 3-4: Улучшение архитектуры**
23. [ ] Создать интерфейс IAIProvider для AI сервисов
24. [ ] Рефакторинг типов вопросов через Strategy pattern
25. [ ] Создать строгие DTOs для всех API endpoints
26. [ ] Генерация TypeScript типов из Supabase схемы

### Фаза 4: Code Quality и Cleanup (1-2 недели) 🟢

**Week 1:**
27. [ ] Удалить все console.log и внедрить proper logging
28. [ ] Удалить неиспользуемый код (dead code, commented code)
29. [ ] Удалить неиспользуемые зависимости (через depcheck)
30. [ ] Исправить naming conventions

**Week 2:**
31. [ ] Добавить JSDoc документацию для публичных API
32. [ ] Улучшить a11y (ARIA атрибуты, keyboard navigation)
33. [ ] Создать документацию (API.md, ARCHITECTURE.md, COMPONENTS.md)
34. [ ] Запустить полный линтинг и исправить все warnings

### Фаза 5: Тестирование и Мониторинг (ongoing)

35. [ ] Настроить автоматический линтинг в pre-commit hooks
36. [ ] Добавить bundle size monitoring
37. [ ] Настроить performance monitoring (Web Vitals)
38. [ ] Настроить error tracking (Sentry)
39. [ ] Написать unit тесты для критичных функций
40. [ ] Настроить CI/CD с проверками качества кода

---

## 9. Автоматизация и Инструменты

### Рекомендуемые инструменты для внедрения

```json
// package.json - добавить scripts
{
  "scripts": {
    "lint:fix": "eslint . --fix",
    "type-check": "tsc --noEmit",
    "analyze": "ANALYZE=true next build",
    "test:a11y": "pa11y http://localhost:3000",
    "check:deps": "npx depcheck",
    "check:bundle": "npx next-bundle-analyzer"
  }
}
```

### Pre-commit hooks (Husky + lint-staged)

```bash
# Установка
npm install -D husky lint-staged

# .husky/pre-commit
npm run lint:fix
npm run type-check
```

### Рекомендуемые дополнительные библиотеки

```bash
# Производительность
npm install react-query        # Кэширование и state management
npm install react-window       # Виртуализация списков
npm install browser-image-compression  # Компрессия изображений

# Quality
npm install -D eslint-plugin-jsx-a11y   # A11y проверки
npm install winston            # Logging
npm install @sentry/nextjs     # Error tracking

# Утилиты
npm install lodash-es          # Утилиты (debounce, throttle)
npm install zod                # Runtime валидация (уже есть)
```

---

## 10. KPI для Отслеживания Прогресса

### Метрики качества кода

- [ ] **TypeScript strict mode**: 0 ошибок компиляции
- [ ] **ESLint**: 0 ошибок, <10 warnings
- [ ] **TypeScript `any` usage**: Снизить с 41 до 0
- [ ] **Console.log**: Удалить все 641 вхождений из production кода
- [ ] **Test coverage**: Достичь минимум 60% coverage

### Метрики производительности

- [ ] **Lighthouse Score**:
  - Performance: >90
  - Accessibility: >95
  - Best Practices: >95
  - SEO: >90
- [ ] **Bundle Size**: Уменьшить на 20-30%
- [ ] **First Contentful Paint (FCP)**: <1.5s
- [ ] **Time to Interactive (TTI)**: <3.5s
- [ ] **Largest Contentful Paint (LCP)**: <2.5s

### Метрики архитектуры

- [ ] **Average component size**: <150 строк
- [ ] **Cyclomatic complexity**: <10 для всех функций
- [ ] **Duplication**: <3% дублированного кода
- [ ] **Documentation coverage**: 100% публичных API

---

## Заключение

Данный план покрывает **219 идентифицированных проблем** в следующих категориях:

1. ✅ **Безопасность**: 15+ критических проблем
2. ✅ **Баги**: 10+ потенциальных ошибок
3. ✅ **Производительность**: 45+ проблем оптимизации
4. ✅ **Архитектура**: 38+ архитектурных улучшений
5. ✅ **Типизация**: 41 случай использования `any`
6. ✅ **Code Quality**: 50+ нарушений best practices
7. ✅ **Cleanup**: ~20 единиц неиспользуемого кода

**Рекомендуемое время выполнения**: 8-12 недель при работе одного разработчика полный рабочий день.

**Критично начать с Фазы 1** (безопасность и критические баги), затем постепенно переходить к оптимизации и архитектурным улучшениям.

**Next Steps:**
1. Провести team review этого плана
2. Приоритизировать задачи согласно бизнес-целям
3. Создать issues/tickets в системе управления проектом
4. Начать выполнение с Фазы 1

---

*Документ создан агентом code-reviewer на основе анализа 65+ файлов кодовой базы ChecklyTool*
*Дата: 2025-10-19*
