'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Camera, FileEdit, Sparkles, CheckCircle2, Star } from 'lucide-react'

interface EmptyDashboardProps {
	onCreateTest?: () => void
}

/**
 * Компонент пустого состояния dashboard
 * Показывает три основных пути для начала работы
 */
export function EmptyDashboard({ onCreateTest }: EmptyDashboardProps) {
	const router = useRouter()

	const handleCheckEssay = () => {
		router.push('/dashboard/checks/create')
	}

	const handleCreateTest = () => {
		if (onCreateTest) {
			onCreateTest()
		} else {
			router.push('/dashboard/test-builder')
		}
	}

	const handleCreateAITest = () => {
		router.push('/dashboard/checks/new')
	}

	return (
		<div className="p-4 space-y-6 pb-8">
			{/* Заголовок и описание */}
			<div className="space-y-3">
				<h1 className="font-nunito font-black text-[32px] leading-tight text-slate-800">
					AI проверяет работы по фото
				</h1>
				<p className="font-inter text-base text-slate-600 leading-relaxed">
					Даже если ученик сфотографировал тетрадь — AI оценит по смыслу, структуре и грамматике
				</p>
			</div>

			{/* Вопрос пользователю */}
			<div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[32px] p-6">
				<h2 className="font-nunito font-bold text-xl text-slate-800 mb-2">
					Что вы хотите сделать сегодня?
				</h2>
				<p className="font-inter text-sm text-slate-600">
					Выберите один из трёх путей для начала работы
				</p>
			</div>

			{/* Три основных действия */}
			<div className="space-y-4">
				{/* 1. Проверить сочинение по фото - ГЛАВНАЯ ФУНКЦИЯ */}
				<button
					onClick={handleCheckEssay}
					className="w-full bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 active:scale-[0.98] transition-all rounded-[32px] p-6 text-left shadow-lg"
				>
					<div className="flex items-start gap-4">
						<div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 flex-shrink-0">
							<Camera className="w-8 h-8 text-white" />
						</div>
						<div className="flex-1 space-y-2">
							<div className="flex items-center gap-2">
								<h3 className="font-nunito font-black text-xl text-white">
									Проверить сочинение по фото
								</h3>
								<span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white">
									ГЛАВНОЕ
								</span>
							</div>
							<p className="font-inter text-sm text-white/90 leading-relaxed">
								Загрузите фото работы — AI оценит по смыслу, структуре и грамматике
							</p>
							<div className="flex flex-wrap gap-2 mt-3">
								<span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white">
									📸 Фото
								</span>
								<span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white">
									📄 Скан
								</span>
								<span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white">
									📋 PDF
								</span>
							</div>
						</div>
					</div>
				</button>

				{/* 2. Создать тест для печати - ОСНОВНОЙ ИНСТРУМЕНТ */}
				<button
					onClick={handleCreateTest}
					className="w-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-[0.98] transition-all rounded-[32px] p-6 text-left shadow-lg"
				>
					<div className="flex items-start gap-4">
						<div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 flex-shrink-0">
							<FileEdit className="w-8 h-8 text-white" />
						</div>
						<div className="flex-1 space-y-2">
							<h3 className="font-nunito font-black text-xl text-white">
								Создать тест для печати
							</h3>
							<p className="font-inter text-sm text-white/90 leading-relaxed">
								Быстро оформите контрольную работу и распечатайте как профессионал
							</p>
							<div className="flex flex-wrap gap-2 mt-3">
								<span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white">
									📝 Вопросы
								</span>
								<span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white">
									✓ Варианты
								</span>
								<span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white">
									📊 Таблицы
								</span>
							</div>
						</div>
					</div>
				</button>

				{/* 3. Создать тест с AI-проверкой - ДОПОЛНИТЕЛЬНО */}
				<button
					onClick={handleCreateAITest}
					className="w-full bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 active:scale-[0.98] transition-all rounded-[32px] p-6 text-left border-2 border-slate-300"
				>
					<div className="flex items-start gap-4">
						<div className="bg-white rounded-2xl p-3 flex-shrink-0 shadow-sm">
							<Sparkles className="w-8 h-8 text-slate-700" />
						</div>
						<div className="flex-1 space-y-2">
							<h3 className="font-nunito font-black text-xl text-slate-800">
								Создать тест с AI-проверкой
							</h3>
							<p className="font-inter text-sm text-slate-600 leading-relaxed">
								AI проверит ответы учеников автоматически — идеально для домашних заданий
							</p>
							<div className="flex flex-wrap gap-2 mt-3">
								<span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 shadow-sm">
									🤖 Множественный выбор
								</span>
								<span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 shadow-sm">
									💬 Открытые вопросы
								</span>
							</div>
						</div>
					</div>
				</button>
			</div>

			{/* Возможности платформы */}
			<div className="bg-slate-50 rounded-[32px] p-6 space-y-4">
				<h3 className="font-nunito font-bold text-lg text-slate-800 flex items-center gap-2">
					<Star className="w-5 h-5 text-amber-500" />
					Что умеет Checkly
				</h3>
				<div className="space-y-3">
					<div className="flex items-start gap-3">
						<CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
						<div>
							<p className="font-inter font-semibold text-sm text-slate-800">
								Проверка сочинений по фото
							</p>
							<p className="font-inter text-xs text-slate-600">
								Даже если ученик сфотографировал тетрадь
							</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
						<div>
							<p className="font-inter font-semibold text-sm text-slate-800">
								Создание красивых тестов для печати
							</p>
							<p className="font-inter text-xs text-slate-600">
								С нумерацией, полями и таблицами
							</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
						<div>
							<p className="font-inter font-semibold text-sm text-slate-800">
								AI-проверка ответов
							</p>
							<p className="font-inter text-xs text-slate-600">
								Мгновенная оценка без ручной проверки
							</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<CheckCircle2 className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
						<div>
							<p className="font-inter font-semibold text-sm text-slate-800">
								Массовая загрузка
							</p>
							<p className="font-inter text-xs text-slate-600">
								Обработка нескольких работ одновременно
							</p>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<CheckCircle2 className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
						<div>
							<p className="font-inter font-semibold text-sm text-slate-800">
								Отчеты по результатам
							</p>
							<p className="font-inter text-xs text-slate-600">
								Кто справился, кто нет — всё в одном месте
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Мотивация и прогресс */}
			<div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[32px] p-6 border-2 border-amber-200">
				<div className="flex items-start gap-3">
					<div className="bg-amber-400 rounded-xl p-2 flex-shrink-0">
						<Star className="w-6 h-6 text-white" />
					</div>
					<div className="flex-1">
						<h3 className="font-nunito font-bold text-base text-slate-800 mb-1">
							Ваша первая цель
						</h3>
						<p className="font-inter text-sm text-slate-600 mb-3">
							Загрузите первую работу и получите значок &quot;AI-эксперт&quot;
						</p>
						<div className="flex items-center gap-2">
							<div className="flex-1 bg-white rounded-full h-2 overflow-hidden">
								<div className="bg-gradient-to-r from-amber-400 to-orange-500 h-full w-0 transition-all duration-500"></div>
							</div>
							<span className="font-inter font-bold text-xs text-slate-600">
								0/1
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
