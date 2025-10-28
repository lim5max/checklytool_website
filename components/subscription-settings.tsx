'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface SubscriptionSettingsProps {
	className?: string
}

export function SubscriptionSettings({ className }: SubscriptionSettingsProps) {
	const [autoRenew, setAutoRenew] = useState(true)
	const [loading, setLoading] = useState(true)
	const [showConfirmDialog, setShowConfirmDialog] = useState(false)
	const [hasRebillId, setHasRebillId] = useState(false)

	// Загрузка текущего статуса
	useEffect(() => {
		loadAutoRenewStatus()
	}, [])

	async function loadAutoRenewStatus() {
		try {
			const response = await fetch('/api/subscription/auto-renew')
			if (response.ok) {
				const data = await response.json()
				setAutoRenew(data.autoRenew)
				setHasRebillId(data.hasRebillId)
			}
		} catch (error) {
			console.error('Failed to load auto-renew status:', error)
		} finally {
			setLoading(false)
		}
	}

	function handleToggleClick() {
		if (autoRenew) {
			// Пытается отключить - показываем модальное окно с подтверждением
			setShowConfirmDialog(true)
		} else {
			// Включает - сразу обновляем
			updateAutoRenew(true)
		}
	}

	async function updateAutoRenew(enabled: boolean) {
		setLoading(true)
		try {
			const response = await fetch('/api/subscription/auto-renew', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ enabled }),
			})

			if (response.ok) {
				const data = await response.json()
				setAutoRenew(data.autoRenew)
			} else {
				const error = await response.json()
				console.error('Failed to update auto-renew:', error)
				alert(error.error || 'Не удалось обновить настройки')
			}
		} catch (error) {
			console.error('Failed to update auto-renew:', error)
			alert('Произошла ошибка при обновлении настроек')
		} finally {
			setLoading(false)
			setShowConfirmDialog(false)
		}
	}

	if (loading) {
		return null
	}

	if (!hasRebillId) {
		// Если нет сохраненной карты, не показываем настройки
		return null
	}

	return (
		<>
			<div className={className}>
				{/* Маленький, незаметный блок с серым текстом внизу страницы */}
				<div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
					<div className="flex items-start justify-between gap-4">
						<div className="flex-1">
							<p className="text-xs text-gray-400 dark:text-gray-600">
								Настройки автоматического продления
							</p>
							<p className="mt-1 text-xs text-gray-400 dark:text-gray-600 leading-relaxed">
								Автопродление позволяет вам не беспокоиться об оплате — ваша подписка будет продлеваться автоматически.
								При отключении вы потеряете непрерывный доступ к премиум-функциям и накопленную статистику может быть сложно восстановить.
								Мы настоятельно рекомендуем оставить автопродление включенным для вашего удобства.
							</p>
						</div>

						<div className="flex items-center gap-2">
							<Switch
								checked={autoRenew}
								onCheckedChange={handleToggleClick}
								disabled={loading}
								className="data-[state=checked]:bg-green-600"
							/>
							<span className="text-xs text-gray-500 dark:text-gray-400">
								{autoRenew ? 'Вкл' : 'Выкл'}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Модальное окно подтверждения с dark patterns */}
			<Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
							<AlertCircle className="w-5 h-5" />
							Вы уверены, что хотите отключить автопродление?
						</DialogTitle>
						<DialogDescription className="text-left space-y-3 pt-4">
							{/* Длинное описание преимуществ */}
							<div className="space-y-2">
								<p className="text-sm text-gray-700 dark:text-gray-300">
									<strong>Вы потеряете следующие преимущества:</strong>
								</p>
								<ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4">
									<li>✗ Непрерывный доступ к премиум-функциям</li>
									<li>✗ Автоматическое начисление кредитов каждый месяц</li>
									<li>✗ Гарантию неизменной цены подписки</li>
									<li>✗ Приоритетную поддержку</li>
									<li>✗ Сохранение вашей статистики и прогресса</li>
								</ul>
							</div>

							<div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
								<p className="text-xs text-amber-800 dark:text-amber-200">
									<strong>Важно:</strong> После отключения автопродления вам придется вручную продлевать подписку каждый месяц.
									Если вы забудете это сделать, ваш аккаунт будет переведен на бесплатный тариф, и вы потеряете доступ ко всем проверкам.
								</p>
							</div>

							<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-4">
								<div className="flex items-start gap-2">
									<CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
									<p className="text-xs text-green-800 dark:text-green-200">
										<strong>Рекомендуем оставить включенным:</strong> Более 95% наших пользователей держат автопродление активным для максимального удобства.
									</p>
								</div>
							</div>
						</DialogDescription>
					</DialogHeader>

					<DialogFooter className="flex-col gap-2 sm:flex-col mt-6">
						{/* Яркая кнопка "Оставить включенным" */}
						<Button
							onClick={() => setShowConfirmDialog(false)}
							className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
							size="lg"
						>
							Оставить автопродление включенным
						</Button>

						{/* Серая, незаметная кнопка отключения */}
						<Button
							onClick={() => updateAutoRenew(false)}
							variant="ghost"
							className="w-full text-xs text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400"
							size="sm"
							disabled={loading}
						>
							Всё равно отключить (не рекомендуется)
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
