import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'

export const metadata = {
	title: 'Публичная оферта | ChecklyTool',
	description: 'Публичная оферта на оказание услуг ChecklyTool',
}

export default function OfertaPage() {
	return (
		<div className="bg-white min-h-screen">
			<div className="max-w-4xl mx-auto px-4 py-8">
				{/* Навигация назад */}
				<Link
					href="/"
					className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-8"
				>
					<ArrowLeft className="w-5 h-5" />
					На главную
				</Link>

				{/* Заголовок */}
				<div className="mb-8">
					<h1 className="font-nunito font-black text-4xl sm:text-5xl text-slate-900 tracking-tight mb-4">
						Публичная оферта
					</h1>
					<p className="text-slate-600 text-lg">
						Договор-оферта на оказание информационно-консультационных услуг
					</p>
				</div>

				{/* Кнопка скачивания */}
				<div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<div>
							<h2 className="font-nunito font-bold text-xl text-slate-900 mb-2">
								Скачать документ
							</h2>
							<p className="text-slate-600 text-sm">
								Публичная оферта в формате DOCX
							</p>
						</div>
						<a
							href="/documents/oferta.docx"
							download="Публичная_оферта_ChecklyTool.docx"
							className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
						>
							<Download className="w-5 h-5" />
							Скачать DOCX
						</a>
					</div>
				</div>

				{/* Содержание оферты */}
				<div className="prose prose-slate max-w-none">
					<section className="mb-8">
						<h2 className="font-nunito font-bold text-2xl text-slate-900 mb-4">
							1. Общие положения
						</h2>
						<div className="text-slate-700 leading-relaxed space-y-4">
							<p>
								Настоящая публичная оферта (далее — «Оферта») является официальным предложением
								Индивидуального предпринимателя Штиль Максима Сергеевича (ИНН: 325774600570532,
								ОГРНИП: 325774600570532) (далее — «Исполнитель») заключить договор на оказание
								информационно-консультационных услуг на условиях, изложенных ниже.
							</p>
							<p>
								Акцептом настоящей Оферты является регистрация Пользователя на сайте
								checklytool.com и начало использования услуг Сервиса.
							</p>
						</div>
					</section>

					<section className="mb-8">
						<h2 className="font-nunito font-bold text-2xl text-slate-900 mb-4">
							2. Предмет договора
						</h2>
						<div className="text-slate-700 leading-relaxed space-y-4">
							<p>
								Исполнитель предоставляет Заказчику доступ к веб-сервису ChecklyTool,
								предназначенному для автоматизированной проверки учебных работ с использованием
								технологий искусственного интеллекта.
							</p>
							<p>Услуги включают:</p>
							<ul className="list-disc pl-6 space-y-2">
								<li>Автоматизированную проверку тестов</li>
								<li>Автоматизированную проверку сочинений</li>
								<li>Автоматизированную проверку контрольных работ</li>
								<li>Конструктор тестов для создания проверочных материалов</li>
								<li>Хранение результатов проверок</li>
							</ul>
						</div>
					</section>

					<section className="mb-8">
						<h2 className="font-nunito font-bold text-2xl text-slate-900 mb-4">
							3. Стоимость услуг и порядок оплаты
						</h2>
						<div className="text-slate-700 leading-relaxed space-y-4">
							<p>
								Стоимость услуг определяется в соответствии с действующими тарифными планами,
								размещенными на сайте checklytool.com.
							</p>
							<p>
								Оплата производится путем перечисления денежных средств через платежную
								систему Т-Банк на расчетный счет Исполнителя.
							</p>
							<p>
								Услуги предоставляются на основе предоплаты путем пополнения баланса проверок.
							</p>
						</div>
					</section>

					<section className="mb-8">
						<h2 className="font-nunito font-bold text-2xl text-slate-900 mb-4">
							4. Права и обязанности сторон
						</h2>
						<div className="text-slate-700 leading-relaxed space-y-4">
							<p className="font-semibold">Исполнитель обязуется:</p>
							<ul className="list-disc pl-6 space-y-2">
								<li>Обеспечить доступ к Сервису в соответствии с выбранным тарифным планом</li>
								<li>Обеспечить конфиденциальность данных Заказчика</li>
								<li>Предоставлять техническую поддержку в рабочее время</li>
							</ul>

							<p className="font-semibold mt-4">Заказчик обязуется:</p>
							<ul className="list-disc pl-6 space-y-2">
								<li>Своевременно оплачивать услуги</li>
								<li>Использовать Сервис в соответствии с его назначением</li>
								<li>Не передавать свои учетные данные третьим лицам</li>
								<li>Соблюдать применимое законодательство при использовании Сервиса</li>
							</ul>
						</div>
					</section>

					<section className="mb-8">
						<h2 className="font-nunito font-bold text-2xl text-slate-900 mb-4">
							5. Ответственность сторон
						</h2>
						<div className="text-slate-700 leading-relaxed space-y-4">
							<p>
								Исполнитель не несет ответственности за перебои в работе Сервиса, вызванные
								техническими неполадками, не зависящими от Исполнителя.
							</p>
							<p>
								Результаты автоматизированной проверки носят рекомендательный характер.
								Окончательная оценка работ учащихся остается на усмотрении преподавателя.
							</p>
						</div>
					</section>

					<section className="mb-8">
						<h2 className="font-nunito font-bold text-2xl text-slate-900 mb-4">
							6. Возврат денежных средств
						</h2>
						<div className="text-slate-700 leading-relaxed space-y-4">
							<p>
								Возврат денежных средств производится в соответствии с законодательством
								Российской Федерации при условии обоснованности претензии Заказчика.
							</p>
							<p>
								Заявки на возврат рассматриваются в течение 10 рабочих дней с момента
								обращения Заказчика.
							</p>
						</div>
					</section>

					<section className="mb-8">
						<h2 className="font-nunito font-bold text-2xl text-slate-900 mb-4">
							7. Срок действия договора
						</h2>
						<div className="text-slate-700 leading-relaxed space-y-4">
							<p>
								Договор вступает в силу с момента акцепта Оферты и действует до полного
								исполнения обязательств сторонами.
							</p>
						</div>
					</section>

					<section className="mb-8">
						<h2 className="font-nunito font-bold text-2xl text-slate-900 mb-4">
							8. Реквизиты Исполнителя
						</h2>
						<div className="text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-200">
							<p><strong>Индивидуальный предприниматель:</strong> Штиль Максим Сергеевич</p>
							<p><strong>ИНН:</strong> 325774600570532</p>
							<p><strong>ОГРНИП:</strong> 325774600570532</p>
							<p><strong>Адрес:</strong> Российская Федерация</p>
							<p><strong>Email:</strong> support@checklytool.com</p>
							<p><strong>Сайт:</strong> checklytool.com</p>
						</div>
					</section>
				</div>

				{/* Футер */}
				<div className="mt-12 pt-8 border-t border-slate-200">
					<p className="text-sm text-slate-500 text-center">
						Последнее обновление: Октябрь 2025 г.
					</p>
				</div>
			</div>
		</div>
	)
}
