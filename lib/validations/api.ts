/**
 * API Validation Schemas
 * Centralized validation using Zod for all API endpoints
 */

import { z } from 'zod'

/**
 * Common validation schemas
 */
export const idSchema = z.string().uuid('Invalid ID format')

export const paginationSchema = z.object({
	page: z.number().int().positive().default(1),
	per_page: z.number().int().positive().max(100).default(20),
})

/**
 * Submission validation schemas
 */
export const submissionIdSchema = z.object({
	id: idSchema,
})

export const evaluateSubmissionSchema = z.object({
	submissionId: idSchema,
	forceReprocess: z.boolean().optional().default(false),
})

/**
 * Check validation schemas
 */
export const checkIdSchema = z.object({
	id: idSchema,
})

export const createCheckSchema = z.object({
	title: z.string().min(3).max(200),
	description: z.string().max(1000).optional(),
	variant_count: z.number().int().min(1).max(10),
	subject: z.string().max(100).optional(),
	class_level: z.string().max(50).optional(),
	total_questions: z.number().int().min(1).max(100).optional(),
	check_type: z.enum(['test', 'essay']).default('test'),
	grading_criteria: z.array(
		z.object({
			grade: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
			min_percentage: z.number().min(0).max(100),
		})
	).min(1),
	essay_grading_criteria: z.array(
		z.object({
			grade: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
			title: z.string().min(1).max(100),
			description: z.string().min(1).max(500),
			min_errors: z.number().int().min(0).optional(),
			max_errors: z.number().int().min(0).optional(),
		})
	).optional(),
})

export const updateCheckSchema = createCheckSchema.partial().extend({
	id: idSchema,
})

/**
 * PDF Generation validation schemas
 */
export const generatePdfSchema = z.object({
	checkId: idSchema.optional(),
	submissionId: idSchema.optional(),
	title: z.string().min(1).max(200).optional(),
	description: z.string().max(1000).optional(),
	questions: z.array(z.any()).optional(), // Will be validated more strictly in implementation
	format: z.enum(['A4', 'Letter']).default('A4'),
	variant: z.number().int().positive().optional(),
}).refine(
	(data) => data.checkId || data.submissionId,
	'Either checkId or submissionId must be provided'
)

/**
 * Test save validation schema
 */
export const saveTestSchema = z.object({
	checkId: idSchema.optional(),
	title: z.string().min(3).max(200),
	description: z.string().max(1000).optional(),
	subject: z.string().max(100).optional(),
	class_level: z.string().max(50).optional(),
	variant_count: z.number().int().min(1).max(10),
	questions: z.array(
		z.object({
			id: z.string(),
			question: z.string().min(1),
			type: z.enum(['single', 'multiple', 'open']),
			options: z.array(
				z.object({
					id: z.string(),
					text: z.string().min(1),
					isCorrect: z.boolean(),
				})
			),
			explanation: z.string().optional(),
			hideOptionsInPDF: z.boolean().optional(),
			points: z.number().positive().optional(),
			imageUrl: z.string().url().optional(),
		})
	).min(1),
	grading_criteria: z.array(
		z.object({
			grade: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
			min_percentage: z.number().min(0).max(100),
		})
	).min(1),
})

/**
 * Image upload validation
 * Note: These schemas use z.any() instead of z.instanceof(File) to avoid
 * "File is not defined" errors in Node.js environments during build time.
 * Runtime validation still occurs through refine() methods.
 */
export const imageUploadSchema = z.object({
	file: z.any().refine(
		(file) => file && typeof file === 'object' && 'size' in file && file.size <= 5 * 1024 * 1024,
		'File size must be less than 5MB'
	).refine(
		(file) => file && typeof file === 'object' && 'type' in file && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
		'File must be an image (JPEG, PNG, or WebP)'
	),
})

export const multipleImagesSchema = z.object({
	files: z.array(z.any()).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed'),
})

/**
 * Helper function to validate data against a schema
 */
export function validateData<T>(
	schema: z.ZodSchema<T>,
	data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
	const result = schema.safeParse(data)
	if (result.success) {
		return { success: true, data: result.data }
	}
	return { success: false, error: result.error }
}

/**
 * Helper function to extract validation errors in a readable format
 */
export function formatValidationErrors(error: z.ZodError): Record<string, string> {
	const errors: Record<string, string> = {}
	error.issues.forEach((err: z.ZodIssue) => {
		const path = err.path.join('.')
		errors[path] = err.message
	})
	return errors
}
