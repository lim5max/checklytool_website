import { z } from 'zod'

// Check creation validation
export const createCheckSchema = z.object({
	title: z.string()
		.min(1, 'Название обязательно')
		.max(200, 'Название не может быть длиннее 200 символов'),
	description: z.string()
		.max(500, 'Описание не может быть длиннее 500 символов')
		.optional(),
	variant_count: z.number()
		.int('Количество вариантов должно быть целым числом')
		.min(1, 'Должен быть минимум 1 вариант')
		.max(20, 'Максимум 20 вариантов'),
	subject: z.string()
		.max(100, 'Предмет не может быть длиннее 100 символов')
		.optional(),
	class_level: z.string()
		.max(50, 'Класс не может быть длиннее 50 символов')
		.optional(),
	total_questions: z.number()
		.int('Количество вопросов должно быть целым числом')
		.min(1, 'Должен быть минимум 1 вопрос')
		.max(100, 'Максимум 100 вопросов')
		.optional(),
	grading_criteria: z.array(z.object({
		grade: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
		min_percentage: z.number()
			.int('Процент должен быть целым числом')
			.min(0, 'Процент не может быть отрицательным')
			.max(100, 'Процент не может быть больше 100')
	}))
	.min(1, 'Должен быть указан минимум 1 критерий оценки')
	.max(4, 'Максимум 4 критерия (по одному на каждую оценку)')
})

export type CreateCheckFormData = z.infer<typeof createCheckSchema>

// Variant creation validation
export const createVariantSchema = z.object({
	variant_number: z.number()
		.int('Номер варианта должен быть целым числом')
		.min(1, 'Номер варианта должен быть больше 0'),
	reference_answers: z.record(z.string(), z.string())
		.optional()
		.refine(
			(answers) => !answers || Object.keys(answers).length <= 100,
			'Максимум 100 вопросов в варианте'
		),
	reference_images: z.array(z.any())
		.optional()
		.refine(
			(files) => !files || files.length <= 10,
			'Максимум 10 изображений на вариант'
		)
})

export type CreateVariantFormData = z.infer<typeof createVariantSchema>

// Submission creation validation
export const createSubmissionSchema = z.object({
	student_name: z.string()
		.max(200, 'Имя не может быть длиннее 200 символов')
		.optional(),
	student_class: z.string()
		.max(50, 'Класс не может быть длиннее 50 символов')
		.optional(),
	images: z.array(z.any())
		.min(1, 'Должно быть загружено минимум 1 изображение')
		.max(20, 'Максимум 20 изображений на работу')
		.refine(
			(files) => files.every(file => file instanceof File),
			'Все элементы должны быть файлами'
		)
		.refine(
			(files) => files.every(file => 
				['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.type)
			),
			'Поддерживаются только изображения (JPEG, PNG, WebP, HEIC)'
		)
		.refine(
			(files) => files.every(file => file.size <= 10 * 1024 * 1024), // 10MB
			'Размер каждого файла не должен превышать 10 МБ'
		)
})

export type CreateSubmissionFormData = z.infer<typeof createSubmissionSchema>

// Update user profile validation  
export const updateUserProfileSchema = z.object({
	name: z.string()
		.max(200, 'Имя не может быть длиннее 200 символов')
		.optional(),
	role: z.enum(['user', 'admin'])
		.optional(),
	is_active: z.boolean()
		.optional()
})

export type UpdateUserProfileFormData = z.infer<typeof updateUserProfileSchema>

// Query parameters validation
export const checksQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	per_page: z.coerce.number().int().min(1).max(50).default(10),
	search: z.string().optional(),
	subject: z.string().optional(),
	sort_by: z.enum(['created_at', 'title', 'updated_at']).default('created_at'),
	sort_order: z.enum(['asc', 'desc']).default('desc')
})

export type ChecksQueryParams = z.infer<typeof checksQuerySchema>

// Admin queries validation
export const adminUsersQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	per_page: z.coerce.number().int().min(1).max(100).default(20),
	search: z.string().optional(),
	role: z.enum(['user', 'admin']).optional(),
	provider: z.enum(['google', 'yandex']).optional(),
	is_active: z.coerce.boolean().optional(),
	sort_by: z.enum(['created_at', 'name', 'email', 'last_login_at']).default('created_at'),
	sort_order: z.enum(['asc', 'desc']).default('desc')
})

export type AdminUsersQueryParams = z.infer<typeof adminUsersQuerySchema>