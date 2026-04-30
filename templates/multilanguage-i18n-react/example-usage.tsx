import React from 'react';
import { LanguageProvider } from './src/contexts/LanguageProvider';
import { useLanguage } from './src/contexts/LanguageProvider';
import LanguageSelector from './src/components/LanguageSelector';

// Exemplo de componente usando o sistema de tradução
const ExampleComponent: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{t('welcome.title')}</h1>
      <p>{t('welcome.description')}</p>
      
      {/* Exemplo com variáveis */}
      <p>{t('welcome.message', { name: 'João' })}</p>
      <p>{t('user.greeting', { name: 'Maria' })}</p>
      <p>{t('items.count', { count: '5' })}</p>
      <p>{t('time.lastUpdate', { date: new Date().toLocaleDateString() })}</p>
      
      {/* Navegação */}
      <nav className="flex gap-4">
        <a href="/">{t('nav.home')}</a>
        <a href="/about">{t('nav.about')}</a>
        <a href="/projects">{t('nav.projects')}</a>
        <a href="/contact">{t('nav.contact')}</a>
      </nav>
      
      {/* Botões comuns */}
      <div className="flex gap-2">
        <button>{t('common.save')}</button>
        <button>{t('common.cancel')}</button>
        <button>{t('common.delete')}</button>
      </div>

      {/* Exemplo de autenticação */}
      <div className="border-t pt-4">
        <h2 className="text-xl font-semibold">{t('auth.login')}</h2>
        <form className="space-y-2">
          <input placeholder={t('auth.email')} />
          <input placeholder={t('auth.password')} type="password" />
          <button type="submit">{t('auth.login')}</button>
        </form>
      </div>

      {/* Exemplo de toast messages */}
      <div className="border-t pt-4">
        <h3 className="font-semibold">Toast Examples:</h3>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-green-600 rounded text-sm">{t('toast.success')}</span>
          <span className="px-2 py-1 bg-red-600 rounded text-sm">{t('toast.error')}</span>
          <span className="px-2 py-1 bg-yellow-600 rounded text-sm">{t('toast.warning')}</span>
          <span className="px-2 py-1 bg-blue-600 rounded text-sm">{t('toast.info')}</span>
        </div>
      </div>
    </div>
  );
};

// Exemplo de uso completo
const App: React.FC = () => {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="p-4 flex justify-between items-center">
          <h1>Meu Site</h1>
          <LanguageSelector />
        </header>
        <main>
          <ExampleComponent />
        </main>
        <footer className="p-4 text-center text-gray-400">
          <ExampleFooter />
        </footer>
      </div>
    </LanguageProvider>
  );
};

// Componente de rodapé de exemplo
const ExampleFooter: React.FC = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear().toString();
  
  return (
    <div>
      <p>{t('footer.text', { year: currentYear })}</p>
      <p>{t('footer.madeWith')}</p>
    </div>
  );
};

export default App;