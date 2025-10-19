import { NextRequest, NextResponse } from 'next/server'
import type { PDFGenerationRequest, PDFGenerationResponse } from '@/types/check'

export async function POST(request: NextRequest) {
  try {
    const body: PDFGenerationRequest = await request.json()

    const { testId, title, questions, variant = 1 } = body

    // Валидация входных данных
    if (!testId || !title || !questions || questions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Некорректные данные для генерации PDF'
      } as PDFGenerationResponse, { status: 400 })
    }

    // Генерируем HTML для PDF (стандартизированный формат бланка)
    const htmlContent = generateTestHTML({
      testId,
      title,
      questions,
      variant,
    })

    // Поскольку jsPDF работает только в браузере, возвращаем HTML для генерации на клиенте
    // В production можно использовать Puppeteer для серверной генерации
    return NextResponse.json({
      success: true,
      htmlContent,
      downloadData: {
        testId,
        title,
        variant,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Внутренняя ошибка сервера при генерации PDF'
    } as PDFGenerationResponse, { status: 500 })
  }
}

function generateTestHTML({
  testId,
  title,
  questions,
  variant,
}: {
  testId: string
  title: string
  questions: Array<{
    question: string
    options: Array<{ text: string }>
    type?: string
    points?: number
    hideOptionsInPDF?: boolean
    imageUrl?: string
  }>
  variant: number
}) {
  const testIdentifier = `#CT${testId.slice(-6).toUpperCase()}`

  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title></title>
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }

        /* Убираем браузерные колонтитулы при печати */
        @media print {
          @page {
            margin: 15mm;
            margin-top: 10mm;
            margin-bottom: 10mm;
          }

          /* Скрываем браузерные элементы */
          @page :first {
            margin-top: 10mm;
          }

          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Убираем заголовки и футеры браузера */
          body::before,
          body::after {
            display: none !important;
          }
        }

        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.4;
          color: #000;
          margin: 0;
          padding: 0;
        }


        .test-title {
          font-size: 18pt;
          font-weight: bold;
          text-align: center;
          margin-bottom: 3mm;
        }

        .test-info {
          text-align: center;
          font-size: 11pt;
          margin-bottom: 8mm;
          font-weight: bold;
        }

        .student-info {
          position: absolute;
          top: 15mm;
          right: 15mm;
          text-align: right;
          font-size: 9pt;
        }

        .student-field {
          border-bottom: 1px solid #000;
          min-width: 45mm;
          padding-bottom: 1mm;
          display: inline-block;
        }

        .question {
          margin-bottom: 5mm;
          break-inside: avoid;
        }

        .question-header {
          display: flex;
          align-items: baseline;
          margin-bottom: 2mm;
        }

        .question-number {
          font-weight: bold;
          font-size: 13pt;
          margin-right: 4mm;
          flex-shrink: 0;
        }

        .question-text {
          font-size: 12pt;
          flex: 1;
        }

        .options {
          margin-left: 8mm;
          margin-bottom: 3mm;
        }

        .option {
          margin-bottom: 1mm;
          font-size: 11pt;
        }

        .answer-section {
          margin-left: 8mm;
          margin-top: 2mm;
        }

        .answer-label {
          font-weight: bold;
          margin-right: 2mm;
        }

        .answer-box {
          display: inline-flex;
          gap: 0mm;
          vertical-align: middle;
        }

        .answer-cell {
          border: 1px solid #000;
          width: 6mm;
          height: 6mm;
          display: inline-block;
          box-sizing: border-box;
        }

        .question-image {
          margin: 4mm 0;
          max-width: 100%;
          max-height: 80mm;
          display: block;
          border: 1px solid #ddd;
          page-break-inside: avoid;
        }

        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="test-title">${title}</div>

      <div class="test-info">Вариант: ${variant} ${testIdentifier}</div>

      <div class="student-info">
        <div style="margin-bottom: 2mm;">
          ФИО: <span class="student-field"></span>
        </div>
        <div>
          Класс: <span class="student-field" style="min-width: 20mm;"></span>
        </div>
      </div>

      ${questions.map((question, index) => `
        <div class="question">
          <div class="question-header">
            <div class="question-number">${index + 1}.</div>
            <div class="question-text">${question.question}</div>
            ${question.points && question.points > 1 ? `<div style="margin-left: auto; font-size: 11pt; color: #666;">(${question.points} балл${question.points === 1 ? '' : question.points < 5 ? 'а' : 'ов'})</div>` : ''}
          </div>

          ${question.imageUrl ? `
          <div style="margin-left: 8mm;">
            <img src="${question.imageUrl}" class="question-image" alt="Изображение к вопросу ${index + 1}" />
          </div>
          ` : ''}

          ${!question.hideOptionsInPDF && question.type !== 'open' ? `
          <div class="options">
            ${question.options.map((option: { text: string }, optIndex: number) => `
              <div class="option">${optIndex + 1}) ${option.text}</div>
            `).join('')}
          </div>
          ` : ''}

          <div class="answer-section">
            <span class="answer-label">Ответ</span>
            <span class="answer-box">
              ${Array.from({ length: 10 }).map(() => '<span class="answer-cell"></span>').join('')}
            </span>
          </div>
        </div>
      `).join('')}

      <script>
        // Автоматически открыть диалог печати
        window.onload = function() {
          setTimeout(() => window.print(), 100);
        };
      </script>
    </body>
    </html>
  `
}