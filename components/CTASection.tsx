'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

export default function CTASection() {
  return (
    <motion.section
      className="flex flex-col md:flex-row gap-16 items-center justify-center w-full"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
    >
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
          <p className="font-inter text-lg md:max-w-full max-w-sm md:text-xl text-slate-800 leading-relaxed">
            Оформи подписку на сервис за 200 ₽ в месяц, <br className="hidden md:inline" />пока мы запускаемся. Потом станет дороже)
          </p>
        </div>
        <div className="flex flex-col gap-4 w-full">
          <Link href="/auth/register" className="w-full">
            <motion.div
              className="bg-[#096ff5] hover:bg-blue-600 transition-colors w-full text-white font-inter font-medium text-2xl px-5 py-8 rounded-full shadow-lg h-[172px] flex items-center justify-center"
              whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              whileTap={{ scale: 0.98 }}
            >
              Купить за 299р
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.section>
  );
}