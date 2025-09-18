# Задача 8: Исправить проблемы с камерой и дублированием при ошибках

## Описание проблемы
При ошибке фотографирования в камере происходит:
- Дублирование учеников
- Невозможность сделать больше 1 фотографии после ошибки
- Отсутствие анимации фотографирования для обратной связи

## Анализ кода
В `components/camera/CameraWorkInterface.tsx:246-280` функция `capturePhoto` имеет обработку ошибок, но может создавать проблемы при повторных попытках.

```tsx
} catch (err) {
  // ... error handling

  // Попробуем перезапустить камеру если поток неактивен
  if (!streamRef.current?.active && isStreaming) {
    setTimeout(() => {
      stopCamera()
      setTimeout(() => startCamera(), 500)
    }, 100)
  }
}
```

## Проблемы
1. **Дублирование**: При ошибке может создаваться новый ученик вместо retry
2. **Блокировка камеры**: После ошибки камера может не работать
3. **Отсутствие анимации**: Пользователь не понимает что происходит фотографирование

## Файлы для изменения
- `components/camera/CameraWorkInterface.tsx` (строки 191-280, 64-89)
- Возможно создать хуки для управления камерой

## План исправления

### 8.1 Исправить логику ошибок
```tsx
const capturePhoto = useCallback(async () => {
  if (isCapturing || !canAddMorePhotos) {
    console.log('[CAMERA] Capture blocked')
    return
  }

  setIsCapturing(true)

  try {
    // ... photo capture logic

    // Success - добавляем фото
    addPhotoDraft(checkId, activeStudentIndex, dataUrl)
    toast.success('Фотография сделана!')

  } catch (err) {
    console.error('[CAMERA] Capture failed:', err)
    toast.error('Не удалось сделать фотографию. Попробуйте еще раз.')

    // НЕ создаваем дубликат ученика при ошибке
    // Только перезапускаем камеру если нужно

  } finally {
    setIsCapturing(false) // ВАЖНО: всегда сбрасываем флаг
  }
}, [/* зависимости */])
```

### 8.2 Добавить анимации
```tsx
// Анимация кнопки во время фотографирования
<Button
  className={cn(
    "w-16 h-16 rounded-full transition-all duration-200",
    isCapturing
      ? "bg-green-500 scale-110 animate-pulse"
      : "bg-white hover:bg-gray-200"
  )}
  disabled={!isStreaming || isCapturing || !canAddMorePhotos}
  onClick={capturePhoto}
>
  {isCapturing ? (
    <div className="w-2 h-2 bg-white rounded-full" />
  ) : (
    <Camera className="w-8 h-8 text-black" />
  )}
</Button>

// Вспышка эффект при успешном фото
{justCaptured && (
  <div className="absolute inset-0 bg-white animate-ping opacity-50 z-10" />
)}
```

### 8.3 Улучшить управление камерой
```tsx
const useCameraManager = () => {
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)

  const recoverCamera = useCallback(async () => {
    try {
      await stopCamera()
      await new Promise(resolve => setTimeout(resolve, 500))
      await startCamera()
      setError(null)
    } catch (err) {
      setError('Не удалось восстановить камеру')
    }
  }, [])

  return { error, isStreaming, isCapturing, recoverCamera }
}
```

### 8.4 Prevent duplicate students
- Убрать автоматическое создание учеников при ошибках
- Добавить явную проверку перед созданием нового ученика
- Логировать все операции с учениками

## Приоритет
🟡 ВЫСОКИЙ - влияет на core UX камеры

## Ожидаемый результат
- Стабильная работа камеры после ошибок
- Отсутствие дубликатов учеников
- Визуальная обратная связь при фотографировании
- Возможность делать множественные фото без проблем