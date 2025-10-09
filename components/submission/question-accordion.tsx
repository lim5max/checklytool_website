'use client'

import { useState } from 'react'
import { ChevronDown, CheckCircle2, XCircle } from 'lucide-react'

interface QuestionItem {
	question_number: number
	is_correct: boolean
	student_answer?: string
	correct_answer?: string
	feedback?: string
}

interface QuestionAccordionProps {
	questions: QuestionItem[]
}

export function QuestionAccordion({ questions }: QuestionAccordionProps) {
	const [openIndex, setOpenIndex] = useState<number | null>(null)

	const toggleQuestion = (index: number) => {
		setOpenIndex(openIndex === index ? null : index)
	}

	return (
		<div className="space-y-3">
			{questions.map((question, index) => {
				const isOpen = openIndex === index
				const borderColor = question.is_correct ? 'border-green-200' : 'border-red-200'
				const bgColor = question.is_correct ? 'bg-green-50' : 'bg-red-50'

				return (
					<div
						key={index}
						className={`bg-white rounded-2xl border-2 ${borderColor} overflow-hidden transition-all duration-300`}
					>
						{/* Заголовок аккордеона */}
						<button
							onClick={() => toggleQuestion(index)}
							className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
						>
							<div className="flex items-center gap-4">
								{question.is_correct ? (
									<CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
								) : (
									<XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
								)}
								<div className="text-left">
									<span className="font-semibold text-slate-900">
										Вопрос {question.question_number}
									</span>
									<p className="text-sm text-slate-500 mt-1">
										{question.is_correct ? 'Правильно' : 'Неправильно'}
									</p>
								</div>
							</div>
							<ChevronDown
								className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
									isOpen ? 'rotate-180' : ''
								}`}
							/>
						</button>

						{/* Содержимое аккордеона */}
						<div
							className={`overflow-hidden transition-all duration-300 ${
								isOpen ? 'max-h-96' : 'max-h-0'
							}`}
						>
							<div className="p-5 pt-0 space-y-4">
								{/* Ответ ученика */}
								{question.student_answer && (
									<div className={`${bgColor} rounded-xl p-4`}>
										<p className="text-sm font-medium text-slate-700 mb-2">
											Ответ ученика:
										</p>
										<p className="text-slate-900">{question.student_answer}</p>
									</div>
								)}

								{/* Правильный ответ */}
								{question.correct_answer && !question.is_correct && (
									<div className="bg-slate-50 rounded-xl p-4">
										<p className="text-sm font-medium text-slate-700 mb-2">
											Правильный ответ:
										</p>
										<p className="text-slate-900">{question.correct_answer}</p>
									</div>
								)}

								{/* Комментарий AI */}
								{question.feedback && (
									<div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
										<p className="text-sm font-medium text-blue-900 mb-2">
											💡 Комментарий:
										</p>
										<p className="text-blue-800 text-sm">{question.feedback}</p>
									</div>
								)}
							</div>
						</div>
					</div>
				)
			})}
		</div>
	)
}
