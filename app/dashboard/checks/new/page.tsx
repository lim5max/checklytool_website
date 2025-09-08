import { redirect } from 'next/navigation'

// Redirect to the new mobile-first check creation flow
export default function NewCheckPage() {
  redirect('/dashboard/checks/create')
}