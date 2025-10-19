import { OpenRouterRequest, OpenRouterResponse, AIAnalysisResponse } from '@/types/check'

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'

// Main function to analyze student work using AI
export async function analyzeStudentWork(
	submissionImages: string[],
	referenceAnswers: Record<string, string> | null,
	referenceImages: string[] | null,
	variantCount: number,
	checkType: 'test' | 'essay' = 'test',
	essayCriteria?: Array<{ grade: number; title: string; description: string; min_errors?: number; max_errors?: number }>
): Promise<AIAnalysisResponse> {

	// Generate unique identifier for this analysis to prevent caching
	const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}`

	// Specialized prompts for each check type
	const systemPrompt = checkType === 'essay' ? `Ты - преподаватель русского языка, проверяешь сочинения учеников.

ВАЖНО: Проверь, подходят ли изображения:
- ✅ ПОДХОДЯЩИЙ КОНТЕНТ: письменные сочинения, рукописный текст, тетради с работами
- ❌ НЕПОДХОДЯЩИЙ КОНТЕНТ: фотографии лиц людей, селфи, случайные предметы, пустые страницы

Если изображения содержат НЕПОДХОДЯЩИЙ КОНТЕНТ, верни JSON с ошибкой:
{
  "error": "inappropriate_content",
  "error_message": "Загружены неподходящие изображения. Пожалуйста, сфотографируйте именно сочинение ученика - рукописный текст, тетрадь с работой.",
  "content_type_detected": "лица людей/селфи/прочее"
}

Если изображения ПОДХОДЯЩИЕ, проанализируй сочинение и верни JSON:
{
  "variant_detected": 1,
  "confidence_score": 0.95,
  "student_name": null,
  "total_questions": 1,
  "essay_analysis": {
    "structure": {"has_introduction": true, "has_body": true, "has_conclusion": true, "score": 0.9},
    "logic": {"coherent": true, "clear_arguments": true, "score": 0.8},
    "errors": {
      "spelling_errors": 2,
      "punctuation_errors": 1,
      "grammar_errors": 0,
      "speech_errors": 0,
      "syntax_errors": 0,
      "total_errors": 3,
      "examples": [
        "орфографическая - несмотря вместо не смотря на стр 1",
        "пунктуационная - отсутствует запятая перед союзом что в предложении о судьбе"
      ]
    },
    "content_quality": "хорошее раскрытие темы примеры уместны",
    "final_grade": 4
  },
  "answers": {
    "1": {"detected_answer": "полный текст сочинения", "confidence": 0.95}
  },
  "additional_notes": "комментарии к работе"
}

КРИТЕРИИ ОЦЕНКИ СОЧИНЕНИЙ:
${essayCriteria?.map(c => `${c.grade} баллов — ${c.description}`).join('\n') ||
'5 баллов — структура соблюдена, логика ясная, ошибок мало или совсем нет (не более двух грамматических ошибок)\n4 балла — структура есть, логика в целом понятна, ошибок немного (от 3 до 6 грамматических и синтаксических)\n3 балла — структура нарушена, логика местами сбивается, ошибок достаточно много (более 6 ошибок)\n2 балла — структура отсутствует, логики почти нет, ошибок очень много, текст трудно читать'}

КРИТИЧЕСКИ ВАЖНО - ТРЕБОВАНИЯ К JSON:
- Верни ТОЛЬКО валидный JSON без лишнего текста
- В строковых значениях НЕ используй двойные кавычки - замени их на одинарные
- В строковых значениях НЕ используй символы скобок () [] {} - замени их на тире или запятые
- Все описания ошибок пиши БЕЗ двойных кавычек и скобок
- Пример: вместо "ошибка: слово "привет"" пиши "ошибка слово привет"
- Пример: вместо "описание (пояснение)" пиши "описание - пояснение"

