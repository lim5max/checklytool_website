'use client'

import { useState, useEffect } from 'react'

interface UserBalance {
	check_balance: number
	subscription_plan_id: string | null
}

export function useCheckBalance() {
	const [balance, setBalance] = useState<number>(0)
	const [loading, setLoading] = useState(true)
	const [subscriptionPlanId, setSubscriptionPlanId] = useState<string | null>(
		null
	)

	useEffect(() => {
		fetchBalance()
	}, [])

	async function fetchBalance() {
		try {
			const response = await fetch('/api/users/profile')
			const data = await response.json()

			if (data.profile) {
				setBalance(Number(data.profile.check_balance) || 0)
				setSubscriptionPlanId(data.profile.subscription_plan_id || null)
			}
		} catch (error) {
			console.error('Error fetching balance:', error)
		} finally {
			setLoading(false)
		}
	}

	function hasEnoughCredits(
		checkType: 'test' | 'essay',
		pagesCount: number
	): boolean {
		const creditsNeeded =
			checkType === 'test' ? pagesCount * 0.5 : pagesCount * 1.0
		return balance >= creditsNeeded
	}

	function getCreditsNeeded(
		checkType: 'test' | 'essay',
		pagesCount: number
	): number {
		return checkType === 'test' ? pagesCount * 0.5 : pagesCount * 1.0
	}

	return {
		balance,
		loading,
		subscriptionPlanId,
		hasEnoughCredits,
		getCreditsNeeded,
		refreshBalance: fetchBalance,
	}
}
