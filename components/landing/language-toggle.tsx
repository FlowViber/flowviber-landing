'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      onClick={() => setLanguage(language === 'nl' ? 'en' : 'nl')}
      className="h-10 px-4 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 hover:border-gray-400 transition-colors font-bold rounded-lg"
      aria-label="Toggle language"
    >
      {language === 'nl' ? 'EN' : 'NL'}
    </Button>
  );
}
