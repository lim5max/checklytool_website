import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { TestQuestion } from '@/types/check'

// Схема валидации для сохранения теста
const SaveTestSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1, 'Название теста обязательно'),
	description: z.string().optional(),
	subject: z.string().optional(),
	questions: z.array(z.object({
		id: z.string(),
		question: z.string().min(1, 'Вопрос не может быть пустым'),
		type: z.enum(['single', 'multiple', 'open']),
		options: z.array(z.object({
			id: z.string(),
			text: z.string(),
			isCorrect: z.boolean()
		})),
		explanation: z.string().optional(),
		hideOptionsInPDF: z.boolean().optional(),
		points: z.number().optional(),
		correctAnswer: z.string().optional(),
	}).refine((q) => {
		// Для открытых вопросов варианты необязательны
		if (q.type === 'open') return true
		// Для закрытых вопросов должен быть хотя бы 1 вариант с текстом
		return q.options.length > 0 && q.options.some(opt => opt.text.trim().length > 0)
	}, {
		message: 'Для вопросов с выбором ответа должен быть минимум 1 заполненный вариант'
	})).min(1, 'Должен быть минимум 1 вопрос')
})

export async function POST(req: Request) {
	const session = await auth()

	if (!session?.user?.email) {
		return NextResponse.json(
			{ error: 'Unauthorized' },
			{ status: 401 }
		)
	}
	try {
		console.log('API: Starting to save test')

		// Валидируем данные
		const body = await req.json()

		// ОТЛАДКА: логируем первый открытый вопрос ДО валидации
		const openQuestionBefore = body.questions?.find((q: TestQuestion) => q.type === 'open')
		if (openQuestionBefore) {
			console.log('API: Открытый вопрос ДО валидации:', JSON.stringify(openQuestionBefore, null, 2))
		}

		const validatedData = SaveTestSchema.parse(body)

		// ОТЛАДКА: логируем первый открытый вопрос ПОСЛЕ валидации
		const openQuestionAfter = validatedData.questions?.find((q: TestQuestion) => q.type === 'open')
		if (openQuestionAfter) {
			console.log('API: Открытый вопрос ПОСЛЕ валидации:', JSON.stringify(openQuestionAfter, null, 2))
		}

		const supabase = await createClient()
		console.log('API: Supabase client created')

		const testId = validatedData.id || `test_${Date.now()}`

		try {
			// Проверяем, существует ли уже тест с таким ID
			const { data: existingTest } = await supabase
				.from('generated_tests')
				.select('id')
				.eq('id', testId)
				.eq('user_id', session.user.email)
				.single()

			let savedTest
			if (existingTest) {
				// Обновляем существующий тест
				const { data, error: updateError } = await supabase
					.from('generated_tests')
					.update({
						title: validatedData.title,
						description: validatedData.description || '',
						subject: validatedData.subject || '',
						questions: validatedData.questions,
						updated_at: new Date().toISOString()
					})
					.eq('id', testId)
					.eq('user_id', session.user.email)
					.select()
					.single()

				if (updateError) {
					console.log('API: Error updating test:', updateError)
					return NextResponse.json(
						{ error: 'Failed to update test' },
						{ status: 500 }
					)
				}
				savedTest = data
			} else {
				// Создаем новый тест
				const { data, error: insertError } = await supabase
					.from('generated_tests')
					.insert({
						id: testId,
						title: validatedData.title,
						description: validatedData.description || '',
						subject: validatedData.subject || '',
						questions: validatedData.questions,
						user_id: session.user.email
					})
					.select()
					.single()

				if (insertError) {
					console.log('API: Error creating test:', insertError)
					return NextResponse.json(
						{ error: 'Failed to create test' },
						{ status: 500 }
					)
				}
				savedTest = data
			}

			console.log('API: Test saved successfully:', savedTest)
			return NextResponse.json({
				success: true,
				test: {
					id: savedTest.id,
					title: savedTest.title,
					description: savedTest.description,
					subject: savedTest.subject,
					questions: savedTest.questions,
					questionsCount: Array.isArray(savedTest.questions) ? savedTest.questions.length : 0
				}
			})

		} catch (queryError) {
			console.log('API: Query failed:', queryError)
			return NextResponse.json(
				{ error: 'Database query failed' },
				{ status: 500 }
			)
		}

	} catch (error) {
		console.error('API Error:', error)

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					success: false,
					error: 'Ошибка валидации данных',
					details: error.issues
				},
				{ status: 400 }
			)
		}

		return NextResponse.json(
			{ success: false, error: 'Внутренняя ошибка сервера' },
			{ status: 500 }
		)
	}
}