'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      onClick={() => setLanguage(language === 'nl' ? 'en' : 'nl')}
      className="h-10 px-4 bg-black/10 hover:bg-black/20 text-gray-700 border border-black/20 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/25 backdrop-blur-sm transition-colors font-semibold"
      aria-label="Toggle language"
    >
      {language === 'nl' ? 'EN' : 'NL'}
    </Button>
  );
}
