import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Script for checking completeness of i18n translation files.
 * It uses 'en.ts' as the source of truth for required keys.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LANG_DIR = path.resolve(__dirname, '../src/i18n/lang');
const SOURCE_FILE = 'en.ts';

function extractKeys(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Regex to find keys in the translations object (single or double quoted)
    const matches = [...content.matchAll(/(['"])([a-zA-Z0-9_.-]+)\1\s*:/g)];
    if (!matches) return [];
    return matches.map(m => m[2]).filter(k => k !== 'code' && k !== 'name' && k !== 'nativeName' && k !== 'flag');
}

function checkTranslations() {
    console.log('🔍 Checking i18n translation keys...');
    
    const sourceFilePath = path.join(LANG_DIR, SOURCE_FILE);
    if (!fs.existsSync(sourceFilePath)) {
        console.error(`❌ Source file ${sourceFilePath} not found!`);
        process.exit(1);
    }

    const requiredKeys = extractKeys(sourceFilePath);
    console.log(`ℹ️ Source (en.ts) has ${requiredKeys.length} keys.`);

    const files = fs.readdirSync(LANG_DIR)
        .filter(file => file.endsWith('.ts') && file !== 'index.ts' && file !== SOURCE_FILE);

    let hasErrors = false;

    files.forEach(file => {
        const filePath = path.join(LANG_DIR, file);
        const currentKeys = extractKeys(filePath);
        
        const missing = requiredKeys.filter(key => !currentKeys.includes(key));
        
        if (missing.length > 0) {
            console.error(`\n❌ File ${file} is missing ${missing.length} keys:`);
            missing.forEach(key => console.error(`   - ${key}`));
            hasErrors = true;
        } else {
            console.log(`✅ ${file}: All keys present.`);
        }
    });

    if (hasErrors) {
        console.error('\nFAIL: Some translation files are missing keys.');
        process.exit(1);
    } else {
        console.log('\nSUCCESS: All translation files are up to date.');
        process.exit(0);
    }
}

checkTranslations();
