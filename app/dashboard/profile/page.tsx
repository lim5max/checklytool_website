import { auth } from '../../../lib/auth'
import { redirect } from 'next/navigation'
import { getUserProfile } from '../../../lib/database'
import ProfileContent from '../../../components/profile/profile-content'

export const metadata = {
	title: 'Профиль - ChecklyTool',
	description: 'Управление профилем и подпиской',
}

export default async function ProfilePage() {
	const session = await auth()

	if (!session?.user?.email) {
		redirect('/auth/login')
	}

	const userProfile = await getUserProfile(session.user.email)

	if (!userProfile) {
		redirect('/auth/login')
	}

	return <ProfileContent userProfile={userProfile} />
}
