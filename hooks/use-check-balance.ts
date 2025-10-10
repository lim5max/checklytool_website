'use client'

import { useState, useEffect } from 'react'

export function useCheckBalance() {
	const [balance, setBalance] = useState<number>(0)
	const [loading, setLoading] = useState(true)
	const [subscriptionPlanId, setSubscriptionPlanId] = useState<string | null>(
		null
	)

	useEffect(() => {
		fetchBalance()
	}, [])

	async function fetchBalance(): Promise<number> {
		try {
			const response = await fetch('/api/users/profile')
			const data = await response.json()

			if (data.profile) {
				const newBalance = Number(data.profile.check_balance) || 0
				setBalance(newBalance)
				setSubscriptionPlanId(data.profile.subscription_plan_id || null)
				return newBalance
			}
			return 0
		} catch (error) {
			console.error('Error fetching balance:', error)
			return 0
		} finally {
			setLoading(false)
		}
	}

	function hasEnoughCredits(
		checkType: 'test' | 'essay' | 'written_work',
		pagesCount: number
	): boolean {
		const creditsNeeded = getCreditsNeeded(checkType, pagesCount)
		return balance >= creditsNeeded
	}

	function getCreditsNeeded(
		checkType: 'test' | 'essay' | 'written_work',
		pagesCount: number
	): number {
		if (checkType === 'test') {
			return pagesCount * 0.5
		} else if (checkType === 'written_work') {
			return pagesCount * 2.0
		} else {
			return pagesCount * 1.0
		}
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
