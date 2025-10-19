"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import Image from "next/image";

export function ProcessFlowSection() {
  const { language } = useLanguage();
  const t = translations[language].processFlow;

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800">
            {t.title}
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 hidden md:block" />
          
          <div className="grid md:grid-cols-4 gap-8 relative">
            {t.steps.map((step, index) => (
              <div key={step.id} className="relative">
                <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-gray-300 transition-colors shadow-sm relative z-10">
                  <div className="w-12 h-12 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xl mb-4 mx-auto">
                    {index + 1}
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-center text-slate-800">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 text-sm text-center">
                    {step.description}
                  </p>
                </div>
                {index < t.steps.length - 1 && (
                  <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300 hidden md:block z-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 relative rounded-3xl overflow-hidden shadow-xl border border-gray-200">
          <div className="absolute inset-0 bg-slate-900/90 z-10" />
          <Image
            src="/images/serene_landscape_mou_9364ee6e.jpg"
            alt="Process visualization"
            width={1200}
            height={400}
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-white text-center px-6">
              <h3 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-2xl" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>
                {language === 'nl' ? 'Onze Methode' : 'Our Method'}
              </h3>
              <p className="text-lg md:text-2xl font-semibold drop-shadow-xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
                {language === 'nl' 
                  ? 'Gestructureerd, transparant, resultaatgericht'
                  : 'Structured, transparent, results-driven'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
