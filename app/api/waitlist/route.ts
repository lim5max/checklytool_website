import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Убедимся что API ключ имеет правильный формат
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Валидация email
    if (!email || !email.includes('@') || email.length < 5) {
      return NextResponse.json(
        { error: 'Неверный email адрес' },
        { status: 400 }
      );
    }

    // Проверяем наличие API ключа
    if (!apiKey || !resend) {
      console.error('RESEND_API_KEY не найден в переменных окружения');
      return NextResponse.json(
        { error: 'Сервис временно недоступен' },
        { status: 500 }
      );
    }

    // Проверяем формат API ключа
    if (!apiKey.startsWith('re_')) {
      console.error('RESEND_API_KEY должен начинаться с "re_"');
      return NextResponse.json(
        { error: 'Неверная конфигурация API' },
        { status: 500 }
      );
    }

    // Проверяем наличие audienceId
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    if (!audienceId) {
      console.error('RESEND_AUDIENCE_ID не найден в переменных окружения');
      return NextResponse.json(
        { error: 'Аудитория не настроена. Пожалуйста, создайте аудиторию в Resend и добавьте RESEND_AUDIENCE_ID в .env файл' },
        { status: 500 }
      );
    }

    // Создаем контакт в Resend
    try {
      const contact = await resend.contacts.create({
        email: email,
        unsubscribed: false,
        audienceId: audienceId
      });

      console.log('Контакт создан:', contact);

      return NextResponse.json({ 
        success: true,
        message: 'Email успешно добавлен в список ожидания' 
      });

    } catch (resendError: unknown) {
      console.error('Ошибка Resend:', resendError);
      
      // Проверяем специфические ошибки Resend
      const errorMessage = resendError instanceof Error ? resendError.message : String(resendError);
      
      if (errorMessage.includes('already exists')) {
        return NextResponse.json({ 
          success: true,
          message: 'Email уже добавлен в список ожидания' 
        });
      }
      
      if (errorMessage.includes('audience') || errorMessage.includes('validation_error')) {
        // Если ошибка с аудиторией или валидацией, сообщаем пользователю
        console.error('Ошибка audienceId:', errorMessage);
        return NextResponse.json(
          { 
            error: 'Не удалось добавить email. Пожалуйста, проверьте настройки аудитории в Resend.',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
          },
          { status: 500 }
        );
      }
      
      throw resendError;
    }

  } catch (error: unknown) {
    console.error('Общая ошибка waitlist:', error);
    
    return NextResponse.json(
      { 
        error: 'Произошла ошибка при добавлении email. Попробуйте позже.',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}