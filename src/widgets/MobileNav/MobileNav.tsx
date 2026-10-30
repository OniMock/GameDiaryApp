import React from 'react';
import { useLanguage } from '../../i18n/hooks/use-language';
import { useAppRouter } from '../../shared/hooks/use-router';
import { buildLocalizedPath } from '../../i18n/utils/routing';
import { Home, BarChart3, Hammer, Download, Coffee } from 'lucide-react';

export const MobileNav: React.FC = () => {
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
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 h-16 bg-background/80 backdrop-blur-lg border-t border-border flex items-center justify-around px-2 pb-safe">
      <a 
        href={homePath} 
        onClick={handleHomeClick}
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${isHome ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <Home size={20} className={isHome ? 'scale-110' : ''} />
        <span className="text-[10px] font-bold uppercase tracking-tight">{t('nav.home')}</span>
        {isHome && <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />}
      </a>

      <a
        href={statsPath}
        onClick={handleNavClick(statsPath)}
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${isStats ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <BarChart3 size={20} className={isStats ? 'scale-110' : ''} />
        <span className="text-[10px] font-bold uppercase tracking-tight">{t('nav.stats')}</span>
        {isStats && <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />}
      </a>

      <a
        href={toolsPath} 
        onClick={handleNavClick(toolsPath)}
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${isTools ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <Hammer size={20} className={isTools ? 'scale-110' : ''} />
        <span className="text-[10px] font-bold uppercase tracking-tight">{t('nav.tools')}</span>
        {isTools && <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />}
      </a>

      <a 
        href={downloadPath} 
        onClick={handleNavClick(downloadPath)}
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${isDownload ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <Download size={20} className={isDownload ? 'scale-110' : ''} />
        <span className="text-[10px] font-bold uppercase tracking-tight">{t('nav.download')}</span>
        {isDownload && <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />}
      </a>

      <a
        href={supportPath}
        onClick={handleSupportClick}
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${isSupport ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <Coffee size={20} className={isSupport ? 'scale-110' : ''} />
        <span className="text-[10px] font-bold uppercase tracking-tight">{t('nav.support')}</span>
        {isSupport && <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />}
      </a>
    </nav>
  );
};
