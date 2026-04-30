import React from 'react';
import { useLanguage } from '../../i18n/hooks/use-language';

export const Home: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-14 flex flex-col items-center justify-center text-center px-6 relative">
      {/* Refined Background elements */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="max-w-4xl mx-auto space-y-12 animate-fade-in-up">
        <div className="space-y-2">
          <h1 className="text-6xl md:text-[7rem] font-[900] tracking-tighter select-none leading-none">
            <span className="text-white drop-shadow-sm">Game</span>
            <span className="text-[#1E3A8A] dark:text-[#3B82F6]">Diary</span>
          </h1>
          
          <p className="text-lg md:text-xl text-foreground/80 font-medium max-w-xl mx-auto leading-relaxed">
            {t('welcome.subtitle')}
          </p>
        </div>

        {/* Primary Action / UI Element */}
        <div className="flex flex-col items-center gap-6">
          <button className="px-8 py-3 bg-[#1E3A8A] dark:bg-[#3B82F6] text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]">
            Get Started
          </button>
          
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-foreground/40">
            <div className="h-px w-8 bg-foreground/10" />
            <span>Track your journey</span>
            <div className="h-px w-8 bg-foreground/10" />
          </div>
        </div>
      </div>

      {/* Subtle Scroll Hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-20">
        <div className="w-[1px] h-12 bg-gradient-to-b from-foreground to-transparent" />
      </div>
    </div>
  );
};
