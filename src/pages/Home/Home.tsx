import React from 'react';
import { useLanguage } from '../../i18n/hooks/use-language';
import './Home.css';

export const Home: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="home-container">
      {/* Top line decorator */}
      <div className="home-top-line" />

      <div className="max-w-4xl mx-auto space-y-12 animate-fade-in-up">
        <div className="space-y-2">
          <h1 className="home-hero-title">
            <span className="text-foreground drop-shadow-sm">Game</span>
            <span className="text-primary">Diary</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
            {t('welcome.subtitle')}
          </p>
        </div>

        {/* Primary Action / UI Element */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a 
              href="#tools" 
              className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]"
            >
              {t('home.getStarted')}
            </a>
            <a 
              href="#download" 
              className="px-8 py-3 bg-card border border-border text-foreground font-bold rounded-2xl shadow-lg hover:bg-card/80 hover:scale-[1.02] transition-all active:scale-[0.98]"
            >
              {t('home.download')}
            </a>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/40">
            <div className="h-px w-8 bg-border" />
            <span>{t('download.subtitle')}</span>
            <div className="h-px w-8 bg-border" />
          </div>
        </div>
      </div>

      {/* Subtle Scroll Hint */}
      <div className="home-scroll-hint">
        <div className="home-scroll-line" />
      </div>
    </div>
  );
};
