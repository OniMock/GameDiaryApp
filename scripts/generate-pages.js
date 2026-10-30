import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BASE_URL = 'https://gamediary.onimock.com';

const LANGUAGES = [
  {
    code: 'en',
    slug: '',
    hreflang: 'en',
    ogLocale: 'en_US',
    htmlLang: 'en',
    name: 'English',
    titleSuffix: 'GameDiary PSP | Your Personal PSP Gaming Journal',
    pageTitles: {
      home: 'GameDiary PSP | Your Personal PSP Gaming Journal',
      tools: 'System Tools | GameDiary PSP',
      download: 'Download GameDiary | PSP Plugin & App',
      stats: 'Statistics & Analytics | GameDiary PSP'
    },
    pageDescriptions: {
      home: 'GameDiary: The ultimate PSP app to track your PlayStation Portable playtime. A lightweight homebrew kernel plugin and dashboard to manage your gaming history.',
      tools: 'Manage your GameDiary PSP data with precision. Visual backup.json editor and database merge tools.',
      download: 'Download the latest GameDiary release for PlayStation Portable. Includes kernel plugin, homebrew app, and installation instructions.',
      stats: 'Deep personal playtime analytics, top games ranking, platform distribution, and historical gaming trends for your PSP.'
    },
    keywords: 'GameDiary PSP, Game Diary, Homebrew, PSP App, PlayStation Portable, Game Tracker, Playtime, PSP Plugin, Gaming Journal, Portable PlayStation'
  },
  {
    code: 'pt-BR',
    slug: 'pt',
    hreflang: 'pt-BR',
    ogLocale: 'pt_BR',
    htmlLang: 'pt-BR',
    name: 'Português',
    pageTitles: {
      home: 'GameDiary PSP | Seu Diário Gamer Pessoal para PSP',
      tools: 'Ferramentas do Sistema | GameDiary PSP',
      download: 'Baixar GameDiary | Plugin & Aplicativo para PSP',
      stats: 'Estatísticas & Análises | GameDiary PSP'
    },
    pageDescriptions: {
      home: 'O rastreador de tempo de jogo definitivo para o PlayStation Portable. A união de um plugin invisível no modo kernel com um aplicativo dashboard premium.',
      tools: 'Gerencie seus dados do GameDiary PSP com precisão. Editor visual de backup.json e ferramentas de mesclagem de banco de dados.',
      download: 'Baixe a versão mais recente do GameDiary para o PlayStation Portable. Inclui plugin kernel, aplicativo homebrew e guia de instalação.',
      stats: 'Estatísticas pessoais completas, ranking de jogos mais jogados, distribuição por plataforma e evolução temporal do seu PSP.'
    },
    keywords: 'GameDiary PSP, Game Diary, Homebrew, Aplicativo PSP, PlayStation Portable, Rastreador de Jogos, Tempo de Jogo, Plugin PSP, Diário Gamer'
  },
  {
    code: 'es',
    slug: 'es',
    hreflang: 'es',
    ogLocale: 'es_ES',
    htmlLang: 'es',
    name: 'Español',
    pageTitles: {
      home: 'GameDiary PSP | Tu Diario de Juegos Personal para PSP',
      tools: 'Herramientas del Sistema | GameDiary PSP',
      download: 'Descargar GameDiary | Plugin y Aplicación para PSP',
      stats: 'Estadísticas y Análisis | GameDiary PSP'
    },
    pageDescriptions: {
      home: 'El rastreador definitivo de tiempo de juego para PlayStation Portable. Plugin ligero en modo kernel y panel de control moderno.',
      tools: 'Administra tus datos de GameDiary PSP con precisión. Editor visual de backup.json y herramientas de combinación de datos.',
      download: 'Descarga la última versión de GameDiary para PlayStation Portable. Incluye plugin kernel, aplicación homebrew y guía de instalación.',
      stats: 'Estadísticas personales detalladas, ranking de títulos más jugados, distribución por plataformas y evolución temporal para PSP.'
    },
    keywords: 'GameDiary PSP, Game Diary, Homebrew, App PSP, PlayStation Portable, Registro de Juego, Horas de Juego, Plugin PSP, Diario Gamer'
  },
  {
    code: 'de',
    slug: 'de',
    hreflang: 'de',
    ogLocale: 'de_DE',
    htmlLang: 'de',
    name: 'Deutsch',
    pageTitles: {
      home: 'GameDiary PSP | Dein persönliches PSP-Gaming-Tagebuch',
      tools: 'System-Tools | GameDiary PSP',
      download: 'GameDiary herunterladen | PSP-Plugin und App',
      stats: 'Statistiken & Analysen | GameDiary PSP'
    },
    pageDescriptions: {
      home: 'Der ultimative Spielzeittracker für PlayStation Portable. Schlankes Kernel-Plugin kombiniert mit einem modernen Dashboard.',
      tools: 'Verwalte deine GameDiary PSP-Daten mit höchster Präzision. Visueller backup.json-Editor und Datenbank-Merge-Tools.',
      download: 'Lade die neueste GameDiary-Version für PlayStation Portable herunter. Beinhaltet Kernel-Plugin, Homebrew-App und Installationsanleitung.',
      stats: 'Detaillierte persönliche Spielzeitstatistiken, Top-Spiele-Rangliste, Plattformverteilung und historische Gaming-Trends für deine PSP.'
    },
    keywords: 'GameDiary PSP, Game Diary, Homebrew, PSP App, PlayStation Portable, Spielzeittracker, PSP Plugin, Gaming Journal'
  },
  {
    code: 'fr',
    slug: 'fr',
    hreflang: 'fr',
    ogLocale: 'fr_FR',
    htmlLang: 'fr',
    name: 'Français',
    pageTitles: {
      home: 'GameDiary PSP | Votre Journal de Jeu Personnel pour PSP',
      tools: 'Outils Système | GameDiary PSP',
      download: 'Télécharger GameDiary | Plugin et Application PSP',
      stats: 'Statistiques et Analyses | GameDiary PSP'
    },
    pageDescriptions: {
      home: 'Le tracker de temps de jeu ultime pour PlayStation Portable. Plugin en mode kernel discret et tableau de bord moderne.',
      tools: 'Gérez vos données GameDiary PSP avec précision. Éditeur visuel pour backup.json et outils de fusion de bases de données.',
      download: 'Téléchargez la dernière version de GameDiary pour PlayStation Portable. Comprend le plugin kernel, l\'application homebrew et le guide d\'installation.',
      stats: 'Statistiques personnelles approfondies, classement des jeux les plus joués, répartition par plateforme et historique pour votre PSP.'
    },
    keywords: 'GameDiary PSP, Game Diary, Homebrew, Application PSP, PlayStation Portable, Suivi de jeu, Plugin PSP, Journal Gamer'
  },
  {
    code: 'it',
    slug: 'it',
    hreflang: 'it',
    ogLocale: 'it_IT',
    htmlLang: 'it',
    name: 'Italiano',
    pageTitles: {
      home: 'GameDiary PSP | Il Tuo Diario di Gioco Personale per PSP',
      tools: 'Strumenti di Sistema | GameDiary PSP',
      download: 'Scarica GameDiary | Plugin e Applicazione per PSP',
      stats: 'Statistiche e Analisi | GameDiary PSP'
    },
    pageDescriptions: {
      home: 'Il tracker di tempo di gioco definitivo per PlayStation Portable. Plugin leggero in modalità kernel e dashboard moderna.',
      tools: 'Gestisci i tuoi dati GameDiary PSP con precisione. Editor visuale per backup.json e strumenti di unione database.',
      download: 'Scarica l\'ultima versione di GameDiary per PlayStation Portable. Include il plugin kernel, l\'app homebrew e le istruzioni di installazione.',
      stats: 'Statistiche personali approfondite, classifica dei giochi più giocati, distribuzione per piattaforma e tendenze per PSP.'
    },
    keywords: 'GameDiary PSP, Game Diary, Homebrew, App PSP, PlayStation Portable, Registro tempo di gioco, Plugin PSP, Diario Gaming'
  },
  {
    code: 'ru',
    slug: 'ru',
    hreflang: 'ru',
    ogLocale: 'ru_RU',
    htmlLang: 'ru',
    name: 'Русский',
    pageTitles: {
      home: 'GameDiary PSP | Ваш личный игровой дневник для PSP',
      tools: 'Системные инструменты | GameDiary PSP',
      download: 'Скачать GameDiary | Плагин и приложение для PSP',
      stats: 'Статистика и Аналитика | GameDiary PSP'
    },
    pageDescriptions: {
      home: 'Лучший трекер игрового времени для PlayStation Portable. Невидимый плагин ядра и современный пользовательский дашборд.',
      tools: 'Управляйте данными GameDiary PSP с высокой точностью. Визуальный редактор backup.json и инструменты объединения баз данных.',
      download: 'Скачайте последнюю версию GameDiary для PlayStation Portable. Включает плагин ядра, homebrew-приложение и инструкцию по установке.',
      stats: 'Подробная личная статистика игрового времени, рейтинг любимых игр, распределение по платформам и хронология для PSP.'
    },
    keywords: 'GameDiary PSP, Game Diary, Homebrew, PSP приложение, PlayStation Portable, Трекер времени, PSP плагин, Игровой дневник'
  },
  {
    code: 'cn',
    slug: 'cn',
    hreflang: 'zh-CN',
    ogLocale: 'zh_CN',
    htmlLang: 'zh-CN',
    name: '简体中文',
    pageTitles: {
      home: 'GameDiary PSP | 您的专属 PSP 游戏日志',
      tools: '系统工具 | GameDiary PSP',
      download: '下载 GameDiary | PSP 插件与应用程序',
      stats: '统计与分析 | GameDiary PSP'
    },
    pageDescriptions: {
      home: '适用于 PlayStation Portable 的终极游戏时间追踪器。轻量级内核插件结合现代用户端仪表盘应用。',
      tools: '精准管理您的 GameDiary PSP 数据。backup.json 可视化编辑器与数据库合并工具。',
      download: '下载适用于 PlayStation Portable 的最新 GameDiary 版本。包含内核插件、自制软件应用与详细安装指南。',
      stats: '深入的个人游戏时间统计、最常玩游戏榜单、平台分布以及 PSP 游戏历史趋势。'
    },
    keywords: 'GameDiary PSP, Game Diary, 自制软件, PSP 应用, PlayStation Portable, 游戏时间统计, PSP 插件, 游戏日志'
  },
  {
    code: 'jp',
    slug: 'jp',
    hreflang: 'ja',
    ogLocale: 'ja_JP',
    htmlLang: 'ja',
    name: '日本語',
    pageTitles: {
      home: 'GameDiary PSP | あなたの個人用 PSP ゲームジャーナル',
      tools: 'システムツール | GameDiary PSP',
      download: 'GameDiary のダウンロード | PSP プラグイン＆アプリ',
      stats: '統計＆分析 | GameDiary PSP'
    },
    pageDescriptions: {
      home: 'PlayStation Portable 向け究極のプレイ時間トラッカー。超軽量カーネルプラグインと洗練されたダッシュボードアプリ。',
      tools: 'GameDiary PSP データを正確に管理。backup.json ビジュアルエディターおよびデータベース統合ツール。',
      download: 'PlayStation Portable 向け最新の GameDiary をダウンロード。カーネルプラグイン、自作アプリ、導入手順を同梱。',
      stats: '詳細な個人プレイ時間統計、最もプレイしたゲームランキング、プラットフォーム別分布、PSPゲーム履歴の推移。'
    },
    keywords: 'GameDiary PSP, Game Diary, 自作ソフト, PSP アプリ, PlayStation Portable, プレイ時間トラッカー, PSP プラグイン, ゲーム記録'
  }
];

