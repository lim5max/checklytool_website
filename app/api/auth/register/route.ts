import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

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
    console.log('[REGISTER] Environment check:')
    console.log('  - NODE_ENV:', process.env.NODE_ENV)
    console.log('  - RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
    console.log('  - RESEND_API_KEY starts with:', process.env.RESEND_API_KEY?.substring(0, 8))
    console.log('  - RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length)

    // TODO: Add actual user registration logic here
    // This would typically involve:
    // 1. Checking if user already exists
    // 2. Hashing the password
    // 3. Saving user to database
    
    // Try to send welcome email via Resend with detailed error handling
    let emailSent = false
    let emailError = null
    
    try {
      console.log('[REGISTER] Attempting to initialize Resend client...')
      
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) {
        throw new Error('RESEND_API_KEY is not set in environment variables')
      }
      
      if (!apiKey.startsWith('re_')) {
        throw new Error('RESEND_API_KEY appears to be invalid (should start with "re_")')
      }
      
      const resend = new Resend(apiKey)
      console.log('[REGISTER] Resend client initialized successfully')
      
      console.log('[REGISTER] Sending welcome email...')
      const emailResult = await resend.emails.send({
      from: 'ChecklyTool <noreply@resend.dev>',
      to: [email],
      subject: 'Добро пожаловать в ChecklyTool!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937; text-align: center;">Добро пожаловать в ChecklyTool!</h1>
          <p>Привет, <strong>${fullName}</strong>!</p>
          <p>Спасибо за регистрацию в ChecklyTool - платформе для автоматической проверки школьных работ с помощью ИИ.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Ваши данные:</strong></p>
            <p>📧 Email: ${email}</p>
            <p>👤 Имя: ${fullName}</p>
          </div>
          
          <p>Теперь вы можете:</p>
          <ul>
            <li>✅ Загружать работы школьников</li>
            <li>🤖 Получать автоматические оценки от ИИ</li>
            <li>📊 Просматривать детальные отчеты</li>
            <li>⚡ Экономить время на проверке</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/auth/login" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Войти в ChecklyTool
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Если у вас есть вопросы, просто ответьте на это письмо.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            ChecklyTool - Автоматическая проверка школьных работ<br>
            Это письмо отправлено автоматически, пожалуйста, не отвечайте на него.
          </p>
        </div>
      `,
      text: `
        Добро пожаловать в ChecklyTool!
        
        Привет, ${fullName}!
        
        Спасибо за регистрацию в ChecklyTool - платформе для автоматической проверки школьных работ с помощью ИИ.
        
        Ваши данные:
        Email: ${email}
        Имя: ${fullName}
        
        Теперь вы можете:
        - Загружать работы школьников
        - Получать автоматические оценки от ИИ
        - Просматривать детальные отчеты
        - Экономить время на проверке
        
        Войти в ChecklyTool: http://localhost:3000/auth/login
        
        Если у вас есть вопросы, просто ответьте на это письмо.
        
        ChecklyTool - Автоматическая проверка школьных работ
      `,
      })

      console.log('[REGISTER] Email API response:', emailResult)
      
      if (emailResult.error) {
        console.error('[REGISTER] Resend API returned error:', emailResult.error)
        throw new Error(`Resend API error: ${emailResult.error.message || 'Unknown error'}`)
      }
      
      if (emailResult.data?.id) {
        console.log('[REGISTER] Email sent successfully with ID:', emailResult.data.id)
        emailSent = true
      } else {
        console.warn('[REGISTER] Email sent but no ID returned:', emailResult)
        emailSent = true // Still consider it successful
      }
      
    } catch (error) {
      emailError = error instanceof Error ? error.message : String(error)
      console.error('[REGISTER] Failed to send email:', emailError)
      console.error('[REGISTER] Full error object:', error)
      
      // Don't fail registration if email fails
      emailSent = false
    }

    // Always return success for registration, even if email fails
    const response = {
      message: emailSent 
        ? 'Регистрация прошла успешно! Проверьте почту.' 
        : 'Регистрация прошла успешно! (Email-уведомление временно недоступно)',
      success: true,
      emailSent,
      ...(emailError && { emailError })
    }
    
    console.log('[REGISTER] Registration completed:', response)
    return NextResponse.json(response)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message || 'Validation error', success: false },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    
    // Check if it's a Resend API error
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          message: `Ошибка при отправке письма: ${error.message}`, 
          success: false 
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Ошибка при регистрации', success: false },
      { status: 500 }
    )
  }
}