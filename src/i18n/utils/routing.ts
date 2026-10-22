import { getCookie, setCookie } from './cookies';

export interface LanguageMeta {
  code: string;        // 'en', 'pt-BR', 'es', 'de', 'fr', 'it', 'ru', 'cn', 'jp'
  slug: string;        // '', 'pt', 'es', 'de', 'fr', 'it', 'ru', 'cn', 'jp'
  name: string;
  nativeName: string;
  flag: string;
  hreflang: string;    // 'en', 'pt-BR', 'es', 'de', 'fr', 'it', 'ru', 'zh-CN', 'ja'
  ogLocale: string;
  htmlLang: string;
  pageTitles: {
    home: string;
    tools: string;
    download: string;
  };
  pageDescriptions: {
    home: string;
    tools: string;
    download: string;
  };
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  {
    code: 'en',
    slug: '',
    name: 'English',
    nativeName: 'English',
    flag: 'us',
    hreflang: 'en',
    ogLocale: 'en_US',
    htmlLang: 'en',
    pageTitles: {
      home: 'GameDiary | Your Personal PSP Gaming Journal',
      tools: 'System Tools | GameDiary PSP',
      download: 'Download GameDiary | PSP Plugin & App'
    },
    pageDescriptions: {
      home: 'GameDiary: The ultimate PSP app to track your PlayStation Portable playtime. A lightweight homebrew kernel plugin and dashboard to manage your gaming history.',
      tools: 'Manage your GameDiary PSP data with precision. Visual backup.json editor and database merge tools.',
      download: 'Download the latest GameDiary release for PlayStation Portable. Includes kernel plugin, homebrew app, and installation instructions.'
    }
  },
  {
    code: 'pt-BR',
    slug: 'pt',
    name: 'Português Brasil',
    nativeName: 'Português',
    flag: 'br',
    hreflang: 'pt-BR',
    ogLocale: 'pt_BR',
    htmlLang: 'pt-BR',
    pageTitles: {
      home: 'GameDiary | Seu Diário Gamer Pessoal para PSP',
      tools: 'Ferramentas do Sistema | GameDiary PSP',
      download: 'Baixar GameDiary | Plugin & Aplicativo para PSP'
    },
    pageDescriptions: {
      home: 'O rastreador de tempo de jogo definitivo para o PlayStation Portable. A união de um plugin invisível no modo kernel com um aplicativo dashboard premium.',
      tools: 'Gerencie seus dados do GameDiary PSP com precisão. Editor visual de backup.json e ferramentas de mesclagem de banco de dados.',
      download: 'Baixe a versão mais recente do GameDiary para o PlayStation Portable. Inclui plugin kernel, aplicativo homebrew e guia de instalação.'
    }
  },
  {
    code: 'es',
    slug: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: 'es',
    hreflang: 'es',
    ogLocale: 'es_ES',
    htmlLang: 'es',
    pageTitles: {
      home: 'GameDiary | Tu Diario de Juegos Personal para PSP',
      tools: 'Herramientas del Sistema | GameDiary PSP',
      download: 'Descargar GameDiary | Plugin y Aplicación para PSP'
    },
    pageDescriptions: {
      home: 'El rastreador definitivo de tiempo de juego para PlayStation Portable. Plugin ligero en modo kernel y panel de control moderno.',
      tools: 'Administra tus datos de GameDiary PSP con precisión. Editor visual de backup.json y herramientas de combinación de datos.',
      download: 'Descarga la última versión de GameDiary para PlayStation Portable. Incluye plugin kernel, aplicación homebrew y guía de instalación.'
    }
  },
  {
    code: 'de',
    slug: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: 'de',
    hreflang: 'de',
    ogLocale: 'de_DE',
    htmlLang: 'de',
    pageTitles: {
      home: 'GameDiary | Dein persönliches PSP-Gaming-Tagebuch',
      tools: 'System-Tools | GameDiary PSP',
      download: 'GameDiary herunterladen | PSP-Plugin und App'
    },
    pageDescriptions: {
      home: 'Der ultimative Spielzeittracker für PlayStation Portable. Schlankes Kernel-Plugin kombiniert mit einem modernen Dashboard.',
      tools: 'Verwalte deine GameDiary PSP-Daten mit höchster Präzision. Visueller backup.json-Editor und Datenbank-Merge-Tools.',
      download: 'Lade die neueste GameDiary-Version für PlayStation Portable herunter. Beinhaltet Kernel-Plugin, Homebrew-App und Installationsanleitung.'
    }
  },
  {
    code: 'fr',
    slug: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: 'fr',
    hreflang: 'fr',
    ogLocale: 'fr_FR',
    htmlLang: 'fr',
    pageTitles: {
      home: 'GameDiary | Votre Journal de Jeu Personnel pour PSP',
      tools: 'Outils Système | GameDiary PSP',
      download: 'Télécharger GameDiary | Plugin et Application PSP'
    },
    pageDescriptions: {
      home: 'Le tracker de temps de jeu ultime pour PlayStation Portable. Plugin en mode kernel discret et tableau de bord moderne.',
      tools: 'Gérez vos données GameDiary PSP avec précision. Éditeur visuel pour backup.json et outils de fusion de bases de données.',
      download: 'Téléchargez la dernière version de GameDiary pour PlayStation Portable. Comprend le plugin kernel, l\'application homebrew et le guide d\'installation.'
    }
  },
  {
    code: 'it',
    slug: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: 'it',
    hreflang: 'it',
    ogLocale: 'it_IT',
    htmlLang: 'it',
    pageTitles: {
      home: 'GameDiary | Il Tuo Diario di Gioco Personale per PSP',
      tools: 'Strumenti di Sistema | GameDiary PSP',
      download: 'Scarica GameDiary | Plugin e Applicazione per PSP'
    },
    pageDescriptions: {
      home: 'Il tracker di tempo di gioco definitivo per PlayStation Portable. Plugin leggero in modalità kernel e dashboard moderna.',
      tools: 'Gestisci i tuoi dati GameDiary PSP con precisione. Editor visuale per backup.json e strumenti di unione database.',
      download: 'Scarica l\'ultima versione di GameDiary per PlayStation Portable. Include il plugin kernel, l\'app homebrew e le istruzioni di installazione.'
    }
  },
  {
    code: 'ru',
    slug: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: 'ru',
    hreflang: 'ru',
    ogLocale: 'ru_RU',
    htmlLang: 'ru',
    pageTitles: {
      home: 'GameDiary | Ваш личный игровой дневник для PSP',
      tools: 'Системные инструменты | GameDiary PSP',
      download: 'Скачать GameDiary | Плагин и приложение для PSP'
    },
    pageDescriptions: {
      home: 'Лучший трекер игрового времени для PlayStation Portable. Невидимый плагин ядра и современный пользовательский дашборд.',
      tools: 'Управляйте данными GameDiary PSP с высокой точностью. Визуальный редактор backup.json и инструменты объединения баз данных.',
      download: 'Скачайте последнюю версию GameDiary для PlayStation Portable. Включает плагин ядра, homebrew-приложение и инструкцию по установке.'
    }
  },
  {
    code: 'cn',
    slug: 'cn',
    name: 'Chinese',
    nativeName: '简体中文',
    flag: 'cn',
    hreflang: 'zh-CN',
    ogLocale: 'zh_CN',
    htmlLang: 'zh-CN',
    pageTitles: {
      home: 'GameDiary | 您的专属 PSP 游戏日志',
      tools: '系统工具 | GameDiary PSP',
      download: '下载 GameDiary | PSP 插件与应用程序'
    },
    pageDescriptions: {
      home: '适用于 PlayStation Portable 的终极游戏时间追踪器。轻量级内核插件结合现代用户端仪表盘应用。',
      tools: '精准管理您的 GameDiary PSP 数据。backup.json 可视化编辑器与数据库合并工具。',
      download: '下载适用于 PlayStation Portable 的最新 GameDiary 版本。包含内核插件、自制软件应用与详细安装指南。'
    }
  },
  {
    code: 'jp',
    slug: 'jp',
    name: 'Japanese',
    nativeName: '日本語',
    flag: 'jp',
    hreflang: 'ja',
    ogLocale: 'ja_JP',
    htmlLang: 'ja',
    pageTitles: {
      home: 'GameDiary | あなたの個人用 PSP ゲームジャーナル',
      tools: 'システムツール | GameDiary PSP',
      download: 'GameDiary のダウンロード | PSP プラグイン＆アプリ'
    },
    pageDescriptions: {
      home: 'PlayStation Portable 向け究極のプレイ時間トラッカー。超軽量カーネルプラグインと洗練されたダッシュボードアプリ。',
      tools: 'GameDiary PSP データを正確に管理。backup.json ビジュアルエディターおよびデータベース統合ツール。',
      download: 'PlayStation Portable 向け最新の GameDiary をダウンロード。カーネルプラグイン、自作アプリ、導入手順を同梱。'
    }
  }
];

