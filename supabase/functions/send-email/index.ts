// Supabase Edge Function для отправки email через SMTP nodemailer
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createTransport } from 'npm:nodemailer@6.9.7'

// Типы для запросов
interface EmailRequest {
	type: 'renewal_reminder' | 'payment_success' | 'payment_failed' | 'subscription_suspended'
	userId: string
	email: string
	userName: string | null
	amount?: number
	renewalDate?: string
	planName?: string
	subscriptionExpiresAt?: string
	retryCount?: number
}

// Создание SMTP транспорта
function createEmailTransporter() {
	const config = {
		host: Deno.env.get('SMTP_HOST') || 'smtp.mail.ru',
		port: Number(Deno.env.get('SMTP_PORT')) || 465,
		secure: Deno.env.get('SMTP_SECURE') === 'true' || true,
		auth: {
			user: Deno.env.get('SMTP_USER') || '',
			pass: Deno.env.get('SMTP_PASSWORD') || '',
		},
		connectionTimeout: 10000,
		greetingTimeout: 10000,
		socketTimeout: 10000,
	}

	console.log('[Edge Function] Creating SMTP transporter:', {
		host: config.host,
		port: config.port,
		secure: config.secure,
		user: config.auth.user,
		hasPassword: !!config.auth.pass,
	})

	return createTransport(config)
}

