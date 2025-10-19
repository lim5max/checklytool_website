# Руководство по добавлению изображений в блог

## Общие требования к изображениям

- **Формат**: PNG или JPEG
- **Размер**: Квадратные изображения (рекомендуется 1200x1200px)
- **Оптимизация**: Используйте сжатие для уменьшения размера файла без потери качества

## Места для добавления изображений

### 1. Главная страница блога (`/app/blog/page.tsx`)

**Местоположение**: Карточка статьи, строка 37-42

```tsx
<div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center">
	{/* TODO: Добавить изображение статьи */}
	<p className="text-slate-400 text-sm text-center px-4">
		Изображение будет добавлено позже
	</p>
</div>
```

**Как добавить**:
```tsx
<div className="aspect-square rounded-2xl overflow-hidden">
	<Image
		src="/images/blog/qwen-image-cover.png"
		alt="Qwen-Image для учителей"
		width={400}
		height={400}
		className="w-full h-full object-cover"
	/>
</div>
```

---

### 2. Страница статьи (`/app/blog/qwen-image-for-teachers/page.tsx`)

#### 2.1 Главное изображение статьи (строка 58)

```tsx
<div className="w-full aspect-square bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center">
	<p className="text-slate-400 text-sm text-center px-4">
		Главное изображение статьи будет добавлено позже
		<br />
		<span className="text-xs">Рекомендуемый размер: квадратное изображение (например, 1200x1200px)</span>
	</p>
</div>
```

**Как добавить**:
```tsx
<div className="w-full aspect-square rounded-2xl overflow-hidden">
	<Image
		src="/images/blog/qwen-image-hero.png"
		alt="Qwen-Image создание учебных материалов"
		width={1200}
		height={1200}
		className="w-full h-full object-cover"
		priority
	/>
</div>
```

#### 2.2 Пример: История - Королевский двор

**Как добавить**:
```tsx
<div className="rounded-xl aspect-square overflow-hidden mb-4">
	<Image
		src="/images/blog/examples/renaissance-court.png"
		alt="Пример: Королевский двор эпохи Возрождения"
		width={800}
		height={800}
		className="w-full h-full object-cover"
	/>
</div>
```

#### 2.3 Пример: Химия - Лабораторная посуда

**Как добавить**:
```tsx
<div className="rounded-xl aspect-square overflow-hidden mb-4">
	<Image
		src="/images/blog/examples/chemistry-lab.png"
		alt="Пример: Лабораторная посуда и химическая реакция"
		width={800}
		height={800}
		className="w-full h-full object-cover"
	/>
</div>
```

#### 2.4 Пример: Математика - Теорема Пифагора

**Как добавить**:
```tsx
<div className="rounded-xl aspect-square overflow-hidden mb-4">
	<Image
		src="/images/blog/examples/pythagorean-theorem.png"
		alt="Пример: Теорема Пифагора"
		width={800}
		height={800}
		className="w-full h-full object-cover"
	/>
</div>
```

#### 2.5 Пример: Геометрия - 3D фигуры

**Как добавить**:
```tsx
<div className="rounded-xl aspect-square overflow-hidden mb-4">
	<Image
		src="/images/blog/examples/3d-shapes.png"
		alt="Пример: 3D геометрические фигуры"
		width={800}
		height={800}
		className="w-full h-full object-cover"
	/>
</div>
```

#### 2.6 Пример: Биология - Лесные животные

**Как добавить**:
```tsx
<div className="rounded-xl aspect-square overflow-hidden mb-4">
	<Image
		src="/images/blog/examples/forest-animals.png"
		alt="Пример: Лесные животные и насекомые"
		width={800}
		height={800}
		className="w-full h-full object-cover"
	/>
</div>
```

---

## Структура папок для изображений

Создайте следующую структуру в папке `public/images/`:

```
public/
└── images/
    └── blog/
        ├── qwen-image-cover.png          # Изображение для карточки на главной странице блога
        ├── qwen-image-hero.png           # Главное изображение статьи
        └── examples/
            ├── renaissance-court.png     # Пример: История - Королевский двор
            ├── chemistry-lab.png         # Пример: Химия - Лабораторная посуда
            ├── pythagorean-theorem.png   # Пример: Математика - Теорема Пифагора
            ├── 3d-shapes.png             # Пример: Геометрия - 3D фигуры
            └── forest-animals.png        # Пример: Биология - Лесные животные
```

---

## Генерация изображений с помощью Qwen-Image

### Для главного изображения статьи:

**Промпт**:
```
Create an educational illustration showing a teacher using AI to generate teaching materials on a computer, with various educational diagrams (math formulas, cell structure, historical timeline) floating around, modern digital art style, bright and inspiring atmosphere, suitable for blog header
```

### Для примеров в статье:

Используйте промпты, которые уже указаны в самой статье для каждого примера.

---

## Оптимизация изображений

После генерации изображений рекомендуется оптимизировать их:

1. **Онлайн инструменты**:
   - TinyPNG (https://tinypng.com/)
   - Squoosh (https://squoosh.app/)

2. **CLI инструменты**:
   ```bash
   # С помощью ImageMagick
   convert input.png -quality 85 -resize 1200x1200 output.png

   # С помощью sharp (Node.js)
   npx sharp-cli resize 1200 1200 --input input.png --output output.png
   ```

---

## Проверка после добавления

После добавления всех изображений:

1. ✅ Проверьте, что все изображения загружаются без ошибок
2. ✅ Проверьте отзывчивость на мобильных устройствах
3. ✅ Убедитесь, что alt-тексты описательные и полезные
4. ✅ Проверьте размер файлов (желательно < 200KB для каждого изображения)

---

## Дополнительные рекомендации

- Используйте компонент `Image` из Next.js для автоматической оптимизации
- Добавляйте `loading="lazy"` для изображений ниже первого экрана
- Используйте `priority` только для главного изображения статьи
- Всегда указывайте `width` и `height` для предотвращения скачков макета (CLS)
