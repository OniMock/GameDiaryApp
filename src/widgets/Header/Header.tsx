import React from 'react';
import { useLanguage } from '../../i18n/hooks/use-language';
import { LanguageSelector } from '../../features/LanguageSelector/LanguageSelector';
import { ThemeSelector } from '../../features/ThemeSelector/ThemeSelector';
import { useHashRouter } from '../../shared/hooks/use-router';

export const Header: React.FC = () => {
  const { t } = useLanguage();
  const hash = useHashRouter();

  const isHome = hash === '#home' || hash === '';
  const isTools = hash.startsWith('#tools');

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 bg-black/50 backdrop-blur-md border-b border-white/5 transition-all">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        
        {/* Left Side: Logo & Nav */}
        <div className="flex items-center gap-8">
          <div className="cursor-pointer select-none">
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-white">Game</span>
              <span className="text-[#3B82F6]">Diary</span>
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a 
              href="#home" 
              className={`text-sm font-medium relative group py-1 transition-colors ${isHome ? 'text-white' : 'text-white/60 hover:text-white'}`}
            >
              {t('nav.home')}
              <span className={`absolute bottom-0 left-0 w-full h-[1.5px] bg-[#3B82F6] transform transition-transform origin-left ${isHome ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </a>
            
            <a 
              href="#tools" 
              className={`text-sm font-medium relative group py-1 transition-colors ${isTools ? 'text-white' : 'text-white/60 hover:text-white'}`}
            >
              {t('nav.tools')}
              <span className={`absolute bottom-0 left-0 w-full h-[1.5px] bg-[#3B82F6] transform transition-transform origin-left ${isTools ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </a>
          </nav>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <div className="w-[1px] h-4 bg-white/20 mx-1" />
          <ThemeSelector variant="slider" size="md" />
        </div>
      </div>
    </header>
  );
};
