'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const WaitlistModal = dynamic(() => import("./WaitlistModal"), {
  ssr: false
});

export default function HeroSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <motion.section
        className="flex flex-col gap-16 items-center justify-start text-center w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
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
            <motion.button
              onClick={openModal}
              className="bg-[#096ff5] hover:bg-blue-600 transition-colors text-white font-inter font-medium text-base px-6 py-3.5 rounded-full shadow-lg inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Начать работу
            </motion.button>
            <p className="font-inter font-medium text-xs text-slate-900">
              Всего 200 ₽ в мес.
            </p>
          </div>
        </div>
      </motion.section>

      <WaitlistModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}