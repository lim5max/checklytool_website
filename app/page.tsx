'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'

export default function Home() {
	const [activeScreen, setActiveScreen] = useState(0)
	const [openFaq, setOpenFaq] = useState<number | null>(null)
	const [checksCount, setChecksCount] = useState(0)
	const phoneRef = useRef<HTMLDivElement>(null)

	// Фейковый счетчик проверок (меняется каждый день от 1000 до 5000)
	useEffect(() => {
		const today = new Date()
		const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()

		// Простой генератор псевдослучайных чисел на основе seed
		const random = (seed * 9301 + 49297) % 233280
		const randomValue = random / 233280

		// Генерируем число от 1000 до 5000
		const count = Math.floor(randomValue * 4000) + 1000

		setChecksCount(count)
	}, [])

	// Обработка скролла для смены экранов телефона в sticky-блоке
	useEffect(() => {
		const handleScroll = () => {
			if (!phoneRef.current) return

			const section = phoneRef.current.closest('section')
			if (!section) return

			const rect = section.getBoundingClientRect()
			const sectionHeight = section.clientHeight
			const viewportHeight = window.innerHeight

			// Прогресс скролла через секцию (0 = начало, 1 = конец)
			const scrollProgress = Math.max(0, Math.min(1, -rect.top / (sectionHeight - viewportHeight)))

			// Разделяем на 4 этапа
			if (scrollProgress < 0.25) setActiveScreen(0)
			else if (scrollProgress < 0.5) setActiveScreen(1)
			else if (scrollProgress < 0.75) setActiveScreen(2)
			else setActiveScreen(3)
		}

		window.addEventListener('scroll', handleScroll)
		handleScroll() // Initial call
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	const screens = [
		{ id: 0, label: 'создайте проверку' },
		{ id: 1, label: 'загрузите работы' },
		{ id: 2, label: 'отправьте на проверку' },
		{ id: 3, label: 'получите оценки' },
	]

	const features = [
		{
			title: 'Проверка сочинений',
			iconPath: '/images/icon-essay.png',
			bullets: [
				'Анализ орфографии и пунктуации',
				'Оценка композиции и логики',
				'Детальная статистика ошибок',
			],
		},
		{
			title: 'Конструктор тестов',
			iconPath: '/images/icon-test-builder.png',
			bullets: [
				'Создание тестов за 2 минуты',
				'AI помощник для вопросов',
				'Автоматическая проверка',
			],
		},
		{
			title: 'Проверка тестых работ',
			iconPath: '/images/icon-grading.png',
			bullets: [
				'Загрузка фото работ',
				'Распознавание ответов',
				'Статистика по классу',
			],
		},
	]

	const audiences = [
		{
			title: 'Учителям',
			benefits: [
				'Проверяйте 30 сочинений за 5 минут вместо 6 часов',
				'Получайте детальную статистику по каждому ученику',
				'Создавайте тесты с AI за 2 минуты',
			],
			description: 'Освободите время для интересных уроков, а рутинную проверку доверьте AI',
		},
		{
			title: 'Репетиторам',
			benefits: [
				'Проверяйте домашние задания автоматически',
				'Отслеживайте прогресс каждого ученика',
				'Берите больше учеников без лишней нагрузки',
			],
			description: 'Увеличьте доход, тратя меньше времени — больше занятий, меньше рутины',
		},
	]

	const faqs = [
		{
			question: 'Как начать пользоваться без регистрации?',
			answer: 'Вы можете создать первую проверку сразу после входа в систему. Регистрация занимает всего 10 секунд.',
		},
		{
			question: 'Есть ли реферальная программа?',
			answer: 'Да! Приглашайте друзей и получайте бонусы на ваш счет. Подробности в личном кабинете.',
		},
		{
			question: 'Можно ли проверять разные типы работ?',
			answer: 'Да, система поддерживает проверку сочинений, тестов, контрольных работ и других типов заданий.',
		},
		{
			question: 'Какая точность проверки?',
			answer: 'Наша AI-система обеспечивает точность проверки более 95% благодаря использованию современных языковых моделей.',
		},
		{
			question: 'Как работает система оценивания?',
			answer: 'Вы можете настривать критерии оценки под себя при создании проверки ',
		},
	]

	return (
		<div className="min-h-screen bg-white font-[family-name:var(--font-inter)]">
			{/* Header */}
			<div className="max-w-[1200px] mx-auto px-6 py-4">
				<Suspense fallback={<div className="h-16 bg-slate-50 rounded animate-pulse" />}>
					<Header variant="landing" />
				</Suspense>
			</div>

			{/* Hero Section */}
			<section className="relative px-6 pt-12 pb-32 2xl:pt-44 2xl:pb-0 overflow-hidden">
				<div className="max-w-[1200px] mx-auto">
					{/* Badge */}
					<div className="flex items-center md:justify-center gap-2 mb-8">
						<Sparkles className="w-5 h-5 text-blue-500" />
						<span className="text-slate-600 font-medium">
							<span className="text-blue-500 font-semibold">{checksCount}</span> работ проверили сегодня
						</span>
					</div>

					{/* Heading */}
					<h1 className="md:text-center mb-6 font-[family-name:var(--font-nunito)] ">
						<span className="block text-5xl md:text-7xl font-black text-slate-900 mb-2 md:leading-16" style={{ letterSpacing: '-0.07em', fontWeight: 900 }}>
							Экономьте{' '}
							<span className="inline-block text-blue-500 md:leading-16 relative">
								20+ часов
								<Image
									src="/icons/line.svg"
									alt=""
									width={298}
									height={11}
									className="absolute -bottom-2 left-0 w-full"
								/>
							</span>
						</span>
						<span className="block text-5xl md:text-7xl font-black text-slate-900 md:leading-16" style={{ letterSpacing: '-0.07em', fontWeight: 900 }}>
							на проверках учениках
						</span>
					</h1>

					{/* Subtitle */}
					<p className="md:text-center text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
						Checkly проверит работы, поставит оценки с детальной статистикой пока вы пьёте чай
					</p>

					{/* CTA Button */}
					<div className="flex md:justify-center w-full">
						<Link href="/auth/register" className="md:w-fit w-full px-8 py-4 bg-blue-500 text-white text-lg font-semibold rounded-full hover:bg-blue-600 transition-all hover:scale-105 shadow-lg shadow-blue-500/30 text-center">
							Создать проверку
						</Link>
					</div>
				</div>
			</section>

			{/* How It Works Section - Sticky Scroll */}
			<section className="relative h-[300vh] md:h-[300vh] ">
				<div className="sticky top-0 h-screen flex items-center justify-center overflow-visible">
					{/* Content Container */}
					<div className="relative w-full max-w-[1440px] mx-auto px-6">
						{/* Blue Blob - Desktop only */}
						<div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1300px] h-[550px] bg-blue-500 rounded-[100px]" />

						{/* Desktop Layout */}
						<div className="hidden md:flex relative z-10 items-center justify-center gap-16 min-h-screen">
							{/* Left Content - Inside Blue */}
							<div className="flex-shrink-0 w-[280px] text-white space-y-6">
								<h2 className="text-5xl font-black font-[family-name:var(--font-nunito)]" style={{ letterSpacing: '-0.02em' }}>
									Как это<br />работает?
								</h2>

								<p className="text-base text-white/90 leading-relaxed">
									Это пример проверки сочинений по русскому языку
								</p>

								<p className="text-base text-white/90 leading-relaxed">
									Также вы можете создавать тесты в нашем конструкторе и проверять их
								</p>
							</div>

							{/* Center - Phone */}
							<div className="flex-shrink-0" ref={phoneRef}>
								<div className="relative w-[340px] h-[690px] transform rotate-3">
									<Image
										src="/images/iphone.png"
										alt="iPhone mockup"
										fill
										className="object-contain drop-shadow-2xl"
										priority
									/>
									{/* Screen Content Overlay */}
									<div className="absolute top-[20px] left-[15px] right-[15px] bottom-[20px]  overflow-hidden">
										{/* Screen transitions based on scroll */}
										<div className="w-full h-full relative">
											{/* Screen 0 - Create Menu */}
											<div className={`-z-10 absolute inset-0 transition-opacity duration-500 ${activeScreen === 0 ? 'opacity-100' : 'opacity-0'}`}>
												<Image
													src="/images/photo-step1.jpg"
													alt="Step 1"
													fill
													className="object-cover object-top"
												/>
											</div>

											{/* Screen 1 - Upload */}
											<div className={`-z-10 absolute inset-0 transition-opacity duration-500 ${activeScreen === 1 ? 'opacity-100' : 'opacity-0'}`}>
												<div className="h-full bg-slate-50 flex items-center justify-center p-6">
													<div className="text-center">
														<div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
															<span className="text-4xl">📤</span>
														</div>
														<h3 className="text-lg font-bold text-slate-900 mb-2">Загрузите работы</h3>
														<p className="text-sm text-slate-600">Сделайте фото или загрузите файлы</p>
													</div>
												</div>
											</div>

											{/* Screen 2 - Processing */}
											<div className={`-z-10 absolute inset-0 transition-opacity duration-500 ${activeScreen === 2 ? 'opacity-100' : 'opacity-0'}`}>
												<Image
													src="/images/photo-step3.jpg"
													alt="Step 3"
													fill
													className="object-cover object-top"
												/>
											</div>

											{/* Screen 3 - Results */}
											<div className={`-z-10 absolute inset-0 transition-opacity duration-500 ${activeScreen === 3 ? 'opacity-100' : 'opacity-0'}`}>
												<Image
													src="/images/photo-step4.jpeg"
													alt="Step 4"
													fill
													className="object-cover object-top"
												/>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Right - Status Steps */}
							<div className="flex-shrink-0 w-[280px] flex flex-col gap-6 items-start">
								{screens.map((screen, index) => (
									<div
										key={screen.id}
										className={`transition-all duration-300 ${
											activeScreen === index
												? 'opacity-100 scale-100'
												: 'opacity-40 scale-95'
										}`}
									>
										<div className={`px-6 py-3 rounded-full font-medium whitespace-nowrap text-sm ${
											activeScreen === index
												? 'bg-white text-slate-900 shadow-lg'
												: 'bg-white/20 text-white'
										}`}>
											{screen.label}
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Mobile Layout */}
						<div className="md:hidden flex flex-col items-center justify-center gap-8 min-h-screen py-12">
							{/* Title */}
							<h2 className="text-4xl font-black text-slate-900 text-center font-[family-name:var(--font-nunito)]">
								Как это работает?
							</h2>

							{/* Phone */}
							<div className="flex-shrink-0">
								<div className="relative w-[280px] h-[568px]">
									<Image
										src="/images/iphone.png"
										alt="iPhone mockup"
										fill
										className="object-contain drop-shadow-2xl"
										priority
									/>
									{/* Screen Content Overlay */}
									<div className="absolute top-[16px] left-[12px] right-[12px] bottom-[16px] overflow-hidden">
										<div className="w-full h-full relative">
											{/* Screen 0 */}
											<div className={`-z-10 absolute inset-0 transition-opacity duration-500 ${activeScreen === 0 ? 'opacity-100' : 'opacity-0'}`}>
												<Image
													src="/images/photo-step1.jpg"
													alt="Step 1"
													fill
													className="object-cover object-top"
												/>
											</div>

											{/* Screen 1 */}
											<div className={`-z-10 absolute inset-0 transition-opacity duration-500 ${activeScreen === 1 ? 'opacity-100' : 'opacity-0'}`}>
												<div className="h-full bg-slate-50 flex items-center justify-center p-4">
													<div className="text-center">
														<div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
															<span className="text-3xl">📤</span>
														</div>
														<h3 className="text-base font-bold text-slate-900 mb-1">Загрузите работы</h3>
														<p className="text-xs text-slate-600">Сделайте фото или загрузите файлы</p>
													</div>
												</div>
											</div>

											{/* Screen 2 */}
											<div className={`-z-10 absolute inset-0 transition-opacity duration-500 ${activeScreen === 2 ? 'opacity-100' : 'opacity-0'}`}>
												<Image
													src="/images/photo-step3.jpg"
													alt="Step 3"
													fill
													className="object-cover object-top"
												/>
											</div>

											{/* Screen 3 */}
											<div className={`-z-10 absolute inset-0 transition-opacity duration-500 ${activeScreen === 3 ? 'opacity-100' : 'opacity-0'}`}>
												<Image
													src="/images/photo-step4.jpeg"
													alt="Step 4"
													fill
													className="object-cover object-top"
												/>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Current Step Label */}
							<div className="bg-blue-500 px-8 py-4 rounded-full">
								<span className="text-white font-semibold text-lg">
									{screens[activeScreen].label}
								</span>
							</div>

						</div>
					</div>
				</div>
			</section>

			{/* Features Cards */}
			<section className="px-6 py-16 md:py-32 2xl:pt-0">
				<div className="max-w-[1200px] mx-auto">
					<div className="grid md:grid-cols-3 gap-6">
						{features.map((feature, index) => (
							<div
								key={index}
								className="group relative bg-slate-50 rounded-[40px] p-8 transition-all duration-500 md:hover:scale-105 md:hover:shadow-2xl cursor-pointer"
								style={{
									transformStyle: 'preserve-3d',
									perspective: '1000px',
								}}
								onMouseEnter={(e) => {
									if (window.innerWidth < 768) return
									const rect = e.currentTarget.getBoundingClientRect()
									const x = e.clientX - rect.left
									const y = e.clientY - rect.top
									const centerX = rect.width / 2
									const centerY = rect.height / 2
									const rotateX = (y - centerY) / 10
									const rotateY = (centerX - x) / 10
									e.currentTarget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`
								}}
								onMouseMove={(e) => {
									if (window.innerWidth < 768) return
									const rect = e.currentTarget.getBoundingClientRect()
									const x = e.clientX - rect.left
									const y = e.clientY - rect.top
									const centerX = rect.width / 2
									const centerY = rect.height / 2
									const rotateX = (y - centerY) / 10
									const rotateY = (centerX - x) / 10
									e.currentTarget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`
								}}
								onMouseLeave={(e) => {
									if (window.innerWidth < 768) return
									e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
								}}
							>
								<div className="relative z-10">
									{/* Icon - appears on top on mobile, on the right on desktop */}
									<div className="mb-4 md:hidden">
										<div className="relative w-16 h-16 transition-transform duration-500 group-hover:rotate-12">
											<Image
												src={feature.iconPath}
												alt={feature.title}
												fill
												className="object-contain"
											/>
										</div>
									</div>

									<div className="flex items-start justify-between mb-6">
										<h3 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-nunito)]">
											{feature.title}
										</h3>
										<div className="hidden md:block relative w-16 h-16 flex-shrink-0 transition-transform duration-500 group-hover:rotate-12">
											<Image
												src={feature.iconPath}
												alt={feature.title}
												fill
												className="object-contain"
											/>
										</div>
									</div>

									<ul className="space-y-2">
										{feature.bullets.map((bullet, i) => (
											<li
												key={i}
												className="flex items-start gap-2 text-sm text-slate-600 transition-all duration-300 group-hover:translate-x-1"
												style={{ transitionDelay: `${i * 50}ms` }}
											>
												<span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 group-hover:scale-150 transition-transform" />
												<span>{bullet}</span>
											</li>
										))}
									</ul>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Audience Section */}
			<section className="px-6 py-16 md:py-32 bg-slate-50 md:overflow-visible">
				<div className="max-w-[1200px] mx-auto md:overflow-visible">
					<h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-center text-slate-900 mb-12 md:mb-20 font-[family-name:var(--font-nunito)]">
						Для кого сервис
					</h2>

					<div className="grid md:grid-cols-2 gap-8 md:gap-16 md:overflow-visible">
						{audiences.map((audience, index) => (
							<div key={index} className="relative bg-white rounded-[40px] p-8 md:p-10 lg:p-12 shadow-lg md:overflow-visible">
								{/* Teacher Illustration - Mobile: before title, Desktop: absolute overflow outside card */}
								<div className="relative w-32 h-32 mb-4 md:hidden">
									<Image
										src={index === 0 ? '/images/teacher1.png' : '/images/teacher2.png'}
										alt={audience.title}
										fill
										className="object-contain"
										priority
									/>
								</div>

								<div className="flex items-start gap-4 relative">
									<div className="flex-1 md:max-w-[350px]">
										<h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 mb-4 md:mb-6 font-[family-name:var(--font-nunito)]" style={{ letterSpacing: '-0.02em' }}>
											{audience.title}
										</h3>

										{/* Benefits list */}
										<ul className="space-y-2 md:space-y-3 mb-4 md:mb-6">
											{audience.benefits.map((benefit, i) => (
												<li key={i} className="flex items-start gap-2">
													<span className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
														<svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
														</svg>
													</span>
													<span className="text-slate-700 text-sm leading-relaxed">{benefit}</span>
												</li>
											))}
										</ul>

										{/* Description */}
										<p className="text-slate-600 text-sm leading-relaxed">
											{audience.description}
										</p>
									</div>

									{/* Teacher Illustration - Desktop only, positioned bottom-right, overflow outside card */}
									<div className="hidden md:block absolute bottom-0 right-0 translate-x-[130px] translate-y-[80px] w-[300px] h-[300px] pointer-events-none">
										<Image
											src={index === 0 ? '/images/teacher1.png' : '/images/teacher2.png'}
											alt={audience.title}
											fill
											className="object-contain"
											priority
										/>
									</div>
								</div>
							</div>
						))}
					</div>

					<div className="flex justify-center mt-16">
						<Link href="/auth/register" className="px-8 py-4 bg-blue-500 text-white text-lg font-semibold rounded-full hover:bg-blue-600 transition-all hover:scale-105 shadow-lg shadow-blue-500/30 flex items-center gap-3">
							Начать экономить
							<Image
								src="/icons/arrow-right.png"
								alt=""
								width={24}
								height={24}
								className="w-6 h-6"
							/>
						</Link>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="md:px-6 py-16 md:py-32">
				<div className="max-w-[1200px] md:mx-auto">
					<div className="bg-blue-500 md:rounded-[60px] p-6 py-12 md:p-16">
						<h2 className="text-4xl md:text-5xl font-black text-white mb-4 md:mb-12 font-[family-name:var(--font-nunito)]">
							Ответы на вопросы
						</h2>

						<div className="space-y-4 max-w-[788px]">
							{faqs.map((faq, index) => (
								<div
									key={index}
									className="border-b border-blue-400/30 last:border-0"
								>
									<button
										onClick={() => setOpenFaq(openFaq === index ? null : index)}
										className="w-full flex items-center justify-between py-5 text-left group"
									>
										<span className="text-lg md:text-xl font-medium text-white pr-8">
											{faq.question}
										</span>
										<ChevronDown
											className={`w-6 h-6 text-white transition-transform flex-shrink-0 ${
												openFaq === index ? 'rotate-180' : ''
											}`}
										/>
									</button>

									{openFaq === index && (
										<div className="pb-6 text-blue-50 text-base md:text-lg">
											{faq.answer}
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-slate-50 border-t border-slate-100 py-12">
				<div className="max-w-[1200px] mx-auto px-6">
					<div className="flex flex-col md:flex-row items-center justify-between gap-6">
						<div className="flex flex-col items-center md:items-start gap-3">
							<p className="text-sm text-slate-600">©2025 ChecklyTool. Все права защищены.</p>
							<div className="flex flex-col md:flex-row gap-3 md:items-start items-center">
								<a
									href="/oferta"
									className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
								>
									Публичная оферта
								</a>
								<a
									href="https://t.me/bogdanvash"
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
								>
									Контакты
								</a>
							</div>
						</div>
						<a
							href="https://www.rusprofile.ru/ip/325774600570532"
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
						>
							ИП Штиль М.С.
						</a>
					</div>
				</div>
			</footer>
		</div>
	)
}
