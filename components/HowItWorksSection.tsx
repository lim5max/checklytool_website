"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const steps = [
  {
    id: 1,
    title: "Введи правильные ответы на тест",
    description: "и добавь варианты к ней",
    image: "/images/step-1-illustration.png"
  },
  {
    id: 2,
    title: "Сфотографируйте работы учеников.",
    description: "",
    image: "/images/step-2-illustration.png"
  },
  {
    id: 3,
    title: "Получите мгновенный результат:",
    description: "баллы, ошибки, подсказки.",
    image: "/images/step-3-illustration.png"
  }
];

const HowItWorksStep = ({ 
  step, 
  title, 
  description, 
  isActive, 
  onClick 
}: { 
  step: number; 
  title: string; 
  description: string; 
  isActive: boolean;
  onClick: () => void;
}) => (
  <div 
    className={`flex gap-3 items-start cursor-pointer transition-opacity duration-300 ${!isActive && "opacity-40"}`}
    onClick={onClick}
  >
    <div className={`font-nunito font-black text-[30px] text-center tracking-[-1px] w-[30px] leading-[1.2] transition-colors duration-300 ${
      isActive ? "text-slate-900" : "text-slate-400"
    }`}>
      {step}
    </div>
    <div className="flex-1">
      <h3 className={`font-inter font-medium text-[20px] leading-[1.6] transition-colors duration-300 ${
        isActive ? "text-slate-900" : "text-slate-400"
      }`}>
        {title}
      </h3>
      {description && (
        <p className={`font-inter font-medium text-[20px] leading-[1.6] transition-colors duration-300 ${
          isActive ? "text-slate-900" : "text-slate-400"
        }`}>
          {description}
        </p>
      )}
    </div>
  </div>
);

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);
  const currentStep = steps.find(step => step.id === activeStep)!;

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const section = sectionRef.current;
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const scrollY = window.scrollY + window.innerHeight / 2;
      
      // Проверяем, находится ли пользователь в пределах секции
      if (scrollY >= sectionTop && scrollY <= sectionTop + sectionHeight) {
        const progress = (scrollY - sectionTop) / sectionHeight;
        
        // Разделяем прогресс на 3 равные части для каждого шага
        if (progress < 0.33) {
          setActiveStep(1);
        } else if (progress < 0.66) {
          setActiveStep(2);
        } else {
          setActiveStep(3);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={sectionRef} className="flex flex-col gap-16 items-start justify-start w-full">
      
      
      <div className="flex flex-col lg:flex-row gap-16 lg:gap-8 items-start justify-between w-full">
      
        <div className="flex flex-col gap-8 w-full lg:w-3/5">
        
<h2 className="font-nunito font-black text-4xl sm:text-5xl text-left text-slate-900 tracking-tight">
        Как это работает
      </h2>
        
          <div className="flex flex-col gap-6">
          {steps.map((step) => (
            <HowItWorksStep 
              key={step.id}
              step={step.id} 
              title={step.title} 
              description={step.description} 
              isActive={activeStep === step.id}
              onClick={() => setActiveStep(step.id)}
            />
          ))}
          </div>
        </div>
        
        <div className="w-full lg:w-3/5">
          <div className="relative">
            <Image 
              src={currentStep.image}
              alt={`Step ${activeStep} illustration`} 
              width={529} 
              height={424}
              className="object-cover rounded-lg w-full h-auto transition-opacity duration-500"
              key={activeStep} // Force re-render for smooth transition
            />
          </div>
        </div>
      </div>
    </section>
  );
}