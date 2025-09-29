import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import { Suspense } from "react";
import YandexMetrika from "../components/YandexMetrika";
import { Toaster } from 'sonner';
import "./globals.css";

// Оптимизированная загрузка шрифтов с display: swap
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: 'swap', // Предотвращает FOIT
  preload: true,
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800", "900"], // Убрали 400 - не используется
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://checklytool.com'),
  title: "ChecklyTool - Быстрая Проверка Работ Школьников",
  description: "Приложение проверит, подсчитает баллы и оценит работу за тебя. Экономь до 3 часов в день. Всего 199 ₽ в месяц.",
  keywords: "проверка работ, школьники, учителя, репетиторы, автоматическая проверка, образование",
  openGraph: {
    title: "ChecklyTool - Быстрая Проверка Работ Школьников",
    description: "Приложение проверит, подсчитает баллы и оценит работу за тебя. Экономь до 3 часов в день.",
    url: "https://checklytool.com",
    siteName: "ChecklyTool",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "/social.jpg",
        width: 1200,
        height: 630,
        alt: "ChecklyTool - Быстрая Проверка Работ Школьников",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChecklyTool - Быстрая Проверка Работ Школьников",
    description: "Приложение проверит, подсчитает баллы и оценит работу за тебя. Экономь до 3 часов в день.",
    images: ["/social.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/images/brand-logo.png",
    apple: "/images/brand-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        {/* Preconnect к внешним доменам */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Предзагрузка критических ресурсов */}
        <link rel="preload" href="/images/logo.png" as="image" />
      </head>
      <body
        className={`${inter.variable} ${nunito.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
        {/* Ленивая загрузка некритических компонентов */}
        <Suspense fallback={null}>
          <YandexMetrika />
          <Toaster position="top-right" richColors closeButton />
        </Suspense>
      </body>
    </html>
  );
}
