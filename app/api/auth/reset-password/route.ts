import { NextRequest, NextResponse } from 'next/server'
import { resetPasswordSchema } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/server'
import {
	createPasswordResetToken,
	invalidateUserTokens,
} from '@/lib/token'
import { sendPasswordResetEmail } from '@/lib/email'

/**
 * POST /api/auth/reset-password
 * Initiates password reset process by sending reset email
 */
export async function POST(request: NextRequest) {
	try {
		// Parse and validate request body
		const body = await request.json()
		const validation = resetPasswordSchema.safeParse(body)

		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Некорректный email' },
				{ status: 400 }
			)
		}

		const { email } = validation.data

		// Check if user exists and uses credentials provider
		const supabase = await createClient()
		const { data: user, error: userError } = await supabase
			.from('user_profiles')
			.select('email, provider, name')
			.eq('email', email)
			.single()

		// For security, always return success even if user doesn't exist
		// This prevents email enumeration attacks
		if (userError || !user) {
			console.log(`Password reset requested for non-existent user: ${email}`)
			return NextResponse.json(
				{
					success: true,
					message:
						'Если пользователь с таким email существует, на него будет отправлена ссылка для сброса пароля',
				},
				{ status: 200 }
			)
		}

		// Check if user uses credentials provider (only they have passwords)
		if (user.provider !== 'credentials') {
			console.log(
				`Password reset requested for OAuth user: ${email} (provider: ${user.provider})`
			)
			// Still return success to avoid information disclosure
			return NextResponse.json(
				{
					success: true,
					message:
						'Если пользователь с таким email существует, на него будет отправлена ссылка для сброса пароля',
				},
				{ status: 200 }
			)
		}

		// Invalidate any existing unused tokens for this user
		await invalidateUserTokens(email)

		// Create new password reset token
		const token = await createPasswordResetToken(email)

		// Send password reset email
		await sendPasswordResetEmail({
			to: email,
			resetToken: token,
		})

		console.log(`Password reset email sent to: ${email}`)

		return NextResponse.json(
			{
				success: true,
				message:
					'Если пользователь с таким email существует, на него будет отправлена ссылка для сброса пароля',
			},
			{ status: 200 }
		)
	} catch (error) {
		console.error('Password reset error:', error)

		// Return generic error message to avoid information disclosure
		return NextResponse.json(
			{
				error:
					'Произошла ошибка при отправке письма. Пожалуйста, попробуйте позже',
			},
			{ status: 500 }
		)
	}
}
