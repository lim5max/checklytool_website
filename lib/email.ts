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
	const config = {
		host: process.env.SMTP_HOST || 'smtp.mail.ru',
		port: Number(process.env.SMTP_PORT) || 465,
		secure: process.env.SMTP_SECURE === 'true' || true,
		auth: {
			user: process.env.SMTP_USER || 'noreply@checklytool.com',
			pass: process.env.SMTP_PASSWORD || '',
		},
		connectionTimeout: 10000, // 10 секунд
		greetingTimeout: 10000,
		socketTimeout: 10000,
	}

	console.log('[Email] Creating transporter with config:', {
		host: config.host,
		port: config.port,
		secure: config.secure,
		user: config.auth.user,
		hasPassword: !!config.auth.pass,
	})

	return nodemailer.createTransport(config)
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

	const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
		.content { padding: 20px; background: #f9fafb; }
		.footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>ChecklyTool</h1>
		</div>
		<div class="content">
			<h2>Напоминание о продлении подписки</h2>
			<p>Здравствуйте${userName ? `, ${userName}` : ''}!</p>
			<p>Это напоминание о том, что <strong>${renewalDate.toLocaleDateString('ru-RU')}</strong> с вашей карты будет автоматически списано <strong>${amount} ₽</strong> за продление подписки ChecklyTool.</p>
			<p>Если у вас недостаточно средств на карте, пожалуйста, пополните счет до указанной даты, чтобы избежать приостановки подписки.</p>
			<p>Вы можете отключить автоматическое продление в настройках профиля на сайте.</p>
		</div>
		<div class="footer">
			<p>С уважением,<br>Команда ChecklyTool</p>
		</div>
	</div>
</body>
</html>
`.trim()

	try {
		console.log(`[Email] Sending renewal reminder to ${email}...`)

		await transporter.sendMail({
			from: process.env.SMTP_FROM || 'ChecklyTool <noreply@checklytool.com>',
			to: email,
			subject,
			html,
		})

		console.log(`[Email] Renewal reminder sent successfully to ${email}`)
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

	const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: #10B981; color: white; padding: 20px; text-align: center; }
		.content { padding: 20px; background: #f9fafb; }
		.footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
		.success { color: #10B981; font-size: 24px; text-align: center; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>ChecklyTool</h1>
		</div>
		<div class="content">
			<div class="success">✅ Подписка продлена!</div>
			<p>Здравствуйте${userName ? `, ${userName}` : ''}!</p>
			<p>Ваша подписка "<strong>${planName}</strong>" успешно продлена!</p>
			<ul>
				<li>Списано: <strong>${amount} ₽</strong></li>
				<li>Подписка активна до: <strong>${nextRenewalDate.toLocaleDateString('ru-RU')}</strong></li>
				<li>Следующее списание: <strong>${nextRenewalDate.toLocaleDateString('ru-RU')}</strong></li>
			</ul>
			<p>Спасибо за использование ChecklyTool!</p>
		</div>
		<div class="footer">
			<p>С уважением,<br>Команда ChecklyTool</p>
		</div>
	</div>
</body>
</html>
`.trim()

	try {
		console.log(`[Email] Sending payment success to ${email}...`)

		await transporter.sendMail({
			from: process.env.SMTP_FROM || 'ChecklyTool <noreply@checklytool.com>',
			to: email,
			subject,
			html,
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

	const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: #EF4444; color: white; padding: 20px; text-align: center; }
		.content { padding: 20px; background: #f9fafb; }
		.footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
		.warning { color: #EF4444; font-size: 18px; text-align: center; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>ChecklyTool</h1>
		</div>
		<div class="content">
			<div class="warning">⚠️ Проблема с оплатой</div>
			<p>Здравствуйте${userName ? `, ${userName}` : ''}!</p>
			<p>К сожалению, не удалось списать <strong>${amount} ₽</strong> для продления вашей подписки ChecklyTool.</p>
			${attemptsLeft > 0 ? `<p>Повторная попытка списания будет произведена <strong>${retryDate.toLocaleDateString('ru-RU')}</strong>.</p>` : '<p>Это была последняя попытка списания.</p>'}
			${attemptsLeft > 0 ? '<p>Пожалуйста, убедитесь, что на вашей карте достаточно средств.</p>' : '<p><strong>Ваша подписка будет приостановлена.</strong></p>'}
			<p>Вы можете вручную оплатить подписку на сайте в любое время.</p>
		</div>
		<div class="footer">
			<p>С уважением,<br>Команда ChecklyTool</p>
		</div>
	</div>
</body>
</html>
`.trim()

	try {
		console.log(`[Email] Sending payment failed to ${email}...`)

		await transporter.sendMail({
			from: process.env.SMTP_FROM || 'ChecklyTool <noreply@checklytool.com>',
			to: email,
			subject,
			html,
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

	const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: #6B7280; color: white; padding: 20px; text-align: center; }
		.content { padding: 20px; background: #f9fafb; }
		.footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>ChecklyTool</h1>
		</div>
		<div class="content">
			<h2>Подписка приостановлена</h2>
			<p>Здравствуйте${userName ? `, ${userName}` : ''}!</p>
			<p>Ваша подписка ChecklyTool была приостановлена из-за невозможности списать средства с карты.</p>
			<p>Вы переведены на бесплатный тариф. Ваши данные и проверки сохранены.</p>
			<p>Чтобы возобновить подписку, пожалуйста, оформите её заново на сайте.</p>
		</div>
		<div class="footer">
			<p>С уважением,<br>Команда ChecklyTool</p>
		</div>
	</div>
</body>
</html>
`.trim()

	try {
		console.log(`[Email] Sending subscription suspended to ${email}...`)

		await transporter.sendMail({
			from: process.env.SMTP_FROM || 'ChecklyTool <noreply@checklytool.com>',
			to: email,
			subject,
			html,
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
		const { data, error} = await (supabase as any)
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
