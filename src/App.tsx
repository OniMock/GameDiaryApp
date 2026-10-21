import { MainLayout } from './widgets/Layout/MainLayout';
import { Home } from './pages/Home/Home';
import { GameSessionsTool } from './pages/Tools/GameSessionsTool';
import { ToolsIndex } from './pages/Tools/ToolsIndex';
import { DatabaseMergeTool } from './pages/Tools/DatabaseMergeTool';
import { Download } from './pages/Download/Download';
import { useAppRouter } from './shared/hooks/use-router';
import { useLanguage } from './i18n/hooks/use-language';
import { syncDocumentMetadata } from './i18n/utils/routing';
import { useEffect } from 'react';

function App() {
  const { route, cleanPath, hash } = useAppRouter();
  const { currentLanguage } = useLanguage();

  // Sync document metadata on route or language changes
  useEffect(() => {
    syncDocumentMetadata(currentLanguage, cleanPath);
  }, [currentLanguage, cleanPath]);

  // Scroll to top on full-page route changes (unless jumping to an anchor)
  useEffect(() => {
    if (hash !== '#support') {
      window.scrollTo(0, 0);
    }
  }, [route, hash]);

  const renderPage = () => {
    switch (route) {
      case 'download':
        return <Download />;
      case 'tools/game_sessions':
        return <GameSessionsTool />;
      case 'tools/db_merge':
        return <DatabaseMergeTool />;
      case 'tools':
        return <ToolsIndex />;
      case 'home':
      default:
        return <Home />;
    }
  };

  return (
    <MainLayout>
      {renderPage()}
    </MainLayout>
  );
}

export default App;
