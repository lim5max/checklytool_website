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
    "1": {"detected_answer": "ТОЧНЫЙ ДОСЛОВНЫЙ текст сочинения ученика так как он написал без пересказа и интерпретации", "confidence": 0.95}
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
- В поле "detected_answer" помести ОРИГИНАЛЬНЫЙ ТЕКСТ сочинения ученика ДОСЛОВНО как он написан
- НЕ пересказывай и НЕ интерпретируй текст - просто точно перепиши что написал ученик
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

- Выбери подходящую оценку согласно критериям на основе РЕАЛЬНЫХ ошибок` : `Ты - преподаватель, проверяешь письменные работы учеников.

ВАЖНО: Проверь, подходят ли изображения:
- ✅ ПОДХОДЯЩИЙ КОНТЕНТ: письменные работы, рукописный текст, тетради, листы с решениями, тесты
- ❌ НЕПОДХОДЯЩИЙ КОНТЕНТ: фотографии лиц людей, селфи, случайные предметы, пустые страницы

Если изображения содержат НЕПОДХОДЯЩИЙ КОНТЕНТ (селфи, пустые страницы), верни JSON с ошибкой:
{
  "error": "inappropriate_content",
  "error_message": "Загружены неподходящие изображения. Пожалуйста, сфотографируйте именно работу ученика - тетрадь, листы с решениями, письменные ответы.",
  "content_type_detected": "лица людей/селфи/прочее"
}

Если изображения ПОДХОДЯЩИЕ, проанализируй работу и верни JSON:
{
  "variant_detected": 1,
  "confidence_score": 0.9,
  "student_name": null,
  "total_questions": 5,
  "answers": {
    "1": {"detected_answer": "1", "confidence": 0.9},
    "2": {"detected_answer": "2", "confidence": 0.8}
  },
  "additional_notes": ""
}

КРИТИЧЕСКИ ВАЖНО - ТРЕБОВАНИЯ К ЧТЕНИЮ ОТВЕТОВ:

ДЛЯ ТЕСТОВ С ПОЛЯМИ "ОТВЕТ" (прямоугольники под вопросами):
- Ученик должен писать ответы ТОЛЬКО в полях "Ответ"
- Игнорируй любые пометки рядом с вариантами ответов
- Читай ТОЛЬКО то, что написано в прямоугольном поле "Ответ"
- Ответы должны быть в формате: "1", "2", "3" (номер выбранного варианта)
- Пример: если в поле "Ответ" написано 2, то detected_answer: "2"

ДЛЯ ОБЫЧНЫХ РАБОТ (без полей "Ответ"):
- Извлеки ответы из рукописного текста
- Ищи ответы рядом с номерами вопросов

ОБРАБОТКА ЗАЧЕРКНУТЫХ СИМВОЛОВ (ОЧЕНЬ ВАЖНО!):
- Зачеркнутые символы означают ИСПРАВЛЕНИЯ ученика - их нужно ПОЛНОСТЬЮ ИГНОРИРОВАТЬ
- Читай ТОЛЬКО незачеркнутый текст в поле Ответ
- Пример: если ученик написал зачеркнутый 0 и затем 7/10 - ответ только "7/10" (НЕ "0.7" и НЕ "0 7/10")
- Пример: если ученик написал зачеркнутый 2 и затем 3 - ответ только "3" (НЕ "2")
- Зачеркивание = ученик передумал = этот символ не существует

ТРЕБОВАНИЯ К ФОРМАТУ JSON:
- Верни ТОЛЬКО валидный JSON без лишнего текста
- В detected_answer НЕ добавляй ЛИШНИЕ кавычки - пиши просто число или текст
- НЕПРАВИЛЬНО: "detected_answer": "'1'" или "detected_answer": "\"1\""
- ПРАВИЛЬНО: "detected_answer": "1"
- В строковых значениях НЕ используй символы скобок () [] {} - замени их на тире или запятые
- Пример: вместо "описание (пояснение)" пиши "описание - пояснение"

