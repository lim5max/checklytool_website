'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, Camera, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface QuestionImageUploadProps {
	imageUrl?: string
	onImageChange: (url: string | undefined) => void
	questionId: string
	className?: string
}

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

async function uploadToSupabase(file: File, questionId: string): Promise<string> {
	const supabase = createClient()

	// Генерируем уникальное имя файла
	const fileExt = file.name.split('.').pop()
	const fileName = `question_${questionId}_${Date.now()}.${fileExt}`
	const filePath = `test-questions/${fileName}`

	// Загружаем файл в Supabase Storage
	const { error } = await supabase.storage
		.from('submissions')
		.upload(filePath, file, {
			cacheControl: '3600',
			upsert: false
		})

	if (error) {
		throw new Error(`Ошибка загрузки: ${error.message}`)
	}

	// Получаем публичный URL
	const { data: { publicUrl } } = supabase.storage
		.from('submissions')
		.getPublicUrl(filePath)

	return publicUrl
}

export function QuestionImageUpload({
	imageUrl,
	onImageChange,
	questionId,
	className = ''
}: QuestionImageUploadProps) {
	const [isUploading, setIsUploading] = useState(false)
	const [uploadError, setUploadError] = useState<string>()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const cameraInputRef = useRef<HTMLInputElement>(null)

	const handleFileSelect = useCallback(async (file: File) => {
		// Валидация типа файла
		if (!file.type.startsWith('image/')) {
			toast.error('Можно загружать только изображения')
			return
		}

		// Валидация размера
		if (file.size > MAX_SIZE) {
			toast.error(`Размер файла не должен превышать ${MAX_SIZE / 1024 / 1024} МБ`)
			return
		}

		setIsUploading(true)
		setUploadError(undefined)

		try {
			const url = await uploadToSupabase(file, questionId)
			onImageChange(url)
			toast.success('Изображение загружено!')
		} catch (error) {
			console.error('Upload error:', error)
			const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки изображения'
			setUploadError(errorMessage)
			toast.error(errorMessage)
		} finally {
			setIsUploading(false)
		}
	}, [questionId, onImageChange])

	const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file) {
			handleFileSelect(file)
		}
		// Очищаем input
		event.target.value = ''
	}

	const handleRemove = useCallback(async () => {
		if (!imageUrl) return

		// Удаляем из Supabase Storage (опционально)
		try {
			const supabase = createClient()
			const filePath = imageUrl.split('/').slice(-2).join('/')
			await supabase.storage.from('submissions').remove([filePath])
		} catch (error) {
			console.error('Error removing file:', error)
		}

		onImageChange(undefined)
		setUploadError(undefined)
		toast.success('Изображение удалено')
	}, [imageUrl, onImageChange])

	const openFileDialog = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click()
		}
	}

	const openCamera = () => {
		if (cameraInputRef.current) {
			cameraInputRef.current.click()
		}
	}

	// Если изображение уже загружено
	if (imageUrl && !isUploading) {
		return (
			<Card className={`p-4 ${className}`}>
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<label className="text-sm font-semibold text-slate-700">
							Изображение к вопросу
						</label>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleRemove}
							className="text-red-600 hover:text-red-700 hover:bg-red-50"
						>
							<X className="w-4 h-4 mr-1" />
							Удалить
						</Button>
					</div>

					<div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-slate-200">
						<Image
							src={imageUrl}
							alt="Изображение к вопросу"
							fill
							className="object-contain bg-slate-50"
						/>
					</div>

					{uploadError && (
						<div className="flex items-center gap-2 text-sm text-red-600">
							<AlertCircle className="w-4 h-4" />
							<span>{uploadError}</span>
						</div>
					)}
				</div>
			</Card>
		)
	}

	// Зона загрузки
	return (
		<Card className={`p-4 ${className}`}>
			<div className="space-y-3">
				<label className="text-sm font-semibold text-slate-700">
					Изображение к вопросу (необязательно)
				</label>

				<div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
					{isUploading ? (
						<div className="space-y-3">
							<Loader2 className="w-8 h-8 mx-auto text-blue-500 animate-spin" />
							<p className="text-sm text-slate-600">Загрузка изображения...</p>
						</div>
					) : (
						<div className="space-y-3">
							<ImageIcon className="w-8 h-8 mx-auto text-slate-400" />
							<p className="text-sm text-slate-600">
								Добавьте изображение к вопросу
							</p>
							<div className="flex flex-col sm:flex-row gap-2 justify-center">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={openFileDialog}
								>
									<Upload className="w-4 h-4 mr-2" />
									Выбрать файл
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={openCamera}
								>
									<Camera className="w-4 h-4 mr-2" />
									Сделать фото
								</Button>
							</div>
							<p className="text-xs text-slate-500">
								Максимум {MAX_SIZE / 1024 / 1024} МБ, JPEG/PNG/WebP
							</p>
						</div>
					)}
				</div>

				{uploadError && (
					<div className="flex items-center gap-2 text-sm text-red-600">
						<AlertCircle className="w-4 h-4" />
						<span>{uploadError}</span>
					</div>
				)}
			</div>

			{/* Скрытые input элементы */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/jpeg,image/png,image/webp,image/heic"
				onChange={handleFileInput}
				className="hidden"
			/>
			<input
				ref={cameraInputRef}
				type="file"
				accept="image/*"
				capture="environment"
				onChange={handleFileInput}
				className="hidden"
			/>
		</Card>
	)
}
