import React from 'react';
import { useLanguage } from '../../i18n/hooks/use-language';
import { Cpu, Gamepad2, Globe, ArrowRight, Download, ChevronDown, Activity, Layers, Zap, Clock, Play } from 'lucide-react';
import './Home.css';

export const Home: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="home-wrapper">
      {/* Background Decorators */}
      <div className="home-bg-glow home-bg-glow-primary" />
      <div className="home-bg-glow home-bg-glow-secondary" />
      <div className="home-bg-grid" />

      <div className="home-container">

        {/* HERO SECTION */}
        <section className="home-hero animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            PSP Homebrew & Plugin
          </div>

          <h1 className="home-hero-title mb-2 overflow-visible">
            <span className="inline-block text-foreground drop-shadow-sm">Game</span>
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 drop-shadow-sm pb-[0.3em] -mb-[0.3em]">Diary</span>
          </h1>

          <div className="text-2xl md:text-3xl font-bold text-foreground/90 mb-6">
            {t('home.hero.title1') || 'Track Every'} <span className="text-primary">{t('home.hero.title2') || 'Session'}</span>
          </div>

          <p className="home-hero-subtitle">
            {t('home.hero.subtitle') || 'The ultimate background playtime tracker for PlayStation Portable. Kernel-mode plugin meets premium user-mode application.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <a
              href="#tools"
              className="home-btn home-btn-primary group"
            >
              <span>{t('home.getStarted')}</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#download"
              className="home-btn home-btn-secondary group"
            >
              <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
              <span>{t('home.download')}</span>
            </a>
          </div>
        </section>

        {/* IMAGE SHOWCASE SECTION (ZIG-ZAG) */}
        <section className="home-showcase-section mt-16 md:mt-32 mb-24 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="showcase-container">
            
            {/* Row 1: Image Left, Text Right */}
            <div className="showcase-row">
              <div className="showcase-image-wrapper">
                <img src="/psp-carousel.png" alt="GameDiary Carousel" className="showcase-img" />
              </div>
              <div className="showcase-text">
                <div className="showcase-badge">
                  <Gamepad2 size={14} className="text-primary" />
                  <span>{t('home.showcase.carousel.badge')}</span>
                </div>
                <h3 className="showcase-title">{t('home.showcase.carousel.title')}</h3>
                <p className="showcase-desc">{t('home.showcase.carousel.desc')}</p>
                <ul className="showcase-features">
                  <li><div className="bullet"></div> {t('home.showcase.carousel.feature1')}</li>
                  <li><div className="bullet"></div> {t('home.showcase.carousel.feature2')}</li>
                </ul>
              </div>
            </div>

            {/* Row 2: Text Left, Image Right */}
            <div className="showcase-row showcase-reverse">
              <div className="showcase-image-wrapper">
                <img src="/psp-details.png" alt="GameDiary Details" className="showcase-img" />
              </div>
              <div className="showcase-text">
                <div className="showcase-badge">
                  <Activity size={14} className="text-primary" />
                  <span>{t('home.showcase.details.badge')}</span>
                </div>
                <h3 className="showcase-title">{t('home.showcase.details.title')}</h3>
                <p className="showcase-desc">{t('home.showcase.details.desc')}</p>
                <ul className="showcase-features">
                  <li><div className="bullet"></div> {t('home.showcase.details.feature1')}</li>
                  <li><div className="bullet"></div> {t('home.showcase.details.feature2')}</li>
                </ul>
              </div>
            </div>

          </div>
        </section>

        {/* SCROLL HINT */}
        <div className="home-scroll-hint animate-fade-in delay-500">
          <ChevronDown size={24} className="animate-bounce text-muted-foreground/50" />
        </div>

        {/* PREMIUM BENTO GRID SECTION */}
        <section className="home-bento-section mt-12 md:mt-16 mb-20 w-full max-w-5xl mx-auto px-4 z-10 relative">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t('home.features.title') || 'Why GameDiary?'}
            </h2>
            <div className="h-1 w-12 bg-primary mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:auto-rows-[250px]">

            {/* Bento Card 1: The Plugin (Spans 2 columns on desktop) */}
            <div className="bento-card md:col-span-2 group">
              <div className="bento-glow" />
              <div className="bento-content">
                <div className="flex justify-between items-start mb-4">
                  <div className="bento-icon-wrapper bg-blue-500/10 text-blue-500">
                    <Cpu size={24} />
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{t('home.features.plugin.title') || 'Invisible Tracking'}</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  {t('home.features.plugin.desc') || 'A lightweight PRX plugin runs silently in the background, logging every minute of your gameplay across UMDs, ISOs, and Homebrews without performance hit.'}
                </p>
                {/* Visual decoration */}
                <div className="absolute right-0 bottom-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Activity size={120} />
                </div>
              </div>
            </div>

            {/* Bento Card 2: The App */}
            <div className="bento-card group">
              <div className="bento-glow" />
              <div className="bento-content">
                <div className="bento-icon-wrapper bg-emerald-500/10 text-emerald-500 mb-4">
                  <Gamepad2 size={24} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{t('home.features.app.title') || 'Premium Dashboard'}</h3>
                <p className="text-muted-foreground text-sm">
                  {t('home.features.app.desc') || 'Launch the beautiful EBOOT application to view your statistics.'}
                </p>
                <div className="mt-auto pt-4">
                  <div className="h-1.5 w-full bg-emerald-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-3/4 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Web Integration */}
            <div className="bento-card group">
              <div className="bento-glow" />
              <div className="bento-content">
                <div className="bento-icon-wrapper bg-purple-500/10 text-purple-500 mb-4">
                  <Globe size={24} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{t('home.features.web.title') || 'Web Integration'}</h3>
                <p className="text-muted-foreground text-sm">
                  {t('home.features.web.desc') || 'Export your backup.json and use our web tools to merge databases and edit sessions.'}
                </p>
              </div>
            </div>

            {/* Bento Card 4: Performance / Visual (Spans 2 columns) */}
            <div className="bento-card md:col-span-2 group overflow-hidden">
              <div className="bento-glow" />
              <div className="bento-content flex flex-col md:flex-row gap-6 items-center h-full">
                <div className="flex-1">
                  <div className="bento-icon-wrapper bg-orange-500/10 text-orange-500 mb-4 inline-flex">
                    <Zap size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{t('home.features.overhead.title') || 'Zero Overhead'}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('home.features.overhead.desc') || 'Engineered in pure C, the kernel module consumes negligible memory, ensuring your games run exactly as they should.'}
                  </p>
                </div>
                {/* Mini abstract UI graphic */}
                <div className="flex-1 w-full flex justify-center items-center">
                  <div className="relative w-48 h-32 bg-background/50 rounded-lg border border-border/50 shadow-inner flex flex-col p-3 overflow-hidden">
                    <div className="h-2 w-12 bg-muted-foreground/30 rounded mb-4" />
                    <div className="flex items-end gap-2 h-16 mt-auto">
                      <div className="w-1/4 bg-primary/40 rounded-t-sm h-1/2" />
                      <div className="w-1/4 bg-primary/60 rounded-t-sm h-3/4" />
                      <div className="w-1/4 bg-primary/80 rounded-t-sm h-full" />
                      <div className="w-1/4 bg-primary rounded-t-sm h-2/3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};