ЕСЛИ ОТВЕТ ПУСТОЙ:
- Если поле "Ответ" пустое, укажи detected_answer: "" с низкой confidence (0.1-0.3)
- Если текст плохо видно, укажи низкую confidence`

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

	// GPT-5 Image Mini не поддерживает параметр temperature
	const requestBody: OpenRouterRequest = {
		model,
		messages,
		max_tokens: 4000,
		...(checkType === 'essay' ? { temperature: 0.15 } : {}),
		metadata: {
			analysis_id: analysisId,
			timestamp: Date.now()
		}
	}

	try {
		// Validate images
		if (submissionImages.length === 0) {
			throw new Error('No images provided for analysis')
		}

		if (submissionImages.length > 5) {
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
			throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
		}

		const data: OpenRouterResponse = await response.json()

		if (!data.choices?.[0]?.message?.content) {
			throw new Error('Invalid response from OpenRouter API - no content')
		}

		// Parse the AI response
		const aiResponseText = data.choices[0].message.content

		// Check if response was truncated
		const finishReason = data.choices[0].finish_reason

		let parsedResponse: AIAnalysisResponse

		try {
			// Try to extract JSON from the response (AI might add extra text)
			const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/)
			if (jsonMatch) {
				let jsonStr = jsonMatch[0]

				// If response was truncated, try to fix incomplete JSON
				if (finishReason === 'length' && !jsonStr.endsWith('}')) {

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
				}

				// First parsing attempt
				try {
					parsedResponse = JSON.parse(jsonStr)
				} catch (firstParseError) {

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

					// Second parsing attempt with sanitized string
					try {
						parsedResponse = JSON.parse(jsonStr)
					} catch {

						// Last resort: try to parse with JSON5 or create minimal valid response
						throw new Error(`Failed to parse AI analysis result: ${firstParseError instanceof Error ? firstParseError.message : 'Invalid JSON format'}`)
					}
				}
			} else {
				throw new Error('No JSON found in AI response')
			}
		} catch (parseError) {
			throw new Error(`Failed to parse AI analysis result: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`)
		}

		// Validate the response structure with more detailed error messages
		if (!parsedResponse) {
			throw new Error('AI response is empty or invalid')
		}

		// Проверяем, есть ли ошибка неподходящего контента
		if (parsedResponse.error === 'inappropriate_content') {
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
			return await analyzeStudentWork(submissionImages, referenceAnswers, referenceImages, variantCount, checkType, essayCriteria)
		} catch (error) {
			lastError = error as Error

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

/**
 * Двухэтапная проверка сочинений с использованием Gemini Pro и Flash
 * ЭТАП 1: Gemini 2.5 Pro читает и расшифровывает текст дословно
 * ЭТАП 2: Gemini 2.5 Flash проверяет текст на ошибки и оценивает
 */
export async function analyzeEssayTwoStage(
	submissionImages: string[],
	essayCriteria?: Array<{ grade: number; title: string; description: string; min_errors?: number; max_errors?: number }>
): Promise<AIAnalysisResponse> {

	const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
	if (!OPENROUTER_API_KEY) {
		throw new Error('OPENROUTER_API_KEY is required')
	}

	const analysisId = `essay_twostage_${Date.now()}_${Math.random().toString(36).substring(7)}`

	// Validate images
	if (submissionImages.length === 0) {
		throw new Error('No images provided for analysis')
	}

	if (submissionImages.length > 5) {
		submissionImages = submissionImages.slice(0, 5)
	}

	try {
		// ========================================
		// ЭТАП 1: Gemini 2.5 Flash - Чтение текста
		// ========================================

		const proSystemPrompt = `Ты - эксперт по распознаванию рукописного текста. Твоя задача - прочитать рукописный текст и расшифровать его в ЧИТАЕМЫЙ вид.

ВАЖНО: Проверь, подходят ли изображения:
- ✅ ПОДХОДЯЩИЙ КОНТЕНТ: письменные сочинения, рукописный текст, тетради с работами
- ❌ НЕПОДХОДЯЩИЙ КОНТЕНТ: фотографии лиц людей, селфи, случайные предметы, пустые страницы

