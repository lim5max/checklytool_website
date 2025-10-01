# ChecklyTool Design System

Единая система дизайна для всего приложения, основанная на принципах Apple Human Interface Guidelines и Google Material Design 3.

## Философия

Наша дизайн-система создана для обеспечения:
- **Консистентности** — все компоненты выглядят и ведут себя единообразно
- **Предсказуемости** — пользователи всегда знают, чего ожидать
- **Масштабируемости** — легко добавлять новые компоненты и функции
- **Доступности** — интерфейс доступен для всех пользователей

---

## 1. Icon Sizes

**Правило:** Используйте только 3 размера иконок во всем приложении.

### Размеры

| Размер | Пиксели | Tailwind Class | CSS Class | Применение |
|--------|---------|----------------|-----------|------------|
| **Small** | 16px | `w-4 h-4` | `icon-sm` | Маленькие иконки в тексте, метках |
| **Medium** | 24px | `w-6 h-6` | `icon-md` | Основные иконки в кнопках, полях |
| **Large** | 32px | `w-8 h-8` | `icon-lg` | Крупные иконки в заголовках |

### Использование

```tsx
import { Icon } from '@/components/ui/icon'
import { Plus, Check, Search } from 'lucide-react'

// Рекомендуемый способ
<Icon icon={Plus} size="md" className="text-blue-600" />

// Прямое использование CSS классов
<Plus className="icon-md text-blue-600" />
```

---

## 2. Spacing System (8pt Grid)

**Правило:** Все отступы кратны 4 пикселям (8pt grid).

### Шкала spacing

| Token | Пиксели | Tailwind | Применение |
|-------|---------|----------|------------|
| `spacing-0` | 0px | `0` | Без отступа |
| `spacing-1` | 4px | `1` | Минимальный отступ |
| `spacing-2` | 8px | `2` | Компактный отступ |
| `spacing-3` | 12px | `3` | Малый отступ |
| `spacing-4` | 16px | `4` | Стандартный отступ |
| `spacing-6` | 24px | `6` | Средний отступ |
| `spacing-8` | 32px | `8` | Большой отступ |
| `spacing-12` | 48px | `12` | Очень большой отступ |
| `spacing-16` | 64px | `16` | Максимальный отступ |

### Применение

```tsx
// Gap между элементами
<div className="flex gap-2">...</div> // 8px
<div className="flex gap-4">...</div> // 16px
<div className="flex gap-6">...</div> // 24px

// Padding
<div className="p-4">...</div>  // 16px со всех сторон
<div className="px-6 py-4">...</div> // 24px по X, 16px по Y

// Margin
<div className="mt-8">...</div> // 32px сверху
```

---

## 3. Typography Scale

**Правило:** Используйте предопределенные типографические стили.

### Типографическая шкала

| Вариант | Размер | Line Height | Weight | Применение |
|---------|--------|-------------|---------|------------|
| **Display** | 32px (2xl) | 40px | 800 | Главные заголовки страниц |
| **Headline** | 24px (xl) | 32px | 700 | Заголовки секций |
| **Title** | 20px (lg) | 28px | 600 | Подзаголовки, названия карточек |
| **Body** | 16px (base) | 24px | 400 | Основной текст |
| **Body Medium** | 16px (base) | 24px | 500 | Акцентный текст |
| **Caption** | 14px (sm) | 20px | 400 | Подписи, метаданные |
| **Label** | 12px (xs) | 16px | 500 | Метки, бейджи |

### Использование

```tsx
// Display
<h1 className="text-2xl font-black leading-[40px] tracking-tight">
  Главный заголовок
</h1>

// Headline
<h2 className="text-xl font-bold leading-8">
  Заголовок секции
</h2>

// Title
<h3 className="text-lg font-semibold leading-7">
  Подзаголовок
</h3>

// Body
<p className="text-base leading-6">
  Основной текст документа
</p>

// Caption
<span className="text-sm leading-5 text-slate-600">
  Дополнительная информация
</span>
```

---

## 4. Border Radius

**Правило:** Используйте стандартизованные значения скругления углов.

### Шкала border-radius

| Token | Пиксели | Tailwind | Применение |
|-------|---------|----------|------------|
| `radius-sm` | 8px | `rounded-lg` | Мелкие элементы, бейджи |
| `radius-md` | 12px | `rounded-xl` | Кнопки, поля ввода |
| `radius-lg` | 16px | `rounded-2xl` | Карточки, модальные окна |
| `radius-xl` | 24px | `rounded-3xl` | Большие контейнеры |
| `radius-2xl` | 28px | `rounded-[28px]` | Специальные элементы |
| `radius-full` | 9999px | `rounded-full` | Круглые элементы, аватары |

