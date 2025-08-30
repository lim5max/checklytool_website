'use client';

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  once?: boolean;
  [key: string]: unknown;
}

export default function AnimatedSection({ 
  children, 
  className = "", 
  direction = 'up',
  delay = 0,
  once = true,
  ...props 
}: AnimatedSectionProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getInitialVariant = () => {
    if (isMobile) {
      return { opacity: 0, y: 30 };
    }
    
    switch (direction) {
      case 'left':
        return { opacity: 0, x: -50 };
      case 'right':
        return { opacity: 0, x: 50 };
      case 'up':
        return { opacity: 0, y: 30 };
      case 'down':
        return { opacity: 0, y: -30 };
      default:
        return { opacity: 0, y: 30 };
    }
  };

  return (
    <motion.div
      className={className}
      initial={getInitialVariant()}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "-100px" }}
      transition={{ duration: 0.8, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}