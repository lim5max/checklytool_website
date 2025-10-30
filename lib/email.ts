import nodemailer from 'nodemailer'

/**
 * SMTP configuration for sending emails
 */
const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST || 'smtp.mail.ru',
	port: parseInt(process.env.SMTP_PORT || '465'),
	secure: process.env.SMTP_SECURE === 'true',
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASSWORD,
	},
})

/**
 * Interface for password reset email parameters
 */
interface SendPasswordResetEmailParams {
	to: string
	resetToken: string
}

/**
 * Generates HTML template for password reset email
 */
function getPasswordResetEmailTemplate(resetUrl: string): string {
	return `
<!DOCTYPE html>
<html lang="ru">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Сброс пароля - ChecklyTool</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
	<table role="presentation" style="width: 100%; border-collapse: collapse;">
		<tr>
			<td style="padding: 40px 0; text-align: center;">
				<table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
					<!-- Header -->
					<tr>
						<td style="padding: 40px 40px 20px 40px; text-align: center;">
							<h1 style="margin: 0; color: #18181b; font-size: 24px; font-weight: 600;">
								ChecklyTool
							</h1>
						</td>
					</tr>

					<!-- Content -->
					<tr>
						<td style="padding: 20px 40px 40px 40px;">
							<h2 style="margin: 0 0 20px 0; color: #18181b; font-size: 20px; font-weight: 600;">
								Сброс пароля
							</h2>
							<p style="margin: 0 0 20px 0; color: #71717a; font-size: 16px; line-height: 1.5;">
								Вы запросили сброс пароля для вашей учетной записи. Нажмите на кнопку ниже, чтобы создать новый пароль.
							</p>

							<!-- Button -->
							<table role="presentation" style="width: 100%; border-collapse: collapse;">
								<tr>
									<td style="padding: 20px 0; text-align: center;">
										<a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
											Сбросить пароль
										</a>
									</td>
								</tr>
							</table>

							<p style="margin: 20px 0 0 0; color: #71717a; font-size: 14px; line-height: 1.5;">
								Или скопируйте и вставьте эту ссылку в ваш браузер:
							</p>
							<p style="margin: 10px 0 0 0; word-break: break-all;">
								<a href="${resetUrl}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">
									${resetUrl}
								</a>
							</p>

							<!-- Warning -->
							<table role="presentation" style="width: 100%; margin-top: 30px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
								<tr>
									<td style="padding: 16px;">
										<p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;">
											⚠️ <strong>Важно:</strong> Ссылка действительна в течение <strong>15 минут</strong>. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
										</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td style="padding: 20px 40px 40px 40px; border-top: 1px solid #e5e7eb;">
							<p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.5; text-align: center;">
								Это автоматическое письмо от ChecklyTool. Пожалуйста, не отвечайте на него.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
	`.trim()
}

/**
 * Generates plain text version of password reset email
 */
function getPasswordResetEmailText(resetUrl: string): string {
	return `
ChecklyTool - Сброс пароля

Вы запросили сброс пароля для вашей учетной записи.

Перейдите по ссылке ниже, чтобы создать новый пароль:
${resetUrl}

⚠️ ВАЖНО: Ссылка действительна в течение 15 минут.

Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.

---
Это автоматическое письмо от ChecklyTool. Пожалуйста, не отвечайте на него.
	`.trim()
}

/**
 * Sends password reset email to user
 * @param params - Email parameters
 * @throws Error if email sending fails
 */
export async function sendPasswordResetEmail(
	params: SendPasswordResetEmailParams
): Promise<void> {
	const { to, resetToken } = params

	// Construct reset URL
	const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/new-password?token=${resetToken}`

	try {
		await transporter.sendMail({
			from: process.env.SMTP_FROM || 'ChecklyTool <noreply@checklytool.com>',
			to,
			subject: 'Сброс пароля - ChecklyTool',
			text: getPasswordResetEmailText(resetUrl),
			html: getPasswordResetEmailTemplate(resetUrl),
		})

		console.log(`Password reset email sent to: ${to}`)
	} catch (error) {
		console.error('Failed to send password reset email:', error)
		throw new Error('Failed to send password reset email')
	}
}

/**
 * Verifies SMTP connection
 * Used for testing email configuration
 */
export async function verifyEmailConnection(): Promise<boolean> {
	try {
		await transporter.verify()
		console.log('SMTP connection verified successfully')
		return true
	} catch (error) {
		console.error('SMTP connection verification failed:', error)
		return false
	}
}