// HTML шаблоны для разных типов email
function getEmailHTML(type: string, data: EmailRequest): string {
	const { userName, amount, renewalDate, retryCount } = data

	switch (type) {
		case 'renewal_reminder':
			return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Напоминание о продлении подписки</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
	<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
		<h1 style="color: white; margin: 0; font-size: 28px;">ChecklyTool</h1>
	</div>

	<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
		<h2 style="color: #667eea; margin-top: 0;">Напоминание о продлении подписки</h2>

		<p>Здравствуйте${userName ? `, ${userName}` : ''}!</p>

		<p>Это напоминание о том, что завтра с вашей карты будет списано <strong>${amount} ₽</strong> за продление подписки ChecklyTool.</p>

		<div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
			<p style="margin: 5px 0;"><strong>Дата списания:</strong> ${new Date(renewalDate || '').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
			<p style="margin: 5px 0;"><strong>Сумма:</strong> ${amount} ₽</p>
		</div>

		<p>Если вы хотите отменить автопродление, вы можете сделать это в настройках профиля.</p>

		<div style="text-align: center; margin: 30px 0;">
			<a href="http://91.229.10.157/dashboard/profile" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Управление подпиской</a>
		</div>

		<p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
			С уважением,<br>
			Команда ChecklyTool
		</p>
	</div>
</body>
</html>
			`

		case 'payment_success':
			return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Подписка успешно продлена</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
	<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
		<h1 style="color: white; margin: 0;">✓ Оплата получена</h1>
	</div>

	<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
		<p>Здравствуйте${userName ? `, ${userName}` : ''}!</p>

		<p>Ваша подписка ChecklyTool успешно продлена!</p>

		<div style="background: white; padding: 20px; border-left: 4px solid #48bb78; margin: 20px 0;">
			<p style="margin: 5px 0;"><strong>Списано:</strong> ${amount} ₽</p>
			<p style="margin: 5px 0;"><strong>Действует до:</strong> ${new Date(renewalDate || '').toLocaleDateString('ru-RU')}</p>
		</div>

		<p style="color: #666; font-size: 14px;">Спасибо за то, что пользуетесь ChecklyTool!</p>
	</div>
</body>
</html>
			`

		case 'payment_failed':
			return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Не удалось продлить подписку</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
	<div style="background: linear-gradient(135deg, #f56565 0%, #c53030 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
		<h1 style="color: white; margin: 0;">⚠ Ошибка оплаты</h1>
	</div>

	<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
		<p>Здравствуйте${userName ? `, ${userName}` : ''}!</p>

		<p>К сожалению, не удалось списать ${amount} ₽ за продление подписки ChecklyTool.</p>

		<div style="background: #fff5f5; padding: 20px; border-left: 4px solid #f56565; margin: 20px 0;">
			<p style="margin: 5px 0;"><strong>Возможные причины:</strong></p>
			<ul style="margin: 10px 0; padding-left: 20px;">
				<li>Недостаточно средств на карте</li>
				<li>Карта заблокирована или истек срок действия</li>
				<li>Ограничения банка на онлайн-платежи</li>
			</ul>
		</div>

		${retryCount && retryCount === 1 ? '<p><strong>Повторная попытка списания будет выполнена через 3 дня.</strong></p>' : ''}
		${retryCount && retryCount === 2 ? '<p><strong>Это была последняя попытка. Ваша подписка будет приостановлена.</strong></p>' : ''}

		<div style="text-align: center; margin: 30px 0;">
			<a href="http://91.229.10.157/dashboard/profile" style="display: inline-block; padding: 12px 30px; background: #f56565; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Обновить способ оплаты</a>
		</div>
	</div>
</body>
</html>
			`

		case 'subscription_suspended':
			return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Подписка приостановлена</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
	<div style="background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
		<h1 style="color: white; margin: 0;">Подписка приостановлена</h1>
	</div>

	<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
		<p>Здравствуйте${userName ? `, ${userName}` : ''}!</p>

		<p>Ваша подписка ChecklyTool была приостановлена из-за неуспешных попыток оплаты.</p>

		<p>Вы можете возобновить подписку в любой момент, обновив способ оплаты в настройках профиля.</p>

		<div style="text-align: center; margin: 30px 0;">
			<a href="http://91.229.10.157/dashboard/profile" style="display: inline-block; padding: 12px 30px; background: #ed8936; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Возобновить подписку</a>
		</div>
	</div>
</body>
</html>
			`

		default:
			return '<p>Email content</p>'
	}
}

// Получение заголовка письма по типу
function getEmailSubject(type: string): string {
	switch (type) {
		case 'renewal_reminder':
			return 'Напоминание о продлении подписки ChecklyTool'
		case 'payment_success':
			return 'Подписка ChecklyTool успешно продлена'
		case 'payment_failed':
			return 'Не удалось продлить подписку ChecklyTool'
		case 'subscription_suspended':
			return 'Подписка ChecklyTool приостановлена'
		default:
			return 'Уведомление от ChecklyTool'
	}
}

// Главная функция обработки запросов
serve(async (req) => {
	try {
		// Проверка метода
		if (req.method !== 'POST') {
			return new Response(
				JSON.stringify({ error: 'Method not allowed' }),
				{ status: 405, headers: { 'Content-Type': 'application/json' } }
			)
		}

		// Проверка API ключа
		const apiKey = req.headers.get('x-api-key')
		const expectedApiKey = Deno.env.get('SUBSCRIPTION_API_KEY')

		if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
			console.error('[Edge Function] Invalid or missing API key')
			return new Response(
				JSON.stringify({ error: 'Unauthorized' }),
				{ status: 401, headers: { 'Content-Type': 'application/json' } }
			)
		}

		// Парсинг тела запроса
		const body: EmailRequest = await req.json()
		console.log('[Edge Function] Received request:', {
			type: body.type,
			email: body.email,
			userId: body.userId,
		})

		// Валидация обязательных полей
		if (!body.type || !body.email || !body.userId) {
			return new Response(
				JSON.stringify({ error: 'Missing required fields: type, email, userId' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			)
		}

		// Создание SMTP транспорта
		const transporter = createEmailTransporter()

		// Формирование email
		const mailOptions = {
			from: Deno.env.get('SMTP_FROM') || 'ChecklyTool <noreply@checklytool.com>',
			to: body.email,
			subject: getEmailSubject(body.type),
			html: getEmailHTML(body.type, body),
		}

		console.log('[Edge Function] Sending email to:', body.email)

		// Отправка email
		const info = await transporter.sendMail(mailOptions)

		console.log('[Edge Function] Email sent successfully:', {
			messageId: info.messageId,
			email: body.email,
		})

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Email sent successfully',
				messageId: info.messageId,
				email: body.email,
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		)
	} catch (error) {
		console.error('[Edge Function] Error sending email:', error)

		return new Response(
			JSON.stringify({
				error: 'Failed to send email',
				details: error instanceof Error ? error.message : 'Unknown error',
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		)
	}
})
