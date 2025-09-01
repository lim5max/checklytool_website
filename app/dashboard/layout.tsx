import type { Metadata } from "next";
import { redirect } from 'next/navigation'
import { auth } from '../../lib/auth'
import DashboardNavbar from '../../components/dashboard/Navbar'

export const metadata: Metadata = {
  title: "Дашборд - ChecklyTool",
  description: "Управляйте проверкой работ школьников в личном кабинете ChecklyTool",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNavbar session={session} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}