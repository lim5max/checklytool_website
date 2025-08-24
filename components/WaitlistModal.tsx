'use client';

import { useState } from 'react';
import Link from 'next/link';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !agreed) {
      setError('Пожалуйста, заполните все поля и согласитесь с условиями');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при отправке');
      }

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setEmail('');
        setAgreed(false);
      }, 3000);
    } catch {
      setError('Произошла ошибка. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setError('');
      setIsSuccess(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-title"
        className="bg-white bg-gradient-to-b from-white to-slate-50 rounded-2xl max-w-md w-full p-8 relative animate-in zoom-in-90 duration-200 ring-1 ring-slate-200 shadow-xl"
      >
        {!isSuccess ? (
          <>
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              disabled={isSubmitting}
              aria-label="Закрыть"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 id="waitlist-title" className="font-nunito font-black text-2xl text-slate-900 mb-2">
                Скоро запуск!
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Мы активно работаем над ChecklyTool. Подписка будет стоить от 200 ₽ в месяц.
                Оставьте заявку и получите специальное предложение для первых пользователей!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email адрес
                </label>
                <div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.ru"
                    className={`w-full px-4 py-3 rounded-full outline-none transition-colors
                      ${error ? 'border border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500' : 'border border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}
                    `}
                    disabled={isSubmitting}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Мы отправим одно письмо с анонсом. Без спама.
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="agreement"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1.5 h-5 w-5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  disabled={isSubmitting}
                />
                <label htmlFor="agreement" className="text-sm text-slate-600">
                  Соглашаюсь с{' '}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    условиями обработки персональных данных
                  </Link>
                </label>
              </div>

              {error && (
                <p className="text-red-600 text-sm" aria-live="polite">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !email || !agreed}
                aria-busy={isSubmitting ? true : undefined}
                className="w-full bg-[#096ff5] hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-full transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Отправка...
                  </>
                ) : (
                  'Оставить заявку'
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center animate-in zoom-in-90 duration-300" role="status">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-nunito font-black text-2xl text-slate-900 mb-2">
              Заявка принята!
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Спасибо! Мы напишем вам с лучшим предложением в качестве одного из первых пользователей ChecklyTool.
            </p>
            <div className="flex justify-center">
              <div className="inline-flex items-center text-sm text-blue-600">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Закрывается автоматически...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}