import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import 'flag-icons/css/flag-icons.min.css';
import './index.css';
import App from './App.tsx';
import { LanguageProvider } from './i18n/contexts/LanguageProvider';
import { ThemeProvider } from './themes/contexts/ThemeContext';
import { GameDiaryProvider } from './features/GameSessions/model/GameDiaryContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <GameDiaryProvider>
          <App />
          <Analytics />
          <SpeedInsights />
        </GameDiaryProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);