### Использование

```tsx
// Кнопки
<Button className="rounded-xl">...</Button>

// Карточки
<Card className="rounded-2xl">...</Card>

// Аватары
<img className="rounded-full" />
```

---

## 5. Elevation (Shadows)

**Правило:** Используйте стандартизованные тени для создания глубины.

### Шкала elevation

| Уровень | CSS Class | Tailwind | Применение |
|---------|-----------|----------|------------|
| **None** | `elevation-none` | `shadow-none` | Плоские элементы |
| **SM** | `elevation-sm` | `shadow-sm` | Легкая тень (карточки) |
| **MD** | `elevation-md` | `shadow-md` | Средняя тень (кнопки) |
| **LG** | `elevation-lg` | `shadow-lg` | Заметная тень (модалки) |
| **XL** | `elevation-xl` | `shadow-xl` | Сильная тень (драйверы) |
| **2XL** | `elevation-2xl` | `shadow-2xl` | Максимальная тень |

### Использование

```tsx
// Карточки с легкой тенью
<Card className="elevation-sm">...</Card>

// Кнопки с интерактивной тенью
<Button className="elevation-sm hover:elevation-md">
  Кнопка
</Button>

// Модальные окна
<div className="elevation-xl">...</div>
```

---

## 6. Color Palette

**Правило:** Используйте только цвета из палитры дизайн-системы.

### Основные цвета

#### Primary (Blue)
```
primary-50:  #eff6ff
primary-100: #dbeafe
primary-500: #096ff5 ← Основной
primary-900: #02153d
```

#### Success (Green)
```
success-50:  #f0fdf4
success-500: #22c55e ← Основной
success-900: #14532d
```

#### Warning (Orange)
```
warning-50:  #fff7ed
warning-500: #f97316 ← Основной
warning-900: #7c2d12
```

#### Error (Red)
```
error-50:  #fef2f2
error-500: #ef4444 ← Основной
error-900: #7f1d1d
```

#### Neutral (Slate)
```
neutral-0:   #ffffff
neutral-50:  #f8fafc
neutral-100: #f1f5f9
neutral-200: #e2e8f0
neutral-500: #64748b
neutral-900: #0f172a
```

### Использование

```tsx
// Текст
<p className="text-slate-900">Основной текст</p>
<p className="text-slate-600">Вторичный текст</p>
<p className="text-primary-blue">Акцентный текст</p>

// Фон
<div className="bg-white">...</div>
<div className="bg-slate-50">...</div>
<div className="bg-primary-blue">...</div>

// Границы
<div className="border-2 border-slate-200">...</div>
<div className="border-2 border-primary-blue">...</div>
```

---

## 7. Components

### Button

Стандартизованные кнопки с тремя размерами и несколькими вариантами.

```tsx
import { Button } from '@/components/ui/button'

// Размеры
<Button size="sm">Маленькая</Button>
<Button size="default">Средняя</Button>
<Button size="lg">Большая</Button>

// Варианты
<Button variant="default">Основная</Button>
<Button variant="outline">Обведенная</Button>
<Button variant="secondary">Вторичная</Button>
<Button variant="ghost">Призрачная</Button>
<Button variant="destructive">Удалить</Button>
<Button variant="link">Ссылка</Button>

// Full width
<Button fullWidth>На всю ширину</Button>
```

### Input

Поля ввода с единообразным дизайном и серой заливкой по умолчанию.

```tsx
import { Input, SearchInput } from '@/components/ui/input'

// Размеры
<Input size="sm" placeholder="Маленькое поле" />
<Input size="default" placeholder="Стандартное поле" />
<Input size="lg" placeholder="Большое поле" />

// Варианты
<Input variant="default" />  // С серой заливкой (bg-slate-50)
<Input variant="outlined" /> // Без заливки (bg-white)
<Input variant="error" />    // С красной заливкой для ошибок

// Поле поиска
<SearchInput placeholder="Поиск..." />
```

**Примечание:** По умолчанию все поля ввода имеют легкую серую заливку (`bg-slate-50`), которая при фокусе меняется на белую (`focus-visible:bg-white`). Это создает приятный визуальный эффект и делает интерфейс более мягким.

