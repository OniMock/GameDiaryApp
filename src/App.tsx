import { MainLayout } from './widgets/Layout/MainLayout';
import { Home } from './pages/Home/Home';
import { GameSessionsTool } from './pages/Tools/GameSessionsTool';
import { ToolsIndex } from './pages/Tools/ToolsIndex';
import { DatabaseMergeTool } from './pages/Tools/DatabaseMergeTool';
import { Download } from './pages/Download/Download';
import { useHashRouter } from './shared/hooks/use-router';
import { useEffect } from 'react';

function App() {
  const hash = useHashRouter();

  // Scroll to top only for full-page route changes (download, tools, etc.).
  // For intra‑page anchors (e.g., #support) we let the browser handle scrolling.
  useEffect(() => {
    const topHashes = ['#download', '#tools', '#tools/game_sessions', '#tools/db_merge'];
    if (topHashes.includes(hash)) {
      const timer = setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [hash]);

  const renderPage = () => {
    if (hash === '#download') {
      // When the user clicks the Download tab we keep the hash so the router
      // shows the Download component. The scroll position will be handled by the
      // browser after the hash changes, which is the expected behavior.
      return <Download />;
    }
    if (hash === '#tools/game_sessions') {
      return <GameSessionsTool />;
    }
    if (hash === '#tools/db_merge') {
      return <DatabaseMergeTool />;
    }
    if (hash === '#tools') {
      return <ToolsIndex />;
    }
    return <Home />;
  };

  return (
    <MainLayout>
      {renderPage()}
    </MainLayout>
  );
}

export default App;
