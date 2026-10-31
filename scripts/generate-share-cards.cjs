#!/usr/bin/env node

/**
 * GameDiary Share Cards Batch Generator
 * 
 * Automatically renders and saves all 15 Share Cards (5 models x 3 formats)
 * to the `generated-cards/` directory using real data from `backup.json`.
 * 
 * Usage:
 *   node scripts/generate-share-cards.cjs
 *   npm run generate:cards
 *   node scripts/generate-share-cards.cjs --lang en
 *   node scripts/generate-share-cards.cjs --open
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');

// Parse CLI flags
const args = process.argv.slice(2);
const langFlag = args.find(a => a.startsWith('--lang='))?.split('=')[1] || (args.includes('--lang') ? args[args.indexOf('--lang') + 1] : 'pt');
const shouldOpenFolder = args.includes('--open') || args.includes('-o');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const OUTPUT_DIR = path.join(ROOT_DIR, 'generated-cards');
const BACKUP_FILE = path.join(ROOT_DIR, 'backup.json');

const HTTP_PORT = 5288;
const CDP_PORT = 9244;
const TEMP_PROFILE = path.join(os.tmpdir(), 'gamediary_card_gen_' + Date.now());

// Detect browser executable
function findBrowserExecutable() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const candidates = [
    path.join(localAppData, 'Chromium', 'Application', 'chrome.exe'),
    path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    // macOS / Linux fallbacks
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.ico': 'image/x-icon'
};

function startStaticServer() {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath.endsWith('/')) {
      reqPath += 'index.html';
    } else if (!path.extname(reqPath)) {
      if (fs.existsSync(path.join(DIST_DIR, reqPath, 'index.html'))) {
        reqPath += '/index.html';
      }
    }

    const filePath = path.join(DIST_DIR, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + reqPath);
    }
  });

  return new Promise((resolve) => {
    server.listen(HTTP_PORT, () => {
      resolve(server);
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getCDPWebSocketUrl(port) {
  const res = await fetch(`http://127.0.0.1:${port}/json`);
  const list = await res.json();
  const page = list.find((p) => p.type === 'page');
  if (!page) throw new Error('Nenhuma página CDP encontrada.');
  return page.webSocketDebuggerUrl;
}

function createCDPClient(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  };

  const waitOpen = new Promise((resolve) => {
    ws.onopen = () => resolve();
  });

  return {
    async send(method, params = {}) {
      await waitOpen;
      return new Promise((resolve, reject) => {
        const msgId = id++;
        pending.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    },
    async evaluate(expression) {
      const res = await this.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.exception?.description || 'Erro de avaliação CDP');
      }
      return res.result?.value;
    },
    close() {
      ws.close();
    },
  };
}

const MODELS = [
  { id: 'top5', name: 'Top 5 Jogos' },
  { id: 'topGame', name: 'Jogo Mais Jogado' },
  { id: 'library', name: 'Minha Biblioteca' },
  { id: 'retrospective', name: 'Retrospectiva Gamer' },
  { id: 'individual', name: 'Card Individual' }
];

const FORMATS = [
  { id: 'vertical', name: 'Vertical (Story)', width: 1080, height: 1920, suffix: '1080x1920' },
  { id: 'square', name: 'Quadrado (Post)', width: 1080, height: 1080, suffix: '1080x1080' },
  { id: 'horizontal', name: 'Paisagem (Banner)', width: 1200, height: 630, suffix: '1200x630' }
];

// Generate an HTML visual index gallery for easy previewing
function generateIndexHtml(cards) {
  const cardsHtml = cards.map(c => `
    <div class="card-item" data-format="${c.format}">
      <div class="card-header">
        <span class="badge">${c.formatName}</span>
        <h3>${c.modelName}</h3>
        <span class="dims">${c.actualWidth} × ${c.actualHeight} • ${c.sizeKb} KB</span>
      </div>
      <a href="./${c.fileName}" target="_blank" title="Clique para abrir imagem em alta resolução">
        <img src="./${c.fileName}" alt="${c.modelName} ${c.formatName}" loading="lazy" />
      </a>
      <div class="card-footer">
        <a href="./${c.fileName}" download="${c.fileName}" class="download-btn">⬇ Baixar PNG</a>
      </div>
    </div>
  `).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Galeria de Share Cards — GameDiary</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #070A14;
      color: #F8FAFC;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 32px 24px;
    }
    header {
      max-width: 1400px;
      margin: 0 auto 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 20px;
    }
    h1 { font-size: 28px; font-weight: 900; color: #60A5FA; }
    p { color: rgba(255,255,255,0.6); font-size: 14px; margin-top: 4px; }
    .filters {
      display: flex;
      gap: 8px;
    }
    .filters button {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.15);
      color: #FFF;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 13px;
      transition: all 0.2s;
    }
    .filters button.active, .filters button:hover {
      background: #3B82F6;
      border-color: #3B82F6;
    }
    .gallery {
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 24px;
    }
    .card-item {
      background: rgba(17, 24, 39, 0.7);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, border-color 0.2s;
    }
    .card-item:hover {
      transform: translateY(-3px);
      border-color: rgba(59, 130, 246, 0.5);
    }
    .card-header {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .badge {
      display: inline-block;
      align-self: flex-start;
      font-size: 11px;
      font-weight: 800;
      color: #60A5FA;
      background: rgba(59, 130, 246, 0.15);
      padding: 3px 8px;
      border-radius: 6px;
    }
    .card-header h3 { font-size: 18px; font-weight: 800; }
    .dims { font-size: 12px; color: rgba(255,255,255,0.5); font-family: monospace; }
    .card-item img {
      width: 100%;
      height: 380px;
      object-fit: contain;
      background: #03050a;
      display: block;
      cursor: zoom-in;
    }
    .card-footer {
      padding: 14px 20px;
      background: rgba(0,0,0,0.2);
      border-top: 1px solid rgba(255,255,255,0.06);
      display: flex;
      justify-content: flex-end;
    }
    .download-btn {
      color: #FFF;
      text-decoration: none;
      font-size: 12px;
      font-weight: 700;
      background: rgba(59, 130, 246, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.4);
      padding: 6px 12px;
      border-radius: 6px;
      transition: background 0.2s;
    }
    .download-btn:hover { background: #3B82F6; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Galeria de Share Cards — GameDiary</h1>
      <p>Todos os 15 cards gerados em alta resolução. Clique na imagem para abrir em resolução máxima.</p>
    </div>
    <div class="filters">
      <button class="active" onclick="filterFormat('all', this)">Todos (15)</button>
      <button onclick="filterFormat('vertical', this)">Vertical (5)</button>
      <button onclick="filterFormat('square', this)">Quadrado (5)</button>
      <button onclick="filterFormat('horizontal', this)">Paisagem (5)</button>
    </div>
  </header>

  <div class="gallery">
    ${cardsHtml}
  </div>

  <script>
    function filterFormat(fmt, btn) {
      document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.card-item').forEach(c => {
        if (fmt === 'all' || c.getAttribute('data-format') === fmt) {
          c.style.display = 'flex';
        } else {
          c.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;
}

async function main() {
  console.log('🎮 ======================================================');
  console.log('   GameDiary: Gerador Automático de Share Cards');
  console.log('========================================================\n');

  // 1. Locate browser
  const browserPath = findBrowserExecutable();
  if (!browserPath) {
    console.error('❌ Nenhum navegador compatível (Chromium, Chrome ou Edge) foi encontrado.');
    process.exit(1);
  }
  console.log(`🌐 Navegador detectado: ${browserPath}`);

  // 2. Ensure dist/ exists
  if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    console.log('📦 Pasta dist/ não encontrada. Executando build de produção...');
    execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
  }

  // 3. Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEMP_PROFILE)) {
    fs.mkdirSync(TEMP_PROFILE, { recursive: true });
  }

  // 4. Load backup.json
  let backupData = null;
  if (fs.existsSync(BACKUP_FILE)) {
    try {
      backupData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
      console.log(`📁 Usando backup.json local: ${backupData.games?.length || 0} jogos e ${backupData.sessions?.length || 0} sessões.`);
    } catch (e) {
      console.warn('⚠️ Falha ao ler backup.json, usando banco de teste padrão.');
    }
  }

  // 5. Start static server
  const server = await startStaticServer();
  const appUrl = `http://localhost:${HTTP_PORT}/${langFlag}/stats/`;
  console.log(`🚀 Servidor iniciado em http://localhost:${HTTP_PORT}`);

  // 6. Spawn headless browser
  console.log('🤖 Abrindo navegador headless para renderização...');
  const chromeProc = spawn(browserPath, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${TEMP_PROFILE}`,
    '--disable-gpu',
    '--no-sandbox',
    '--disable-web-security',
    '--window-size=1600,1000',
    appUrl
  ], { stdio: 'ignore' });

  await sleep(2500);

  let cdp = null;
  try {
    const wsUrl = await getCDPWebSocketUrl(CDP_PORT);
    cdp = createCDPClient(wsUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // Populate IndexedDB if backupData exists
    if (backupData && backupData.games && backupData.sessions) {
      console.log('💾 Injetando dados do backup.json no IndexedDB...');
      await cdp.evaluate(`
        new Promise((resolve, reject) => {
          const req = indexedDB.open('gamediary_db', 1);
          req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('games')) db.createObjectStore('games', { keyPath: 'uid' });
            if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { autoIncrement: true });
            if (!db.objectStoreNames.contains('metadata')) db.createObjectStore('metadata', { keyPath: 'id' });
          };
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction(['games', 'sessions', 'metadata'], 'readwrite');
            const gs = tx.objectStore('games');
            const ss = tx.objectStore('sessions');
            const ms = tx.objectStore('metadata');
            gs.clear();
            ss.clear();

            const raw = ${JSON.stringify(backupData)};
            const games = raw.games.map((g, i) => ({
              uid: i + 1,
              game_id: g.game_id,
              game_name: g.name,
              apitype_str: String(g.apitype || 0),
              category: g.category || 'PSP'
            }));
            const sessions = raw.sessions.map((s) => ({
              game_uid: raw.games.findIndex(g => g.game_id === s.game_id) + 1,
              duration: s.duration,
              timestamp: s.timestamp
            }));

            games.forEach(g => gs.put(g));
            sessions.forEach(s => ss.add(s));

            ms.put({
              id: 'gamediary_meta',
              version: 1,
              nextUid: games.length + 1,
              lastSavedAt: Date.now(),
              gameCount: games.length,
              sessionCount: sessions.length
            });

            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
          };
          req.onerror = () => reject(req.error);
        })
      `);

      // Reload page with injected data
      await cdp.send('Page.navigate', { url: appUrl });
      await sleep(2500);
    }

    // Open Card Studio modal
    console.log('🎨 Abrindo Card Studio...');
    const opened = await cdp.evaluate(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => {
          const t = b.textContent?.toLowerCase() || '';
          return t.includes('compartilhar') || t.includes('share') || t.includes('card');
        });
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()
    `);

    if (!opened) {
      throw new Error('Não foi possível encontrar o botão de abrir o Card Studio.');
    }
    await sleep(2000);

    const generatedCards = [];
    let count = 0;

    // Loop through all 5 models and 3 formats
    for (const model of MODELS) {
      console.log(`\n📌 Renderizando Modelo: [${model.name}]`);

      // Select model
      await cdp.evaluate(`
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => {
            const txt = b.textContent.toLowerCase();
            if ('${model.id}' === 'top5') return txt.includes('top 5');
            if ('${model.id}' === 'topGame') return txt.includes('mais jogado') || txt.includes('top game');
            if ('${model.id}' === 'library') return txt.includes('biblioteca') || txt.includes('library');
            if ('${model.id}' === 'retrospective') return txt.includes('retrospectiva') || txt.includes('retrospective');
            if ('${model.id}' === 'individual') return txt.includes('individual');
            return false;
          });
          if (btn) btn.click();
        })()
      `);
      await sleep(1500);

      for (const fmt of FORMATS) {
        count++;
        // Select format
        await cdp.evaluate(`
          (() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => {
              const txt = b.textContent.toLowerCase();
              if ('${fmt.id}' === 'vertical') return txt.includes('vertical') || txt.includes('story');
              if ('${fmt.id}' === 'square') return txt.includes('quadrado') || txt.includes('post') || txt.includes('square');
              if ('${fmt.id}' === 'horizontal') return txt.includes('paisagem') || txt.includes('banner') || txt.includes('horizontal');
              return false;
            });
            if (btn) btn.click();
          })()
        `);
        await sleep(1600);

        // Extract canvas image data
        const cardData = await cdp.evaluate(`
          (() => {
            const canvas = document.querySelector('canvas');
            if (!canvas) return null;
            return {
              width: canvas.width,
              height: canvas.height,
              dataUrl: canvas.toDataURL('image/png')
            };
          })()
        `);

        if (!cardData || !cardData.dataUrl) {
          console.error(`  ❌ [${count}/15] Falha ao capturar canvas de ${model.id}_${fmt.id}`);
          continue;
        }

        const base64 = cardData.dataUrl.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');
        const fileName = `${model.id}_${fmt.id}.png`;
        const filePath = path.join(OUTPUT_DIR, fileName);
        fs.writeFileSync(filePath, buffer);

        const sizeKb = Math.round(buffer.length / 1024);
        console.log(`  ✓ [${String(count).padStart(2, ' ')}/15] ${fileName.padEnd(28)} | ${cardData.width}x${cardData.height} | ${sizeKb} KB`);

        generatedCards.push({
          model: model.id,
          modelName: model.name,
          format: fmt.id,
          formatName: fmt.name,
          actualWidth: cardData.width,
          actualHeight: cardData.height,
          sizeKb,
          fileName
        });
      }
    }

    // 7. Write index.html visual gallery
    const indexHtml = generateIndexHtml(generatedCards);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml, 'utf8');

    const galleryUrl = 'file:///' + path.join(OUTPUT_DIR, 'index.html').replace(/\\/g, '/');
    console.log('\n======================================================');
    console.log(`🎉 Sucesso! Todos os 15 Share Cards salvos em:`);
    console.log(`   📁 Diretório: ${OUTPUT_DIR}`);
    console.log(`   🌐 Galeria HTML: ${galleryUrl}`);
    console.log('======================================================\n');

    // 8. Open folder in Explorer if requested
    if (shouldOpenFolder) {
      if (process.platform === 'win32') {
        execSync(`explorer.exe "${OUTPUT_DIR}"`);
      } else if (process.platform === 'darwin') {
        execSync(`open "${OUTPUT_DIR}"`);
      } else {
        execSync(`xdg-open "${OUTPUT_DIR}"`);
      }
    }

  } catch (err) {
    console.error('❌ Erro durante a geração dos cards:', err);
  } finally {
    if (cdp) cdp.close();
    chromeProc.kill();
    server.close();
    try {
      fs.rmSync(TEMP_PROFILE, { recursive: true, force: true });
    } catch (e) {}
  }
}

main();
