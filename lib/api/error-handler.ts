/**
 * API Error Handler
 * Unified error handling for all API routes
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { formatValidationErrors } from '@/lib/validations/api'

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
	error: string
	message: string
	details?: Record<string, unknown>
	code?: string
	timestamp: string
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
	constructor(
		message: string,
		public details?: Record<string, unknown>
	) {
		super(message)
		this.name = 'ValidationError'
	}
}

export class AuthenticationError extends Error {
	constructor(message: string = 'Authentication required') {
		super(message)
		this.name = 'AuthenticationError'
	}
}

export class AuthorizationError extends Error {
	constructor(message: string = 'Insufficient permissions') {
		super(message)
		this.name = 'AuthorizationError'
	}
}

export class NotFoundError extends Error {
	constructor(resource: string = 'Resource') {
		super(`${resource} not found`)
		this.name = 'NotFoundError'
	}
}

export class DatabaseError extends Error {
	constructor(
		message: string = 'Database operation failed',
		public originalError?: unknown
	) {
		super(message)
		this.name = 'DatabaseError'
	}
}

export class ExternalServiceError extends Error {
	constructor(
		public service: string,
		message: string,
		public originalError?: unknown
	) {
		super(`${service}: ${message}`)
		this.name = 'ExternalServiceError'
	}
}

/**
 * Convert error to API response
 */
function errorToResponse(error: unknown): { response: ApiErrorResponse; status: number } {
	const timestamp = new Date().toISOString()

	// Zod validation errors
	if (error instanceof ZodError) {
		return {
			response: {
				error: 'Validation Error',
				message: 'Invalid request data',
				details: formatValidationErrors(error),
				code: 'VALIDATION_ERROR',
				timestamp,
			},
			status: 400,
		}
	}

	// Custom validation errors
	if (error instanceof ValidationError) {
		return {
			response: {
				error: 'Validation Error',
				message: error.message,
				details: error.details,
				code: 'VALIDATION_ERROR',
				timestamp,
			},
			status: 400,
		}
	}

	// Authentication errors
	if (error instanceof AuthenticationError) {
		return {
			response: {
				error: 'Authentication Error',
				message: error.message,
				code: 'AUTHENTICATION_ERROR',
				timestamp,
			},
			status: 401,
		}
	}

	// Authorization errors
	if (error instanceof AuthorizationError) {
		return {
			response: {
				error: 'Authorization Error',
				message: error.message,
				code: 'AUTHORIZATION_ERROR',
				timestamp,
			},
			status: 403,
		}
	}

	// Not found errors
	if (error instanceof NotFoundError) {
		return {
			response: {
				error: 'Not Found',
				message: error.message,
				code: 'NOT_FOUND',
				timestamp,
			},
			status: 404,
		}
	}

	// Database errors
	if (error instanceof DatabaseError) {
		// Log the original error for debugging
		if (process.env.NODE_ENV === 'development') {
			console.error('Database error:', error.originalError)
		}
		return {
			response: {
				error: 'Database Error',
				message: error.message,
				code: 'DATABASE_ERROR',
				timestamp,
			},
			status: 500,
		}
	}

	// External service errors
	if (error instanceof ExternalServiceError) {
		// Log the original error for debugging
		if (process.env.NODE_ENV === 'development') {
			console.error(`${error.service} error:`, error.originalError)
		}
		return {
			response: {
				error: 'External Service Error',
				message: error.message,
				details: { service: error.service },
				code: 'EXTERNAL_SERVICE_ERROR',
				timestamp,
			},
			status: 502,
		}
	}

	// Generic errors
	const message = error instanceof Error ? error.message : 'An unexpected error occurred'

	// Log unexpected errors
	console.error('Unexpected API error:', error)

	return {
		response: {
			error: 'Internal Server Error',
			message,
			code: 'INTERNAL_ERROR',
			timestamp,
		},
		status: 500,
	}
}

/**
 * API Route Handler Type
 */
type NextRequest = import('next/server').NextRequest

export type ApiHandler<T = unknown> = (
	req: NextRequest,
	context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse<T>>

/**
 * Wrap an API handler with error handling
 */
export function withErrorHandler<T = unknown>(
	handler: ApiHandler<T>
) {
	return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => {
		try {
			return await handler(req, context)
		} catch (error) {
			const { response, status } = errorToResponse(error)
			return NextResponse.json(response, { status })
		}
	}
}

/**
 * Helper to create success responses with consistent structure
 */
export function successResponse<T>(
	data: T,
	status: number = 200,
	message?: string
): NextResponse<{ success: true; data: T; message?: string }> {
	return NextResponse.json(
		{
			success: true,
			data,
			...(message && { message }),
		},
		{ status }
	)
}

/**
 * Helper to create error responses
 */
export function errorResponse(
	message: string,
	status: number = 500,
	details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
	const { response } = errorToResponse(new Error(message))
	return NextResponse.json(
		{
			...response,
			...(details && { details }),
		},
		{ status }
	)
}