### Card

Карточки для группировки контента.

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card'

<Card variant="default" padding="default" rounded="default">
  <CardHeader>
    <CardTitle>Заголовок</CardTitle>
    <CardDescription>Описание</CardDescription>
  </CardHeader>
  <CardContent>
    Содержимое карточки
  </CardContent>
  <CardFooter>
    <Button>Действие</Button>
  </CardFooter>
</Card>

// Варианты
<Card variant="elevated">...</Card>
<Card variant="interactive">...</Card>
<Card variant="outlined">...</Card>
```

### Switch

Переключатели с двумя вариантами и тремя размерами.

```tsx
import { Switch } from '@/components/ui/switch'

// Размеры
<Switch size="sm" />
<Switch size="default" />
<Switch size="lg" />

// Варианты
<Switch variant="default" /> // Синий
<Switch variant="success" /> // Зеленый
```

### Textarea

Многострочные поля ввода с серой заливкой по умолчанию.

```tsx
import { Textarea } from '@/components/ui/textarea'

// Размеры
<Textarea size="sm" />
<Textarea size="default" />
<Textarea size="lg" />

// Варианты
<Textarea variant="default" />  // С серой заливкой (bg-slate-50)
<Textarea variant="outlined" /> // Без заливки (bg-white)
<Textarea variant="error" />    // С красной заливкой для ошибок
```

**Примечание:** Textarea также использует серую заливку по умолчанию, которая меняется на белую при фокусе.

---

## 8. Animation

**Правило:** Используйте стандартные длительности анимаций.

| Длительность | MS | Применение |
|--------------|-----|------------|
| **Fast** | 150ms | Быстрые взаимодействия (hover) |
| **Normal** | 200ms | Стандартные переходы |
| **Slow** | 300ms | Сложные анимации |
| **Slower** | 400ms | Большие изменения |

```tsx
// В Tailwind
<div className="transition-all duration-200">...</div>

// В CSS
.element {
  transition: all var(--animation-normal);
}
```

---

## 9. Best Practices

### Консистентность

✅ **DO:**
- Используйте только размеры из дизайн-системы
- Применяйте стандартные компоненты везде, где возможно
- Следуйте 8pt grid для всех отступов

❌ **DON'T:**
- Не используйте произвольные размеры (`w-[23px]`)
- Не создавайте кастомные компоненты без необходимости
- Не используйте произвольные цвета вне палитры

### Иерархия

✅ **DO:**
- Используйте размеры иконок для создания визуальной иерархии
- Применяйте elevation для выделения важных элементов
- Используйте типографику для структурирования контента

### Доступность

✅ **DO:**
- Обеспечивайте достаточный контраст (WCAG AA)
- Добавляйте aria-атрибуты к интерактивным элементам
- Поддерживайте навигацию с клавиатуры

### Производительность

✅ **DO:**
- Используйте CSS классы вместо inline стилей
- Минимизируйте количество re-renders
- Применяйте `will-change` для анимированных элементов

---

## 10. Примеры использования

### Пример 1: Форма входа

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'

function LoginForm() {
  return (
    <Card variant="elevated" padding="lg" rounded="lg">
      <CardHeader>
        <CardTitle>Вход в систему</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Email"
            size="default"
          />
          <Input
            type="password"
            placeholder="Пароль"
            size="default"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button fullWidth size="lg">
          Войти
        </Button>
      </CardFooter>
    </Card>
  )
}
```

### Пример 2: Список с иконками

```tsx
import { Icon } from '@/components/ui/icon'
import { Check, X, AlertCircle } from 'lucide-react'

function StatusList() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Icon icon={Check} size="md" className="text-green-500" />
        <span>Задача выполнена</span>
      </div>
      <div className="flex items-center gap-3">
        <Icon icon={AlertCircle} size="md" className="text-orange-500" />
        <span>Требует внимания</span>
      </div>
      <div className="flex items-center gap-3">
        <Icon icon={X} size="md" className="text-red-500" />
        <span>Ошибка</span>
      </div>
    </div>
  )
}
```

---

## Заключение

Следуя этой дизайн-системе, вы создадите консистентный, доступный и масштабируемый пользовательский интерфейс, который обеспечит отличный опыт использования приложения ChecklyTool.

**Важно:** Все изменения в дизайн-системе должны быть согласованы с командой и задокументированы в этом файле.
