import { NextRequest, NextResponse } from 'next/server'
import type { PDFGenerationRequest, PDFGenerationResponse } from '@/types/check'

export async function POST(request: NextRequest) {
  try {
    const body: PDFGenerationRequest = await request.json()

    const { testId, title, description, questions, answerType = 'circles', variant = 1 } = body

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
      description,
      questions,
      variant,
      answerType
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
  description,
  questions,
  variant,
  answerType
}: {
  testId: string
  title: string
  description?: string
  questions: Array<{
    question: string
    options: Array<{ text: string }>
  }>
  variant: number
  answerType: 'circles' | 'squares'
}) {
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F']
  const currentDate = new Date().toLocaleDateString('ru-RU')

  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Бланк ответов</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }

        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.4;
          color: #000;
          margin: 0;
          padding: 0;
        }

        .header {
          text-align: center;
          margin-bottom: 20mm;
          border-bottom: 2px solid #000;
          padding-bottom: 10mm;
        }

        .test-title {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 5mm;
        }

        .test-info {
          font-size: 11pt;
          margin-bottom: 3mm;
        }

        .student-info {
          display: flex;
          justify-content: space-between;
          margin: 15mm 0;
          font-size: 11pt;
        }

        .student-field {
          border-bottom: 1px solid #000;
          min-width: 120mm;
          padding-bottom: 1mm;
        }

        .question {
          margin-bottom: 12mm;
          break-inside: avoid;
          padding: 5mm;
          border: 2px solid #e0e0e0;
          border-radius: 4mm;
          background-color: #fefefe;
        }

        .question-number {
          font-weight: bold;
          font-size: 13pt;
          margin-bottom: 3mm;
        }

        .question-text {
          margin-bottom: 6mm;
          padding: 4mm;
          text-align: justify;
          background-color: #f8f9fa;
          border-left: 4px solid #007bff;
          border-radius: 2mm;
          font-weight: 500;
        }

        .options {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3mm;
          padding: 3mm;
          background-color: #f9f9f9;
          border-radius: 3mm;
          border: 1px solid #e9ecef;
        }

        @media print {
          .options {
            grid-template-columns: 1fr 1fr;
          }
        }

        .option {
          display: flex;
          align-items: center;
          margin-bottom: 3mm;
          padding: 2mm;
          border: 1px solid #ddd;
          border-radius: 3mm;
          background-color: #fafafa;
          transition: background-color 0.2s;
        }

        .option:hover {
          background-color: #f0f0f0;
        }

        .answer-mark {
          width: 10mm;
          height: 10mm;
          border: 3px solid #000;
          margin-right: 5mm;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #fff;
          ${answerType === 'circles' ? 'border-radius: 50%;' : 'border-radius: 2px;'}
        }

        .option-label {
          font-weight: bold;
          margin-right: 4mm;
          font-size: 12pt;
          color: #495057;
          min-width: 8mm;
          text-align: center;
        }

        .option-text {
          font-size: 11pt;
          flex: 1;
        }

        .instructions {
          background-color: #e7f3ff;
          border: 2px solid #007bff;
          padding: 6mm;
          margin-bottom: 12mm;
          font-size: 10pt;
          border-radius: 4mm;
        }

        .instructions-title {
          font-weight: bold;
          margin-bottom: 2mm;
        }

        .footer {
          position: fixed;
          bottom: 10mm;
          right: 0;
          font-size: 9pt;
          color: #666;
        }

        .test-id {
          position: fixed;
          top: 10mm;
          right: 0;
          font-size: 8pt;
          color: #666;
        }

        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="test-id">ID: ${testId.slice(-8).toUpperCase()}</div>

      <div class="header">
        <div class="test-title">${title}</div>
        ${description ? `<div class="test-info">${description}</div>` : ''}
        <div class="test-info">Вариант: ${variant} | Дата: ${currentDate}</div>
      </div>

      <div class="student-info">
        <div>
          ФИО: <span class="student-field"></span>
        </div>
        <div>
          Класс: <span class="student-field" style="min-width: 30mm;"></span>
        </div>
      </div>

      <div class="instructions">
        <div class="instructions-title">ИНСТРУКЦИЯ:</div>
        <div>• Для каждого вопроса выберите правильный ответ и ${answerType === 'circles' ? 'полностью закрасьте кружок' : 'поставьте четкую галочку в квадрате'}</div>
        <div>• При исправлениях: полностью зачеркните неправильный ответ и четко отметьте правильный</div>
        <div>• Используйте только черную или темно-синюю ручку</div>
        <div>• Отмечайте ответы четко и аккуратно - от этого зависит точность автоматической проверки</div>
        <div>• Не делайте лишних пометок на бланке и не выходите за границы полей для ответов</div>
      </div>

      ${questions.map((question, index) => `
        <div class="question">
          <div class="question-number">${index + 1}.</div>
          <div class="question-text">${question.question}</div>
          <div class="options">
            ${question.options.map((option: { text: string }, optIndex: number) => `
              <div class="option">
                <div class="answer-mark"></div>
                <span class="option-label">${optionLabels[optIndex]})</span>
                <span class="option-text">${option.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}

      <div class="footer">
        ChecklyTool - Система автоматической проверки
      </div>

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