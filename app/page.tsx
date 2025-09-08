'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import StructuredData from "../components/StructuredData";
import TeachersRepetitorsBlock from "../components/TeachersRepetitorsBlock";
import HowItWorksSection from "../components/HowItWorksSection";
import WaitlistModal from "../components/WaitlistModal";
import MobileHeader from "../components/MobileHeader";
import DesktopHeader from "../components/DesktopHeader";



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
            <MobileHeader 
              variant="landing"
              onOpenModal={openModal}
            />
            <DesktopHeader variant="landing" />
          </header>

          <main className="flex flex-col gap-32 items-center justify-start relative w-full">
            
            <motion.section 
              className="flex flex-col gap-16 items-center justify-start text-center w-full"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="flex flex-col gap-6 items-center justify-start"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="flex flex-col gap-2.5 items-center">
                  <motion.h1 
                    className="font-nunito font-black leading-tight text-4xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <span className="block">Быстрая Проверка</span>
                    <span className="block">Работ Школьников</span>
                  </motion.h1>
                  <motion.p 
                    className="font-inter text-lg text-slate-800 max-w-md leading-relaxed"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    Приложение проверит, подсчитает баллы и оценит работу за тебя. Пока ты пьешь чай :)
                  </motion.p>
                </div>
                <motion.div 
                  className="flex flex-col gap-2 items-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Link 
                      href="/auth/login"
                      className="bg-[#096ff5] hover:bg-blue-600 transition-colors text-white font-inter font-medium text-base px-6 py-3.5 rounded-full shadow-lg inline-block"
                    >
                      Начать работу
                    </Link>
                  </motion.div>
                  <p className="font-inter font-medium text-xs text-slate-900">
                    Всего 200 ₽ в мес.
                  </p>
                </motion.div>
              </motion.div>
              <motion.div 
                className="-mx-4 md:mx-0 w-full"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <TeachersRepetitorsBlock />
              </motion.div>
            </motion.section>

            <HowItWorksSection />

            <motion.section 
              className="flex flex-col gap-10 items-center justify-start w-full"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <motion.h2 
                className="font-nunito font-black text-4xl sm:text-5xl text-center text-slate-900 tracking-tight"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Какие проблемы решаем
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
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
              </motion.div>
            </motion.section>

            <motion.section 
              className="flex flex-col md:flex-row gap-16 items-center justify-center w-full"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="hidden md:block w-full max-w-[464px] aspect-square rounded-[48px] bg-slate-50"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Image 
                  src="/images/cta-illustration.png" 
                  alt="CTA illustration" 
                  width={464} 
                  height={485}
                  loading="lazy"
                  sizes="(max-width: 768px) 0px, 464px"
                  className="object-cover w-full h-auto"
                />
              </motion.div>
              <motion.div 
                className="flex flex-col gap-8 items-center md:items-start w-full text-center md:text-left"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <div className="flex flex-col gap-4">
                  <motion.h2 
                    className="font-nunito font-black leading-tight text-4xl sm:text-5xl text-slate-900 tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <span className="block">Cокращай время</span>
                    <span className="block">проверки в <span className="text-[#096ff5]">5 раз</span></span>
                  </motion.h2>
                  <motion.p 
                    className="font-inter text-lg md:max-w-full max-w-sm md:text-xl  text-slate-800  leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    Оформи подписку на сервис за 200 ₽ в месяц, <br className="hidden md:inline" />пока мы запускаемся. Потом станет дороже)
                  </motion.p>
                </div>
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link 
                    href="/auth/login"
                    className="bg-[#096ff5] hover:bg-blue-600 transition-colors w-full text-white font-inter font-medium text-2xl px-5 py-8 rounded-full shadow-lg h-[172px] flex items-center justify-center"
                  >
                    Начать сейчас
                  </Link>
                </motion.div>
              </motion.div>
            </motion.section>

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
