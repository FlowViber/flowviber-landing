"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import Image from "next/image";

export function ProcessFlowSection() {
  const { language } = useLanguage();
  const t = translations[language].processFlow;

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-slate-800">
            {t.title}
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 hidden lg:block" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
            {t.steps.map((step, index) => (
              <div key={step.id} className="relative">
                <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-gray-200 hover:border-gray-300 transition-colors shadow-sm relative z-10">
                  <div className="w-12 h-12 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xl mb-4 mx-auto">
                    {index + 1}
                  </div>
                  <h3 className="font-bold text-base sm:text-lg mb-2 text-center text-slate-800">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 text-sm text-center">
                    {step.description}
                  </p>
                </div>
                {index < t.steps.length - 1 && (
                  <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300 hidden lg:block z-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 sm:mt-16" style={{ backgroundColor: '#1e293b', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6" style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {language === 'nl' ? 'Onze Methode' : 'Our Method'}
          </h3>
          <p className="text-lg sm:text-xl md:text-2xl font-semibold" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
            {language === 'nl' 
              ? 'Gestructureerd, transparant, resultaatgericht'
              : 'Structured, transparent, results-driven'}
          </p>
        </div>
      </div>
    </section>
  );
}
