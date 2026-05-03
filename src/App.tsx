import { MainLayout } from './widgets/Layout/MainLayout';
import { Home } from './pages/Home/Home';
import { GameSessionsTool } from './pages/Tools/GameSessionsTool';
import { ToolsIndex } from './pages/Tools/ToolsIndex';
import { DatabaseMergeTool } from './pages/Tools/DatabaseMergeTool';
import { useHashRouter } from './shared/hooks/use-router';

function App() {
  const hash = useHashRouter();

  const renderPage = () => {
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
