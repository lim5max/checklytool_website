import { signOut } from '@/lib/auth'

export async function POST() {
	try {
		// Sign out and redirect to home
		return await signOut({
			redirectTo: '/',
			redirect: true
		})
	} catch (error) {
		console.error('Sign out error:', error)
		return new Response('Error signing out', { status: 500 })
	}
}
