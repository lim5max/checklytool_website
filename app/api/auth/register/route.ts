import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

const registerSchema = z.object({
	email: z.string().email('Некорректный email'),
	password: z.string().min(6, 'Пароль должен быть минимум 6 символов'),
	fullName: z.string().min(2, 'Имя должно быть минимум 2 символа'),
})

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { email, password, fullName } = registerSchema.parse(body)

		console.log('[REGISTER] Registration attempt:', { email, fullName })

		const supabase = await createClient()

		// Проверяем, существует ли пользователь
		const { data: existingUser } = await supabase
			.from('user_profiles')
			.select('email')
			.eq('email', email)
			.single()

		if (existingUser) {
			return NextResponse.json(
				{ message: 'Пользователь с таким email уже существует', success: false },
				{ status: 400 }
			)
		}

		// Хешируем пароль
		const hashedPassword = await bcrypt.hash(password, 10)
		console.log('[REGISTER] Password hashed successfully')

		// Получаем FREE план подписки
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data: freePlan } = await (supabase as any)
			.from('subscription_plans')
			.select('id')
			.eq('name', 'FREE')
			.single()

		const now = new Date()

		// Создаем профиль пользователя
		const profileData: {
			user_id: string
			email: string
			name: string
			password_hash: string
			provider: string
			subscription_plan_id?: string
			check_balance: number
			first_login_at: string
			last_login_at: string
			created_at: string
			updated_at: string
		} = {
			user_id: email,
			email,
			name: fullName,
			password_hash: hashedPassword,
			provider: 'credentials',
			check_balance: 0,
			first_login_at: now.toISOString(),
			last_login_at: now.toISOString(),
			created_at: now.toISOString(),
			updated_at: now.toISOString(),
		}

		// Устанавливаем FREE план подписки
		if (freePlan?.id) {
			profileData.subscription_plan_id = freePlan.id
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data: newUser, error: createError } = await (supabase as any)
			.from('user_profiles')
			.insert(profileData)
			.select()
			.single()

		if (createError) {
			console.error('[REGISTER] Error creating user:', createError)
			return NextResponse.json(
				{ message: 'Ошибка при создании пользователя', success: false },
				{ status: 500 }
			)
		}

		console.log('[REGISTER] User created successfully:', { email, id: newUser.id })

		return NextResponse.json({
			message: 'Регистрация прошла успешно!',
			success: true,
			user: {
				email: newUser.email,
				name: newUser.name,
			},
		})

	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ message: error.issues[0]?.message || 'Validation error', success: false },
				{ status: 400 }
			)
		}

		console.error('[REGISTER] Registration error:', error)
		return NextResponse.json(
			{ message: 'Ошибка при регистрации', success: false },
			{ status: 500 }
		)
	}
}
