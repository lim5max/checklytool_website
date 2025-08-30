'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import StructuredData from "../../components/StructuredData";
import WaitlistModal from "../../components/WaitlistModal";
import MobileNavigation from "../../components/MobileNavigation";

const teamMembers = [
  {
    id: 1,
    name: "Митусов Богдан",
    role: "Преподаватель, 5 лет опыта",
    description: "Хорошо знаю, сколько времени и сил уходит у учителей на проверку тетрадей и выставление оценок, особенно в напряженные периоды 'сезонного' повсеместного итогов.",
    longDescription: "Эта проблема стала отправной точкой для создания сервиса, который позволит учителям меньше тратить время на рутину и больше посвящать себя действительно важному: обучению и развитию детей.",
    image: "/images/Bogdan.jpg",
    socialIcon: "vk",
    socialLink: "https://vk.com/b.mitusov"
  },
  {
    id: 2,
    name: "Максим Штиль",
    role: "Дизайнер/разработчик, 5 лет опыта",
    description: "В основном я работаю дизайнером и разработчиком, также руководил проектами в крупных стартапах России.",
    longDescription: "Опыт в EdTech помогает мне создавать решения, которые реально полезны для учителей и образовательных учреждений.",
    additionalDescription: "Для меня важно, чтобы наш сервис приносил реальную пользу людям и помогал двигать индустрию вперед.",
    image: "/images/Max.jpg",
    socialIcon: "telegram",
    socialLink: "https://t.me/maxshtill"
  }
];


export default function About() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <StructuredData />
      <div className="bg-white">
        <div className="box-border flex flex-col gap-10 items-start justify-start px-4 py-4 relative min-h-screen max-w-[1082px] mx-auto">
          
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

          <main className="flex flex-col gap-16 items-center justify-start relative w-full">
            <div className="flex flex-col gap-6">
            <section className="flex flex-col lg:flex-row gap-2 lg:gap-2 items-center justify-between w-full">
              <div className="flex flex-col gap-6 items-center lg:items-start text-left ">
                <h1 className="font-nunito font-black leading-tight text-4xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight w-full">
                  Упрощаем повседневную жизнь преподавателей
                </h1>
              </div>
              <div className="flex-shrink-0 hidden lg:block">
                <div className="w-32 h-32 lg:w-48 lg:h-48">
                  <Image
                    src="/images/Face.png"
                    alt="Teacher face"
                    width={192}
                    height={192}
                    priority
                    sizes="(max-width: 1024px) 0px, 192px"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-8 items-center justify-start w-full">
              <div className="w-full">
                <Image
                  src="/images/About_preview_desktop.jpg"
                  alt="Checkly values"
                  width={1000}
                  height={400}
                  priority
                  sizes="(max-width: 768px) 0px, (max-width: 1200px) 80vw, 1000px"
                  className="hidden md:block w-full h-auto object-cover rounded-lg"
                />
                <Image
                  src="/images/About_preview_mobile.jpg"
                  alt="Checkly values"
                  width={400}
                  height={400}
                  priority
                  sizes="(max-width: 768px) 100vw, 0px"
                  className="block md:hidden w-full h-auto object-cover rounded-lg"
                />
              </div>
            </section>
</div> 
            <section className="flex flex-col gap-12 items-center justify-start w-full">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex flex-col lg:flex-row gap-8 items-start lg:items-start w-full max-w-4xl">
                  <div className="lg:flex-shrink-0 ">
                    <div className="w-full h-80 lg:w-80 lg:h-[26rem] rounded-3xl bg-slate-100 aspect-[320/416]">
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={320}
                        height={416}
                        loading="lazy"
                        sizes="(max-width: 1024px) 100vw, 320px"
                        className="w-full h-full object-cover rounded-3xl"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 text-left lg:text-left flex-1">
                    <div>
                      <h2 className="font-nunito font-black text-3xl lg:text-4xl text-slate-900 tracking-tight">
                        {member.name}
                      </h2>
                      <p className="font-inter text-lg text-slate-600 mt-1">
                        {member.role}
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-4 text-left">
                      <p className="font-inter text-base text-slate-800 leading-relaxed">
                        {member.description}
                      </p>
                      <p className="font-inter text-base text-slate-800 leading-relaxed">
                        {member.longDescription}
                      </p>
                      {member.additionalDescription && (
                        <p className="font-inter text-base text-slate-800 leading-relaxed">
                          {member.additionalDescription}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-center lg:justify-start">
                      <a
                        href={member.socialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block lg:inline-block w-full lg:w-auto"
                      >
                        <div className="hidden lg:block w-12 h-12">
                          <Image
                            src={member.socialIcon === 'vk' ? '/images/vk.svg' : '/images/tg.svg'}
                            alt={member.socialIcon === 'vk' ? 'VKontakte' : 'Telegram'}
                            width={42}
                            height={42}
                            loading="lazy"
                            className="w-full h-full object-contain hover:opacity-80 transition-opacity"
                          />
                        </div>
                        <button className="block lg:hidden bg-[#096ff5] hover:bg-blue-600 transition-colors text-white font-inter font-medium text-base px-5 py-3 rounded-full w-full">
                          {member.socialIcon === 'vk' ? 'Смотреть VK' : 'Смотреть TG'}
                        </button>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
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