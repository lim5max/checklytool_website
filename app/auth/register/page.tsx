import { Suspense } from 'react'
import RegisterForm from '../../../components/auth/RegisterForm'

// Force dynamic rendering to avoid SSG issues with auth
export const dynamic = 'force-dynamic'

function RegisterFormWrapper() {
  return <RegisterForm />
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterFormWrapper />
    </Suspense>
  )
}