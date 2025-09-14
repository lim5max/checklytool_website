import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import YandexMetrika from "../components/YandexMetrika";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700", "800", "900"],
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
      <body
        className={`${inter.variable} ${nunito.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
        <YandexMetrika />
      </body>
    </html>
  );
}
