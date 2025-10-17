'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Hook для предупреждения о несохраненных изменениях при навигации
 * @param hasUnsavedChanges - флаг наличия несохраненных изменений
 * @param message - сообщение для предупреждения (опционально)
 */
export function useUnsavedChangesWarning(
	hasUnsavedChanges: boolean,
	message = 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?'
) {
	const pathname = usePathname()

	// Перехватываем клики по ссылкам
	useEffect(() => {
		if (!hasUnsavedChanges) return

		const handleClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement
			const link = target.closest('a')

			if (link && link.href && !link.href.startsWith('#')) {
				// Проверяем, является ли ссылка внутренней
				const url = new URL(link.href, window.location.origin)
				if (url.origin === window.location.origin && url.pathname !== pathname) {
					const confirmLeave = window.confirm(message)
					if (!confirmLeave) {
						e.preventDefault()
						e.stopPropagation()
					}
				}
			}
		}

		document.addEventListener('click', handleClick, true)
		return () => document.removeEventListener('click', handleClick, true)
	}, [hasUnsavedChanges, message, pathname])

	// Обрабатываем кнопку "Назад" браузера
	useEffect(() => {
		if (!hasUnsavedChanges) return

		const handlePopState = (e: PopStateEvent) => {
			if (!window.confirm(message)) {
				// Восстанавливаем текущую страницу
				window.history.pushState(null, '', pathname)
				e.preventDefault()
			}
		}

		// Добавляем состояние в историю для отслеживания
		window.history.pushState(null, '', pathname)

		window.addEventListener('popstate', handlePopState)
		return () => {
			window.removeEventListener('popstate', handlePopState)
		}
	}, [hasUnsavedChanges, message, pathname])
}
