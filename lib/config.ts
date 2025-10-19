/**
 * Application Configuration
 * Centralizes all configuration values for easier maintenance
 */

/**
 * OpenRouter API Configuration
 */
export const OPENROUTER_CONFIG = {
	BASE_URL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
	API_KEY: process.env.OPENROUTER_API_KEY || '',
	DEFAULT_MODEL: 'google/gemini-2.5-flash',
	MAX_TOKENS: 4000,
	TEMPERATURE: 0.15,
	MAX_IMAGES: 5,
	SITE_URL: 'https://checklytool.com',
	SITE_NAME: 'ChecklyTool',
} as const

/**
 * Image Processing Configuration
 */
export const IMAGE_CONFIG = {
	FORMAT: 'image/jpeg',
	QUALITY: 0.95,
	MAX_WIDTH: 1920,
	MAX_HEIGHT: 1080,
	MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
} as const

/**
 * API Configuration
 */
export const API_CONFIG = {
	MAX_RETRIES: 3,
	RETRY_DELAY_BASE: 1000, // ms
	REQUEST_TIMEOUT: 30000, // 30s
} as const

/**
 * Validation Configuration
 */
export const VALIDATION_CONFIG = {
	MIN_VARIANT_COUNT: 1,
	MAX_VARIANT_COUNT: 10,
	MIN_QUESTIONS: 1,
	MAX_QUESTIONS: 100,
	MIN_TITLE_LENGTH: 3,
	MAX_TITLE_LENGTH: 200,
	MAX_DESCRIPTION_LENGTH: 1000,
} as const

/**
 * Grading Configuration
 */
export const GRADING_CONFIG = {
	GRADES: [2, 3, 4, 5] as const,
	DEFAULT_CRITERIA: [
		{ grade: 5, min_percentage: 85 },
		{ grade: 4, min_percentage: 70 },
		{ grade: 3, min_percentage: 50 },
		{ grade: 2, min_percentage: 0 },
	],
} as const

/**
 * Essay Grading Configuration
 */
export const ESSAY_GRADING_CONFIG = {
	DEFAULT_CRITERIA: [
		{
			grade: 5,
			title: 'Отлично',
			description: 'Структура соблюдена, логика ясная, ошибок мало или совсем нет (не более двух грамматических ошибок)',
			max_errors: 2,
		},
		{
			grade: 4,
			title: 'Хорошо',
			description: 'Структура есть, логика в целом понятна, ошибок немного (от 3 до 6 грамматических и синтаксических)',
			min_errors: 3,
			max_errors: 6,
		},
		{
			grade: 3,
			title: 'Удовлетворительно',
			description: 'Структура нарушена, логика местами сбивается, ошибок достаточно много (более 6 ошибок)',
			min_errors: 7,
		},
		{
			grade: 2,
			title: 'Неудовлетворительно',
			description: 'Структура отсутствует, логики почти нет, ошибок очень много, текст трудно читать',
		},
	],
} as const
