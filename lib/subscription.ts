import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface DeductCreditsParams {
	userId: string
	checkId: string
	submissionId: string
	checkType: 'test' | 'essay'
	pagesCount: number
}

interface DeductCreditsResult {
	success: boolean
	error?: string
	required?: number
	available?: number
	creditsDeducted?: number
	newBalance?: number
}

export async function deductCheckCredits({
	userId,
	checkId,
	submissionId,
	checkType,
	pagesCount,
}: DeductCreditsParams): Promise<DeductCreditsResult> {
	try {
		const { data, error } = await supabase.rpc('deduct_check_credits', {
			p_user_id: userId,
			p_check_id: checkId,
			p_submission_id: submissionId,
			p_check_type: checkType,
			p_pages_count: pagesCount,
		})

		if (error) {
			console.error('Error deducting credits:', error)
			return {
				success: false,
				error: 'Failed to deduct credits',
			}
		}

		return data as DeductCreditsResult
	} catch (error) {
		console.error('Error in deductCheckCredits:', error)
		return {
			success: false,
			error: 'Internal error',
		}
	}
}

interface AddSubscriptionParams {
	userId: string
	planName: 'FREE' | 'PLUS' | 'PRO'
}

interface AddSubscriptionResult {
	success: boolean
	error?: string
	plan?: string
	creditsAdded?: number
}

export async function addSubscription({
	userId,
	planName,
}: AddSubscriptionParams): Promise<AddSubscriptionResult> {
	try {
		const { data, error } = await supabase.rpc('add_subscription', {
			p_user_id: userId,
			p_plan_name: planName,
		})

		if (error) {
			console.error('Error adding subscription:', error)
			return {
				success: false,
				error: 'Failed to add subscription',
			}
		}

		return data as AddSubscriptionResult
	} catch (error) {
		console.error('Error in addSubscription:', error)
		return {
			success: false,
			error: 'Internal error',
		}
	}
}

export async function getUserBalance(userId: string): Promise<number> {
	try {
		const { data, error } = await supabase
			.from('user_profiles')
			.select('check_balance')
			.eq('user_id', userId)
			.single()

		if (error || !data) {
			console.error('Error fetching user balance:', error)
			return 0
		}

		return Number(data.check_balance) || 0
	} catch (error) {
		console.error('Error in getUserBalance:', error)
		return 0
	}
}

export function calculateCreditsNeeded(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	checkType: 'test' | 'essay',
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	pagesCount: number
): number {
	// И тесты, и сочинения считаются одинаково: 1 работа = 1 проверка
	return 1
}
