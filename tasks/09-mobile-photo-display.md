# Задача 9: Исправить отображение фотографий на мобильных устройствах

## Описание проблемы
При просмотре фотографий на мобильных устройствах в режиме review:
- Фотографии "уезжают вниз" из-за неправильной высоты viewport
- Нижние переключатели (миниатюры) не видны
- Фотография должна занимать всю возможную высоту, но при этом должны быть видны миниатюры и нижняя панель

## Анализ кода
В `components/camera/CameraWorkInterface.tsx:487-635` режим review:

```tsx
<div className="fixed inset-0 bg-black z-50 flex flex-col min-h-screen overflow-y-auto" style={{ minHeight: '100dvh', height: '100dvh' }}>

  {/* Photo display */}
  <div className="px-4 pt-4">
    {currentPhoto && (
      <div
        className="mx-auto mb-4 bg-white rounded-[42px] overflow-hidden ring-1 ring-white/10 max-h-[calc(100vh-260px)]"
        style={{ width: 'min(92vw, 560px)', aspectRatio: '2 / 3' }}
      >
```

## Проблемы
1. **Высота расчет**: `max-h-[calc(100vh-260px)]` может быть некорректен на мобильных
2. **Viewport units**: `100vh` vs `100dvh` проблемы на мобильных браузерах
3. **Safe areas**: Не учтены безопасные зоны iPhone
4. **Соотношение**: Фиксированное `aspectRatio: '2 / 3'` может не подходить всем фото

## Файлы для изменения
- `components/camera/CameraWorkInterface.tsx` (строки 487-635)

## План исправления

### 9.1 Исправить layout
```tsx
// Review mode container
<div
  className="fixed inset-0 bg-black z-50 flex flex-col"
  style={{
    height: '100dvh',
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)'
  }}
>
  {/* Header - фиксированная высота */}
  <div className="flex items-center justify-between gap-3 p-4 flex-shrink-0">
    {/* ... header content */}
  </div>

  {/* Photo area - занимает оставшееся место */}
  <div className="flex-1 flex flex-col px-4 min-h-0">
    {/* Photo container */}
    <div className="flex-1 flex items-center justify-center min-h-0 mb-4">
      {currentPhoto && (
        <div
          className="bg-white rounded-[42px] overflow-hidden ring-1 ring-white/10 max-w-full max-h-full"
          style={{
            width: 'min(92vw, 560px)',
            height: 'auto',
            maxHeight: '100%',
            aspectRatio: 'auto' // Let image determine ratio
          }}
        >
          <Image
            src={currentPhoto.dataUrl}
            alt="Фотография работы"
            width={560}
            height={840}
            className="w-full h-full object-contain"
            style={{ maxHeight: '100%' }}
          />
        </div>
      )}
    </div>

    {/* Thumbnails - фиксированная высота */}
    {activeStudent.photos.length > 0 && (
      <div className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-center gap-2">
          {/* ... thumbnails */}
        </div>
      </div>
    )}
  </div>

  {/* Bottom controls - фиксированная высота */}
  <div className="flex-shrink-0 px-7 py-6">
    {/* ... controls */}
  </div>
</div>
```

### 9.2 Улучшить responsive логику
```tsx
const useViewportHeight = () => {
  const [height, setHeight] = useState('100vh')

  useEffect(() => {
    const updateHeight = () => {
      // Используем dvh если доступно, иначе vh
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
      setHeight('calc(var(--vh, 1vh) * 100)')
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  return height
}
```

### 9.3 Уменьшить отступы
```tsx
// Уменьшить отступ между переименованием и фото
<div className="flex items-center justify-between gap-3 p-4 py-2">
  {/* header content */}
</div>

// Добавить py-4 сверху для инпута
<div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
```

### 9.4 Адаптивные размеры для разных экранов
```tsx
// Разные размеры для разных экранов
const getPhotoContainerStyle = () => {
  return {
    width: 'min(95vw, 560px)', // Больше ширина на мобильных
    maxHeight: 'calc(100% - 2rem)', // Учесть отступы
    aspectRatio: 'auto' // Пусть изображение определяет соотношение
  }
}
```

## Приоритет
🟡 ВЫСОКИЙ - критично для мобильного просмотра

## Ожидаемый результат
- Фотографии корректно отображаются на всех мобильных устройствах
- Видны все элементы UI (миниатюры, кнопки)
- Нет обрезания контента
- Правильное использование доступного пространства экрана