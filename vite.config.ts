import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // Default (English) entries
        main: path.resolve(__dirname, 'index.html'),
        tools: path.resolve(__dirname, 'tools/index.html'),
        download: path.resolve(__dirname, 'download/index.html'),

        // Portuguese entries
        pt: path.resolve(__dirname, 'pt/index.html'),
        ptTools: path.resolve(__dirname, 'pt/tools/index.html'),
        ptDownload: path.resolve(__dirname, 'pt/download/index.html'),

        // Spanish entries
        es: path.resolve(__dirname, 'es/index.html'),
        esTools: path.resolve(__dirname, 'es/tools/index.html'),
        esDownload: path.resolve(__dirname, 'es/download/index.html'),

        // German entries
        de: path.resolve(__dirname, 'de/index.html'),
        deTools: path.resolve(__dirname, 'de/tools/index.html'),
        deDownload: path.resolve(__dirname, 'de/download/index.html'),

        // French entries
        fr: path.resolve(__dirname, 'fr/index.html'),
        frTools: path.resolve(__dirname, 'fr/tools/index.html'),
        frDownload: path.resolve(__dirname, 'fr/download/index.html'),

        // Italian entries
        it: path.resolve(__dirname, 'it/index.html'),
        itTools: path.resolve(__dirname, 'it/tools/index.html'),
        itDownload: path.resolve(__dirname, 'it/download/index.html'),

        // Russian entries
        ru: path.resolve(__dirname, 'ru/index.html'),
        ruTools: path.resolve(__dirname, 'ru/tools/index.html'),
        ruDownload: path.resolve(__dirname, 'ru/download/index.html'),

        // Chinese entries
        cn: path.resolve(__dirname, 'cn/index.html'),
        cnTools: path.resolve(__dirname, 'cn/tools/index.html'),
        cnDownload: path.resolve(__dirname, 'cn/download/index.html'),

        // Japanese entries
        jp: path.resolve(__dirname, 'jp/index.html'),
        jpTools: path.resolve(__dirname, 'jp/tools/index.html'),
        jpDownload: path.resolve(__dirname, 'jp/download/index.html'),
      },
    },
  },
});