const PAGES = [
  { id: 'home', path: '', changefreq: 'weekly', priority: '1.0' },
  { id: 'stats', path: 'stats', changefreq: 'weekly', priority: '0.9' },
  { id: 'tools', path: 'tools', changefreq: 'monthly', priority: '0.8' },
  { id: 'download', path: 'download', changefreq: 'weekly', priority: '0.9' }
];

function getCanonicalUrl(langSlug, pagePath) {
  const parts = [];
  if (langSlug) parts.push(langSlug);
  if (pagePath) parts.push(pagePath);
  return `${BASE_URL}/${parts.join('/')}`;
}

function generateHreflangLinks(pagePath) {
  const links = [];
  // All languages
  for (const lang of LANGUAGES) {
    const url = getCanonicalUrl(lang.slug, pagePath);
    links.push(`    <link rel="alternate" hreflang="${lang.hreflang}" href="${url}" />`);
  }
  // x-default points to default English version
  const xDefaultUrl = getCanonicalUrl('', pagePath);
  links.push(`    <link rel="alternate" hreflang="x-default" href="${xDefaultUrl}" />`);
  return links.join('\n');
}

function generateAlternateOgLocales(currentOgLocale) {
  return LANGUAGES
    .filter(l => l.ogLocale !== currentOgLocale)
    .map(l => `    <meta property="og:locale:alternate" content="${l.ogLocale}" />`)
    .join('\n');
}

