import { describe, it, expect } from 'vitest';
import { en } from '../i18n/lang/en';
import { ptBr } from '../i18n/lang/ptBr';
import { cn } from '../i18n/lang/cn';
import { de } from '../i18n/lang/de';
import { es } from '../i18n/lang/es';
import { fr } from '../i18n/lang/fr';
import { it as itLocale } from '../i18n/lang/it';
import { jp } from '../i18n/lang/jp';
import { ru } from '../i18n/lang/ru';

describe('Internationalization (i18n) Completeness and Integrity', () => {
  const locales: Record<string, Record<string, string>> = {
    en: en.translations,
    'pt-BR': ptBr.translations,
    cn: cn.translations,
    de: de.translations,
    es: es.translations,
    fr: fr.translations,
    it: itLocale.translations,
    jp: jp.translations,
    ru: ru.translations,
  };

  const englishKeys = Object.keys(en.translations);

  it('all 9 locales are loaded and have dictionary objects', () => {
    expect(Object.keys(locales)).toHaveLength(9);
    Object.entries(locales).forEach(([, dict]) => {
      expect(dict).toBeDefined();
      expect(typeof dict).toBe('object');
      expect(Object.keys(dict).length).toBeGreaterThan(150);
    });
  });

  it('every English key exists and is non-empty across all 9 languages', () => {
    Object.entries(locales).forEach(([langCode, dict]) => {
      const missingKeys: string[] = [];
      englishKeys.forEach((key) => {
        const val = dict[key];
        if (val === undefined || val === null || val === '') {
          missingKeys.push(key);
        }
      });
      expect(
        missingKeys,
        `Language [${langCode}] is missing keys: ${missingKeys.join(', ')}`
      ).toEqual([]);
    });
  });

  it('essential Share Card keys are defined with localized values and no literal placeholders', () => {
    const essentialKeys = [
      'share.button',
      'share.modalTitle',
      'share.modalSubtitle',
      'share.title',
      'share.subtitle',
      'share.modelLabel',
      'share.formatLabel',
      'share.model.top5',
      'share.model.topGame',
      'share.model.library',
      'share.model.retrospective',
      'share.model.individual',
      'share.format.vertical',
      'share.format.square',
      'share.format.horizontal',
      'share.format.verticalRatio',
      'share.format.squareRatio',
      'share.format.horizontalRatio',
      'stats.modal.bestDay',
      'stats.modal.played',
    ];

    Object.entries(locales).forEach(([langCode, dict]) => {
      essentialKeys.forEach((key) => {
        const value = dict[key];
        expect(value, `Language [${langCode}] missing essential key ${key}`).toBeDefined();
        expect(value.trim()).not.toBe('');
        // Value must not equal the raw key name
        expect(value).not.toBe(key);
      });
    });
  });

  it('Chinese locale specifically contains translated title and subtitle', () => {
    expect(cn.translations['share.modalTitle']).toBe('分享卡片工坊');
    expect(cn.translations['share.title']).toBe('分享卡片工坊');
    expect(cn.translations['share.modalSubtitle']).toContain('制作并导出适合社交平台分享的高清玩家卡片');
    expect(cn.translations['share.subtitle']).toContain('制作并导出适合社交平台分享的高清玩家卡片');
  });

  it('Portuguese locale specifically contains translated title and subtitle', () => {
    expect(ptBr.translations['share.modalTitle']).toBe('Estúdio de Cards Compartilháveis');
    expect(ptBr.translations['share.title']).toBe('Estúdio de Cards Compartilháveis');
    expect(ptBr.translations['share.modalSubtitle']).toContain('Crie e exporte cards gamer em alta resolução para redes sociais');
    expect(ptBr.translations['share.subtitle']).toContain('Crie e exporte cards gamer em alta resolução para redes sociais');
  });

  it('static scan of all source code confirms 100% of used keys exist in all 9 languages', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const srcDir = path.resolve(__dirname, '..');
    const findFiles = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of list) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
          if (full.includes(path.join('src', 'i18n', 'lang'))) continue;
          if (full.includes(path.join('src', 'tests'))) continue;
          results = results.concat(findFiles(full));
        } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
          results.push(full);
        }
      }
      return results;
    };

    const files = findFiles(srcDir);
    const usedKeys = new Set<string>();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const staticRegex = /\bt\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g;
      let match;
      while ((match = staticRegex.exec(content)) !== null) {
        usedKeys.add(match[1]);
      }
    }

    expect(usedKeys.size).toBeGreaterThan(100);

    Object.entries(locales).forEach(([langCode, dict]) => {
      const missing: string[] = [];
      usedKeys.forEach((key) => {
        if (!dict[key]) {
          missing.push(key);
        }
      });
      expect(missing, `Language [${langCode}] is missing keys used in source code: ${missing.join(', ')}`).toEqual([]);
    });
  });
});
