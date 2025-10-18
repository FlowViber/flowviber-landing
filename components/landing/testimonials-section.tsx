"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import Image from "next/image";
import { X } from "lucide-react";

export function TestimonialsSection() {
  const { language } = useLanguage();
  const t = translations[language].testimonials;
  const [selectedTestimonial, setSelectedTestimonial] = useState<number | null>(null);

  return (
    <>
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-slate-800">
            {t.title}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {t.items.map((testimonial, index) => (
              <div
                key={index}
                onClick={() => setSelectedTestimonial(index)}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{testimonial.name}</h3>
                    <p className="text-sm text-slate-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-slate-700 mb-4 line-clamp-4">
                  "{testimonial.quote}"
                </p>
                <div className="inline-block bg-slate-700 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  {testimonial.results}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedTestimonial !== null && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedTestimonial(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTestimonial(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                <Image
                  src={t.items[selectedTestimonial].image}
                  alt={t.items[selectedTestimonial].name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">
                  {t.items[selectedTestimonial].name}
                </h3>
                <p className="text-slate-600">{t.items[selectedTestimonial].role}</p>
                <p className="text-sm text-slate-500">{t.items[selectedTestimonial].company}</p>
              </div>
            </div>
            
            <p className="text-xl text-slate-700 mb-6 leading-relaxed">
              "{t.items[selectedTestimonial].quote}"
            </p>
            
            <div className="inline-block bg-slate-700 text-white px-6 py-3 rounded-full text-lg font-semibold">
              {t.items[selectedTestimonial].results}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
