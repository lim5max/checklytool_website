import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

const registerSchema = z.object({
	email: z.string().email('Некорректный email'),
	password: z.string().min(6, 'Пароль должен быть минимум 6 символов'),
	fullName: z.string().min(2, 'Имя должно быть минимум 2 символа'),
	promoCode: z.string().optional(),
})

const PROMO_CODE = 'ChecklyBeta1'
const PROMO_DURATION_DAYS = 30

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { email, password, fullName, promoCode } = registerSchema.parse(body)

		console.log('[REGISTER] Registration attempt:', { email, fullName, hasPromo: !!promoCode })

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

		// Получаем ID планов подписки
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data: freePlan } = await (supabase as any)
			.from('subscription_plans')
			.select('id')
			.eq('name', 'FREE')
			.single()

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data: proPlan } = await (supabase as any)
			.from('subscription_plans')
			.select('id, check_credits')
			.eq('name', 'PRO')
			.single()

		// Проверяем промокод
		const isPromoValid = promoCode === PROMO_CODE
		const selectedPlan = isPromoValid && proPlan ? proPlan : freePlan

		// Рассчитываем даты подписки для промокода
		const now = new Date()
		const expiresAt = new Date(now)
		expiresAt.setDate(expiresAt.getDate() + PROMO_DURATION_DAYS)

		console.log('[REGISTER] Promo code check:', {
			providedCode: promoCode,
			isValid: isPromoValid,
			planSelected: isPromoValid ? 'PRO' : 'FREE'
		})

		// Создаем профиль пользователя
		const profileData: {
			user_id: string
			email: string
			name: string
			password_hash: string
			provider: string
			subscription_plan_id?: string
			check_balance: number
			subscription_started_at?: string
			subscription_expires_at?: string
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

		// Устанавливаем план подписки
		if (selectedPlan?.id) {
			profileData.subscription_plan_id = selectedPlan.id
		}

		// Если промокод валиден, активируем PRO подписку
		if (isPromoValid && proPlan) {
			profileData.subscription_started_at = now.toISOString()
			profileData.subscription_expires_at = expiresAt.toISOString()
			// Используем check_credits из плана
			profileData.check_balance = Number(proPlan.check_credits) || 0
			console.log('[REGISTER] PRO subscription activated with promo code:', {
				planId: proPlan.id,
				credits: proPlan.check_credits,
				finalBalance: profileData.check_balance,
				startedAt: profileData.subscription_started_at,
				expiresAt: profileData.subscription_expires_at
			})
		} else {
			console.log('[REGISTER] No promo code or invalid promo code, using FREE plan')
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
			promoApplied: isPromoValid,
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
