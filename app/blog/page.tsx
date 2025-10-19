import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Calendar, Clock } from 'lucide-react'

export default function BlogPage() {
	return (
		<div className="bg-white min-h-screen">
			<div className="box-border flex flex-col gap-10 items-start justify-start px-4 py-4 relative max-w-[1082px] mx-auto">
				<header className="relative w-full">
					<Suspense fallback={<div className="h-16 bg-slate-50 rounded animate-pulse" />}>
						<Header variant="landing" />
					</Suspense>
				</header>

				<main className="flex flex-col gap-12 items-start justify-start relative w-full pb-16">
					{/* Заголовок блога */}
					<section className="flex flex-col gap-4 w-full">
						<h1 className="font-nunito font-black text-4xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight">
							Блог ChecklyTool
						</h1>
						<p className="text-lg sm:text-xl text-slate-600 max-w-3xl">
							Полезные статьи об образовательных технологиях, AI в образовании и эффективной работе учителей
						</p>
					</section>

					{/* Список статей */}
					<section className="grid grid-cols-1 gap-8 w-full">
						{/* Первая статья */}
						<article className="group bg-white border-2 border-slate-200 rounded-3xl overflow-hidden hover:border-blue-600 transition-all duration-300 elevation-sm hover:elevation-lg">
							<Link href="/blog/qwen-image-for-teachers">
								<div className="flex flex-col md:flex-row gap-6 p-6 md:p-8">
									{/* Изображение статьи */}
									<div className="w-full md:w-1/3 flex-shrink-0">
										<div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center">
											{/* TODO: Добавить изображение статьи */}
											<Image
												src="/images/blog/qwen-image-cover.jpg"
												alt="Пример: Лесные животные и насекомые"
												width={800}
												height={800}
												className="w-full h-full object-cover"
											/>
										</div>
									</div>

									{/* Контент статьи */}
									<div className="flex-1 flex flex-col gap-4">
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

										<h2 className="font-nunito font-bold text-2xl sm:text-3xl text-slate-900 group-hover:text-blue-600 transition-colors">
											Qwen-Image для учителей: как создавать учебные материалы за 2 минуты
										</h2>

										<p className="text-slate-600 text-base sm:text-lg line-clamp-3">
											Вы готовитесь к уроку биологии про строение клетки. Нужна схема с подписями органелл. Открываете Google Картинки и начинаете искать... Qwen-Image решает эту проблему за 2 минуты.
										</p>

										<div className="flex flex-wrap gap-2 mt-2">
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

										<div className="mt-auto pt-4">
											<Button variant="ghost" size="sm" className="group-hover:text-blue-600">
												Читать далее →
											</Button>
										</div>
									</div>
								</div>
							</Link>
						</article>

						{/* Заглушка для будущих статей */}
						<div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center gap-4 min-h-[300px]">
							<div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
								<svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
								</svg>
							</div>
							<p className="text-slate-500 text-lg font-medium text-center">
								Скоро здесь появятся новые статьи
							</p>
						</div>
					</section>
				</main>

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
