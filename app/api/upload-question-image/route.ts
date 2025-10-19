import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'

export async function POST(request: NextRequest) {
	try {
		// Получаем аутентифицированный Supabase клиент
		const { supabase, userId } = await getAuthenticatedSupabase()

		console.log('[UPLOAD-QUESTION-IMAGE] User authenticated:', userId)

		// Получаем данные из FormData
		const formData = await request.formData()
		const file = formData.get('file') as File
		const questionId = formData.get('questionId') as string

		if (!file || !questionId) {
			return NextResponse.json(
				{ error: 'Файл и ID вопроса обязательны' },
				{ status: 400 }
			)
		}

		// Валидация типа файла
		if (!file.type.startsWith('image/')) {
			return NextResponse.json(
				{ error: 'Можно загружать только изображения' },
				{ status: 400 }
			)
		}

		// Валидация размера (5MB)
		const MAX_SIZE = 5 * 1024 * 1024
		if (file.size > MAX_SIZE) {
			return NextResponse.json(
				{ error: 'Размер файла не должен превышать 5 МБ' },
				{ status: 400 }
			)
		}

		// Генерируем уникальное имя файла
		const fileExt = file.name.split('.').pop()
		const fileName = `question_${questionId}_${Date.now()}.${fileExt}`
		const filePath = `test-questions/${fileName}`

		// Конвертируем File в ArrayBuffer
		const arrayBuffer = await file.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		// Загружаем файл в Supabase Storage
		const { error: uploadError } = await supabase.storage
			.from('submissions')
			.upload(filePath, buffer, {
				contentType: file.type,
				cacheControl: '3600',
				upsert: false
			})

		if (uploadError) {
			console.error('Upload error:', uploadError)
			return NextResponse.json(
				{ error: `Ошибка загрузки: ${uploadError.message}` },
				{ status: 500 }
			)
		}

		// Получаем публичный URL (бакет должен быть public для корректного отображения)
		const { data: { publicUrl } } = supabase.storage
			.from('submissions')
			.getPublicUrl(filePath)

		console.log('[UPLOAD-QUESTION-IMAGE] Upload successful:', publicUrl)

		return NextResponse.json({ url: publicUrl })

	} catch (error) {
		console.error('Error in upload-question-image:', error)
		return NextResponse.json(
			{ error: 'Ошибка при загрузке изображения' },
			{ status: 500 }
		)
	}
}
