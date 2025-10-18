'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';

export function CookieConsent() {
  const { language } = useLanguage();
  const t = translations[language];
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowConsent(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-slate-800 border-t border-slate-700 shadow-xl">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white flex-1">
            {t.cookies.message}
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleDecline}
              className="bg-slate-700 hover:bg-slate-600 text-white border-2 border-slate-600 font-semibold"
            >
              {t.cookies.decline}
            </Button>
            <Button
              onClick={handleAccept}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {t.cookies.accept}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
