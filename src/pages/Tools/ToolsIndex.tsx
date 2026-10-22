import React from 'react';
import { useLanguage } from '../../i18n/hooks/use-language';
import { useAppRouter } from '../../shared/hooks/use-router';
import { buildLocalizedPath } from '../../i18n/utils/routing';
import { Database, LayoutGrid, GitMerge } from 'lucide-react';

export const ToolsIndex: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const { navigate } = useAppRouter();

  const gameSessionsPath = buildLocalizedPath('/tools/game_sessions', currentLanguage);
  const dbMergePath = buildLocalizedPath('/tools/db_merge', currentLanguage);
  const toolsPath = buildLocalizedPath('/tools', currentLanguage);

  const tools = [
    {
      id: 'game_sessions',
      title: t('tools.gameSessions.title') || 'Game Sessions',
      subtitle: t('tools.gameSessions.subtitle') || 'Visual editor for backup.json',
      icon: <Database className="w-8 h-8 text-blue-500" />,
      href: gameSessionsPath,
      color: 'bg-blue-500/10'
    },
    {
      id: 'db_merge',
      title: t('tools.dbMerge.title') || 'Database Merge',
      subtitle: t('tools.dbMerge.subtitle') || 'Combine datasets',
      icon: <GitMerge className="w-8 h-8 text-emerald-500" />,
      href: dbMergePath,
      color: 'bg-emerald-500/10'
    },
    {
      id: 'placeholder_2',
      title: t('tools.advancedSettings.title') || 'Advanced Settings',
      subtitle: t('tools.advancedSettings.subtitle') || 'Under construction.',
      icon: <LayoutGrid className="w-8 h-8 text-purple-500" />,
      href: toolsPath,
      color: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="pb-20">
      <header className="py-4 mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          {t('tools.hub.title') || 'System Tools'}
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          {t('tools.hub.subtitle') || 'Manage your PSP database files with precision.'}
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <a
            key={tool.id}
            href={tool.href}
            onClick={(e) => {
              e.preventDefault();
              navigate(tool.href);
            }}
            className="group block p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300"
          >
            <div className={`w-14 h-14 rounded-xl ${tool.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
              {tool.icon}
            </div>
            <h2 className="text-xl font-bold text-card-foreground group-hover:text-primary transition-colors">
              {tool.title}
            </h2>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              {tool.subtitle}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
};
