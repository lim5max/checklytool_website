"use client";
import { useState, useEffect, useRef, memo, useCallback } from "react";
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

const HowItWorksStep = memo(function HowItWorksStep({ 
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
}) {
  return (
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
});

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);
  const debounceRef = useRef<number | null>(null);
  const activeStepRef = useRef<number>(1);
  const throttleRef = useRef<number | null>(null);
  const DEBOUNCE_MS = 150;
  useEffect(() => {
    activeStepRef.current = activeStep;
  }, [activeStep]);
  const currentStep = steps.find(step => step.id === activeStep)!;

  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (!isDesktop) {
      // Disable scroll-driven switching on mobile (< md)
      return;
    }

    const handleScroll = () => {
      if (throttleRef.current) return;
      
      throttleRef.current = requestAnimationFrame(() => {
        throttleRef.current = null;
        const section = sectionRef.current;
        if (!section) return;

      const start = section.offsetTop;
      const end = start + section.offsetHeight - window.innerHeight;
      const y = window.scrollY;

      if (y < start || y > end) {
        return;
      }

      const progress = Math.min(1, Math.max(0, (y - start) / (end - start)));
      const segment = 1 / steps.length;
      const candidateStep = Math.min(steps.length, Math.floor(progress / segment) + 1);

      const current = activeStepRef.current;
      if (candidateStep === current) {
        return;
      }

      const diff = candidateStep - current;

      if (Math.abs(diff) > 1) {
        // Prevent skipping the intermediate step on very fast scroll.
        if (debounceRef.current) {
          window.clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
        const stepTowards = current + Math.sign(diff);
        setActiveStep(stepTowards);
        activeStepRef.current = stepTowards;
        return;
      }

      // diff is exactly ±1: use a short debounce for smoothness.
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      debounceRef.current = window.setTimeout(() => {
        setActiveStep(candidateStep);
        debounceRef.current = null;
      }, DEBOUNCE_MS);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Sync once on mount in case we're already within the section
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (throttleRef.current) {
        cancelAnimationFrame(throttleRef.current);
        throttleRef.current = null;
      }
    };
  }, []);

  const scrollToStep = useCallback((stepId: number) => {
    const section = sectionRef.current;
    if (!section) return;

    const start = section.offsetTop;
    const totalScrollable = section.offsetHeight - window.innerHeight;
    if (totalScrollable <= 0) return;

    const segment = 1 / steps.length;
    const targetProgress = ((stepId - 1) + 0.5) * segment;
    const targetY = start + targetProgress * totalScrollable;

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    window.scrollTo({ top: targetY, behavior: "smooth" });
  }, []);

  return (
    <section ref={sectionRef} className="relative h-auto md:h-[300vh] w-full">
      <div className="md:sticky md:top-0 md:min-h-screen flex flex-col justify-center">
        {/* Mobile-only static stacked list */}
        <div className="block md:hidden md:px-4 space-y-6">
          <h2 className="font-nunito font-black text-4xl sm:text-5xl md:text-left text-center  text-slate-900 tracking-tight">
            Как это работает
          </h2>
          {steps.map((step) => (
            <div key={step.id} className="bg-[#F7FAFF]   p-6 sm:p-5 rounded-4xl">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="font-nunito text-2xl md:text-[20px] font-black text-slate-700 leading-tight">
                    {step.description ? `${step.title} ${step.description}` : step.title}
                  </h3>
                </div>
              </div>
              <div className="mt-3 aspect-[529/424]">
                <Image
                  src={step.image}
                  alt={`Step ${step.id} illustration`}
                  width={529}
                  height={424}
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, 529px"
                  className="object-cover rounded-lg w-full h-full"
                />
              </div>
            </div>
          ))}
        </div>
        {/* Desktop/Tablet interactive container */}
        <div className="hidden md:flex flex-col lg:flex-row gap-16 lg:gap-8 items-start justify-between w-full">
        
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
                onClick={() => scrollToStep(step.id)}
              />
            ))}
            </div>
          </div>
          
          <div className="w-full lg:w-3/5">
            <div className="relative aspect-[529/424]">
              <Image
                src={currentStep.image}
                alt={`Step ${activeStep} illustration`}
                width={529}
                height={424}
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 529px"
                className="object-cover rounded-lg w-full h-full transition-opacity duration-300 ease-in-out"
                key={activeStep}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}