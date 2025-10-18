"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

export function StatsSection() {
  const { language } = useLanguage();
  const t = translations[language].stats;

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900">
          {t.title}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {t.metrics.map((metric, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {metric.value}
              </div>
              <div className="text-gray-600 text-lg">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