export const SLUG_TO_LANG_CODE: Record<string, string> = {
  pt: 'pt-BR',
  'pt-br': 'pt-BR',
  'pt-BR': 'pt-BR',
  es: 'es',
  de: 'de',
  fr: 'fr',
  it: 'it',
  ru: 'ru',
  cn: 'cn',
  zh: 'cn',
  jp: 'jp',
  ja: 'jp',
  en: 'en',
};

export const LANG_CODE_TO_SLUG: Record<string, string> = {
  en: '',
  'pt-BR': 'pt',
  pt: 'pt',
  es: 'es',
  de: 'de',
  fr: 'fr',
  it: 'it',
  ru: 'ru',
  cn: 'cn',
  jp: 'jp',
};

const KNOWN_SLUGS = new Set(['pt', 'pt-br', 'pt-BR', 'es', 'de', 'fr', 'it', 'ru', 'cn', 'zh', 'jp', 'ja', 'en']);

/**
 * Maps project language codes to valid BCP 47 locales recognized by Intl / toLocaleDateString.
 */
export function getIntlLocale(langCode: string): string {
  switch (langCode) {
    case 'jp':
      return 'ja-JP';
    case 'cn':
      return 'zh-CN';
    case 'pt-BR':
    case 'pt':
      return 'pt-BR';
    case 'es':
      return 'es-ES';
    case 'de':
      return 'de-DE';
    case 'fr':
      return 'fr-FR';
    case 'it':
      return 'it-IT';
    case 'ru':
      return 'ru-RU';
    case 'en':
    default:
      return 'en-US';
  }
}

