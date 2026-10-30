import React from 'react';
import { useLanguage } from '../../i18n/hooks/use-language';
import { LanguageSelector } from '../../features/LanguageSelector/LanguageSelector';
import { ThemeSelector } from '../../features/ThemeSelector/ThemeSelector';
import { useAppRouter } from '../../shared/hooks/use-router';
import { buildLocalizedPath } from '../../i18n/utils/routing';

export const Header: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const { route, hash, navigate } = useAppRouter();

  const isHome = route === 'home' && hash !== '#support';
  const isStats = route === 'stats';
  const isTools = route.startsWith('tools');
  const isDownload = route === 'download';
  const isSupport = hash === '#support';

  const homePath = buildLocalizedPath('/', currentLanguage);
  const statsPath = buildLocalizedPath('/stats', currentLanguage);
  const toolsPath = buildLocalizedPath('/tools', currentLanguage);
  const downloadPath = buildLocalizedPath('/download', currentLanguage);
  const supportPath = `${homePath}#support`;

  const handleNavClick = (path: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(path);
  };

  const handleHomeClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(homePath);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleSupportClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (route === 'home') {
      window.history.pushState(null, '', supportPath);
      document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(supportPath);
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 bg-background/80 backdrop-blur-md border-b border-border transition-all">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        
        {/* Left Side: Logo & Nav */}
        <div className="flex items-center gap-8">
          <a href={homePath} onClick={handleHomeClick} className="select-none group transition-transform active:scale-95 flex items-center gap-2.5">
            <img 
              src="/logo.svg" 
              alt="GameDiary Logo" 
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain transition-transform group-hover:scale-105 hidden dark:block" 
            />
            <img 
              src="/logo-light.svg" 
              alt="GameDiary Logo" 
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain transition-transform group-hover:scale-105 block dark:hidden" 
            />
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-foreground">Game</span>
              <span className="text-primary">Diary</span>
            </h1>
          </a>

          <nav className="hidden md:flex items-center gap-6">
            <a 
              href={homePath} 
              onClick={handleHomeClick}
              className={`text-sm font-medium relative group transition-colors ${isHome ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('nav.home')}
              <span className={`absolute -bottom-1 left-0 w-full h-[1.5px] bg-primary transform transition-transform origin-left ${isHome ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </a>

            <a
              href={statsPath}
              onClick={handleNavClick(statsPath)}
              className={`text-sm font-medium relative group transition-colors ${isStats ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('nav.stats')}
              <span className={`absolute -bottom-1 left-0 w-full h-[1.5px] bg-primary transform transition-transform origin-left ${isStats ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </a>
            
            <a 
              href={toolsPath} 
              onClick={handleNavClick(toolsPath)}
              className={`text-sm font-medium relative group transition-colors ${isTools ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('nav.tools')}
              <span className={`absolute -bottom-1 left-0 w-full h-[1.5px] bg-primary transform transition-transform origin-left ${isTools ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </a>

            <a 
              href={downloadPath} 
              onClick={handleNavClick(downloadPath)}
              className={`text-sm font-medium relative group transition-colors ${isDownload ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('nav.download')}
              <span className={`absolute -bottom-1 left-0 w-full h-[1.5px] bg-primary transform transition-transform origin-left ${isDownload ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </a>

            <a
              href={supportPath}
              onClick={handleSupportClick}
              className={`text-sm font-medium relative group transition-colors ${isSupport ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('nav.support')}
              <span className={`absolute -bottom-1 left-0 w-full h-[1.5px] bg-primary transform transition-transform origin-left ${isSupport ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
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
