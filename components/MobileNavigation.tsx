'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface MobileNavigationProps {
  onOpenModal: () => void;
}

export default function MobileNavigation({ onOpenModal }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <div className="md:hidden flex items-center justify-between w-full">
        <Link href="/" className="flex gap-0.5 items-center justify-start relative">
          <Image 
            src="/images/logo.png" 
            alt="Checkly" 
            width={120} 
            height={40}
            className="object-contain"
          />
        </Link>
        <button 
          onClick={toggleMenu}
          className="overflow-clip relative shrink-0 size-[42px]"
          aria-label="Open menu"
        >
          <div className="absolute content-stretch flex flex-col gap-2 items-start justify-start left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]">
            <div className="bg-slate-900 h-1 rounded-xl shrink-0 w-[34px]" />
            <div className="bg-slate-900 h-1 rounded-xl shrink-0 w-[34px]" />
          </div>
        </button>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 bg-white z-50 md:hidden">
          <div className="box-border content-stretch flex flex-col items-center justify-between p-4 relative size-full">
            <div className="content-stretch flex flex-col gap-8 items-start justify-start relative shrink-0 w-full">
              <div className="content-stretch flex flex-col gap-5 items-end justify-start relative shrink-0 w-full">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                  <Link href="/" className="flex gap-0.5 items-center justify-start relative" onClick={closeMenu}>
                    <Image 
                      src="/images/logo.png" 
                      alt="Checkly" 
                      width={120} 
                      height={40}
                      className="object-contain"
                    />
                  </Link>
                  <button 
                    onClick={closeMenu}
                    className="overflow-clip relative shrink-0 size-[42px]"
                    aria-label="Close menu"
                  >
                    <div className="absolute flex h-[20.464px] items-center justify-center translate-x-[-50%] translate-y-[-50%] w-[31.445px]" style={{ top: "calc(50% + 0.435px)", left: "calc(50% + 0.607px)" }}>
                      <div className="flex-none rotate-[30deg]">
                        <div className="bg-slate-900 h-1 rounded-xl w-[34px]" />
                      </div>
                    </div>
                    <div className="absolute flex h-[20.464px] items-center justify-center translate-x-[-50%] translate-y-[-50%] w-[31.445px]" style={{ top: "calc(50% + 0.393px)", left: "calc(50% + 0.435px)" }}>
                      <div className="flex-none rotate-[330deg]">
                        <div className="bg-slate-900 h-1 rounded-xl w-[34px]" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>
              <div className="content-stretch flex flex-col font-nunito font-black gap-2.5 items-start justify-start leading-[0] relative shrink-0 text-[36px] text-slate-800 tracking-[-1px] w-full">
                <Link href="/" onClick={closeMenu} className="relative shrink-0 w-full">
                  <p className="leading-[1.2]">Главная</p>
                </Link>
                <Link href="/about" onClick={closeMenu} className="relative shrink-0 w-full">
                  <p className="leading-[1.2]">О проекте</p>
                </Link>
              </div>
            </div>
            <button 
              onClick={() => {
                closeMenu();
                onOpenModal();
              }}
              className="bg-[#096ff5] hover:bg-blue-600 transition-colors box-border content-stretch flex gap-2 h-[172px] items-center justify-center overflow-clip px-5 py-3 relative rounded-[1200px] shadow-lg shrink-0 w-full"
            >
              <div className="flex flex-col font-inter font-medium justify-center leading-[0] not-italic relative shrink-0 text-white text-[24px] text-nowrap">
                <p className="leading-[1.6] whitespace-pre">Оставить заявку</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
}