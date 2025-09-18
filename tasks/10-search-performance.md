# Задача 10: Оптимизировать загрузку главной страницы и поиска

## Описание проблемы
Из логов видно что:
- Главная страница долго грузится при первом заходе
- При наборе каждой буквы в поиске идет долгая загрузка
- Множественные API вызовы без debouncing
- Отсутствие кэширования результатов

## Анализ кода
В `components/MobileDashboard.tsx:102-144`:

```tsx
// Мемоизируем загрузку данных для предотвращения лишних запросов
const loadDashboardData = useCallback(async () => {
  // ... API calls без debouncing
}, [searchQuery, subjectFilter, sortBy]) // Каждое изменение searchQuery вызывает запрос

// Загрузка данных
useEffect(() => {
  loadDashboardData()
}, [loadDashboardData]) // Перезапускается при каждом изменении зависимостей
```

## Проблемы
1. **Нет debouncing**: Каждый keystroke вызывает API запрос
2. **Нет кэширования**: Повторные запросы не кэшируются
3. **Избыточные запросы**: Параллельные запросы к одним данным
4. **Тяжелая загрузка**: Загружаются все данные сразу

## Файлы для изменения
- `components/MobileDashboard.tsx` (строки 102-144)
- Возможно создать хуки `useDebounce`, `useCache`

## План исправления

### 10.1 Добавить debouncing для поиска
```tsx
import { useMemo } from 'react'

// Custom hook для debouncing
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// В компоненте
const [searchQuery, setSearchQuery] = useState('')
const debouncedSearchQuery = useDebounce(searchQuery, 500) // 500ms debounce

const loadDashboardData = useCallback(async () => {
  // ... используем debouncedSearchQuery вместо searchQuery
}, [debouncedSearchQuery, subjectFilter, sortBy])
```

### 10.2 Добавить кэширование
```tsx
const useApiCache = () => {
  const cache = useRef(new Map())

  const getCached = useCallback((key: string) => {
    const cached = cache.current.get(key)
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 минут
      return cached.data
    }
    return null
  }, [])

  const setCached = useCallback((key: string, data: any) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now()
    })
  }, [])

  return { getCached, setCached }
}

// В loadDashboardData
const cacheKey = `${debouncedSearchQuery}-${subjectFilter}-${sortBy}`
const cachedData = getCached(cacheKey)

if (cachedData) {
  setChecks(cachedData.checks)
  setStats(cachedData.stats)
  return
}

// ... делать запрос только если нет в кэше
const result = await Promise.all([/* API calls */])
setCached(cacheKey, result)
```

### 10.3 Оптимизировать первую загрузку
```tsx
// Lazy loading для не критичных данных
const loadDashboardData = useCallback(async (priority: 'critical' | 'normal' = 'normal') => {
  setIsLoading(true)

  try {
    if (priority === 'critical') {
      // Загружаем только критичные данные при первом заходе
      const checksResponse = await fetch(`/api/checks?limit=10`) // Ограничиваем количество
      const checksData = await checksResponse.json()
      setChecks(checksData.checks || [])

      // Статистику загружаем отдельно
      setTimeout(() => loadStats(), 100)
    } else {
      // Полная загрузка
      const [checksResponse, statsResponse] = await Promise.all([
        fetch(`/api/checks?${params}`),
        fetch('/api/dashboard/stats')
      ])
      // ...
    }
  } finally {
    setIsLoading(false)
  }
}, [debouncedSearchQuery, subjectFilter, sortBy])

// При первой загрузке
useEffect(() => {
  if (isFirstLoad) {
    loadDashboardData('critical')
    setIsFirstLoad(false)
  } else {
    loadDashboardData()
  }
}, [loadDashboardData])
```

### 10.4 Показать промежуточные состояния
```tsx
// Разные состояния загрузки
const [isInitialLoading, setIsInitialLoading] = useState(true)
const [isSearching, setIsSearching] = useState(false)

// В UI
{isInitialLoading ? (
  <InitialLoadingSkeleton />
) : isSearching ? (
  <SearchingIndicator />
) : (
  <ChecksList />
)}
```

### 10.5 Virtualization для больших списков
```tsx
// Если много элементов - использовать react-window
import { FixedSizeList as List } from 'react-window'

const VirtualizedChecksList = ({ checks }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <CheckItem check={checks[index]} />
    </div>
  )

  return (
    <List
      height={600}
      itemCount={checks.length}
      itemSize={100}
    >
      {Row}
    </List>
  )
}
```

## Приоритет
🟡 ВЫСОКИЙ - влияет на первое впечатление

## Ожидаемый результат
- Быстрая первая загрузка главной страницы (< 2сек)
- Мгновенный поиск без задержек
- Снижение количества API запросов на 70%
- Плавный UX без "подвисаний"