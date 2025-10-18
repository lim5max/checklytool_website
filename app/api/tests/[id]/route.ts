import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

interface Question {
	type: string
	correctAnswer?: string
	[key: string]: unknown
}

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const session = await auth()

	if (!session?.user?.email) {
		return NextResponse.json(
			{ error: 'Unauthorized' },
			{ status: 401 }
		)
	}

	try {
		const { id } = await context.params

		const supabase = await createClient()

		const { data: test, error: testError } = await supabase
			.from('generated_tests')
			.select('*')
			.eq('id', id)
			.eq('user_id', session.user.email)
			.single()

		if (testError || !test) {
			return NextResponse.json(
				{ error: 'Test not found' },
				{ status: 404 }
			)
		}

		// Исправляем старые тесты - добавляем correctAnswer для открытых вопросов
		const questions = (test.questions || []) as Question[]
		const fixedQuestions = questions.map((q: Question) => {
			if (q.type === 'open' && !q.hasOwnProperty('correctAnswer')) {
				return { ...q, correctAnswer: '' }
			}
			return q
		})

		return NextResponse.json({
			test: {
				id: test.id,
				title: test.title,
				description: test.description || '',
				subject: test.subject || '',
				questions: fixedQuestions
			}
		})

	} catch (error) {
		console.error('API Error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