Требования к анализу:
- Внимательно прочитай весь текст сочинения
- Оцени структуру: есть ли вступление, основная часть, заключение
- Оцени логику изложения и связность текста
- Найди ТОЛЬКО реальные ошибки, классифицируй их по типам:

  ОРФОГРАФИЧЕСКИЕ ошибки - неправильное написание слов:
  * Примеры: "корова" вместо "карова", "несмотря" вместо "не смотря", "в течение" вместо "в течении"

  ПУНКТУАЦИОННЫЕ ошибки - неправильная постановка знаков препинания:
  * Примеры: отсутствие запятой перед союзом, лишняя запятая, отсутствие точки

  ГРАММАТИЧЕСКИЕ ошибки - нарушение грамматических норм:
  * Примеры: неправильное согласование "красивый девочка", неправильное управление "гордиться за успехи"
  * Примеры: неправильная форма слова "ляжь" вместо "ляг", "ехай" вместо "поезжай"

  РЕЧЕВЫЕ ошибки - неправильное употребление слов и выражений:
  * Примеры: плеоназм "главная суть", тавтология "спросить вопрос"

  СИНТАКСИЧЕСКИЕ ошибки - нарушение структуры предложения:
  * Примеры: неправильный порядок слов, нарушение границ предложения

КРИТИЧЕСКИ ВАЖНО - НЕ СЧИТАЙ ОШИБКАМИ:
- Стилистические варианты выражений если они не содержат языковых ошибок
- Разные способы формулировки если они грамматически корректны
- Сокращенные формы если они допустимы в речи
- Примеры: "придерживаюсь мнения" vs "придерживаюсь" - оба варианта корректны

- Выбери подходящую оценку согласно критериям на основе РЕАЛЬНЫХ ошибок` : `Ты - преподаватель, проверяешь тесты ChecklyTool.

КРИТИЧЕСКИ ВАЖНО - МЫ ПРОВЕРЯЕМ ТОЛЬКО ТЕСТЫ CHECKLY TOOL:
Ищи следующие признаки ChecklyTool теста:
- Черный идентификатор в формате "#CT" + 6 символов (например: #CT123ABC) в правом верхнем углу
- Структура: номер вопроса + текст вопроса в одной строке, затем варианты ответов 1), 2), 3)... в столбик
- Поле "Ответ" с прямоугольником под каждым вопросом
- Отсутствие квадратов или кружочков рядом с вариантами ответов

Если изображения содержат НЕПОДХОДЯЩИЙ КОНТЕНТ (селфи, пустые страницы), верни JSON с ошибкой:
{
  "error": "inappropriate_content",
  "error_message": "Загружены неподходящие изображения. Пожалуйста, сфотографируйте именно работу ученика - тетрадь, листы с решениями, письменные ответы или тест ChecklyTool.",
  "content_type_detected": "лица людей/селфи/прочее"
}

