import { Suspense } from 'react'
import LoginForm from '../../../components/auth/LoginForm'

// Force dynamic rendering to avoid SSG issues with auth
export const dynamic = 'force-dynamic'

function LoginFormWrapper() {
  return <LoginForm />
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginFormWrapper />
    </Suspense>
  )
}