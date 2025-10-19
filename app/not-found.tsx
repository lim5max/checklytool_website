import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

/**
 * Страница 404 - Not Found
 * Отображается когда пользователь переходит на несуществующую страницу
 */
export default function NotFound() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
			<div className="max-w-md w-full text-center">
				{/* Иконка */}
				<div className="flex justify-center mb-6">
					<div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
						<FileQuestion className="w-12 h-12 text-blue-600" />
					</div>
				</div>

				{/* Заголовок */}
				<h1 className="font-nunito font-black text-6xl text-slate-800 mb-4">
					404
				</h1>

				<h2 className="font-nunito font-bold text-2xl text-slate-700 mb-3">
					Страница не найдена
				</h2>

				<p className="font-inter text-slate-600 mb-8">
					К сожалению, запрашиваемая страница не существует или была удалена.
					Проверьте правильность адреса или вернитесь на главную.
				</p>

				{/* Кнопки */}
				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					<Link
						href="/"
						className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-inter font-medium rounded-full transition-colors"
					>
						На главную
					</Link>
					<Link
						href="/dashboard"
						className="inline-flex items-center justify-center px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-inter font-medium rounded-full transition-colors"
					>
						В личный кабинет
					</Link>
				</div>
			</div>
		</div>
	)
}