Если изображения содержат НЕПОДХОДЯЩИЙ КОНТЕНТ, верни JSON с ошибкой:
{
  "error": "inappropriate_content",
  "error_message": "Загружены неподходящие изображения. Пожалуйста, сфотографируйте именно сочинение ученика - рукописный текст, тетрадь с работой.",
  "content_type_detected": "лица людей/селфи/прочее"
}

Если изображения ПОДХОДЯЩИЕ, прочитай текст сочинения и верни JSON:
{
  "raw_text": "Расшифрованный текст сочинения в читаемом виде",
  "confidence": 0.95,
  "student_name": null
}

КРИТИЧЕСКИ ВАЖНО - ПРАВИЛА РАСШИФРОВКИ НЕРАЗБОРЧИВОГО ПОЧЕРКА:

1. ИСПРАВЛЯЙ неразборчивый почерк, используя контекст:
   ✅ ПРАВИЛЬНО: Видишь "че-ловек" (написано неразборчиво) → пишешь "человек"
   ✅ ПРАВИЛЬНО: Видишь "неочастные" (неразборчиво) → угадываешь "несчастные" по контексту
   ✅ ПРАВИЛЬНО: Видишь слитное слово → разделяешь правильно

2. Используй КОНТЕКСТ предложения для расшифровки:
   - Читай всё предложение целиком
   - Понимай о чем речь в абзаце
   - Угадывай правильное слово по смыслу

3. Сохраняй РЕАЛЬНЫЕ орфографические и грамматические ошибки:
   ✅ Если ученик ЧЕТКО написал "корова" вместо "карова" - сохраняй ошибку
   ✅ Если ученик пропустил запятую - не добавляй её
   ❌ НО если это просто неразборчивый почерк (слипшиеся буквы, неровный текст) - исправляй на читаемый вариант

4. Если слово СОВСЕМ невозможно распознать:
   ✅ Пиши: [неразборчиво]
   ✅ Или попробуй угадать по контексту: "по контексту скорее всего: слово"

5. Твоя задача - сделать текст ЧИТАЕМЫМ, чтобы второй AI мог проверить его на ошибки!
   - Исправляй неразборчивый почерк
   - Разделяй слипшиеся слова
   - Убирай лишние пробелы и дефисы от плохого почерка
   - НО сохраняй НАСТОЯЩИЕ ошибки ученика (орфография, грамматика, пунктуация)

