#!/usr/bin/env node

/**
 * GameDiary i18n Static Verification Script
 * 
 * Scans all TypeScript and TSX files in src/ for translation keys requested via t('key')
 * and verifies that every single key is present across all 9 language dictionaries.
 * Also verifies cross-language parity (no language is missing keys present in others).
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const LANG_DIR = path.join(SRC_DIR, 'i18n', 'lang');

const LANGUAGES = [
  { code: 'pt-BR', file: 'ptBr.ts', name: 'Português (Brasil)' },
  { code: 'en', file: 'en.ts', name: 'English' },
  { code: 'es', file: 'es.ts', name: 'Español' },
  { code: 'de', file: 'de.ts', name: 'Deutsch' },
  { code: 'fr', file: 'fr.ts', name: 'Français' },
  { code: 'it', file: 'it.ts', name: 'Italiano' },
  { code: 'cn', file: 'cn.ts', name: '简体中文' },
  { code: 'jp', file: 'jp.ts', name: '日本語' },
  { code: 'ru', file: 'ru.ts', name: 'Русский' }
];

// Extract keys from a language .ts file
function loadLanguageDictionary(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const dict = new Map();
  // Matches "key.name": "value"
  const regex = /"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    dict.set(match[1], match[2]);
  }
  return dict;
}

// Recursively find all source files (.ts, .tsx)
function findSourceFiles(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (fullPath.includes(path.join('src', 'i18n', 'lang'))) continue; // skip dictionary files
      if (fullPath.includes(path.join('src', 'tests'))) continue; // skip tests
      files = files.concat(findSourceFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  return files;
}

// Known dynamic patterns and their expanded keys
const DYNAMIC_EXPANSIONS = {
  'stats.months.': Array.from({ length: 12 }, (_, i) => `stats.months.${i + 1}`),
  'stats.days.': Array.from({ length: 7 }, (_, i) => `stats.days.${i}`),
  'stats.timeOfDay.': ['morning', 'afternoon', 'evening', 'night'].map(t => `stats.timeOfDay.${t}`),
  'stats.filter.': ['all', 'psp', 'ps1', 'homebrew', 'other', 'periodAll', 'periodPastYear', 'periodPast30'].map(f => `stats.filter.${f}`),
};

function main() {
  console.log('🔍 Iniciando auditoria estática de internacionalização (i18n)...\n');

  // 1. Load all language dictionaries
  const dictionaries = new Map();
  for (const lang of LANGUAGES) {
    const filePath = path.join(LANG_DIR, lang.file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo de idioma não encontrado: ${filePath}`);
      process.exit(1);
    }
    const dict = loadLanguageDictionary(filePath);
    dictionaries.set(lang.code, { ...lang, dict, keySet: new Set(dict.keys()) });
    console.log(`  ✓ [${lang.code.padEnd(5)}] ${lang.name.padEnd(20)}: ${dict.size} chaves cadastradas`);
  }

  // 2. Scan source code for translation key references
  const sourceFiles = findSourceFiles(SRC_DIR);
  console.log(`\n📂 Escaneando ${sourceFiles.length} arquivos-fonte em src/...`);

  const codeKeys = new Map(); // key -> [{ file, line }]

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineNum = lineIndex + 1;
      const relPath = path.relative(ROOT_DIR, file).replace(/\\/g, '/');

      // Static keys: t('some.key') or t("some.key")
      const staticRegex = /\bt\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g;
      let match;
      while ((match = staticRegex.exec(line)) !== null) {
        const key = match[1];
        if (!codeKeys.has(key)) codeKeys.set(key, []);
        codeKeys.get(key).push({ file: relPath, line: lineNum });
      }

      // Dynamic template keys: t(`prefix.${...}`)
      for (const [prefix, expandedKeys] of Object.entries(DYNAMIC_EXPANSIONS)) {
        if (line.includes(`t(\`${prefix}$`) || line.includes(`t('${prefix}'`) || line.includes(`t("${prefix}"`)) {
          for (const expKey of expandedKeys) {
            if (!codeKeys.has(expKey)) codeKeys.set(expKey, []);
            codeKeys.get(expKey).push({ file: relPath, line: lineNum, isDynamic: true });
          }
        }
      }
    }
  }

  console.log(`🔑 Total de chaves únicas identificadas no código: ${codeKeys.size}`);

  // 3. Validation: Code-to-Dictionaries (Are all keys used in code present in ALL languages?)
  let totalErrors = 0;
  const missingInLanguages = new Map(); // langCode -> [{ key, occurrences }]

  for (const lang of LANGUAGES) {
    const { keySet } = dictionaries.get(lang.code);
    const missing = [];

    for (const [key, occurrences] of codeKeys.entries()) {
      if (!keySet.has(key)) {
        missing.push({ key, occurrences });
      }
    }

    if (missing.length > 0) {
      missingInLanguages.set(lang.code, missing);
      totalErrors += missing.length;
    }
  }

  // 4. Validation: Cross-Language Parity (Does any language have keys missing in others?)
  const allDictionaryKeys = new Set();
  for (const [, { keySet }] of dictionaries) {
    for (const k of keySet) allDictionaryKeys.add(k);
  }

  const parityMissing = new Map(); // langCode -> [missingKey]
  for (const lang of LANGUAGES) {
    const { keySet } = dictionaries.get(lang.code);
    const missingKeys = [];
    for (const k of allDictionaryKeys) {
      if (!keySet.has(k)) missingKeys.push(k);
    }
    if (missingKeys.length > 0) {
      parityMissing.set(lang.code, missingKeys);
      totalErrors += missingKeys.length;
    }
  }

  // 5. Output Report
  console.log('\n======================================================');
  console.log('       RELATÓRIO DE INTEGRIDADE I18N DO GAMEDIARY');
  console.log('======================================================');

  if (missingInLanguages.size > 0) {
    console.log('\n❌ CHAVES UTILIZADAS NO CÓDIGO MAS AUSENTES DAS TRADUÇÕES:');
    for (const [langCode, items] of missingInLanguages.entries()) {
      console.log(`\n  Idioma [${langCode}]: ${items.length} chave(s) ausente(s):`);
      for (const item of items) {
        const occStr = item.occurrences.map(o => `${o.file}:${o.line}`).slice(0, 3).join(', ');
        console.log(`    - "${item.key}" (em: ${occStr})`);
      }
    }
  } else {
    console.log('\n✅ Todas as chaves utilizadas no código estão presentes em todos os 9 idiomas!');
  }

  if (parityMissing.size > 0) {
    console.log('\n⚠️ DESALINHAMENTO ENTRE DICIONÁRIOS (PARIDADE DE CHAVES):');
    for (const [langCode, keys] of parityMissing.entries()) {
      console.log(`\n  Idioma [${langCode}] falta ${keys.length} chave(s) presente(s) em outros dicionários:`);
      for (const k of keys.slice(0, 10)) {
        console.log(`    - "${k}"`);
      }
      if (keys.length > 10) console.log(`    ... e mais ${keys.length - 10} chaves.`);
    }
  } else {
    console.log('✅ Paridade perfeita: todos os 9 idiomas possuem exatamente o mesmo conjunto de chaves!');
  }

  console.log('\n======================================================');
  if (totalErrors > 0) {
    console.error(`❌ FALHA NA AUDITORIA: Encontradas ${totalErrors} pendência(s) de tradução.`);
    process.exit(1);
  } else {
    console.log('🎉 SUCESSO TOTAL: 0 chaves ausentes. 100% de cobertura i18n garantida!');
    process.exit(0);
  }
}

main();
