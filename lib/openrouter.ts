import { OpenRouterRequest, OpenRouterResponse, AIAnalysisResponse } from '@/types/check'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'

if (!OPENROUTER_API_KEY) {
	throw new Error('OPENROUTER_API_KEY is required')
}

// Main function to analyze student work using AI
export async function analyzeStudentWork(
	submissionImages: string[],
	referenceAnswers: Record<string, string> | null,
	referenceImages: string[] | null,
	variantCount: number
): Promise<AIAnalysisResponse> {
	
	// Prepare the prompt for the AI
	const systemPrompt = `Ты - опытный преподаватель, который проверяет школьные контрольные работы. 
Твоя задача - проанализировать отсканированные изображения работы ученика и определить:

1. ВАРИАНТ РАБОТЫ (если их несколько): Определи номер варианта (1-${variantCount}) по содержанию или заголовку
2. ОТВЕТЫ УЧЕНИКА: Извлеки все ответы ученика из изображений
3. ПРАВИЛЬНОСТЬ: Сравни с эталонными ответами (если предоставлены)
4. ФИО УЧЕНИКА: Если видно на работе, извлеки имя и фамилию

ВАЖНЫЕ ПРАВИЛА:
- Внимательно изучи ВСЕ изображения работы
- Если текст плохо читается, укажи это в уверенности (confidence)
- Нумеруй ответы по порядку (1, 2, 3, ...)
- Для математики: принимай эквивалентные формы записи (0.5 = 1/2)
- Для текстовых ответов: учитывай орфографические ошибки как правильные, если смысл понятен

ФОРМАТ ОТВЕТА: Верни JSON в точно таком формате:
{
  "variant_detected": 1,
  "confidence_score": 0.95,
  "student_name": "Иванов Иван" или null,
  "total_questions": 10,
  "answers": {
    "1": {"detected_answer": "42", "confidence": 0.9},
    "2": {"detected_answer": "x=5", "confidence": 0.85},
    ...
  },
  "additional_notes": "Работа выполнена аккуратно, почерк читаемый"
}`

	const userPrompt = `Проанализируй работу ученика на изображениях.

${referenceAnswers ? `ЭТАЛОННЫЕ ОТВЕТЫ:\n${JSON.stringify(referenceAnswers, null, 2)}\n` : ''}

Количество вариантов: ${variantCount}

Проанализируй ВСЕ изображения и верни результат в JSON формате.`

	// Prepare messages for OpenRouter
	const messages: OpenRouterRequest['messages'] = [
		{
			role: 'system',
			content: systemPrompt
		},
		{
			role: 'user',
			content: [
				{
					type: 'text',
					text: userPrompt
				},
				...submissionImages.map(imageUrl => ({
					type: 'image_url' as const,
					image_url: { url: imageUrl }
				}))
			]
		}
	]

	// Add reference images if available
	if (referenceImages && referenceImages.length > 0) {
		messages.push({
			role: 'user',
			content: [
				{
					type: 'text',
					text: 'ЭТАЛОННЫЕ ИЗОБРАЖЕНИЯ ДЛЯ СРАВНЕНИЯ:'
				},
				...referenceImages.map(imageUrl => ({
					type: 'image_url' as const,
					image_url: { url: imageUrl }
				}))
			]
		})
	}

	const requestBody: OpenRouterRequest = {
		model: 'google/gemini-flash-1.5',
		messages,
		max_tokens: 2000,
		temperature: 0.1 // Low temperature for consistent analysis
	}

	try {
		const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
				'Content-Type': 'application/json',
				'HTTP-Referer': 'https://checklytool.com', // Optional: your app URL
				'X-Title': 'ChecklyTool' // Optional: your app name
			},
			body: JSON.stringify(requestBody)
		})

		if (!response.ok) {
			const errorText = await response.text()
			console.error('OpenRouter API error:', response.status, errorText)
			throw new Error(`OpenRouter API error: ${response.status} ${errorText}`)
		}

		const data: OpenRouterResponse = await response.json()
		
		if (!data.choices?.[0]?.message?.content) {
			throw new Error('Invalid response from OpenRouter API')
		}

		// Parse the AI response
		const aiResponseText = data.choices[0].message.content
		let parsedResponse: AIAnalysisResponse

		try {
			// Try to extract JSON from the response (AI might add extra text)
			const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/)
			if (jsonMatch) {
				parsedResponse = JSON.parse(jsonMatch[0])
			} else {
				throw new Error('No JSON found in AI response')
			}
		} catch {
			console.error('Failed to parse AI response:', aiResponseText)
			throw new Error('Failed to parse AI analysis result')
		}

		// Validate the response structure
		if (!parsedResponse.answers || !parsedResponse.total_questions) {
			throw new Error('Invalid AI response structure')
		}

		return parsedResponse

	} catch (error) {
		console.error('Error calling OpenRouter API:', error)
		throw error
	}
}

// Retry mechanism for failed API calls
export async function analyzeWithRetry(
	submissionImages: string[],
	referenceAnswers: Record<string, string> | null,
	referenceImages: string[] | null,
	variantCount: number,
	maxRetries: number = 3
): Promise<AIAnalysisResponse> {
	let lastError: Error
	
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			console.log(`AI Analysis attempt ${attempt}/${maxRetries}`)
			return await analyzeStudentWork(submissionImages, referenceAnswers, referenceImages, variantCount)
		} catch (error) {
			lastError = error as Error
			console.error(`Analysis attempt ${attempt} failed:`, error)
			
			if (attempt < maxRetries) {
				// Wait before retrying (exponential backoff)
				const delay = Math.pow(2, attempt - 1) * 1000 // 1s, 2s, 4s
				await new Promise(resolve => setTimeout(resolve, delay))
			}
		}
	}
	
	throw lastError!
}

// Calculate final grade based on percentage and grading criteria
export function calculateGrade(
	correctAnswers: number,
	totalQuestions: number,
	gradingCriteria: Array<{ grade: number; min_percentage: number }>
): { grade: number; percentage: number } {
	const percentage = (correctAnswers / totalQuestions) * 100
	
	// Sort criteria by grade descending (5, 4, 3, 2)
	const sortedCriteria = [...gradingCriteria].sort((a, b) => b.grade - a.grade)
	
	// Find the highest grade the student qualifies for
	for (const criterion of sortedCriteria) {
		if (percentage >= criterion.min_percentage) {
			return {
				grade: criterion.grade,
				percentage: Math.round(percentage * 100) / 100
			}
		}
	}
	
	// If no criteria match, return the lowest grade
	const lowestGrade = sortedCriteria[sortedCriteria.length - 1]?.grade || 2
	return {
		grade: lowestGrade,
		percentage: Math.round(percentage * 100) / 100
	}
}