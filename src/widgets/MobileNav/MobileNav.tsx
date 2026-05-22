import React from 'react';
import { useLanguage } from '../../i18n/hooks/use-language';
import { useHashRouter } from '../../shared/hooks/use-router';
import { Home, Hammer, Download, Coffee } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { t } = useLanguage();
  const hash = useHashRouter();

  const isHome = hash === '#home' || hash === '' || hash === '#';
  const isTools = hash.startsWith('#tools');
  const isDownload = hash === '#download';
  const isSupport = hash === '#support';

  const handleHomeClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (window.location.hash !== '#home') {
      window.location.hash = 'home';
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 h-16 bg-background/80 backdrop-blur-lg border-t border-border flex items-center justify-around px-2 pb-safe">
      <a 
        href="#home" 
        onClick={handleHomeClick}
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${isHome ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <Home size={20} className={isHome ? 'scale-110' : ''} />
        <span className="text-[10px] font-bold uppercase tracking-tight">{t('nav.home')}</span>
        {isHome && <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />}
      </a>

      <a 
        href="#tools" 
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${isTools ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <Hammer size={20} className={isTools ? 'scale-110' : ''} />
        <span className="text-[10px] font-bold uppercase tracking-tight">{t('nav.tools')}</span>
        {isTools && <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />}
      </a>

      <a 
        href="#download" 
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${isDownload ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <Download size={20} className={isDownload ? 'scale-110' : ''} />
        <span className="text-[10px] font-bold uppercase tracking-tight">{t('nav.download')}</span>
        {isDownload && <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />}
      </a>

      <a
        href="#support"
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${isSupport ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <Coffee size={20} className={isSupport ? 'scale-110' : ''} />
        <span className="text-[10px] font-bold uppercase tracking-tight">{t('nav.support')}</span>
        {isSupport && <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />}
      </a>
    </nav>
  );
};
