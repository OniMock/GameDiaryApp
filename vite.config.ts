import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  root: path.resolve(__dirname, 'pages'),
  publicDir: path.resolve(__dirname, 'public'),
  resolve: {
    alias: {
      '/src': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    fs: {
      allow: [__dirname],
    },
  },
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Default (English) entries
        main: path.resolve(__dirname, 'pages/index.html'),
        stats: path.resolve(__dirname, 'pages/stats/index.html'),
        tools: path.resolve(__dirname, 'pages/tools/index.html'),
        download: path.resolve(__dirname, 'pages/download/index.html'),

        // Portuguese entries
        pt: path.resolve(__dirname, 'pages/pt/index.html'),
        ptStats: path.resolve(__dirname, 'pages/pt/stats/index.html'),
        ptTools: path.resolve(__dirname, 'pages/pt/tools/index.html'),
        ptDownload: path.resolve(__dirname, 'pages/pt/download/index.html'),

        // Spanish entries
        es: path.resolve(__dirname, 'pages/es/index.html'),
        esStats: path.resolve(__dirname, 'pages/es/stats/index.html'),
        esTools: path.resolve(__dirname, 'pages/es/tools/index.html'),
        esDownload: path.resolve(__dirname, 'pages/es/download/index.html'),

        // German entries
        de: path.resolve(__dirname, 'pages/de/index.html'),
        deStats: path.resolve(__dirname, 'pages/de/stats/index.html'),
        deTools: path.resolve(__dirname, 'pages/de/tools/index.html'),
        deDownload: path.resolve(__dirname, 'pages/de/download/index.html'),

        // French entries
        fr: path.resolve(__dirname, 'pages/fr/index.html'),
        frStats: path.resolve(__dirname, 'pages/fr/stats/index.html'),
        frTools: path.resolve(__dirname, 'pages/fr/tools/index.html'),
        frDownload: path.resolve(__dirname, 'pages/fr/download/index.html'),

        // Italian entries
        it: path.resolve(__dirname, 'pages/it/index.html'),
        itStats: path.resolve(__dirname, 'pages/it/stats/index.html'),
        itTools: path.resolve(__dirname, 'pages/it/tools/index.html'),
        itDownload: path.resolve(__dirname, 'pages/it/download/index.html'),

        // Russian entries
        ru: path.resolve(__dirname, 'pages/ru/index.html'),
        ruStats: path.resolve(__dirname, 'pages/ru/stats/index.html'),
        ruTools: path.resolve(__dirname, 'pages/ru/tools/index.html'),
        ruDownload: path.resolve(__dirname, 'pages/ru/download/index.html'),

        // Chinese entries
        cn: path.resolve(__dirname, 'pages/cn/index.html'),
        cnStats: path.resolve(__dirname, 'pages/cn/stats/index.html'),
        cnTools: path.resolve(__dirname, 'pages/cn/tools/index.html'),
        cnDownload: path.resolve(__dirname, 'pages/cn/download/index.html'),

        // Japanese entries
        jp: path.resolve(__dirname, 'pages/jp/index.html'),
        jpStats: path.resolve(__dirname, 'pages/jp/stats/index.html'),
        jpTools: path.resolve(__dirname, 'pages/jp/tools/index.html'),
        jpDownload: path.resolve(__dirname, 'pages/jp/download/index.html'),
      },
    },
  },
});
