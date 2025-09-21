import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import StructuredData from "../components/StructuredData";
import MobileHeader from "../components/MobileHeader";
import DesktopHeader from "../components/DesktopHeader";
import HeroSection from "../components/HeroSection";

// Ленивая загрузка тяжелых компонентов
import dynamic from "next/dynamic";

const TeachersRepetitorsBlock = dynamic(() => import("../components/TeachersRepetitorsBlock"), {
  loading: () => <div className="h-[424px] bg-slate-50 rounded-3xl animate-pulse" />
});

const HowItWorksSection = dynamic(() => import("../components/HowItWorksSection"), {
  loading: () => <div className="h-96 bg-slate-50 rounded-lg animate-pulse" />
});

const CTASection = dynamic(() => import("../components/CTASection"), {
  loading: () => <div className="h-64 bg-slate-50 rounded-lg animate-pulse" />
});

export default function Home() {
  return (
    <>
      <StructuredData />
      <div className="bg-white">
        <div className="box-border flex flex-col gap-10 items-start justify-start px-4 py-4 relative min-h-screen max-w-[1082px] mx-auto">

          <header className="relative w-full">
            <Suspense fallback={<div className="h-16 bg-slate-50 rounded animate-pulse" />}>
              <MobileHeader variant="landing" />
              <DesktopHeader variant="landing" />
            </Suspense>
          </header>

          <main className="flex flex-col gap-32 items-center justify-start relative w-full">

            {/* Hero секция - критичная для LCP */}
            <HeroSection />

            {/* Ленивая загрузка остальных секций */}
            <Suspense fallback={<div className="h-[424px] bg-slate-50 rounded-3xl animate-pulse w-full" />}>
              <TeachersRepetitorsBlock />
            </Suspense>

            <Suspense fallback={<div className="h-96 bg-slate-50 rounded-lg animate-pulse w-full" />}>
              <HowItWorksSection />
            </Suspense>

            {/* Статическая секция с проблемами */}
            <section className="flex flex-col gap-10 items-center justify-start w-full">
              <h2 className="font-nunito font-black text-4xl sm:text-5xl text-center text-slate-900 tracking-tight">
                Какие проблемы решаем
              </h2>
              <div>
                <Image
                  src="/images/problem-illustration.png"
                  alt="Problems we solve"
                  width={732}
                  height={490}
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAGAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLli+YVvk="
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 732px"
                  className="object-cover rounded-lg w-full h-auto max-w-3xl"
                  decoding="async"
                />
              </div>
            </section>

            <Suspense fallback={<div className="h-64 bg-slate-50 rounded-lg animate-pulse w-full" />}>
              <CTASection />
            </Suspense>

          </main>

          <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full pt-8 mt-16 border-t border-slate-200 text-sm text-slate-600">
            <p>©2025 ChecklyTool. Все права защищены.</p>
            <Link
              href="https://www.rusprofile.ru/ip/321508100625381"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              ИП Митусов Б.С.
            </Link>
          </footer>

        </div>
      </div>
    </>
  );
}
