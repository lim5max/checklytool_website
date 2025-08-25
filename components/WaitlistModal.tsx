'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Mobile Close Button - Top */}
      <button
        onClick={handleClose}
        className="md:hidden absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white rounded-full shadow-lg z-10"
        disabled={isSubmitting}
        aria-label="Закрыть"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start justify-center gap-3 md:gap-[13px]">
        {/* Main Modal */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="waitlist-title"
          className="bg-white flex flex-col gap-2.5 items-center justify-start overflow-hidden px-6 md:px-[42px] py-6 md:py-9 relative rounded-4xl md:rounded-[52px] shadow-[0px_0px_24px_-5px_rgba(131,138,145,0.25)] w-full max-w-[90vw] md:w-[545px]"
        >
          {!isSuccess ? (
            <>
              {/* Decorative Image */}
              <div className="absolute flex h-[70px] md:h-[108px] items-center justify-center right-[-16px] top-[-10px] md:top-[-18px] w-[70px] md:w-[108px]">
                <div className="flex-none rotate-[342deg]">
                  <div 
                    className="w-[56px] h-[56px] md:w-[86px] md:h-[86px] bg-cover bg-center bg-no-repeat" 
                    style={{ backgroundImage: 'url(/images/logo_five.png)' }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-7 items-center justify-start relative w-full">
                {/* Header */}
                <div className="flex flex-col gap-[13px] items-center justify-start text-center w-full">
                  <h1 id="waitlist-title" className="font-nunito font-black text-3xl md:text-[42px] text-slate-900 tracking-[-1px] leading-[1.2] max-w-full">
                    Ускоряйте свою работу с Checkly
                  </h1>
                  <p className="font-inter font-normal text-lg md:text-[20px] text-slate-800 leading-[1.6] max-w-full">
                    Скоро запуск, дарим выгодную подписку от 200 ₽ в месяц
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 items-start justify-start w-full">
                  <div className="flex flex-col gap-4 items-start justify-start w-full">
                    {/* Email Input */}
                    <div className="bg-white h-14 relative rounded-[1200px] w-full">
                      
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Введите вашу почту"
                          className=" font-inter font-medium text-[18px] h-14 w-full px-6 py-0 text-slate-700 leading-[1.6] border-none outline-none placeholder:text-slate-400"
                          disabled={isSubmitting}
                        />
                      
                      <div className="absolute border border-slate-200 border-solid inset-0 pointer-events-none rounded-[1200px] shadow-[0px_0.301px_1.505px_-1.5px_rgba(0,0,0,0.08),0px_1.144px_5.721px_-3px_rgba(0,0,0,0.04)]" />
                    </div>

                    {/* Checkbox */}
                    <div className="flex gap-2.5 items-center justify-start w-full">
                      <label htmlFor="agreement" className="flex gap-2.5 items-center justify-start cursor-pointer">
                        <div className="bg-white relative rounded-xl w-8 h-8 min-w-8 flex items-center justify-center">
                          <input
                            type="checkbox"
                            id="agreement"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="absolute opacity-0 w-full h-full cursor-pointer"
                            disabled={isSubmitting}
                          />
                          {agreed && (
                            <svg className="w-4 h-4 text-blue-600 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          <div className="absolute border border-slate-200 border-solid inset-0 pointer-events-none rounded-xl shadow-[0px_0.301px_1.505px_-1.5px_rgba(0,0,0,0.08),0px_1.144px_5.721px_-3px_rgba(0,0,0,0.04)]" />
                        </div>
                        <span className="font-inter font-normal text-[16px] text-slate-800  leading-[1.6]">
                          Соглашаюсь с{' '}
                          <Link href="/privacy" className="text-slate-800 underline">
                            условиями обработки данных
                          </Link>
                        </span>
                      </label>
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-600 text-sm w-full" aria-live="polite">{error}</p>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !email || !agreed}
                    aria-busy={isSubmitting ? true : undefined}
                    className="bg-[#096ff5] hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed flex gap-2 h-14 items-center justify-center overflow-hidden px-5 py-3 relative rounded-[1200px] shadow-[0px_0.301px_1.505px_-1.5px_rgba(0,0,0,0.08),0px_1.144px_5.721px_-3px_rgba(0,0,0,0.04)] w-full transition-colors duration-200"
                  >
                    <span className="font-inter font-medium text-white text-[16px] leading-[1.6]">
                      {isSubmitting ? 'Отправка...' : 'Отправить'}
                    </span>
                  </button>
                </form>
              </div>
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

        {/* Desktop Close Button */}
        <button
          onClick={handleClose}
          className="hidden md:flex w-[52px] h-[52px] items-center justify-center text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white rounded-full shadow-lg"
          disabled={isSubmitting}
          aria-label="Закрыть"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}