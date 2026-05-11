import React from 'react';
import { useLanguage } from '../../i18n/hooks/use-language';
import { LanguageSelector } from '../../features/LanguageSelector/LanguageSelector';
import { ThemeSelector } from '../../features/ThemeSelector/ThemeSelector';
import { useHashRouter } from '../../shared/hooks/use-router';

export const Header: React.FC = () => {
  const { t } = useLanguage();
  const hash = useHashRouter();

  const isHome = hash === '#home' || hash === '' || hash === '#';
  const isTools = hash.startsWith('#tools');
  const isDownload = hash === '#download';

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 bg-background/80 backdrop-blur-md border-b border-border transition-all">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        
        {/* Left Side: Logo & Nav */}
        <div className="flex items-center gap-8">
          <a href="#home" className="select-none group transition-transform active:scale-95">
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-foreground">Game</span>
              <span className="text-primary">Diary</span>
            </h1>
          </a>

          <nav className="hidden md:flex items-center gap-6">
            <a 
              href="#home" 
              className={`text-sm font-medium relative group transition-colors ${isHome ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('nav.home')}
              <span className={`absolute -bottom-1 left-0 w-full h-[1.5px] bg-primary transform transition-transform origin-left ${isHome ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </a>
            
            <a 
              href="#tools" 
              className={`text-sm font-medium relative group transition-colors ${isTools ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('nav.tools')}
              <span className={`absolute -bottom-1 left-0 w-full h-[1.5px] bg-primary transform transition-transform origin-left ${isTools ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </a>

            <a 
              href="#download" 
              className={`text-sm font-medium relative group transition-colors ${isDownload ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('nav.download')}
              <span className={`absolute -bottom-1 left-0 w-full h-[1.5px] bg-primary transform transition-transform origin-left ${isDownload ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </a>
          </nav>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <div className="w-[1px] h-4 bg-border mx-1" />
          <ThemeSelector variant="slider" size="md" />
        </div>
      </div>
    </header>
  );
};
