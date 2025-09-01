import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Авторизация - ChecklyTool",
  description: "Войдите в свой аккаунт ChecklyTool для проверки работ школьников",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center justify-center mb-6"
          >
            <Image 
              src="/images/logo.png" 
              alt="ChecklyTool" 
              width={160} 
              height={53}
              priority
              className="object-contain"
            />
          </Link>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {children}
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            ©2025 ChecklyTool. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  );
}