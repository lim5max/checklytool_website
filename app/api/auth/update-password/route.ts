import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validatePasswordResetToken, markTokenAsUsed } from '@/lib/token'

/**
 * Schema for request body including token
 * Note: We can't use .extend() on schemas with .refine(), so we create a new schema
 */
const requestSchema = z.object({
	token: z.string().min(1, 'Токен обязателен'),
	password: z.string()
		.min(1, 'Введите новый пароль')
		.min(6, 'Пароль должен содержать минимум 6 символов')
		.max(100, 'Пароль слишком длинный'),
	confirmPassword: z.string().min(1, 'Подтвердите новый пароль'),
}).refine((data) => data.password === data.confirmPassword, {
	message: 'Пароли не совпадают',
	path: ['confirmPassword'],
})

/**
 * POST /api/auth/update-password
 * Updates user password using a valid reset token
 */
export async function POST(request: NextRequest) {
	try {
		// Parse and validate request body
		const body = await request.json()
		const validation = requestSchema.safeParse(body)

		if (!validation.success) {
			const errors = validation.error.flatten().fieldErrors
			const firstError =
				errors.token?.[0] ||
				errors.password?.[0] ||
				errors.confirmPassword?.[0] ||
				'Некорректные данные'

			return NextResponse.json({ error: firstError }, { status: 400 })
		}

		const { token, password } = validation.data

		// Validate reset token
		const tokenData = await validatePasswordResetToken(token)

		if (!tokenData) {
			return NextResponse.json(
				{
					error:
						'Ссылка для сброса пароля недействительна или истекла. Пожалуйста, запросите новую ссылку',
				},
				{ status: 400 }
			)
		}

		// Hash the new password
		const hashedPassword = await bcrypt.hash(password, 10)

		// Update user's password in database
		const supabase = await createClient()
		const { error: updateError } = await supabase
			.from('user_profiles')
			.update({
				password_hash: hashedPassword,
				updated_at: new Date().toISOString(),
			})
			.eq('email', tokenData.user_email)

		if (updateError) {
			console.error('Failed to update password:', updateError)
			return NextResponse.json(
				{
					error:
						'Не удалось обновить пароль. Пожалуйста, попробуйте позже',
				},
				{ status: 500 }
			)
		}

		// Mark token as used
		await markTokenAsUsed(token)

		console.log(`Password successfully reset for user: ${tokenData.user_email}`)

		return NextResponse.json(
			{
				success: true,
				message: 'Пароль успешно обновлен. Теперь вы можете войти с новым паролем',
			},
			{ status: 200 }
		)
	} catch (error) {
		console.error('Update password error:', error)

		return NextResponse.json(
			{
				error:
					'Произошла ошибка при обновлении пароля. Пожалуйста, попробуйте позже',
			},
			{ status: 500 }
		)
	}
}
