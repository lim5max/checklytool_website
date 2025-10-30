import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

/**
 * Token expiration time in minutes
 */
const TOKEN_EXPIRATION_MINUTES = 15

/**
 * Interface for password reset token
 */
export interface PasswordResetToken {
	id: string
	user_email: string
	token: string
	expires_at: string
	used_at: string | null
	created_at: string
}

/**
 * Generates a cryptographically secure random token
 * @returns A 32-byte hex string (64 characters)
 */
export function generateSecureToken(): string {
	return crypto.randomBytes(32).toString('hex')
}

/**
 * Creates a password reset token in the database
 * @param email - User's email address
 * @returns The generated token string
 * @throws Error if token creation fails
 */
export async function createPasswordResetToken(
	email: string
): Promise<string> {
	const supabase = await createClient()
	const token = generateSecureToken()

	// Calculate expiration time (15 minutes from now)
	const expiresAt = new Date()
	expiresAt.setMinutes(expiresAt.getMinutes() + TOKEN_EXPIRATION_MINUTES)

	// Insert token into database
	const { error } = await supabase.from('password_reset_tokens').insert({
		user_email: email,
		token,
		expires_at: expiresAt.toISOString(),
	})

	if (error) {
		console.error('Failed to create password reset token:', error)
		throw new Error('Failed to create password reset token')
	}

	return token
}

/**
 * Validates a password reset token
 * @param token - Token string to validate
 * @returns Token data if valid, null otherwise
 */
export async function validatePasswordResetToken(
	token: string
): Promise<PasswordResetToken | null> {
	const supabase = await createClient()

	// Fetch token from database
	const { data, error } = await supabase
		.from('password_reset_tokens')
		.select('*')
		.eq('token', token)
		.single()

	if (error || !data) {
		return null
	}

	// Check if token has already been used
	if (data.used_at) {
		return null
	}

	// Check if token has expired
	const expiresAt = new Date(data.expires_at)
	const now = new Date()

	if (now > expiresAt) {
		return null
	}

	return data as PasswordResetToken
}

/**
 * Marks a password reset token as used
 * @param token - Token string to mark as used
 * @throws Error if marking fails
 */
export async function markTokenAsUsed(token: string): Promise<void> {
	const supabase = await createClient()

	const { error } = await supabase
		.from('password_reset_tokens')
		.update({ used_at: new Date().toISOString() })
		.eq('token', token)

	if (error) {
		console.error('Failed to mark token as used:', error)
		throw new Error('Failed to mark token as used')
	}
}

/**
 * Deletes expired password reset tokens (cleanup utility)
 * This can be called periodically to clean up old tokens
 * @returns Number of deleted tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
	const supabase = await createClient()
	const now = new Date().toISOString()

	const { data, error } = await supabase
		.from('password_reset_tokens')
		.delete()
		.lt('expires_at', now)
		.select()

	if (error) {
		console.error('Failed to cleanup expired tokens:', error)
		return 0
	}

	const count = data?.length || 0
	console.log(`Cleaned up ${count} expired password reset tokens`)
	return count
}

/**
 * Deletes all tokens for a specific user email
 * Useful when user requests a new reset link
 * @param email - User's email address
 */
export async function invalidateUserTokens(email: string): Promise<void> {
	const supabase = await createClient()

	const { error } = await supabase
		.from('password_reset_tokens')
		.delete()
		.eq('user_email', email)
		.is('used_at', null)

	if (error) {
		console.error('Failed to invalidate user tokens:', error)
		// Don't throw error, just log it - this is not critical
	}
}
