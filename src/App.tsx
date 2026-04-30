import { MainLayout } from './widgets/Layout/MainLayout';
import { Home } from './pages/Home/Home';
import { GameSessionsTool } from './pages/Tools/GameSessionsTool';
import { ToolsIndex } from './pages/Tools/ToolsIndex';
import { useHashRouter } from './shared/hooks/use-router';

function App() {
  const hash = useHashRouter();

  const renderPage = () => {
    if (hash === '#tools/game_sessions') {
      return <GameSessionsTool />;
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
