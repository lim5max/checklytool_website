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
          display: flex;
          justify-content: space-between;
          margin-bottom: 12mm;
          font-size: 11pt;
        }

        .student-field {
          border-bottom: 1px solid #000;
          min-width: 120mm;
          padding-bottom: 1mm;
        }

        .question {
          margin-bottom: 8mm;
          break-inside: avoid;
        }

        .question-header {
          display: flex;
          align-items: baseline;
          margin-bottom: 4mm;
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
          margin-bottom: 6mm;
        }

        .option {
          margin-bottom: 2mm;
          font-size: 11pt;
        }

        .answer-section {
          margin-left: 8mm;
          margin-top: 4mm;
        }

        .answer-label {
          font-weight: bold;
          margin-right: 4mm;
        }

        .answer-box {
          border: 2px solid #000;
          width: calc(100% - 20mm);
          height: 8mm;
          display: inline-block;
          vertical-align: middle;
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
        <div>
          ФИО: <span class="student-field"></span>
        </div>
        <div>
          Класс: <span class="student-field" style="min-width: 30mm;"></span>
        </div>
      </div>

      ${questions.map((question, index) => `
        <div class="question">
          <div class="question-header">
            <div class="question-number">${index + 1}.</div>
            <div class="question-text">${question.question}</div>
            ${question.points && question.points > 1 ? `<div style="margin-left: auto; font-size: 11pt; color: #666;">(${question.points} балл${question.points === 1 ? '' : question.points < 5 ? 'а' : 'ов'})</div>` : ''}
          </div>

          ${!question.hideOptionsInPDF && question.type !== 'open' ? `
          <div class="options">
            ${question.options.map((option: { text: string }, optIndex: number) => `
              <div class="option">${String.fromCharCode(65 + optIndex)}) ${option.text}</div>
            `).join('')}
          </div>
          ` : ''}

          <div class="answer-section">
            <span class="answer-label">Ответ</span>
            <span class="answer-box"></span>
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