Если это НЕ тест ChecklyTool (нет идентификатора #CT или неправильный формат), верни JSON с ошибкой:
{
  "error": "unsupported_test_format",
  "error_message": "Мы можем проверять только тесты, созданные в конструкторе ChecklyTool. Пожалуйста, используйте наш конструктор тестов для создания проверяемых работ.",
  "content_type_detected": "сторонний тест"
}

Если изображения ПОДХОДЯЩИЕ и это тест ChecklyTool, проанализируй работу и верни JSON:
{
  "variant_detected": 1,
  "confidence_score": 0.95,
  "student_name": null,
  "total_questions": 5,
  "checkly_tool_test": true,
  "test_identifier": "#CT123ABC",
  "answers": {
    "1": {"detected_answer": "ответ1", "confidence": 0.9},
    "2": {"detected_answer": "ответ2", "confidence": 0.8}
  },
  "additional_notes": ""
}

Требования к анализу тестов ChecklyTool:
- ОБЯЗАТЕЛЬНО найди и укажи идентификатор теста (#CT + 6 символов)
- Извлеки ВСЕ ответы из полей "Ответ" под каждым вопросом
- Номера заданий: 1, 2, 3...
- Если поле "Ответ" пустое, укажи "detected_answer": "" с низкой confidence
- КРИТИЧЕСКИ ВАЖНО - ученик должен писать ответы ТОЛЬКО в полях "Ответ":
  * Игнорируй любые пометки рядом с вариантами ответов
  * Читай ТОЛЬКО то, что написано в прямоугольном поле "Ответ"
  * Ответы должны быть в формате номеров: "1", "2", "3" (номер выбранного варианта)
  * Если в поле "Ответ" написано несколько номеров или текст - верни как есть
  * Пример: если в поле "Ответ" написано "2", то detected_answer: "2"
- КРИТИЧЕСКИ ВАЖНО - обработка зачеркнутых символов:
  * Зачеркнутые символы означают ИСПРАВЛЕНИЯ ученика - их нужно ИГНОРИРОВАТЬ
  * Читай ТОЛЬКО незачеркнутый текст в поле Ответ
  * Пример: если ученик написал зачеркнутый 0 и затем 7/10 - ответ только 7/10 а НЕ 0.7 или 0 7/10
  * Пример: если ученик написал зачеркнутый 2 и затем 3 - ответ только 3
  * Зачеркивание = ученик передумал = не учитывать этот символ
- Если текст в поле "Ответ" плохо видно, укажи низкую confidence

КРИТИЧЕСКИ ВАЖНО - ТРЕБОВАНИЯ К JSON:
- Верни ТОЛЬКО валидный JSON без лишнего текста
- В строковых значениях НЕ используй двойные кавычки - замени их на одинарные
- В строковых значениях НЕ используй символы скобок () [] {} - замени их на тире или запятые
- Все комментарии пиши БЕЗ двойных кавычек и скобок
- Пример: вместо "описание (пояснение)" пиши "описание - пояснение"`

	let userPrompt = `Анализ ${analysisId}.${referenceAnswers ? ` Эталонные ответы преподавателя: ${JSON.stringify(referenceAnswers)}` : ''}`

	// Инструкции для проверки открытых вопросов (для всех типов тестов)
	if (checkType === 'test') {
		userPrompt += `\n\nПРОВЕРКА ОТВЕТОВ:`

		if (referenceAnswers && Object.keys(referenceAnswers).length > 0) {
			userPrompt += `\n- Для ОТКРЫТЫХ вопросов используй ДВУХЭТАПНУЮ ПРОВЕРКУ:`

			userPrompt += `\n\nЭТАП 1: АНАЛИЗ ТИПА ОТВЕТА`
			userPrompt += `\n  Сначала определи тип эталонного ответа:`
			userPrompt += `\n  • ЧИСЛОВОЙ: содержит только цифры, знаки (+, -, =, <, >, ≤, ≥), десятичные разделители (. или ,)`
			userPrompt += `\n  • ФОРМУЛА/ВЫРАЖЕНИЕ: содержит математические символы, переменные, функции`
			userPrompt += `\n  • ТЕКСТОВЫЙ: развернутый ответ с объяснением, описанием, определением`
			userPrompt += `\n  • СМЕШАННЫЙ: комбинация числовых и текстовых частей`

			userPrompt += `\n\nЭТАП 2: КОНТЕКСТНАЯ ПРОВЕРКА`
			userPrompt += `\n  В зависимости от типа применяй разные правила:`

			userPrompt += `\n\n  ДЛЯ ЧИСЛОВЫХ ОТВЕТОВ:`
			userPrompt += `\n    ✓ ПРАВИЛЬНО если:`
			userPrompt += `\n      - Числовые значения ПОЛНОСТЬЮ совпадают`
			userPrompt += `\n      - Все математические знаки (+, -, <, >, =) совпадают`
			userPrompt += `\n      - Допустимы различия: пробелы, запятая vs точка (0,7 = 0.7)`
			userPrompt += `\n    ✗ НЕПРАВИЛЬНО если:`
			userPrompt += `\n      - Хотя бы одна цифра отличается`
			userPrompt += `\n      - Пропущен или неверен знак числа (минус, плюс)`
			userPrompt += `\n      - Знак сравнения неверный (< вместо >)`

			userPrompt += `\n\n  ДЛЯ ФОРМУЛ/ВЫРАЖЕНИЙ:`
			userPrompt += `\n    ✓ ПРАВИЛЬНО если:`
			userPrompt += `\n      - Математически эквивалентные выражения (2x = x+x, a² = a*a)`
			userPrompt += `\n      - Все переменные и коэффициенты совпадают`
			userPrompt += `\n    ✗ НЕПРАВИЛЬНО если:`
			userPrompt += `\n      - Выражения не эквивалентны математически`
			userPrompt += `\n      - Пропущены переменные или знаки`

			userPrompt += `\n\n  ДЛЯ ТЕКСТОВЫХ ОТВЕТОВ:`
			userPrompt += `\n    ✓ ПРАВИЛЬНО если:`
			userPrompt += `\n      - Передана СУТЬ и КЛЮЧЕВЫЕ ПОНЯТИЯ эталона`
			userPrompt += `\n      - Допустимы: другая формулировка, орфографические ошибки, пропуск деталей`
			userPrompt += `\n      - Ответ показывает ПОНИМАНИЕ темы`
			userPrompt += `\n    ✗ НЕПРАВИЛЬНО если:`
			userPrompt += `\n      - Ответ слишком поверхностный, не раскрывает суть`
			userPrompt += `\n      - Пропущены КЛЮЧЕВЫЕ понятия из эталона`
			userPrompt += `\n      - Ответ содержит фактические ошибки`
			userPrompt += `\n      - Ответ не по теме или пустой`

			userPrompt += `\n\n  ОБЩИЕ ПРАВИЛА:`
			userPrompt += `\n    • Пустой ответ = НЕПРАВИЛЬНО`
			userPrompt += `\n    • Для смешанных ответов проверяй каждую часть по соответствующим правилам`
			userPrompt += `\n    • В случае сомнения - проверь, понял ли ученик СУТЬ вопроса`

			userPrompt += `\n- Для ЗАКРЫТЫХ вопросов (с вариантами) - точное совпадение с эталоном`
		}
	}

	userPrompt += `\n\nВерни JSON.`

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

	// Для тестов используем GPT-5 Image Mini, для сочинений - Gemini 2.5 Flash
	const model = checkType === 'test'
		? 'openai/gpt-5-image-mini'
		: 'google/gemini-2.5-flash'

	const requestBody: OpenRouterRequest = {
		model,
		messages,
		max_tokens: 4000,
		temperature: 0.15,
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

		// Check if response was truncated
		const finishReason = data.choices[0].finish_reason
		if (finishReason === 'length') {
			console.warn('AI response was truncated due to max_tokens limit')
		}

		let parsedResponse: AIAnalysisResponse

		try {
			// Try to extract JSON from the response (AI might add extra text)
			const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/)
			if (jsonMatch) {
				console.log('JSON extracted from response:', jsonMatch[0])
				let jsonStr = jsonMatch[0]

				// If response was truncated, try to fix incomplete JSON
				if (finishReason === 'length' && !jsonStr.endsWith('}')) {
					console.log('Attempting to fix truncated JSON...')

					// Try to complete common incomplete patterns
					if (jsonStr.includes('"content_quality"') && !jsonStr.includes('"final_grade"')) {
						// If content_quality field is incomplete, complete it properly
						if (jsonStr.match(/[",]\s*"content_quality"\s*:\s*"[^"]*$/)) {
							// Incomplete content_quality value - close it and add final_grade
							jsonStr = jsonStr.replace(/([",]\s*"content_quality"\s*:\s*"[^"]*)$/, '$1", "final_grade": 4 } }')
						} else if (jsonStr.match(/[",]\s*"content_quality"\s*:\s*"[^"]*"[,\s]*$/)) {
							// Complete content_quality value - just add final_grade
							jsonStr = jsonStr.replace(/([",]\s*"content_quality"\s*:\s*"[^"]*")\s*,?\s*$/, '$1, "final_grade": 4 } }')
						}
					} else if (jsonStr.includes('"examples"') && !jsonStr.endsWith(']}')) {
						// Close examples array and errors object
						jsonStr = jsonStr.replace(/,?\s*$/, '') + '] }, "content_quality": "Хорошее сочинение", "final_grade": 4 } }'
					} else {
						// Generic fix: close all open objects
						const openBraces = (jsonStr.match(/\{/g) || []).length
						const closeBraces = (jsonStr.match(/\}/g) || []).length
						const missingBraces = openBraces - closeBraces
						if (missingBraces > 0) {
							// Add missing final_grade if in essay_analysis context
							if (jsonStr.includes('"essay_analysis"') && !jsonStr.includes('"final_grade"')) {
								jsonStr += ', "final_grade": 4'
							}
							jsonStr += '}'.repeat(missingBraces)
						}
					}
					console.log('Fixed JSON:', jsonStr)
				}

				// First parsing attempt
				try {
					parsedResponse = JSON.parse(jsonStr)
				} catch (firstParseError) {
					console.warn('First parse attempt failed, trying to sanitize JSON...')

					// Try to fix common JSON issues
					// 1. Remove control characters and invalid escapes
					jsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')

					// 2. Fix unescaped quotes in string values
					// This regex finds strings and escapes any unescaped quotes within them
					jsonStr = jsonStr.replace(/"([^"]*?)"(\s*:\s*)"([^"]*)"/g, (match, key, colon, value) => {
						// Only process if this is a key-value pair
						if (colon.includes(':')) {
							// Escape any unescaped quotes in the value
							const escapedValue = value.replace(/(?<!\\)"/g, '\\"')
							return `"${key}"${colon}"${escapedValue}"`
						}
						return match
					})

					// 3. Try to extract just the outer JSON object more carefully
					const betterJsonMatch = jsonStr.match(/^\{[\s\S]*\}$/)
					if (betterJsonMatch) {
						jsonStr = betterJsonMatch[0]
					}

					console.log('Sanitized JSON:', jsonStr.substring(0, 500) + '...')

					// Second parsing attempt with sanitized string
					try {
						parsedResponse = JSON.parse(jsonStr)
					} catch (secondParseError) {
						console.error('Second parse attempt also failed')
						console.error('Parse error details:', secondParseError)

						// Last resort: try to parse with JSON5 or create minimal valid response
						throw new Error(`Failed to parse AI analysis result: ${firstParseError instanceof Error ? firstParseError.message : 'Invalid JSON format'}`)
					}
				}
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
	maxRetries: number = 3,
	checkType: 'test' | 'essay' = 'test',
	essayCriteria?: Array<{ grade: number; title: string; description: string; min_errors?: number; max_errors?: number }>
): Promise<AIAnalysisResponse> {
	let lastError: Error

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			console.log(`AI Analysis attempt ${attempt}/${maxRetries}`)
			return await analyzeStudentWork(submissionImages, referenceAnswers, referenceImages, variantCount, checkType, essayCriteria)
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

export function calculateEssayGrade(
	aiGrade: number,
	essayGradingCriteria: Array<{ grade: number; title: string; description: string }>
): { grade: number; percentage: number } {
	// For essays, we trust the AI's grade decision directly
	// since it was made based on descriptive criteria

	// Validate that the AI grade exists in our criteria
	const validGrade = essayGradingCriteria.find(criteria => criteria.grade === aiGrade)

	if (validGrade) {
		return {
			grade: aiGrade,
			percentage: (aiGrade / 5) * 100 // Convert grade to percentage for consistency
		}
	}

	// Fallback: if AI returned invalid grade, use the lowest grade
	const lowestGrade = Math.min(...essayGradingCriteria.map(c => c.grade))
	return {
		grade: lowestGrade,
		percentage: (lowestGrade / 5) * 100
	}
}
