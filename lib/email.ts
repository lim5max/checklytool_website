import nodemailer from 'nodemailer'
import { createClient } from '@/lib/supabase/server'

/**
 * Типы email уведомлений для подписок
 */
export type NotificationType =
	| 'renewal_reminder'
	| 'payment_success'
	| 'payment_failed'
	| 'subscription_suspended'

/**
 * Создание SMTP транспорта для отправки email
 */
function createEmailTransporter() {
	return nodemailer.createTransport({
		host: process.env.SMTP_HOST || 'smtp.mail.ru',
		port: Number(process.env.SMTP_PORT) || 465,
		secure: process.env.SMTP_SECURE === 'true' || true,
		auth: {
			user: process.env.SMTP_USER || 'noreply@checklytool.com',
			pass: process.env.SMTP_PASSWORD || '',
		},
	})
}

/**
 * Отправка email о предстоящем списании (за 1 день)
 */
export async function sendRenewalReminder(
	email: string,
	userName: string | null,
	amount: number,
	renewalDate: Date
): Promise<void> {
	const transporter = createEmailTransporter()

	const subject = 'Напоминание о продлении подписки ChecklyTool'

	const text = `
Здравствуйте${userName ? `, ${userName}` : ''}!

Это напоминание о том, что ${renewalDate.toLocaleDateString('ru-RU')} с вашей карты будет автоматически списано ${amount} ₽ за продление подписки ChecklyTool.

Если у вас недостаточно средств на карте, пожалуйста, пополните счет до указанной даты, чтобы избежать приостановки подписки.

Вы можете отключить автоматическое продление в настройках профиля на сайте.

--
С уважением,
Команда ChecklyTool
`.trim()

	try {
		await transporter.sendMail({
			from: process.env.SMTP_FROM || 'ChecklyTool <noreply@checklytool.com>',
			to: email,
			subject,
			text,
		})

		console.log(`[Email] Renewal reminder sent to ${email}`)
	} catch (error) {
		console.error(`[Email] Failed to send renewal reminder to ${email}:`, error)
		throw error
	}
}

/**
 * Отправка email об успешном списании
 */
export async function sendPaymentSuccess(
	email: string,
	userName: string | null,
	amount: number,
	nextRenewalDate: Date,
	planName: string
): Promise<void> {
	const transporter = createEmailTransporter()

	const subject = 'Подписка ChecklyTool успешно продлена'

	const text = `
Здравствуйте${userName ? `, ${userName}` : ''}!

Ваша подписка "${planName}" успешно продлена!

Списано: ${amount} ₽
Подписка активна до: ${nextRenewalDate.toLocaleDateString('ru-RU')}
Следующее списание: ${nextRenewalDate.toLocaleDateString('ru-RU')}

Спасибо за использование ChecklyTool!

--
С уважением,
Команда ChecklyTool
`.trim()

	try {
		await transporter.sendMail({
			from: process.env.SMTP_FROM || 'ChecklyTool <noreply@checklytool.com>',
			to: email,
			subject,
			text,
		})

		console.log(`[Email] Payment success sent to ${email}`)
	} catch (error) {
		console.error(`[Email] Failed to send payment success to ${email}:`, error)
		throw error
	}
}

/**
 * Отправка email о неудачной попытке списания
 */
export async function sendPaymentFailed(
	email: string,
	userName: string | null,
	amount: number,
	retryDate: Date,
	attemptsLeft: number
): Promise<void> {
	const transporter = createEmailTransporter()

	const subject = 'Не удалось продлить подписку ChecklyTool'

	const text = `
Здравствуйте${userName ? `, ${userName}` : ''}!

К сожалению, не удалось списать ${amount} ₽ для продления вашей подписки ChecklyTool.

${attemptsLeft > 0 ? `Повторная попытка списания будет произведена ${retryDate.toLocaleDateString('ru-RU')}.` : 'Это была последняя попытка списания.'}

${attemptsLeft > 0 ? 'Пожалуйста, убедитесь, что на вашей карте достаточно средств.' : 'Ваша подписка будет приостановлена.'}

Вы можете вручную оплатить подписку на сайте в любое время.

--
С уважением,
Команда ChecklyTool
`.trim()

	try {
		await transporter.sendMail({
			from: process.env.SMTP_FROM || 'ChecklyTool <noreply@checklytool.com>',
			to: email,
			subject,
			text,
		})

		console.log(`[Email] Payment failed sent to ${email}`)
	} catch (error) {
		console.error(`[Email] Failed to send payment failed email to ${email}:`, error)
		throw error
	}
}

/**
 * Отправка email о приостановке подписки
 */
export async function sendSubscriptionSuspended(
	email: string,
	userName: string | null
): Promise<void> {
	const transporter = createEmailTransporter()

	const subject = 'Подписка ChecklyTool приостановлена'

	const text = `
Здравствуйте${userName ? `, ${userName}` : ''}!

Ваша подписка ChecklyTool была приостановлена из-за невозможности списать средства с карты.

Вы переведены на бесплатный тариф. Ваши данные и проверки сохранены.

Чтобы возобновить подписку, пожалуйста, оформите её заново на сайте.

--
С уважением,
Команда ChecklyTool
`.trim()

	try {
		await transporter.sendMail({
			from: process.env.SMTP_FROM || 'ChecklyTool <noreply@checklytool.com>',
			to: email,
			subject,
			text,
		})

		console.log(`[Email] Subscription suspended sent to ${email}`)
	} catch (error) {
		console.error(`[Email] Failed to send subscription suspended email to ${email}:`, error)
		throw error
	}
}

/**
 * Запись отправленного уведомления в базу данных
 */
export async function logNotification(
	userId: string,
	notificationType: NotificationType,
	subscriptionExpiresAt: Date,
	metadata?: Record<string, unknown>
): Promise<void> {
	try {
		const supabase = await createClient()

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { error } = await (supabase as any)
			.from('subscription_notifications')
			.insert({
				user_id: userId,
				notification_type: notificationType,
				subscription_expires_at: subscriptionExpiresAt.toISOString(),
				metadata: metadata || null,
			})

		if (error) {
			console.error('[Email] Failed to log notification:', error)
			// Не прерываем процесс, т.к. уведомление уже отправлено
		} else {
			console.log(`[Email] Notification logged: ${notificationType} for user ${userId}`)
		}
	} catch (error) {
		console.error('[Email] Failed to log notification:', error)
		// Не прерываем процесс
	}
}

/**
 * Проверка, было ли уже отправлено уведомление
 */
export async function wasNotificationSent(
	userId: string,
	notificationType: NotificationType,
	subscriptionExpiresAt: Date
): Promise<boolean> {
	try {
		const supabase = await createClient()

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data, error } = await (supabase as any)
			.from('subscription_notifications')
			.select('id')
			.eq('user_id', userId)
			.eq('notification_type', notificationType)
			.eq('subscription_expires_at', subscriptionExpiresAt.toISOString())
			.limit(1)

		if (error) {
			console.error('[Email] Failed to check notification:', error)
			return false
		}

		return data && data.length > 0
	} catch (error) {
		console.error('[Email] Failed to check notification:', error)
		return false
	}
}