/**
 * Extracts language code from URL pathname (e.g. /pt/tools -> 'pt-BR').
 */
export function getLanguageFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const first = segments[0].toLowerCase();
    if (SLUG_TO_LANG_CODE[first]) {
      return SLUG_TO_LANG_CODE[first];
    }
  }
  return null;
}

/**
 * Normalizes pathname by removing any language slug prefix.
 * e.g. /pt/download -> /download, /es -> /, /tools -> /tools
 */
export function getCleanPathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && KNOWN_SLUGS.has(segments[0].toLowerCase())) {
    segments.shift();
  }
  return segments.length === 0 ? '/' : `/${segments.join('/')}`;
}

/**
 * Builds localized pathname for navigation.
 * e.g. buildLocalizedPath('/tools', 'pt-BR') -> '/pt/tools'
 *      buildLocalizedPath('/tools', 'en') -> '/tools'
 *      buildLocalizedPath('/', 'es') -> '/es'
 */
export function buildLocalizedPath(cleanPath: string, langCode: string): string {
  const slug = LANG_CODE_TO_SLUG[langCode] || '';
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

  if (!slug) {
    return normalizedPath;
  }

  if (normalizedPath === '/' || normalizedPath === '') {
    return `/${slug}`;
  }

  return `/${slug}${normalizedPath}`;
}

/**
 * Resolves initial language following the strict priority order from architecture docs:
 * 1. URL Path prefix
 * 2. Saved preference (cookie / localStorage)
 * 3. Browser language
 * 4. Fallback default ('en')
 */
export function resolveInitialLanguage(): string {
  if (typeof window === 'undefined') {
    return 'en';
  }

  // 1. URL Path Prefix
  const fromPath = getLanguageFromPath(window.location.pathname);
  if (fromPath) {
    return fromPath;
  }

  // 2. Saved Preference
  const savedCookie = getCookie('language');
  if (savedCookie && SLUG_TO_LANG_CODE[savedCookie]) {
    return SLUG_TO_LANG_CODE[savedCookie];
  }
  try {
    const savedLocal = localStorage.getItem('gamediary_language');
    if (savedLocal && SLUG_TO_LANG_CODE[savedLocal]) {
      return SLUG_TO_LANG_CODE[savedLocal];
    }
  } catch {
    // Ignore storage errors
  }

  // 3. Browser Language
  const browserLanguages = navigator.languages || [navigator.language || ''];
  for (const bl of browserLanguages) {
    const lower = bl.toLowerCase();
    if (lower.startsWith('pt')) return 'pt-BR';
    if (lower.startsWith('zh')) return 'cn';
    if (lower.startsWith('ja')) return 'jp';
    if (lower.startsWith('es')) return 'es';
    if (lower.startsWith('de')) return 'de';
    if (lower.startsWith('fr')) return 'fr';
    if (lower.startsWith('it')) return 'it';
    if (lower.startsWith('ru')) return 'ru';
    if (lower.startsWith('en')) return 'en';
  }

  // 4. Fallback Default
  return 'en';
}

/**
 * Updates DOM title, lang, and description dynamically based on current page and language.
 */
export function syncDocumentMetadata(langCode: string, cleanPath: string): void {
  if (typeof document === 'undefined') return;

  const meta = SUPPORTED_LANGUAGES.find(l => l.code === langCode) || SUPPORTED_LANGUAGES[0];

  let pageKey: 'home' | 'tools' | 'download' = 'home';
  if (cleanPath.startsWith('/download')) {
    pageKey = 'download';
  } else if (cleanPath.startsWith('/tools')) {
    pageKey = 'tools';
  }

  // Update HTML lang
  document.documentElement.lang = meta.htmlLang;

  // Update document.title
  document.title = meta.pageTitles[pageKey] || meta.pageTitles.home;

  // Update meta[name="description"]
  const descEl = document.querySelector('meta[name="description"]');
  const descContent = meta.pageDescriptions[pageKey] || meta.pageDescriptions.home;
  if (descEl) {
    descEl.setAttribute('content', descContent);
  }

  // Save preference
  setCookie('language', langCode);
  try {
    localStorage.setItem('gamediary_language', langCode);
  } catch {
    // Ignore
  }
}
