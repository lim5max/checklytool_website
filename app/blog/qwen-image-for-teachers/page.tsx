'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const WaitlistModal = dynamic(() => import('@/components/WaitlistModal'), {
	ssr: false
})

export default function QwenImageArticlePage() {
	const [isModalOpen, setIsModalOpen] = useState(false)

	const openModal = () => setIsModalOpen(true)
	const closeModal = () => setIsModalOpen(false)
	return (
		<div className="bg-white min-h-screen">
			<div className="box-border flex flex-col gap-10 items-start justify-start px-4 py-4 relative max-w-[1082px] mx-auto">
				<header className="relative w-full">
					<Suspense fallback={<div className="h-16 bg-slate-50 rounded animate-pulse" />}>
						<Header variant="landing" />
					</Suspense>
				</header>

				<main className="flex flex-col gap-8 items-start justify-start relative w-full pb-16">
					{/* Кнопка назад */}
					<Link href="/blog">
						<Button variant="ghost" size="sm" className="gap-2">
							<ArrowLeft className="w-4 h-4" />
							Назад к блогу
						</Button>
					</Link>

					{/* Заголовок статьи */}
					<article className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
						<header className="flex flex-col gap-6">
							<div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
								<div className="flex items-center gap-2">
									<Calendar className="w-4 h-4" />
									<time dateTime="2025-10-19">19 октября 2025</time>
								</div>
								<div className="flex items-center gap-2">
									<Clock className="w-4 h-4" />
									<span>15 мин чтения</span>
								</div>
							</div>

							<h1 className="font-nunito font-black text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight leading-tight">
								Qwen-Image для учителей: как создавать учебные материалы за 2 минуты
							</h1>

							<div className="flex flex-wrap gap-2">
								<span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
									AI в образовании
								</span>
								<span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
									Инструменты
								</span>
								<span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
									Для учителей
								</span>
							</div>

							{/* TODO: Добавить главное изображение статьи */}
							<div className="w-full  bg-gradient-to-br from-blue-50 to-purple-50  flex items-center justify-center">
								<Image
									src="/images/blog/qwen-image-hero.jpg"
									alt="Пример: Лесные животные и насекомые"
									width={1200}
									height={675}
									className="w-full h-full object-cover aspect-16/9 rounded-2xl"
								/>
							</div>
						</header>

						{/* Контент статьи */}
						<div className="prose prose-lg max-w-none">
							{/* Вступление */}
							<p className="text-xl text-slate-700 leading-relaxed">
								Вы готовитесь к уроку биологии про строение клетки. Нужна схема с подписями органелл. Открываете Google Картинки и начинаете искать: первая без подписей, вторая на английском, третья низкого качества, четвертая с водяным знаком. Час потрачен, идеальной картинки нет.
							</p>

							<p className="text-xl text-slate-700 leading-relaxed">
								Qwen-Image решает эту проблему за 2 минуты. Вы пишете одно предложение на английском (или используете Яндекс Переводчик для перевода), нейросеть создает нужное изображение с правильными подписями, в нужном стиле, идеального качества.
							</p>

							<div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-xl my-8">
								<p className="text-slate-700 leading-relaxed">
									<strong className="text-slate-900">Важно:</strong> Промпты лучше писать на английском языке для достижения наилучших результатов. Если не владеете английским — используйте Яндекс Переводчик или любой другой переводчик. Можно также писать промпты на русском, но качество результата может быть ниже.
								</p>
							</div>

							<hr className="my-12 border-slate-200" />

							{/* Почему Qwen-Image подходит для образования */}
							<section className="my-12">
								<h2 className="font-nunito font-bold text-3xl text-slate-900 mb-6">
									Почему Qwen-Image подходит для образования
								</h2>

								<div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-xl my-8">
									<h3 className="font-nunito font-bold text-2xl text-slate-900 mb-4">
										Главное отличие: правильный текст на изображениях
									</h3>
									<p className="text-slate-700 leading-relaxed">
										Вы пробовали генерировать формулы в Midjourney или DALL-E? Эти нейросети искажают надписи. Формула a²+b²=c² превращается в набор символов, названия городов на картах выглядят как опечатки, химические формулы становятся нечитаемыми.
									</p>
									<p className="text-slate-700 leading-relaxed mt-4">
										Qwen-Image пишет формулы как в учебнике, подписи читаются без искажений, сложные термины отображаются правильно. Поэтому инструмент подходит для создания образовательных материалов.
									</p>
								</div>

								<h3 className="font-nunito font-bold text-2xl text-slate-900 mb-4 mt-8">
									Адаптация под возраст учеников
								</h3>
								<p className="text-slate-700 leading-relaxed">
									Нейросеть создает материалы с учетом возраста учащихся: яркие иллюстрации для начальной школы, строгие научные диаграммы для старшеклассников. Один концепт можно представить в разных формах сложности.
								</p>

								<h3 className="font-nunito font-bold text-2xl text-slate-900 mb-4 mt-8">
									Создание инфографики и схем
								</h3>
								<p className="text-slate-700 leading-relaxed">
									Qwen-Image создает временные шкалы исторических событий, циклические диаграммы природных процессов, структурные схемы, пошаговые инструкции для лабораторных работ. Можно создавать плакаты с QR-кодами, схемы с пронумерованными частями, сравнительные таблицы.
								</p>
							</section>

							<hr className="my-12 border-slate-200" />

							{/* Как использовать для разных предметов */}
							<section className="my-12">
								<h2 className="font-nunito font-bold text-3xl text-slate-900 mb-6">
									Как использовать для разных предметов
								</h2>

								{/* История */}
								<div className="my-8">
									<h3 className="font-nunito font-bold text-2xl text-slate-900 mb-4">
										История
									</h3>
									<p className="text-slate-700 leading-relaxed mb-4">
										Можно создать:
									</p>
									<ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
										<li>Временные линии событий</li>
										<li>Исторические карты с подписями</li>
										<li>Инфографику об эпохах</li>
										<li>Схемы зданий и сооружений</li>
									</ul>

									{/* TODO: Добавить пример истории */}
									<div className="my-6 bg-slate-50 rounded-2xl p-6">
										<h4 className="font-nunito font-bold text-xl text-slate-900 mb-3">
											Пример: Королевский двор эпохи Возрождения
										</h4>
										<div className="bg-slate-200 rounded-xl p-4 flex items-center justify-center mb-4">
											<Image
												src="/images/blog/examples/renaissance-court.png"
												alt="Пример: Лесные животные и насекомые"
												width={800}
												height={800}
												className="max-w-lg max-h-lg object-cover rounded-lg aspect-square"
											/>
										</div>
										<div className="bg-slate-800 rounded-xl p-4 font-mono text-sm text-green-400 overflow-x-auto">
											<p className="whitespace-pre-wrap break-all">
												Create a painting showing a Renaissance royal court with kings, queens, and courtiers in elegant costumes, with intricate architecture, dramatic lighting, and historical atmosphere, suitable for grade 8, in Leonardo da Vinci style.
											</p>
										</div>
										<p className="text-slate-600 mt-4 text-sm">
											<strong>Почему работает:</strong> указан исторический период, стиль художника и атмосфера эпохи.
										</p>
									</div>
								</div>

								{/* Химия */}
								<div className="my-8">
									<h3 className="font-nunito font-bold text-2xl text-slate-900 mb-4">
										Химия
									</h3>
									<p className="text-slate-700 leading-relaxed mb-4">
										Можно создать:
									</p>
									<ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
										<li>Лабораторную посуду и оборудование</li>
										<li>Визуализацию химических реакций</li>
										<li>Структуры молекул</li>
										<li>Таблицы растворимости</li>
									</ul>

									{/* TODO: Добавить пример химии */}
									<div className="my-6 bg-slate-50 rounded-2xl p-6">
										<h4 className="font-nunito font-bold text-xl text-slate-900 mb-3">
											Пример: Лабораторная посуда и химическая реакция
										</h4>
										<div className="bg-slate-200 rounded-xl p-4 flex items-center justify-center mb-4">
											<Image
												src="/images/blog/examples/chemistry-lab.png"
												alt="Пример: Лесные животные и насекомые"
												width={800}
												height={800}
												className="max-w-lg max-h-lg object-cover rounded-lg aspect-square"
											/>
										</div>
										<div className="bg-slate-800 rounded-xl p-4 font-mono text-sm text-green-400 overflow-x-auto">
											<p className="whitespace-pre-wrap break-all">
												Create an illustration showing various laboratory glassware (flasks, beakers, test tubes) and a visible chemical reaction (bubbling, color change, smoke) with realistic details, bright colors, and scientific atmosphere, suitable for grade 7, in modern digital art style.
											</p>
										</div>
										<p className="text-slate-600 mt-4 text-sm">
											<strong>Почему работает:</strong> детально описаны элементы лаборатории и визуальные эффекты реакции.
										</p>
									</div>
								</div>

								{/* Математика */}
								<div className="my-8">
									<h3 className="font-nunito font-bold text-2xl text-slate-900 mb-4">
										Математика
									</h3>
									<p className="text-slate-700 leading-relaxed mb-4">
										Можно создать:
									</p>
									<ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
										<li>Графики функций с точными координатами</li>
										<li>Математические формулы и теоремы</li>
										<li>Диаграммы и схемы</li>
										<li>Системы координат</li>
									</ul>

									{/* TODO: Добавить пример математики */}
									<div className="my-6 bg-slate-50 rounded-2xl p-6">
										<h4 className="font-nunito font-bold text-xl text-slate-900 mb-3">
											Пример: Теорема Пифагора
										</h4>
										<div className="bg-slate-200 rounded-xl p-4 flex items-center justify-center mb-4">
											<Image
												src="/images/blog/examples/pythagorean-theorem.png"
												alt="Пример: Лесные животные и насекомые"
												width={800}
												height={800}
												className="max-w-lg max-h-lg object-cover rounded-lg aspect-square"
											/>
										</div>
										<div className="bg-slate-800 rounded-xl p-4 font-mono text-sm text-green-400 overflow-x-auto">
											<p className="whitespace-pre-wrap break-all">
												Create educational diagram showing the Pythagorean theorem with a right triangle (90-degree angle), sides labeled a, b along the legs, and c as the hypotenuse. Place formula c² = a² + b², clear right angle mark, minimalist clean style, blue and white colors, grid background
											</p>
										</div>
										<p className="text-slate-600 mt-4 text-sm">
											<strong>Почему работает:</strong> указан тип изображения (diagram), перечислено содержание (треугольник + формула), указан стиль (minimalist) и цветовая схема.
										</p>
									</div>
								</div>

								{/* Геометрия */}
								<div className="my-8">
									<h3 className="font-nunito font-bold text-2xl text-slate-900 mb-4">
										Геометрия
									</h3>
									<p className="text-slate-700 leading-relaxed mb-4">
										Можно создать:
									</p>
									<ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
										<li>3D геометрические фигуры</li>
										<li>Чертежи с размерами и углами</li>
										<li>Развертки объемных фигур</li>
										<li>Схемы построений</li>
									</ul>

									{/* TODO: Добавить пример геометрии */}
									<div className="my-6 bg-slate-50 rounded-2xl p-6">
										<h4 className="font-nunito font-bold text-xl text-slate-900 mb-3">
											Пример: 3D геометрические фигуры
										</h4>
										<div className="bg-slate-200 rounded-xl p-4 flex items-center justify-center mb-4">
											<Image
												src="/images/blog/examples/3d-shapes.png"
												alt="Пример: Лесные животные и насекомые"
												width={800}
												height={800}
												className="max-w-lg max-h-lg object-cover rounded-lg aspect-square"
											/>
										</div>
										<div className="bg-slate-800 rounded-xl p-4 font-mono text-sm text-green-400 overflow-x-auto">
											<p className="whitespace-pre-wrap break-all">
												Create an illustration showing various 3D geometric shapes (cube, sphere, pyramid, cylinder, cone) with bright colors, accurate perspective, and shadows, suitable for grade 5, in modern digital art style.
											</p>
										</div>
										<p className="text-slate-600 mt-4 text-sm">
											<strong>Почему работает:</strong> перечислены все нужные фигуры, указана перспектива и тени для объемности.
										</p>
									</div>
								</div>

								{/* Биология */}
								<div className="my-8">
									<h3 className="font-nunito font-bold text-2xl text-slate-900 mb-4">
										Биология
									</h3>
									<p className="text-slate-700 leading-relaxed mb-4">
										Можно создать:
									</p>
									<ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
										<li>Схемы строения клеток, органов, систем</li>
										<li>Диаграммы процессов (фотосинтез, дыхание)</li>
										<li>Фотографии животных и растений</li>
										<li>Циклы развития</li>
									</ul>

									{/* TODO: Добавить пример биологии */}
									<div className="my-6 bg-slate-50 rounded-2xl p-6">
										<h4 className="font-nunito font-bold text-xl text-slate-900 mb-3">
											Пример: Лесные животные и насекомые
										</h4>
										<div className="bg-slate-200 rounded-xl p-4 flex items-center justify-center mb-4">
											<Image
												src="/images/blog/examples/forest-animals.png"
												alt="Пример: Лесные животные и насекомые"
												width={800}
												height={800}
												className="max-w-lg max-h-lg object-cover rounded-lg aspect-square"
											/>
										</div>
										<div className="bg-slate-800 rounded-xl p-4 font-mono text-sm text-green-400 overflow-x-auto">
											<p className="whitespace-pre-wrap break-all">
												Create a photo with a group of forest animals and insects, suitable for grade 6, in a playful, realism style.
											</p>
										</div>
										<p className="text-slate-600 mt-4 text-sm">
											<strong>Почему работает:</strong> указан стиль (реализм с игривым характером) и возраст учеников.
										</p>
									</div>
								</div>
							</section>

							<hr className="my-12 border-slate-200" />

							{/* Пошаговая инструкция */}
							<section className="my-12">
								<h2 className="font-nunito font-bold text-3xl text-slate-900 mb-6">
									Пошаговая инструкция: от регистрации до результата
								</h2>

								<div className="space-y-8">
									{/* Шаг 1 */}
									<div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-6">
										<div className="flex items-start gap-3 sm:gap-4">
											<div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg sm:text-xl">
												1
											</div>
											<div className="flex-1 min-w-0">
												<h3 className="font-nunito font-bold text-lg sm:text-xl text-slate-900 mb-2">
													Регистрация (30 секунд)
												</h3>
												<ol className="list-decimal list-inside space-y-2 text-slate-700">
													<li>Откройте chat.qwen.ai в браузере</li>
													<li>Нажмите &ldquo;Sign Up&rdquo;</li>
													<li>Введите email или войдите через Google</li>
													<li>Подтвердите регистрацию</li>
												</ol>
												<p className="text-slate-600 mt-2 font-medium">
													VPN не нужен.
												</p>
											</div>
										</div>
									</div>

									{/* Шаг 2 */}
									<div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-6">
										<div className="flex items-start gap-3 sm:gap-4">
											<div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg sm:text-xl">
												2
											</div>
											<div className="flex-1 min-w-0">
												<h3 className="font-nunito font-bold text-lg sm:text-xl text-slate-900 mb-2">
													Выбор режима генерации (10 секунд)
												</h3>
												<ol className="list-decimal list-inside space-y-2 text-slate-700">
													<li>В меню слева выберите &ldquo;Image Generation&rdquo;</li>
													<li>Появится поле для ввода текста</li>
												</ol>
											</div>
										</div>
									</div>

									{/* Шаг 3 */}
									<div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-6">
										<div className="flex items-start gap-3 sm:gap-4">
											<div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg sm:text-xl">
												3
											</div>
											<div className="flex-1 min-w-0">
												<h3 className="font-nunito font-bold text-lg sm:text-xl text-slate-900 mb-2">
													Написание промпта
												</h3>

												<div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-xl my-4">
													<p className="font-bold text-slate-900 mb-2">Формула промпта:</p>
													<div className="bg-white rounded-lg p-3 font-mono text-xs sm:text-sm overflow-x-auto">
														<p className="whitespace-nowrap">
															Create + [тип] + showing + [содержание] + with + [детали] + suitable for grade [X] + [стиль]
														</p>
													</div>
												</div>

												<div className="space-y-4 mt-4">
													<div>
														<p className="font-semibold text-slate-900">1. Create — команда создать</p>
													</div>
													<div>
														<p className="font-semibold text-slate-900 mb-2">2. [тип] — что создаем:</p>
														<ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
															<li>diagram (схема)</li>
															<li>illustration (иллюстрация)</li>
															<li>infographic (инфографика)</li>
															<li>chart (диаграмма)</li>
															<li>table (таблица)</li>
														</ul>
													</div>
													<div>
														<p className="font-semibold text-slate-900">3. showing — показывающий (что именно)</p>
													</div>
													<div>
														<p className="font-semibold text-slate-900 mb-2">4. [содержание] — главный объект</p>
													</div>
													<div>
														<p className="font-semibold text-slate-900">5. with — с (какими деталями)</p>
													</div>
													<div>
														<p className="font-semibold text-slate-900 mb-2">6. [детали] — конкретика:</p>
														<ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
															<li>labeled parts (подписанные части)</li>
															<li>clear formulas (четкие формулы)</li>
															<li>arrows showing direction (стрелки, показывающие направление)</li>
														</ul>
													</div>
												</div>
											</div>
										</div>
									</div>

									{/* Шаг 4 */}
									<div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-6">
										<div className="flex items-start gap-3 sm:gap-4">
											<div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg sm:text-xl">
												4
											</div>
											<div className="flex-1 min-w-0">
												<h3 className="font-nunito font-bold text-lg sm:text-xl text-slate-900 mb-2">
													Генерация изображения
												</h3>
												<ol className="list-decimal list-inside space-y-2 text-slate-700">
													<li>Вставьте промпт в поле ввода</li>
													<li>Нажмите &ldquo;Generate&rdquo;</li>
													<li>Подождите 1-2 минуты</li>
												</ol>
											</div>
										</div>
									</div>

									{/* Шаг 5 */}
									<div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-6">
										<div className="flex items-start gap-3 sm:gap-4">
											<div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg sm:text-xl">
												5
											</div>
											<div className="flex-1 min-w-0">
												<h3 className="font-nunito font-bold text-lg sm:text-xl text-slate-900 mb-2">
													Улучшение результата
												</h3>
												<p className="text-slate-700 mb-3">
													Если результат не подходит, добавьте одну из фраз:
												</p>
												<ul className="list-disc list-inside space-y-2 text-slate-700 text-sm sm:text-base">
													<li><code className="bg-slate-100 px-2 py-1 rounded text-xs sm:text-sm break-all">&ldquo;with clear, readable text labels&rdquo;</code> — если текст нечеткий</li>
													<li><code className="bg-slate-100 px-2 py-1 rounded text-xs sm:text-sm break-all">&ldquo;simple and clear for beginners&rdquo;</code> — если слишком сложно</li>
													<li><code className="bg-slate-100 px-2 py-1 rounded text-xs sm:text-sm break-all">&ldquo;detailed and comprehensive&rdquo;</code> — если слишком просто</li>
													<li><code className="bg-slate-100 px-2 py-1 rounded text-xs sm:text-sm break-all">&ldquo;in high contrast colors&rdquo;</code> — если плохо видно на проекторе</li>
												</ul>
											</div>
										</div>
									</div>
								</div>
							</section>

							<hr className="my-12 border-slate-200" />

							{/* Библиотека готовых промптов */}
							<section className="my-12">
								<h2 className="font-nunito font-bold text-3xl text-slate-900 mb-6">
									Библиотека готовых промптов
								</h2>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{/* История */}
									<div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 sm:p-6">
										<h3 className="font-nunito font-bold text-lg sm:text-xl text-slate-900 mb-4">
											История (5-9 класс)
										</h3>
										<div className="space-y-4">
											<div className="bg-white rounded-xl p-3 sm:p-4">
												<p className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">Королевский двор эпохи Возрождения</p>
												<code className="text-xs text-slate-600 break-words block overflow-wrap-anywhere">
													Create a painting showing a Renaissance royal court with kings, queens, and courtiers in elegant costumes, with intricate architecture, dramatic lighting, and historical atmosphere, suitable for grade 8, in Leonardo da Vinci style.
												</code>
											</div>
										</div>
									</div>

									{/* Химия */}
									<div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 sm:p-6">
										<h3 className="font-nunito font-bold text-lg sm:text-xl text-slate-900 mb-4">
											Химия (7-9 класс)
										</h3>
										<div className="space-y-4">
											<div className="bg-white rounded-xl p-3 sm:p-4">
												<p className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">Лабораторная посуда и химическая реакция</p>
												<code className="text-xs text-slate-600 break-words block overflow-wrap-anywhere">
													Create an illustration showing various laboratory glassware (flasks, beakers, test tubes) and a visible chemical reaction (bubbling, color change, smoke) with realistic details, bright colors, and scientific atmosphere, suitable for grade 7, in modern digital art style.
												</code>
											</div>
										</div>
									</div>

									{/* Математика */}
									<div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 sm:p-6">
										<h3 className="font-nunito font-bold text-lg sm:text-xl text-slate-900 mb-4">
											Математика (5-9 класс)
										</h3>
										<div className="space-y-4">
											<div className="bg-white rounded-xl p-3 sm:p-4">
												<p className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">Теорема Пифагора</p>
												<code className="text-xs text-slate-600 break-words block overflow-wrap-anywhere">
													Create educational diagram showing the Pythagorean theorem with a right triangle (90-degree angle), sides labeled a, b along the legs, and c as the hypotenuse. Place formula c² = a² + b², clear right angle mark, minimalist clean style, blue and white colors, grid background
												</code>
											</div>
										</div>
									</div>

									{/* Геометрия */}
									<div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-4 sm:p-6">
										<h3 className="font-nunito font-bold text-lg sm:text-xl text-slate-900 mb-4">
											Геометрия (5-9 класс)
										</h3>
										<div className="space-y-4">
											<div className="bg-white rounded-xl p-3 sm:p-4">
												<p className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">3D геометрические фигуры</p>
												<code className="text-xs text-slate-600 break-words block overflow-wrap-anywhere">
													Create an illustration showing various 3D geometric shapes (cube, sphere, pyramid, cylinder, cone) with bright colors, accurate perspective, and shadows, suitable for grade 5, in modern digital art style.
												</code>
											</div>
										</div>
									</div>

									{/* Биология */}
									<div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 sm:p-6">
										<h3 className="font-nunito font-bold text-lg sm:text-xl text-slate-900 mb-4">
											Биология (5-9 класс)
										</h3>
										<div className="space-y-4">
											<div className="bg-white rounded-xl p-3 sm:p-4">
												<p className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">Лесные животные и насекомые</p>
												<code className="text-xs text-slate-600 break-words block overflow-wrap-anywhere">
													Create a photo with a group of forest animals and insects, suitable for grade 6, in a playful, realism style.
												</code>
											</div>
										</div>
									</div>
								</div>
							</section>

							<hr className="my-12 border-slate-200" />

							{/* Частые вопросы */}
							<section className="my-12">
								<h2 className="font-nunito font-bold text-3xl text-slate-900 mb-6">
									Частые вопросы
								</h2>

								<div className="space-y-4">
									<details className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-600 transition-colors">
										<summary className="font-nunito font-bold text-lg text-slate-900 cursor-pointer">
											Текст на картинке нечеткий. Что делать?
										</summary>
										<div className="mt-4 text-slate-700">
											<p>Добавьте в промпт:</p>
											<code className="block bg-slate-100 px-4 py-2 rounded-lg mt-2">
												with clear, readable text labels, high resolution
											</code>
										</div>
									</details>

									<details className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-600 transition-colors">
										<summary className="font-nunito font-bold text-lg text-slate-900 cursor-pointer">
											Результат слишком сложный. Как упростить?
										</summary>
										<div className="mt-4 text-slate-700">
											<p>Добавьте:</p>
											<code className="block bg-slate-100 px-4 py-2 rounded-lg mt-2">
												simple and clear for beginners, minimalist style
											</code>
										</div>
									</details>

									<details className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-600 transition-colors">
										<summary className="font-nunito font-bold text-lg text-slate-900 cursor-pointer">
											Работает без VPN в России?
										</summary>
										<div className="mt-4 text-slate-700">
											<p className="font-semibold text-green-700">Да. Qwen-Image работает без VPN.</p>
										</div>
									</details>

									<details className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-600 transition-colors">
										<summary className="font-nunito font-bold text-lg text-slate-900 cursor-pointer">
											Нужно платить?
										</summary>
										<div className="mt-4 text-slate-700">
											<p className="font-semibold text-green-700">Базовая версия бесплатна с безлимитным количеством генераций.</p>
										</div>
									</details>
								</div>
							</section>

							<hr className="my-12 border-slate-200" />

							{/* Итог */}
							<section className="my-12">
								<div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white">
									<h2 className="font-nunito font-bold text-3xl mb-6">
										Итог
									</h2>
									<p className="text-lg mb-4">
										После прочтения вы можете:
									</p>
									<ul className="space-y-3 text-lg">
										<li className="flex items-start gap-3">
											<span className="text-2xl">✓</span>
											<span>Создавать учебные схемы и диаграммы за 2 минуты</span>
										</li>
										<li className="flex items-start gap-3">
											<span className="text-2xl">✓</span>
											<span>Генерировать изображения с читаемым текстом</span>
										</li>
										<li className="flex items-start gap-3">
											<span className="text-2xl">✓</span>
											<span>Писать эффективные промпты по формуле</span>
										</li>
										<li className="flex items-start gap-3">
											<span className="text-2xl">✓</span>
											<span>Использовать 30+ готовых шаблонов для разных предметов</span>
										</li>
										<li className="flex items-start gap-3">
											<span className="text-2xl">✓</span>
											<span>Исправлять неудачные результаты</span>
										</li>
										<li className="flex items-start gap-3">
											<span className="text-2xl">✓</span>
											<span>Экономить время на подготовку к урокам</span>
										</li>
									</ul>
									<div className="mt-8 p-6 bg-white/10 backdrop-blur rounded-2xl">
										<p className="text-xl font-semibold">
											Откройте chat.qwen.ai и создайте одно изображение для завтрашнего урока. Потратьте 3 минуты. Увидите результат и поймете, подходит ли инструмент для вашей работы.
										</p>
									</div>
								</div>
							</section>
						</div>
					</article>

					{/* CTA */}
					<div className="w-full max-w-4xl mx-auto mt-12">
						<div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-8 text-center">
							<h3 className="font-nunito font-bold text-2xl text-slate-900 mb-4">
								Хотите сэкономить 20+ часов в мес на проверках сочинений?
							</h3>
							<p className="text-slate-700 mb-6">
								ChecklyTool помогает учителям экономить время на проверке сочинений с помощью AI
							</p>
							<Button
								size="lg"
								className="bg-blue-600 hover:bg-blue-700"
								onClick={openModal}
							>
								Попробовать бесплатно
							</Button>
						</div>
					</div>
				</main>

				<WaitlistModal isOpen={isModalOpen} onClose={closeModal} />

				{/* Footer */}
				<footer className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full pt-8 mt-16 border-t border-slate-200 text-sm text-slate-600">
					<div className="flex flex-col sm:flex-row items-center gap-4">
						<p>©2025 ChecklyTool. Все права защищены.</p>
						<Link
							href="/oferta"
							className="hover:text-slate-900 transition-colors"
						>
							Публичная оферта
						</Link>
					</div>
					<Link
						href="https://www.rusprofile.ru/ip/325774600570532"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-slate-900 transition-colors"
					>
						ИП Штиль М.С.
					</Link>
				</footer>
			</div>
		</div>
	)
}
