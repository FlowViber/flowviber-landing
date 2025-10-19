"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

export function StatsSection() {
  const { language } = useLanguage();
  const t = translations[language].stats;

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 md:mb-16 text-slate-800">
          {t.title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {t.metrics.map((metric, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-4xl sm:text-5xl font-bold text-slate-800 mb-2">
                {metric.value}
              </div>
              <div className="text-slate-600 text-base sm:text-lg">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
