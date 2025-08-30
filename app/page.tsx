'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import StructuredData from "../components/StructuredData";
import TeachersRepetitorsBlock from "../components/TeachersRepetitorsBlock";
import HowItWorksSection from "../components/HowItWorksSection";
import WaitlistModal from "../components/WaitlistModal";
import MobileNavigation from "../components/MobileNavigation";



export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <StructuredData />
      <div className="bg-white">
        <div className="box-border flex flex-col gap-10 items-start justify-start px-4  py-4 relative min-h-screen max-w-[1082px] mx-auto">
          
          <header className="relative w-full">
            <MobileNavigation onOpenModal={openModal} />
            
            <div className="hidden md:flex items-center justify-between w-full">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex gap-0.5 items-center justify-start relative">
                  <Image 
                    src="/images/logo.png" 
                    alt="Checkly" 
                    width={120} 
                    height={40}
                    priority
                    className="object-contain"
                  />
                </Link>
                <Link 
                  href="/about" 
                  className="text-slate-900 hover:text-slate-600 transition-colors font-inter tracking-tight font-semibold text-lg"
                >
                  О проекте
                </Link>
              </div>
              <button 
                onClick={openModal}
                className="bg-slate-900 hover:bg-slate-800 transition-colors text-white font-inter font-medium text-base px-5 py-3 rounded-full shadow-md"
              >
                Попробовать
              </button>
            </div>
          </header>

          <main className="flex flex-col gap-32 items-center justify-start relative w-full">
            
            <section className="flex flex-col gap-16 items-center justify-start text-center w-full">
              <div className="flex flex-col gap-6 items-center justify-start">
                <div className="flex flex-col gap-2.5 items-center">
                  <h1 className="font-nunito font-black leading-tight text-4xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight">
                    <span className="block">Быстрая Проверка</span>
                    <span className="block">Работ Школьников</span>
                  </h1>
                  <p className="font-inter text-lg text-slate-800 max-w-md leading-relaxed">
                    Приложение проверит, подсчитает баллы и оценит работу за тебя. Пока ты пьешь чай :)
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <button 
                    onClick={openModal}
                    className="bg-[#096ff5] hover:bg-blue-600 transition-colors text-white font-inter font-medium text-base px-6 py-3.5 rounded-full shadow-lg"
                  >
                    Загрузить работы
                  </button>
                  <p className="font-inter font-medium text-xs text-slate-900">
                    Всего 200 ₽ в мес.
                  </p>
                </div>
              </div>
              <div className="-mx-4 md:mx-0 w-full">
                <TeachersRepetitorsBlock />
              </div>
            </section>

            <HowItWorksSection />

            <section className="flex flex-col gap-10 items-center justify-start w-full">
              <h2 className="font-nunito font-black text-4xl sm:text-5xl text-center text-slate-900 tracking-tight">
                Какие проблемы решаем
              </h2>
              <Image 
                src="/images/problem-illustration.png" 
                alt="Problems we solve" 
                width={732} 
                height={490}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAGAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLli+YVvk="
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 732px"
                className="object-cover rounded-lg w-full h-auto max-w-3xl"
                decoding="async"
              />
            </section>

            <section className="flex flex-col md:flex-row gap-16 items-center justify-center w-full">
              <div className="hidden md:block w-full max-w-[464px] aspect-square rounded-[48px] bg-slate-50">
                <Image 
                  src="/images/cta-illustration.png" 
                  alt="CTA illustration" 
                  width={464} 
                  height={485}
                  loading="lazy"
                  sizes="(max-width: 768px) 0px, 464px"
                  className="object-cover w-full h-auto"
                />
              </div>
              <div className="flex flex-col gap-8 items-center md:items-start w-full text-center md:text-left">
                <div className="flex flex-col gap-4">
                  <h2 className="font-nunito font-black leading-tight text-4xl sm:text-5xl text-slate-900 tracking-tight">
                    <span className="block">Cокращай время</span>
                    <span className="block">проверки в <span className="text-[#096ff5]">5 раз</span></span>
                  </h2>
                  <p className="font-inter text-lg md:max-w-full max-w-sm md:text-xl  text-slate-800  leading-relaxed">
                    Оформи подписку на сервис за 200 ₽ в месяц, <br className="hidden md:inline" />пока мы запускаемся. Потом станет дороже)
                  </p>
                </div>
                <button 
                  onClick={openModal}
                  className="bg-[#096ff5] hover:bg-blue-600 transition-colors w-full text-white font-inter font-medium text-2xl px-5 py-8 rounded-full shadow-lg h-[172px]"
                >
                  Оставить заявку
                </button>
              </div>
            </section>

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

      <WaitlistModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}
