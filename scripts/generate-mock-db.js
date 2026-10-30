#!/usr/bin/env node
/**
 * GameDiary Mock Database Generator
 *
 * Gera um banco de dados realista em formato JSON (compatível com backup.json do GameDiary)
 * contendo jogos reais (PSP e PS1) do projeto de capas e sessões distribuídas ao longo de
 * vários meses até o momento atual de hoje.
 *
 * Uso via Terminal:
 *   npm run generate:mock                              # Padrão: 3 meses até hoje com 20 jogos
 *   npm run generate:mock -- -i                        # Modo interativo (pergunta meses, jogos, etc.)
 *   npm run generate:mock -- 3 25                      # Shorthand: 3 meses até hoje, 25 jogos
 *   npm run generate:mock -- 6 30 psp                  # Shorthand: 6 meses até hoje, 30 jogos PSP
 *   npm run generate:mock -- -m 6 -g 30 -p all         # Flags nomeadas
 *   node scripts/generate-mock-db.js [opções]
 *
 * Opções:
 *   -m, --months <número>    Quantidade de meses até a data de hoje (padrão: 3)
 *   -d, --days <número>      Quantidade de dias exatos até a data de hoje
 *   -g, --games <número>     Quantidade de jogos no catálogo ativo (padrão: 20)
 *   -p, --platform <p>       Plataforma: 'all' (PSP + PS1), 'psp', ou 'psx' (padrão: all)
 *   -o, --out <arquivo>      Caminho do arquivo de saída (padrão: backup.json)
 *   -i, --interactive        Modo interativo no terminal
 *   -h, --help               Exibe esta mensagem de ajuda
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ============================================================================
// 1. Carregamento do Catálogo Real (13.236 Jogos com capas oficiais)
// ============================================================================

const POSSIBLE_MAP_PATHS = [
  'd:/Biblioteca/Github Projects/Capas/full_game_map.json',
  path.resolve(rootDir, '../Capas/full_game_map.json'),
  path.resolve(rootDir, 'scripts/.cache_game_map.json'),
  path.resolve(rootDir, '.cache_game_map.json')
];

function loadFullGameMap() {
  for (const p of POSSIBLE_MAP_PATHS) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return { map: parsed, source: p };
        }
      }
    } catch {
      // Tenta próximo caminho
    }
  }
  return { map: {}, source: null };
}

// ============================================================================
// 2. Limpeza de Nomes e Classificação de Gêneros
// ============================================================================

function cleanGameName(rawPath) {
  let name = rawPath.split('/').pop().replace(/\.png$/i, '');
  // Remove sufixos de discos, versões e regiões comuns preservando o nome do jogo
  name = name.replace(/\s*\((Disc|Disk|Rev|v\d+|Beta|Demo|Sample|En|Ja|Fr|De|Es|It|Ko|Zh|USA|Europe|Japan|Asia|Germany|France|Spain|Italy|Korea|Australia|Brazil|World)[^)]*\)/gi, '');
  name = name.replace(/\s*\([^)]*\)$/g, '').trim();
  name = name.replace(/\s*\([^)]*\)$/g, '').trim();
  // Limita tamanho para caber no limite de interface
  if (name.length > 60) {
    name = name.substring(0, 57).trim() + '...';
  }
  return name;
}

const POPULAR_KEYWORDS = [
  'God of War', 'Persona', 'Grand Theft Auto', 'Monster Hunter', 'Crisis Core',
  'Castlevania', 'Final Fantasy', 'Metal Gear', 'Silent Hill', 'Tekken',
  'Resident Evil', 'Crash Bandicoot', 'Spyro', 'Gran Turismo', 'Ridge Racer',
  'Burnout', 'Need for Speed', 'Kingdom Hearts', 'Patapon', 'LocoRoco',
  'Daxter', 'Tomb Raider', 'Chrono Cross', 'Xenogears', 'Valkyrie Profile',
  'Dissidia', 'Midnight Club', 'Star Wars', 'Twisted Metal', 'Parasite Eve',
  'Syphon Filter', 'Medal of Honor', 'Tony Hawk', 'Dragon Ball', 'Naruto',
  'Disgaea', 'Ys', 'Ape Escape', 'MediEvil', 'Ratchet', 'Jak and Daxter'
];

function detectGenre(title) {
  const t = title.toLowerCase();
  if (/fantasy|persona|shin megami|chrono|xenogears|valkyrie|kingdom hearts|disgaea|tactics|ys|rpg|quest|dragon quest|suikoden|star ocean|monster hunter/.test(t)) {
    return 'rpg';
  }
  if (/tekken|street fighter|mortal kombat|guilty gear|fight|brawler|wrestling|smackdown|ufc|versus|vs/.test(t)) {
    return 'fighting';
  }
  if (/gran turismo|ridge racer|burnout|need for speed|wipeout|racing|race|rally|moto|gp|f1|formula|nascar|kart|driver|midnight club/.test(t)) {
    return 'racing';
  }
  if (/god of war|metal gear|silent hill|resident evil|grand theft auto|gta|tomb raider|syphon filter|medal of honor|call of duty|dino crisis|parasite eve|action/.test(t)) {
    return 'action';
  }
  if (/crash|spyro|patapon|locoroco|daxter|jak|ratchet|sonic|mario|pac-man|rayman|ape escape|medievil|klonoa|bomberman|tetris|lumines|pinball/.test(t)) {
    return 'casual';
  }
  return 'general';
}

function scoreGameForSelection(relPath) {
  let score = 0;
  const pLower = relPath.toLowerCase();
  if (POPULAR_KEYWORDS.some(kw => pLower.includes(kw.toLowerCase()))) score += 100;
  if (relPath.includes('(USA)')) score += 40;
  else if (relPath.includes('(Europe)')) score += 30;
  else if (relPath.includes('(En')) score += 20;
  return score;
}

function selectGamesFromCatalog(map, count = 20, platformChoice = 'all') {
  const pspList = [];
  const psxList = [];

  for (const [id, relPath] of Object.entries(map)) {
    const isPsp = relPath.startsWith('psp/');
    const isPsx = relPath.startsWith('psx/');
    if (!isPsp && !isPsx) continue;

    const item = {
      id: id.replace(/-/g, '').toUpperCase(),
      relPath,
      score: scoreGameForSelection(relPath)
    };

    if (isPsp) pspList.push(item);
    else if (isPsx) psxList.push(item);
  }

  // Ordena com variação aleatória para diversificar entre execuções
  const sorter = (a, b) => (b.score + Math.random() * 50) - (a.score + Math.random() * 50);
  pspList.sort(sorter);
  psxList.sort(sorter);

  let targetPsp = Math.floor(count / 2);
  let targetPsx = count - targetPsp;

  if (platformChoice === 'psp') {
    targetPsp = count;
    targetPsx = 0;
  } else if (platformChoice === 'psx') {
    targetPsp = 0;
    targetPsx = count;
  }

  const selected = [];
  const usedTitles = new Set();

  function addCandidates(list, targetQuota) {
    let added = 0;
    for (const item of list) {
      if (added >= targetQuota) break;
      const clean = cleanGameName(item.relPath);
      if (!clean || usedTitles.has(clean.toLowerCase())) continue;
      usedTitles.add(clean.toLowerCase());

      const isPsx = item.relPath.startsWith('psx/');
      selected.push({
        game_id: item.id,
        name: clean,
        category: isPsx ? 1 : 0,
        apitype: isPsx ? '0x144' : '0x120',
        platform: isPsx ? 'PS1' : 'PSP',
        genre: detectGenre(clean)
      });
      added++;
    }
  }

  addCandidates(pspList, targetPsp);
  addCandidates(psxList, targetPsx);

  // Se ainda faltar para o count desejado, preenche de qualquer lista disponível
  if (selected.length < count) {
    const remaining = [...pspList, ...psxList].sort(() => Math.random() - 0.5);
    addCandidates(remaining, count - selected.length);
  }

  return selected;
}

// ============================================================================
// 3. Utilitários de Argumentos e Interface
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    months: 3,
    days: null,
    gamesCount: 20,
    platform: 'all',
    out: path.join(rootDir, 'backup.json'),
    interactive: false,
    help: false
  };

  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--interactive' || arg === '-i') {
      options.interactive = true;
    } else if (arg === '--months' || arg === '-m') {
      const val = args[++i];
      if (val && !isNaN(val)) options.months = Math.max(1, parseInt(val, 10));
    } else if (arg === '--days' || arg === '-d') {
      const val = args[++i];
      if (val && !isNaN(val)) options.days = Math.max(1, parseInt(val, 10));
    } else if (arg === '--games' || arg === '-g') {
      const val = args[++i];
      if (val && !isNaN(val)) options.gamesCount = Math.max(3, parseInt(val, 10));
    } else if (arg === '--platform' || arg === '-p') {
      const val = (args[++i] || '').toLowerCase();
      if (['all', 'psp', 'psx', 'ps1'].includes(val)) {
        options.platform = val === 'ps1' ? 'psx' : val;
      }
    } else if (arg === '--out' || arg === '-o') {
      const val = args[++i];
      if (val) options.out = path.resolve(rootDir, val);
    } else if (!arg.startsWith('-')) {
      if (arg.trim()) positional.push(arg.trim());
    }
  }

  // Suporte a argumentos posicionais curtos: [meses] [jogos] [plataforma] [arquivo]
  // Ex: node scripts/generate-mock-db.js 3 25
  // Ex: node scripts/generate-mock-db.js 6 30 psp
  if (positional.length > 0) {
    if (positional[0].endsWith('.json')) {
      options.out = path.resolve(rootDir, positional[0]);
    } else if (!isNaN(positional[0])) {
      options.months = Math.max(1, parseInt(positional[0], 10));
    }

    if (positional.length > 1 && !isNaN(positional[1])) {
      options.gamesCount = Math.max(3, parseInt(positional[1], 10));
    }

    if (positional.length > 2) {
      const p = positional[2].toLowerCase();
      if (['all', 'psp', 'psx', 'ps1'].includes(p)) {
        options.platform = p === 'ps1' ? 'psx' : p;
      } else if (positional[2].endsWith('.json')) {
        options.out = path.resolve(rootDir, positional[2]);
      }
    }

    if (positional.length > 3 && positional[3].endsWith('.json')) {
      options.out = path.resolve(rootDir, positional[3]);
    }
  }

  return options;
}

async function promptInteractive(options) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    console.log('\n\x1b[1;36m🎮 Modo Interativo - Gerador de Banco de Dados Mock\x1b[0m');
    console.log('\x1b[90m(Pressione Enter para confirmar o valor padrão entre colchetes)\x1b[0m\n');

    // 1. Quantidade de Meses
    const mAns = await rl.question(`  📅 Quantos meses deseja gerar até hoje? [1 a 24] (Padrão: ${options.months}): `);
    if (mAns.trim() && !isNaN(mAns)) {
      options.months = Math.max(1, parseInt(mAns.trim(), 10));
    }

    // 2. Quantidade de Jogos
    const gAns = await rl.question(`  🕹️  Quantidade de jogos no catálogo? [3 a 200] (Padrão: ${options.gamesCount}): `);
    if (gAns.trim() && !isNaN(gAns)) {
      options.gamesCount = Math.max(3, parseInt(gAns.trim(), 10));
    }

    // 3. Plataforma
    console.log('  🎯 Plataforma desejada:');
    console.log('     [1] Todas (PSP + PS1)');
    console.log('     [2] Apenas PSP');
    console.log('     [3] Apenas PS1');
    const pAns = await rl.question('     Escolha [1, 2 ou 3] (Padrão: 1): ');
    if (pAns.trim() === '2') options.platform = 'psp';
    else if (pAns.trim() === '3') options.platform = 'psx';
    else options.platform = 'all';

    // 4. Arquivo de Saída
    const defaultOutRel = path.relative(rootDir, options.out) || 'backup.json';
    const oAns = await rl.question(`  💾 Arquivo de saída (Padrão: ${defaultOutRel}): `);
    if (oAns.trim()) {
      options.out = path.resolve(rootDir, oAns.trim());
    }

    console.log('');
  } finally {
    rl.close();
  }
}

function printHelp() {
  console.log(`
\x1b[1mGameDiary Mock Database Generator\x1b[0m
Gera um banco de dados realista em formato JSON para testar o site GameDiary.
Utiliza os mais de 13.000 jogos reais da biblioteca de capas do PlayStation Portable / PS1.

\x1b[36mUso via Terminal:\x1b[0m
  npm run generate:mock                               # 3 meses até hoje com 20 jogos (padrão)
  npm run generate:mock -- -i                         # Modo interativo (perguntas guiadas)
  npm run generate:mock -- 3 25                       # Shorthand: 3 meses até hoje, 25 jogos
  npm run generate:mock -- 6 30 psp                   # Shorthand: 6 meses até hoje, 30 jogos PSP
  npm run generate:mock -- -m 6 -g 35 -p all          # Flags nomeadas
  node scripts/generate-mock-db.js [opções]

\x1b[36mOpções:\x1b[0m
  -m, --months <número>    Quantidade de meses até hoje (ex: 1, 3, 6, 12. Padrão: 3)
  -d, --days <número>      Quantidade exata de dias até hoje
  -g, --games <número>     Quantidade de jogos no catálogo ativo (padrão: 20)
  -p, --platform <p>       Filtrar plataforma: 'all' (PSP + PS1), 'psp', ou 'psx' (padrão: all)
  -o, --out <arquivo>      Arquivo de saída (padrão: backup.json na raiz)
  -i, --interactive        Modo interativo no terminal
  -h, --help               Exibe esta mensagem de ajuda

\x1b[36mExemplos:\x1b[0m
  # Gerar últimos 6 meses com 40 jogos mistos:
  npm run generate:mock -- 6 40

  # Gerar apenas o mês atual até a data de hoje com 15 jogos:
  npm run generate:mock -- 1 15

  # Gerar 1 ano inteiro até hoje focado em jogos de PSP:
  npm run generate:mock -- 12 50 psp
`);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// ============================================================================
// 4. Motor de Simulação de Múltiplos Meses até Hoje
// ============================================================================

function generateMockData(options, gameCatalog) {
  const now = new Date();
  const currentNowTs = Math.floor(now.getTime() / 1000);

  // Determina a data de início da simulação:
  // Se options.days foi informado, volta N dias a partir de agora.
  // Caso contrário, volta (options.months - 1) meses até o 1º dia daquele mês.
  let startDate;
  if (options.days) {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - options.days + 1, 0, 0, 0, 0);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth() - (options.months - 1), 1, 0, 0, 0, 0);
  }

  // 1. Seleciona os jogos ativos para a biblioteca
  const selectedGames = selectGamesFromCatalog(gameCatalog, options.gamesCount, options.platform);

  // 2. Organiza o comportamento do jogador:
  // - Focus Games: 2 a 3 jogos em foco por mês/fase (ex: RPGs e Campanhas)
  // - Evergreen Games: Jogos rápidos jogados ao longo de todo o período (Tekken, GT, Burnout, CTR)
  // - Backlog Games: Jogos experimentados ocasionalmente
  const evergreenGames = selectedGames.filter(g => g.genre === 'fighting' || g.genre === 'racing' || g.genre === 'casual');
  const campaignGames = selectedGames.filter(g => g.genre === 'rpg' || g.genre === 'action' || g.genre === 'general');

  // Duração orgânica por gênero
  const pickDuration = (game) => {
    let minMinutes = 25;
    let maxMinutes = 75;

    if (game.genre === 'rpg') {
      minMinutes = 45;
      maxMinutes = 150; // Até 2h30m
    } else if (game.genre === 'action') {
      minMinutes = 35;
      maxMinutes = 110;
    } else if (game.genre === 'fighting' || game.genre === 'racing') {
      minMinutes = 15;
      maxMinutes = 55;
    } else if (game.genre === 'casual') {
      minMinutes = 20;
      maxMinutes = 65;
    }

    const minutes = randomInt(minMinutes, maxMinutes);
    const extraSeconds = randomInt(1, 59);
    return minutes * 60 + extraSeconds;
  };

  // 3. Itera dia por dia do início até HOJE
  const sessions = [];
  const gamesPlayedSet = new Set();
  const monthlyStats = {};

  const currentDateCursor = new Date(startDate);
  // Garante que o cursor comece à meia-noite
  currentDateCursor.setHours(0, 0, 0, 0);

  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDay = now.getDate();

  // Para alternar jogos de foco conforme os meses avançam
  let dayCounter = 0;

  while (currentDateCursor <= now) {
    const year = currentDateCursor.getFullYear();
    const month = currentDateCursor.getMonth(); // 0-indexed
    const day = currentDateCursor.getDate();
    const dayOfWeek = currentDateCursor.getDay(); // 0 = Domingo, 6 = Sábado
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    const isToday = (year === todayYear && month === todayMonth && day === todayDay);

    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    if (!monthlyStats[monthKey]) {
      monthlyStats[monthKey] = { sessions: 0, duration: 0 };
    }

    // Janela de jogos de foco para este momento da linha do tempo
    const phaseIndex = Math.floor(dayCounter / 21); // Muda o foco a cada ~3 semanas
    const activeCampaignGames = campaignGames.slice(
      (phaseIndex * 2) % Math.max(1, campaignGames.length),
      ((phaseIndex * 2) % Math.max(1, campaignGames.length)) + 3
    );
    if (activeCampaignGames.length === 0 && campaignGames.length > 0) {
      activeCampaignGames.push(campaignGames[0]);
    }

    // Probabilidade de jogar hoje:
    // Fins de semana: ~88% de chance. Dias de semana: ~75% de chance.
    // O dia de hoje sempre tem jogatina garantida (se horário permitir).
    const playChance = isWeekend ? 0.88 : 0.75;
    if (Math.random() > playChance && !isToday) {
      currentDateCursor.setDate(currentDateCursor.getDate() + 1);
      dayCounter++;
      continue;
    }

    // Janelas de horário habituais
    const availableSlots = [
      { startHour: 12, startMin: randomInt(0, 30) },
      { startHour: 16, startMin: randomInt(30, 50) },
      { startHour: 19, startMin: randomInt(15, 45) },
      { startHour: 21, startMin: randomInt(45, 55) }
    ];

    // Quantas sessões no dia:
    const numSessions = isWeekend ? randomInt(2, 4) : randomInt(1, 3);
    const chosenSlots = availableSlots
      .sort(() => Math.random() - 0.5)
      .slice(0, numSessions)
      .sort((a, b) => (a.startHour * 60 + a.startMin) - (b.startHour * 60 + b.startMin));

    let lastSessionEndTs = 0;

    for (const slot of chosenSlots) {
      const sessionDate = new Date(year, month, day, slot.startHour, slot.startMin, randomInt(0, 59));
      let startTs = Math.floor(sessionDate.getTime() / 1000);

      // Garante buffer mínimo de 15 minutos entre sessões no mesmo dia (sem colisão)
      if (startTs < lastSessionEndTs + 900) {
        startTs = lastSessionEndTs + randomInt(900, 2400);
      }

      // Escolhe o jogo para esta sessão
      let game;
      const roll = Math.random();
      if (roll < 0.65 && activeCampaignGames.length > 0) {
        game = activeCampaignGames[Math.floor(Math.random() * activeCampaignGames.length)];
      } else if (roll < 0.90 && evergreenGames.length > 0) {
        game = evergreenGames[Math.floor(Math.random() * evergreenGames.length)];
      } else {
        game = selectedGames[Math.floor(Math.random() * selectedGames.length)];
      }

      let duration = pickDuration(game);

      // SE FOR O DIA DE HOJE: NUNCA GERAR NO FUTURO!
      if (isToday) {
        // A sessão deve terminar antes de agora (com pelo menos 5 min de margem)
        const maxAllowedEndTs = currentNowTs - 300;

        if (startTs >= maxAllowedEndTs) {
          // O horário do slot ainda não aconteceu hoje, ignoramos
          continue;
        }

        if (startTs + duration > maxAllowedEndTs) {
          // Reduz a duração da sessão para terminar antes do horário atual
          duration = maxAllowedEndTs - startTs;
          if (duration < 600) {
            // Se restarem menos de 10 minutos, descarta a sessão
            continue;
          }
        }
      }

      sessions.push({
        game_id: game.game_id,
        duration,
        timestamp: startTs
      });

      lastSessionEndTs = startTs + duration;
      gamesPlayedSet.add(game.game_id);

      monthlyStats[monthKey].sessions += 1;
      monthlyStats[monthKey].duration += duration;
    }

    currentDateCursor.setDate(currentDateCursor.getDate() + 1);
    dayCounter++;
  }

  // Ordena por timestamp crescente
  sessions.sort((a, b) => a.timestamp - b.timestamp);

  const finalGamesList = selectedGames.map(g => ({
    game_id: g.game_id,
    name: g.name,
    apitype: g.apitype,
    category: g.category
  }));

  const database = {
    games: finalGamesList,
    sessions
  };

  return {
    database,
    stats: {
      startDate,
      endDate: now,
      totalSessions: sessions.length,
      totalGames: finalGamesList.length,
      activeGamesCount: gamesPlayedSet.size,
      totalPlaytimeSec: sessions.reduce((acc, s) => acc + s.duration, 0),
      monthlyStats,
      sessionsPerGame: sessions.reduce((acc, s) => {
        acc[s.game_id] = (acc[s.game_id] || 0) + 1;
        return acc;
      }, {}),
      playtimePerGame: sessions.reduce((acc, s) => {
        acc[s.game_id] = (acc[s.game_id] || 0) + s.duration;
        return acc;
      }, {})
    }
  };
}

// ============================================================================
// 5. Execução Principal
// ============================================================================

async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  // Se o usuário solicitou modo interativo (-i ou --interactive)
  if (options.interactive) {
    await promptInteractive(options);
  }

  console.log('\n\x1b[1;34m====================================================\x1b[0m');
  console.log('\x1b[1;34m        GameDiary Mock Database Generator           \x1b[0m');
  console.log('\x1b[1;34m====================================================\x1b[0m\n');

  // Carrega catálogo de jogos com capas
  const { map: gameCatalog, source: mapSource } = loadFullGameMap();
  const catalogSize = Object.keys(gameCatalog).length;

  if (catalogSize > 0) {
    console.log(`\x1b[32m✔ Catálogo Carregado:\x1b[0m ${catalogSize.toLocaleString()} jogos reais (${mapSource ? path.basename(mapSource) : 'local'})\n`);
  } else {
    console.log(`\x1b[33m⚠ Catálogo completo não encontrado, utilizando base padrão.\x1b[0m\n`);
  }

  const { database, stats } = generateMockData(options, gameCatalog);

  // Salva no arquivo de saída
  const jsonContent = JSON.stringify(database, null, 2);
  fs.writeFileSync(options.out, jsonContent, 'utf-8');

  const startFormatted = stats.startDate.toLocaleDateString('pt-BR');
  const endFormatted = stats.endDate.toLocaleDateString('pt-BR');
  const nowTime = stats.endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  console.log(`\x1b[32m✔ Banco de dados gerado com sucesso!\x1b[0m`);
  console.log(`\x1b[1mArquivo:\x1b[0m             ${path.relative(rootDir, options.out) || options.out}`);
  console.log(`\x1b[1mPeríodo Simulado:\x1b[0m    ${startFormatted} até hoje (${endFormatted} às ${nowTime})`);
  console.log(`\x1b[1mJogos no Catálogo:\x1b[0m   ${stats.totalGames} (${stats.activeGamesCount} com sessões gravadas)`);
  console.log(`\x1b[1mTotal de Sessões:\x1b[0m    ${stats.totalSessions}`);
  console.log(`\x1b[1mTempo Total Jogado:\x1b[0m  ${formatDuration(stats.totalPlaytimeSec)}\n`);

  // Distribuição por Mês
  console.log('\x1b[1mEvolução Mensal:\x1b[0m');
  console.log('------------------------------------------------------------');
  for (const [mKey, data] of Object.entries(stats.monthlyStats)) {
    const [y, m] = mKey.split('-');
    const mNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const label = `${mNames[parseInt(m, 10) - 1]} / ${y}`;
    const durStr = formatDuration(data.duration);
    console.log(` • \x1b[36m${label.padEnd(12)}\x1b[0m: ${durStr.padEnd(10)} em ${data.sessions} sessões`);
  }
  console.log('------------------------------------------------------------\n');

  // Ranking dos jogos mais jogados
  console.log('\x1b[1mTop Jogos Mais Jogados:\x1b[0m');
  console.log('------------------------------------------------------------');
  const gameMap = new Map(database.games.map(g => [g.game_id, g.name]));
  const sortedGames = Object.entries(stats.playtimePerGame)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  sortedGames.forEach(([gid, duration], idx) => {
    const name = gameMap.get(gid) || gid;
    const count = stats.sessionsPerGame[gid];
    const durStr = formatDuration(duration);
    console.log(` ${idx + 1}. \x1b[33m${name}\x1b[0m (${gid})`);
    console.log(`    Tempo: \x1b[36m${durStr}\x1b[0m em ${count} ${count === 1 ? 'sessão' : 'sessões'}`);
  });
  console.log('------------------------------------------------------------\n');

  console.log('\x1b[1;35mComo testar no site:\x1b[0m');
  console.log(' 1. Inicie o site localmente (npm run dev)');
  console.log(' 2. Vá em \x1b[1mFerramentas -> Gerenciamento de Dados\x1b[0m');
  console.log(' 3. Clique em \x1b[1m"Importar Backup"\x1b[0m e escolha o arquivo:');
  console.log(`    \x1b[36m${options.out}\x1b[0m`);
  console.log(' 4. Acesse a aba \x1b[1m"Estatísticas"\x1b[0m ou a \x1b[1m"Linha do Tempo"\x1b[0m para ver os dados!\n');
}

main().catch(err => {
  console.error('\x1b[31mErro ao gerar dados mock:\x1b[0m', err);
  process.exit(1);
});
