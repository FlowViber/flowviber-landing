"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import Image from "next/image";

export function HeroSection() {
  const { language } = useLanguage();
  const t = translations[language].hero;

  const openCalendly = () => {
    window.open('https://calendly.com/luca-flowviber/30min', '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/minimalist_tech_work_49d907c1.jpg"
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/70" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gray-900 leading-tight">
          {t.title}
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-12 leading-relaxed">
          {t.subtitle}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={openCalendly}
            size="lg"
            className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <Calendar className="w-5 h-5 mr-2" />
            {t.cta}
          </Button>
          <span className="text-sm text-gray-700 font-medium">
            {t.trust}
          </span>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="w-6 h-6 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </section>
  );
}