function renderHtml(lang, page) {
  const canonicalUrl = getCanonicalUrl(lang.slug, page.path);
  const hreflangLinks = generateHreflangLinks(page.path);
  const alternateOgLocales = generateAlternateOgLocales(lang.ogLocale);
  const title = lang.pageTitles[page.id];
  const description = lang.pageDescriptions[page.id];

  return `<!doctype html>
<html lang="${lang.htmlLang}">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
    <link rel="icon" type="image/png" sizes="any" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="google-site-verification" content="161af3675e0d8fa2" />
    <script>
      (function() {
        try {
          var saved = localStorage.getItem('theme');
          var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          var theme = (saved === 'dark' || saved === 'light') ? saved : (prefersDark ? 'dark' : 'light');
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          document.documentElement.setAttribute('data-theme', theme);
        } catch (e) {}
      })();
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="keywords" content="${lang.keywords}" />
    
    <!-- Canonical -->
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- Hreflang Matrix -->
${hreflangLinks}
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="https://gamediary.onimock.com/og-image.png" />
    <meta property="og:site_name" content="GameDiary PSP" />
    <meta property="og:locale" content="${lang.ogLocale}" />
${alternateOgLocales}

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${canonicalUrl}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="https://gamediary.onimock.com/og-image.png" />

    <!-- Structured Data for Google Site Name -->
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "GameDiary PSP",
        "alternateName": ["GameDiary", "Game Diary", "gamediary.onimock.com"],
        "url": "https://gamediary.onimock.com/"
      }
    </script>
  </head>
  <body class="antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

function generateSitemapXml() {
  const urls = [];

  for (const page of PAGES) {
    for (const lang of LANGUAGES) {
      const canonicalUrl = getCanonicalUrl(lang.slug, page.path);
      const hreflangs = LANGUAGES.map(l => {
        const u = getCanonicalUrl(l.slug, page.path);
        return `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${u}" />`;
      });
      const xDefaultUrl = getCanonicalUrl('', page.path);
      hreflangs.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefaultUrl}" />`);

      urls.push(`  <url>
    <loc>${canonicalUrl}</loc>
${hreflangs.join('\n')}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

export function generateAll() {
  console.log('🚀 Generating physical HTML multi-pages in pages/ and international sitemap...');

  let totalPages = 0;
  const pagesDir = path.join(rootDir, 'pages');

  for (const lang of LANGUAGES) {
    for (const page of PAGES) {
      const html = renderHtml(lang, page);
      
      let filePath;
      if (lang.slug === '') {
        // Default English
        filePath = page.path === ''
          ? path.join(pagesDir, 'index.html')
          : path.join(pagesDir, page.path, 'index.html');
      } else {
        // Regional language
        filePath = page.path === ''
          ? path.join(pagesDir, lang.slug, 'index.html')
          : path.join(pagesDir, lang.slug, page.path, 'index.html');
      }

      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, html, 'utf8');
      totalPages++;
    }
  }

  // Generate sitemap.xml
  const sitemapXml = generateSitemapXml();
  const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
  fs.mkdirSync(path.dirname(sitemapPath), { recursive: true });
  fs.writeFileSync(sitemapPath, sitemapXml, 'utf8');

  console.log(`✅ Generated ${totalPages} HTML files across ${LANGUAGES.length} languages and ${PAGES.length} pages in pages/.`);
  console.log(`✅ Updated international sitemap.xml with ${LANGUAGES.length * PAGES.length} localized URLs.`);
}

// Execute if run directly
generateAll();
