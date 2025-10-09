'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'

interface ImageGalleryProps {
	images: string[]
	alt?: string
}

export function ImageGallery({ images, alt = 'Изображение работы' }: ImageGalleryProps) {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
	const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())

	const handleImageError = (index: number) => {
		setImageErrors(prev => new Set(prev).add(index))
	}

	const openLightbox = (index: number) => {
		setSelectedIndex(index)
		// Блокируем скролл body когда лайтбокс открыт
		document.body.style.overflow = 'hidden'
	}

	const closeLightbox = () => {
		setSelectedIndex(null)
		// Восстанавливаем скролл
		document.body.style.overflow = 'unset'
	}

	const goToPrevious = () => {
		if (selectedIndex !== null && selectedIndex > 0) {
			setSelectedIndex(selectedIndex - 1)
		}
	}

	const goToNext = () => {
		if (selectedIndex !== null && selectedIndex < images.length - 1) {
			setSelectedIndex(selectedIndex + 1)
		}
	}

	// Обработка клавиш
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape') closeLightbox()
		if (e.key === 'ArrowLeft') goToPrevious()
		if (e.key === 'ArrowRight') goToNext()
	}

	return (
		<>
			{/* Галерея в сетке */}
			<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
				{images.map((image, index) => (
					<button
						key={index}
						onClick={() => !imageErrors.has(index) && openLightbox(index)}
						className="relative aspect-[3/4] rounded-2xl overflow-hidden group cursor-pointer bg-slate-100"
					>
						{imageErrors.has(index) ? (
							<div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4">
								<AlertCircle className="w-12 h-12 mb-2" />
								<p className="text-sm text-center">Не удалось загрузить изображение</p>
							</div>
						) : (
							<>
								<Image
									src={image}
									alt={`${alt} ${index + 1}`}
									fill
									className="object-cover transition-transform duration-300 group-hover:scale-110"
									sizes="(max-width: 768px) 50vw, 33vw"
									onError={() => handleImageError(index)}
								/>
								<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
							</>
						)}
					</button>
				))}
			</div>

			{/* Lightbox */}
			{selectedIndex !== null && (
				<div
					className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
					onKeyDown={handleKeyDown}
					tabIndex={0}
				>
					{/* Кнопка закрытия */}
					<button
						onClick={closeLightbox}
						className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
						aria-label="Закрыть"
					>
						<X className="w-6 h-6 text-white" />
					</button>

					{/* Счётчик изображений */}
					<div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 rounded-full text-white font-medium z-50">
						{selectedIndex + 1} / {images.length}
					</div>

					{/* Кнопка "Предыдущее" */}
					{selectedIndex > 0 && (
						<button
							onClick={goToPrevious}
							className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
							aria-label="Предыдущее изображение"
						>
							<ChevronLeft className="w-6 h-6 text-white" />
						</button>
					)}

					{/* Кнопка "Следующее" */}
					{selectedIndex < images.length - 1 && (
						<button
							onClick={goToNext}
							className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
							aria-label="Следующее изображение"
						>
							<ChevronRight className="w-6 h-6 text-white" />
						</button>
					)}

					{/* Изображение */}
					<div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
						{imageErrors.has(selectedIndex) ? (
							<div className="flex flex-col items-center justify-center text-white">
								<AlertCircle className="w-16 h-16 mb-4" />
								<p className="text-lg">Не удалось загрузить изображение</p>
							</div>
						) : (
							<div className="relative max-w-5xl max-h-full w-full h-full">
								<Image
									src={images[selectedIndex]}
									alt={`${alt} ${selectedIndex + 1}`}
									fill
									className="object-contain"
									sizes="100vw"
									priority
									onError={() => handleImageError(selectedIndex)}
								/>
							</div>
						)}
					</div>

					{/* Подложка для закрытия по клику */}
					<div
						className="absolute inset-0 -z-10"
						onClick={closeLightbox}
					/>
				</div>
			)}
		</>
	)
}
