import type { Metadata } from "next";
import { redirect } from 'next/navigation'
import { auth, signOut } from '../../lib/auth'
import MobileHeader from '../../components/MobileHeader'
import DesktopHeader from '../../components/DesktopHeader'
import HeaderGate from '../../components/HeaderGate'

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

  const handleSignOut = async () => {
    'use server'
    await signOut({ redirectTo: '/' })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Headers (hidden on checks pages to match Figma local nav) */}
      <HeaderGate>
        <div className="">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <MobileHeader
              variant="dashboard"
              user={{
                name: session.user?.name,
                email: session.user?.email,
                image: session.user?.image
              }}
              onSignOut={handleSignOut}
              className="py-4"
            />
            <DesktopHeader
              variant="dashboard"
              user={{
                name: session.user?.name,
                email: session.user?.email,
                image: session.user?.image
              }}
              onSignOut={handleSignOut}
              className="py-4"
            />
          </div>
        </div>
      </HeaderGate>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto  pb-[100px]">
        {children}
      </main>
    </div>
  );
}