ТРЕБОВАНИЯ К JSON:
- Верни ТОЛЬКО валидный JSON без лишнего текста
- В строковых значениях НЕ используй двойные кавычки - замени их на одинарные
- Сохраняй структуру абзацев через \n`

		const proMessages: OpenRouterRequest['messages'] = [
			{
				role: 'system',
				content: proSystemPrompt
			},
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: `Анализ ${analysisId}. Прочитай текст сочинения ДОСЛОВНО.`
					},
					...submissionImages.map(imageUrl => ({
						type: 'image_url' as const,
						image_url: { url: imageUrl }
					}))
				]
			}
		]

		const proRequest: OpenRouterRequest = {
			model: 'google/gemini-2.5-flash',
			messages: proMessages,
			max_tokens: 4000,
			temperature: 0.1, // Низкая температура для точного чтения
			metadata: {
				analysis_id: `${analysisId}_stage1_flash`,
				timestamp: Date.now(),
				stage: 'text_extraction'
			}
		}

		const proResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
				'Content-Type': 'application/json',
				'HTTP-Referer': 'https://checklytool.com',
				'X-Title': 'ChecklyTool',
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'Pragma': 'no-cache',
				'X-Request-ID': `${analysisId}_flash1`
			},
			body: JSON.stringify(proRequest)
		})

		if (!proResponse.ok) {
			const errorText = await proResponse.text()
			throw new Error(`Gemini Flash API error: ${proResponse.status} - ${errorText}`)
		}

		const proData: OpenRouterResponse = await proResponse.json()

		if (!proData.choices?.[0]?.message?.content) {
			throw new Error('Invalid response from Gemini Pro - no content')
		}

		const proResponseText = proData.choices[0].message.content

		// Parse Pro response
		let proResult: { raw_text?: string; confidence?: number; error?: string; error_message?: string; content_type_detected?: string }

		try {
			const jsonMatch = proResponseText.match(/\{[\s\S]*\}/)
			if (!jsonMatch) {
				throw new Error('No JSON found in Pro response')
			}
			proResult = JSON.parse(jsonMatch[0])
		} catch (parseError) {
			throw new Error(`Failed to parse Pro response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
		}

		// Проверяем на неподходящий контент
		if (proResult.error === 'inappropriate_content') {
			return {
				error: 'inappropriate_content',
				error_message: proResult.error_message || 'Загружены неподходящие изображения',
				content_type_detected: proResult.content_type_detected
			}
		}

		if (!proResult.raw_text) {
			throw new Error('Pro did not return raw_text')
		}

		const extractedText = proResult.raw_text
		const textConfidence = proResult.confidence || 0.9

		// ========================================
		// ЭТАП 2: Gemini 2.5 Flash - Проверка ошибок
		// ========================================

		const flashSystemPrompt = `Ты - преподаватель, проверяешь сочинения учеников (на русском или английском языке).

Тебе предоставлен ДОСЛОВНО расшифрованный текст сочинения ученика.
Твоя задача - ПРОВЕРИТЬ этот текст на ошибки и ОЦЕНИТЬ по критериям.

ОПРЕДЕЛИ ЯЗЫК текста (русский или английский) и проверяй согласно правилам этого языка.

Верни JSON:
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
        "орфографическая - несмотря вместо не смотря",
        "пунктуационная - отсутствует запятая перед союзом что"
      ]
    },
    "content_quality": "хорошее раскрытие темы примеры уместны",
    "final_grade": 4
  },
  "answers": {
    "1": {"detected_answer": "ПОЛНЫЙ ТЕКСТ СОЧИНЕНИЯ который был предоставлен выше - перепиши его ДОСЛОВНО сюда", "confidence": 0.95}
  },
  "additional_notes": "комментарии к работе"
}

КРИТИЧЕСКИ ВАЖНО для поля answers:
- В поле answers.1.detected_answer ОБЯЗАТЕЛЬНО помести ВЕСЬ текст сочинения ДОСЛОВНО
- Это нужно для отображения текста пользователю
- НЕ сокращай текст, НЕ пиши "текст сочинения" - пиши РЕАЛЬНЫЙ полный текст

КРИТЕРИИ ОЦЕНКИ СОЧИНЕНИЙ:
${essayCriteria?.map(c => `${c.grade} баллов — ${c.description}`).join('\n') ||
'5 баллов — структура соблюдена, логика ясная, ошибок мало или совсем нет (не более двух грамматических ошибок)\n4 балла — структура есть, логика в целом понятна, ошибок немного (от 3 до 6 грамматических и синтаксических)\n3 балла — структура нарушена, логика местами сбивается, ошибок достаточно много (более 6 ошибок)\n2 балла — структура отсутствует, логики почти нет, ошибок очень много, текст трудно читать'}

КРИТИЧЕСКИ ВАЖНО - ТРЕБОВАНИЯ К JSON:
- Верни ТОЛЬКО валидный JSON без лишнего текста
- В строковых значениях НЕ используй двойные кавычки - замени их на одинарные
- В строковых значениях НЕ используй символы скобок () [] {} - замени их на тире или запятые

Требования к анализу:
- Оцени структуру: есть ли вступление, основная часть, заключение
- Оцени логику изложения и связность текста
- Найди ТОЛЬКО реальные ошибки, классифицируй их по типам:

  ДЛЯ РУССКОГО ЯЗЫКА:

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

  ДЛЯ АНГЛИЙСКОГО ЯЗЫКА:

  SPELLING ERRORS - incorrect word spelling:
  * Examples: "recieve" instead of "receive", "definately" instead of "definitely"

  PUNCTUATION ERRORS - incorrect punctuation:
  * Examples: missing comma, missing apostrophe in contractions, run-on sentences

  GRAMMAR ERRORS - grammatical mistakes:
  * Examples: subject-verb agreement "he go" instead of "he goes", wrong tense usage
  * Examples: article errors "a apple" instead of "an apple"

  WORD CHOICE ERRORS - incorrect word usage:
  * Examples: "affect" vs "effect", "then" vs "than"

  SYNTAX ERRORS - sentence structure problems:
  * Examples: wrong word order, sentence fragments

КРИТИЧЕСКИ ВАЖНО - НЕ СЧИТАЙ ОШИБКАМИ:
- Стилистические варианты выражений если они не содержат языковых ошибок
- Разные способы формулировки если они грамматически корректны
- Сокращенные формы если они допустимы в речи (don't, can't для английского)

- Выбери подходящую оценку согласно критериям на основе РЕАЛЬНЫХ ошибок`

		const flashMessages: OpenRouterRequest['messages'] = [
			{
				role: 'system',
				content: flashSystemPrompt
			},
			{
				role: 'user',
				content: `Анализ ${analysisId}. Проверь следующий текст сочинения на ошибки:\n\n${extractedText}`
			}
		]

		const flashRequest: OpenRouterRequest = {
			model: 'google/gemini-2.5-flash',
			messages: flashMessages,
			max_tokens: 4000,
			temperature: 0.15,
			metadata: {
				analysis_id: `${analysisId}_stage2_flash`,
				timestamp: Date.now(),
				stage: 'error_checking'
			}
		}

		const flashResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
				'Content-Type': 'application/json',
				'HTTP-Referer': 'https://checklytool.com',
				'X-Title': 'ChecklyTool',
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'Pragma': 'no-cache',
				'X-Request-ID': `${analysisId}_flash`
			},
			body: JSON.stringify(flashRequest)
		})

		if (!flashResponse.ok) {
			const errorText = await flashResponse.text()
			throw new Error(`Gemini Flash API error: ${flashResponse.status} - ${errorText}`)
		}

		const flashData: OpenRouterResponse = await flashResponse.json()

		if (!flashData.choices?.[0]?.message?.content) {
			throw new Error('Invalid response from Gemini Flash - no content')
		}

		const flashResponseText = flashData.choices[0].message.content

		// Parse Flash response
		let flashResult: AIAnalysisResponse

		try {
			const jsonMatch = flashResponseText.match(/\{[\s\S]*\}/)
			if (!jsonMatch) {
				throw new Error('No JSON found in Flash response')
			}
			flashResult = JSON.parse(jsonMatch[0])
		} catch (parseError) {
			throw new Error(`Failed to parse Flash response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
		}

		// Validate Flash result
		if (!flashResult.answers || !flashResult.essay_analysis) {
			throw new Error('Flash response missing required fields (answers or essay_analysis)')
		}

		// ВАЖНО: Убеждаемся, что текст сочинения есть в answers для отображения пользователю
		// Если Flash не вернул текст или вернул заглушку, подставляем текст от Pro
		if (!flashResult.answers['1']?.detected_answer ||
		    flashResult.answers['1'].detected_answer.length < 100 ||
		    flashResult.answers['1'].detected_answer.includes('ПОЛНЫЙ ТЕКСТ')) {
			flashResult.answers['1'] = {
				detected_answer: extractedText,
				confidence: textConfidence
			}
		}

		// Возвращаем финальный результат с данными от Pro для отладки
		return {
			...flashResult,
			// Добавляем текст от Pro в additional_notes для отладки (опционально)
			additional_notes: `${flashResult.additional_notes || ''}\n\n[DEBUG] Extracted text length: ${extractedText.length} chars, confidence: ${textConfidence}`.trim()
		}

	} catch (error) {
		throw error
	}
}
