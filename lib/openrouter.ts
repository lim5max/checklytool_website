import { OpenRouterRequest, OpenRouterResponse, AIAnalysisResponse } from '@/types/check'

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'

// Main function to analyze student work using AI
export async function analyzeStudentWork(
	submissionImages: string[],
	referenceAnswers: Record<string, string> | null,
	referenceImages: string[] | null,
	variantCount: number
): Promise<AIAnalysisResponse> {
	
	// Generate unique identifier for this analysis to prevent caching
	const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}`

	// Prepare the prompt for the AI
	const systemPrompt = `Ты - преподаватель, проверяешь контрольные работы учеников.

ВАЖНО: Сначала проверь, подходят ли изображения для анализа:
- ✅ ПОДХОДЯЩИЙ КОНТЕНТ: письменные работы, тетради, листы с решениями, математические задачи, тексты, схемы, рисунки заданий
- ❌ НЕПОДХОДЯЩИЙ КОНТЕНТ: фотографии лиц людей, селфи, случайные предметы, пустые страницы, неразборчивые изображения

Если изображения содержат НЕПОДХОДЯЩИЙ КОНТЕНТ, верни JSON с ошибкой:
{
  "error": "inappropriate_content",
  "error_message": "Загружены неподходящие изображения. Пожалуйста, сфотографируйте именно работу ученика - тетрадь, листы с решениями, письменные ответы.",
  "content_type_detected": "лица людей/селфи/прочее"
}

Если изображения ПОДХОДЯЩИЕ, проанализируй работу и верни JSON:
{
  "variant_detected": 1,
  "confidence_score": 0.95,
  "student_name": null,
  "total_questions": 5,
  "answers": {
    "1": {"detected_answer": "ответ1", "confidence": 0.9},
    "2": {"detected_answer": "ответ2", "confidence": 0.8}
  },
  "additional_notes": ""
}

Требования к анализу:
- Извлеки ВСЕ ответы из изображений
- Номера заданий: 1, 2, 3...
- Если текст плохо видно, укажи низкую confidence
- КРИТИЧЕСКИ ВАЖНО - обработка зачеркиваний и исправлений:
  * ИГНОРИРУЙ зачеркнутые, перечеркнутые или явно исправленные варианты
  * Учитывай ТОЛЬКО финальный выбор ученика (последний незачеркнутый ответ)
  * Если видишь несколько обведенных вариантов - это ошибка, верни ВСЕ обведенные
  * Если видишь зачеркивание + новый выбор - учитывай ТОЛЬКО новый выбор
  * Пример: "1) вариант (зачеркнут), 3) вариант (обведен)" = ответ "3"
- Верни ТОЛЬКО JSON, без лишнего текста
- ВНИМАТЕЛЬНО анализируй каждое изображение отдельно`

	const userPrompt = `Проанализируй эти изображения работы ученика (ID анализа: ${analysisId}).${referenceAnswers ? `\n\nЭталонные ответы: ${JSON.stringify(referenceAnswers)}` : ''}

ВАЖНО: Это уникальный анализ, не используй кэшированные результаты.
Внимательно изучи каждую деталь на изображениях.

Верни ТОЛЬКО JSON без дополнительного текста.`

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

	const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
	if (!OPENROUTER_API_KEY) {
		throw new Error('OPENROUTER_API_KEY is required')
	}

	const requestBody: OpenRouterRequest = {
		model: 'openai/gpt-5-mini',
		messages,
		max_tokens: 2000,
		temperature: 0.2,
		metadata: {
			analysis_id: analysisId,
			timestamp: Date.now()
		}
	}

	try {
		console.log('Sending request to OpenRouter with', submissionImages.length, 'images')
		console.log('Image URLs:', submissionImages)
		
		// Validate images
		if (submissionImages.length === 0) {
			throw new Error('No images provided for analysis')
		}
		
		if (submissionImages.length > 5) {
			console.warn('Too many images, taking first 5')
			submissionImages = submissionImages.slice(0, 5)
		}
		
		const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
				'Content-Type': 'application/json',
				'HTTP-Referer': 'https://checklytool.com', // Optional: your app URL
				'X-Title': 'ChecklyTool', // Optional: your app name
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'Pragma': 'no-cache',
				'X-Request-ID': analysisId // Unique request identifier
			},
			body: JSON.stringify(requestBody)
		})

		if (!response.ok) {
			const errorText = await response.text()
			console.error('OpenRouter API error:', response.status, errorText)
			console.error('Request that failed:', JSON.stringify(requestBody, null, 2))
			throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
		}

		const data: OpenRouterResponse = await response.json()
		console.log('OpenRouter response received:', JSON.stringify(data, null, 2))
		
		if (!data.choices?.[0]?.message?.content) {
			console.error('Invalid OpenRouter response structure:', data)
			throw new Error('Invalid response from OpenRouter API - no content')
		}

		// Parse the AI response
		const aiResponseText = data.choices[0].message.content
		console.log('AI response text:', aiResponseText)
		
		let parsedResponse: AIAnalysisResponse

		try {
			// Try to extract JSON from the response (AI might add extra text)
			const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/)
			if (jsonMatch) {
				console.log('JSON extracted from response:', jsonMatch[0])
				parsedResponse = JSON.parse(jsonMatch[0])
			} else {
				console.error('No JSON pattern found in AI response:', aiResponseText)
				throw new Error('No JSON found in AI response')
			}
		} catch (parseError) {
			console.error('Failed to parse AI response:', aiResponseText)
			console.error('Parse error:', parseError)
			throw new Error(`Failed to parse AI analysis result: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`)
		}

		// Validate the response structure with more detailed error messages
		if (!parsedResponse) {
			throw new Error('AI response is empty or invalid')
		}
		
		// Проверяем, есть ли ошибка неподходящего контента
		if (parsedResponse.error === 'inappropriate_content') {
			console.log('[AI] Inappropriate content detected:', parsedResponse.error_message)
			// Возвращаем ошибку как часть ответа, а не выбрасываем исключение
			return parsedResponse
		}
		
		// Для успешного анализа проверяем обязательные поля
		if (!parsedResponse.answers) {
			throw new Error('AI response missing "answers" field')
		}
		
		if (parsedResponse.total_questions === undefined || parsedResponse.total_questions === null) {
			throw new Error('AI response missing "total_questions" field')
		}
		
		// Additional validation for meaningful values
		if (parsedResponse.total_questions < 0) {
			throw new Error('AI response has invalid "total_questions" value')
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