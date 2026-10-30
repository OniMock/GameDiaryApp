#!/usr/bin/env node
/**
 * GameDiary Mock Database Generator
 *
 * Gera um banco de dados realista em formato JSON (compatível com backup.json do GameDiary)
 * contendo jogos reais (PSP e PS1) e sessões distribuídas do primeiro dia do mês até a data desejada.
 *
 * Uso via Terminal:
 *   npm run generate:mock                              # Mês atual até a data de hoje
 *   npm run generate:mock -- -i                        # Modo interativo com perguntas no terminal
 *   npm run generate:mock -- 9 30 18                   # Shorthand: Mês 9, 30 dias, 18 jogos
 *   npm run generate:mock -- -m 9 -d 20 -g 15          # Flags nomeadas
 *   node scripts/generate-mock-db.js [opções]
 *
 * Opções:
 *   -m, --month <1-12>     Mês desejado (padrão: mês atual)
 *   -d, --days <número>    Dias a gerar (padrão: dia atual de hoje)
 *   -g, --games <número>   Quantidade de jogos no catálogo ativo (padrão: 14)
 *   -y, --year <ano>       Ano desejado (padrão: ano atual)
 *   -o, --out <arquivo>    Caminho do arquivo de saída (padrão: backup.json)
 *   -i, --interactive      Modo interativo: pergunta mês, dias e jogos no terminal
 *   -h, --help             Exibe esta mensagem de ajuda
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ============================================================================
// Catálogo de Jogos Reais (com seriais e capas 100% verificados no repositório)
// Category: 0 = PSP (apitype 0x120), 1 = PS1 (apitype 0x144)
// Type: 'rpg' | 'action' | 'racing' | 'fighting' | 'platformer' | 'casual'
// ============================================================================
const REAL_GAMES_CATALOG = [
  // --- PSP ---
  {
    game_id: 'ULES01523',
    name: 'Shin Megami Tensei - Persona 3 Portable',
    apitype: '0x120',
    category: 0,
    type: 'rpg'
  },
  {
    game_id: 'NPEG00023',
    name: 'God of War - Chains of Olympus',
    apitype: '0x120',
    category: 0,
    type: 'action'
  },
  {
    game_id: 'UCES01401',
    name: 'God of War - Ghost of Sparta',
    apitype: '0x120',
    category: 0,
    type: 'action'
  },
  {
    game_id: 'ULES00151',
    name: 'Grand Theft Auto - Liberty City Stories',
    apitype: '0x120',
    category: 0,
    type: 'action'
  },
  {
    game_id: 'ULES00502',
    name: 'Grand Theft Auto - Vice City Stories',
    apitype: '0x120',
    category: 0,
    type: 'action'
  },
  {
    game_id: 'UCAS40167',
    name: 'Crisis Core - Final Fantasy VII',
    apitype: '0x120',
    category: 0,
    type: 'rpg'
  },
  {
    game_id: 'UCKS45036',
    name: 'Monster Hunter Freedom',
    apitype: '0x120',
    category: 0,
    type: 'action'
  },
  {
    game_id: 'ULES01213',
    name: 'Monster Hunter Freedom Unite',
    apitype: '0x120',
    category: 0,
    type: 'action'
  },
  {
    game_id: 'NPJH50045',
    name: 'Metal Gear Solid - Peace Walker',
    apitype: '0x120',
    category: 0,
    type: 'action'
  },
  {
    game_id: 'NPJH50184',
    name: 'Tekken 6',
    apitype: '0x120',
    category: 0,
    type: 'fighting'
  },
  {
    game_id: 'NPJH50148',
    name: 'Silent Hill - Shattered Memories',
    apitype: '0x120',
    category: 0,
    type: 'action'
  },
  {
    game_id: 'UCES01177',
    name: 'Patapon 2',
    apitype: '0x120',
    category: 0,
    type: 'casual'
  },
  {
    game_id: 'UCES01421',
    name: 'Patapon 3',
    apitype: '0x120',
    category: 0,
    type: 'casual'
  },
  {
    game_id: 'NPJH50140',
    name: 'Ridge Racer',
    apitype: '0x120',
    category: 0,
    type: 'racing'
  },
  {
    game_id: 'NPJH50305',
    name: 'Burnout Legends',
    apitype: '0x120',
    category: 0,
    type: 'racing'
  },
  {
    game_id: 'ULES00229',
    name: 'Stealth + WipEout Pure',
    apitype: '0x120',
    category: 0,
    type: 'racing'
  },
  {
    game_id: 'NPHG00015',
    name: 'LocoRoco 2',
    apitype: '0x120',
    category: 0,
    type: 'casual'
  },
  {
    game_id: 'ULES01392',
    name: 'Disgaea 2 - Dark Hero Days',
    apitype: '0x120',
    category: 0,
    type: 'rpg'
  },
  {
    game_id: 'NPEG00025',
    name: 'Daxter',
    apitype: '0x120',
    category: 0,
    type: 'platformer'
  },
  {
    game_id: 'UCES01245',
    name: 'Gran Turismo',
    apitype: '0x120',
    category: 0,
    type: 'racing'
  },
  {
    game_id: 'ULUS10297',
    name: 'Final Fantasy Tactics - The War of the Lions',
    apitype: '0x120',
    category: 0,
    type: 'rpg'
  },
  {
    game_id: 'ULES00344',
    name: 'Valkyrie Profile - Lenneth',
    apitype: '0x120',
    category: 0,
    type: 'rpg'
  },
  {
    game_id: 'ULES00841',
    name: 'Castlevania - The Dracula X Chronicles',
    apitype: '0x120',
    category: 0,
    type: 'action'
  },
  {
    game_id: 'ULJM05036',
    name: 'Crash Bandicoot - Gacchanko World',
    apitype: '0x120',
    category: 0,
    type: 'racing'
  },
  {
    game_id: 'NPJG00038',
    name: 'Jak and Daxter - Elf to Itachi no Daibouken',
    apitype: '0x120',
    category: 0,
    type: 'platformer'
  },

  // --- PS1 Classics ---
  {
    game_id: 'SCPS45196',
    name: 'Castlevania - Symphony of the Night',
    apitype: '0x144',
    category: 1,
    type: 'action'
  },
  {
    game_id: 'SCUS94163',
    name: 'Final Fantasy VII',
    apitype: '0x144',
    category: 1,
    type: 'rpg'
  },
  {
    game_id: 'SLUS00892',
    name: 'Final Fantasy VIII',
    apitype: '0x144',
    category: 1,
    type: 'rpg'
  },
  {
    game_id: 'SLUS01251',
    name: 'Final Fantasy IX',
    apitype: '0x144',
    category: 1,
    type: 'rpg'
  },
  {
    game_id: 'SLUS00594',
    name: 'Metal Gear Solid',
    apitype: '0x144',
    category: 1,
    type: 'action'
  },
  {
    game_id: 'SLUS00957',
    name: 'Metal Gear Solid - VR Missions',
    apitype: '0x144',
    category: 1,
    type: 'action'
  },
  {
    game_id: 'SCUS94244',
    name: 'Crash Bandicoot - Warped',
    apitype: '0x144',
    category: 1,
    type: 'platformer'
  },
  {
    game_id: 'SCUS94900',
    name: 'Crash Team Racing',
    apitype: '0x144',
    category: 1,
    type: 'racing'
  },
  {
    game_id: 'PAPX90077',
    name: 'Spyro the Dragon',
    apitype: '0x144',
    category: 1,
    type: 'platformer'
  },
  {
    game_id: 'SCES00005',
    name: 'Tekken',
    apitype: '0x144',
    category: 1,
    type: 'fighting'
  },
  {
    game_id: 'SCES01237',
    name: 'Tekken 3',
    apitype: '0x144',
    category: 1,
    type: 'fighting'
  },
  {
    game_id: 'SCPS45380',
    name: 'Silent Hill',
    apitype: '0x144',
    category: 1,
    type: 'action'
  },
  {
    game_id: 'SLUS00421',
    name: 'Resident Evil 2',
    apitype: '0x144',
    category: 1,
    type: 'action'
  },
  {
    game_id: 'SLUS00747',
    name: 'Resident Evil 3 - Nemesis',
    apitype: '0x144',
    category: 1,
    type: 'action'
  },
  {
    game_id: 'SLUS00664',
    name: 'Xenogears',
    apitype: '0x144',
    category: 1,
    type: 'rpg'
  },
  {
    game_id: 'SLUS00404',
    name: 'Chrono Cross',
    apitype: '0x144',
    category: 1,
    type: 'rpg'
  },
  {
    game_id: 'SLUS90049',
    name: 'Ridge Racer Bonus Turbo Mode Disc',
    apitype: '0x144',
    category: 1,
    type: 'racing'
  }
];

// ============================================================================
// Utilitários de Argumentos e Interface
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    out: path.join(rootDir, 'backup.json'),
    gamesCount: 14,
    days: null,
    month: null,
    year: null,
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
    } else if (arg === '--out' || arg === '-o') {
      const val = args[++i];
      if (val && val.trim()) options.out = path.resolve(rootDir, val.trim());
    } else if (arg === '--games' || arg === '-g') {
      const val = args[++i];
      if (val && val.trim() && !isNaN(val)) options.gamesCount = parseInt(val.trim(), 10);
    } else if (arg === '--days' || arg === '-d') {
      const val = args[++i];
      if (val && val.trim() && !isNaN(val)) options.days = parseInt(val.trim(), 10);
    } else if (arg === '--month' || arg === '-m') {
      const val = args[++i];
      if (val && val.trim() && !isNaN(val)) options.month = parseInt(val.trim(), 10);
    } else if (arg === '--year' || arg === '-y') {
      const val = args[++i];
      if (val && val.trim() && !isNaN(val)) options.year = parseInt(val.trim(), 10);
    } else if (!arg.startsWith('-')) {
      if (arg.trim()) positional.push(arg.trim());
    }
  }

  // Suporte a argumentos posicionais: [mês] [dias] [jogos] [arquivo_saida]
  // Exemplo: node scripts/generate-mock-db.js 9 30 18
  if (positional.length > 0) {
    if (positional[0].endsWith('.json')) {
      options.out = path.resolve(rootDir, positional[0]);
    } else if (!isNaN(positional[0])) {
      options.month = parseInt(positional[0], 10);
    }

    if (positional.length > 1 && !isNaN(positional[1])) {
      options.days = parseInt(positional[1], 10);
    }

    if (positional.length > 2 && !isNaN(positional[2])) {
      options.gamesCount = parseInt(positional[2], 10);
    }

    if (positional.length > 3 && positional[3].endsWith('.json')) {
      options.out = path.resolve(rootDir, positional[3]);
    }
  }

  return options;
}

async function promptInteractive(options) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    console.log('\n\x1b[1;36m🎮 Modo Interativo - Gerador de Banco de Dados Mock\x1b[0m');
    console.log('\x1b[90m(Pressione Enter para confirmar o valor padrão entre colchetes)\x1b[0m\n');

    // 1. Mês
    const monthDefault = options.month || currentMonth;
    const mAns = await ask(`  📅 Mês [1-12] (Padrão: ${monthDefault}): `);
    if (mAns.trim() && !isNaN(mAns)) {
      options.month = Math.min(12, Math.max(1, parseInt(mAns.trim(), 10)));
    } else if (!options.month) {
      options.month = monthDefault;
    }

    // 2. Dias
    const targetMonth = options.month;
    const isCurrentMonth = (targetMonth === currentMonth);
    const maxDay = new Date(currentYear, targetMonth, 0).getDate();
    const daysDefault = options.days || (isCurrentMonth ? currentDay : maxDay);

    const dAns = await ask(`  📆 Dias a gerar [1-${maxDay}] (Padrão: ${daysDefault}): `);
    if (dAns.trim() && !isNaN(dAns)) {
      options.days = Math.min(maxDay, Math.max(1, parseInt(dAns.trim(), 10)));
    } else if (!options.days) {
      options.days = daysDefault;
    }

    // 3. Quantidade de Jogos
    const gamesDefault = options.gamesCount || 14;
    const gAns = await ask(`  🕹️  Quantidade de jogos no catálogo [3-${REAL_GAMES_CATALOG.length}] (Padrão: ${gamesDefault}): `);
    if (gAns.trim() && !isNaN(gAns)) {
      options.gamesCount = Math.min(REAL_GAMES_CATALOG.length, Math.max(3, parseInt(gAns.trim(), 10)));
    }

    // 4. Arquivo de Saída
    const defaultOutRel = path.relative(rootDir, options.out) || 'backup.json';
    const oAns = await ask(`  💾 Arquivo de saída (Padrão: ${defaultOutRel}): `);
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

\x1b[36mUso via Terminal:\x1b[0m
  npm run generate:mock                               # Mês atual até hoje (padrão)
  npm run generate:mock -- -i                         # Modo interativo (pergunta no terminal)
  npm run generate:mock -- 9 30 18                    # Shorthand: Mês 9, 30 dias, 18 jogos
  npm run generate:mock -- -m 9 -d 20 -g 15           # Flags nomeadas
  node scripts/generate-mock-db.js [opções]

\x1b[36mOpções:\x1b[0m
  -m, --month <1-12>     Mês desejado (padrão: mês atual)
  -d, --days <número>    Quantidade de dias (padrão: até o dia atual de hoje)
  -g, --games <número>   Quantidade de jogos no catálogo ativo (padrão: 14)
  -y, --year <ano>       Ano desejado (padrão: ano atual)
  -o, --out <arquivo>    Arquivo de saída (padrão: backup.json na raiz)
  -i, --interactive      Modo interativo no terminal
  -h, --help             Exibe esta mensagem de ajuda

\x1b[36mExemplos:\x1b[0m
  # Setembro completo com 20 jogos:
  npm run generate:mock -- -m 9 -d 30 -g 20

  # Ou de forma compacta (mês dias jogos):
  node scripts/generate-mock-db.js 8 31 16
`);
}

function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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
// Gerador Principal
// ============================================================================

function generateMockData(options) {
  const now = new Date();
  const year = options.year || now.getFullYear();
  // month: 0-indexed no JS (se options.month for 10, usamos 9)
  const month = options.month !== null ? options.month - 1 : now.getMonth();

  const isCurrentMonth = (year === now.getFullYear() && month === now.getMonth());
  const maxDayPossible = new Date(year, month + 1, 0).getDate();
  const todayDay = isCurrentMonth ? now.getDate() : maxDayPossible;
  const daysToGenerate = options.days ? Math.min(options.days, maxDayPossible) : todayDay;

  // 1. Seleciona os jogos ativos para o mês
  const shuffledCatalog = shuffleArray(REAL_GAMES_CATALOG);
  const selectedGames = shuffledCatalog.slice(0, Math.min(options.gamesCount, REAL_GAMES_CATALOG.length));

  // Tiers de preferência do jogador:
  // Tier 1 (1-2 jogos): Jogo principal zerando (~50% do tempo)
  // Tier 2 (3-4 jogos): Jogos secundários habituais (~35% do tempo)
  // Tier 3 (resto): Jogos casuais ou experimentais (~15% do tempo)
  const tier1 = selectedGames.slice(0, Math.min(2, selectedGames.length));
  const tier2 = selectedGames.slice(2, Math.min(6, selectedGames.length));
  const tier3 = selectedGames.slice(6);

  const pickGame = () => {
    const roll = Math.random();
    if (roll < 0.50 && tier1.length > 0) {
      return tier1[Math.floor(Math.random() * tier1.length)];
    } else if (roll < 0.85 && tier2.length > 0) {
      return tier2[Math.floor(Math.random() * tier2.length)];
    } else if (tier3.length > 0) {
      return tier3[Math.floor(Math.random() * tier3.length)];
    }
    return selectedGames[Math.floor(Math.random() * selectedGames.length)];
  };

  // Duração realista com base no estilo de jogo
  const pickDuration = (game) => {
    let minMinutes = 25;
    let maxMinutes = 75;

    if (game.type === 'rpg') {
      minMinutes = 45;
      maxMinutes = 150; // Até 2h30m
    } else if (game.type === 'action') {
      minMinutes = 35;
      maxMinutes = 110;
    } else if (game.type === 'fighting' || game.type === 'racing') {
      minMinutes = 15;
      maxMinutes = 55;
    } else if (game.type === 'casual' || game.type === 'platformer') {
      minMinutes = 20;
      maxMinutes = 65;
    }

    const minutes = randomInt(minMinutes, maxMinutes);
    const extraSeconds = randomInt(1, 59);
    return minutes * 60 + extraSeconds;
  };

  const sessions = [];
  const gamesPlayedSet = new Set();

  // 2. Itera pelos dias do mês: do dia 1 até o limite de dias
  for (let day = 1; day <= daysToGenerate; day++) {
    const dayDate = new Date(year, month, day);
    const dayOfWeek = dayDate.getDay(); // 0 = Domingo, 6 = Sábado
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    const isToday = isCurrentMonth && (day === now.getDate());

    // Probabilidade de jogar neste dia:
    // Fins de semana: ~90% de chance. Dias de semana: ~75% de chance.
    const playChance = isWeekend ? 0.90 : 0.75;
    if (Math.random() > playChance && !isToday) {
      // Dia de descanso/folga sem jogatina
      continue;
    }

    // Janelas de horário habituais
    const availableSlots = [
      { startHour: 12, startMin: randomInt(0, 30), maxDurationMin: 50 },
      { startHour: 16, startMin: randomInt(30, 50), maxDurationMin: 70 },
      { startHour: 19, startMin: randomInt(15, 45), maxDurationMin: 90 },
      { startHour: 21, startMin: randomInt(45, 55), maxDurationMin: 120 }
    ];

    // Quantas sessões no dia?
    const maxSessions = isWeekend ? randomInt(2, 4) : randomInt(1, 3);
    const chosenSlots = shuffleArray(availableSlots).slice(0, maxSessions);
    chosenSlots.sort((a, b) => (a.startHour * 60 + a.startMin) - (b.startHour * 60 + b.startMin));

    let lastSessionEndTs = 0;

    for (const slot of chosenSlots) {
      const sessionDate = new Date(year, month, day, slot.startHour, slot.startMin, randomInt(0, 59));
      let startTs = Math.floor(sessionDate.getTime() / 1000);

      // Garante buffer mínimo de 15 minutos entre sessões no mesmo dia
      if (startTs < lastSessionEndTs + 900) {
        startTs = lastSessionEndTs + randomInt(900, 2400);
      }

      const game = pickGame();
      let duration = pickDuration(game);

      // Se for hoje no mês atual, não gera sessões no futuro
      if (isToday) {
        const currentNowTs = Math.floor(now.getTime() / 1000);
        const maxAllowedEndTs = currentNowTs - 300;

        if (startTs >= maxAllowedEndTs) {
          continue;
        }

        if (startTs + duration > maxAllowedEndTs) {
          duration = maxAllowedEndTs - startTs;
          if (duration < 600) {
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
    }
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
      year,
      month: month + 1,
      daysGenerated: daysToGenerate,
      totalSessions: sessions.length,
      totalGames: finalGamesList.length,
      activeGamesCount: gamesPlayedSet.size,
      totalPlaytimeSec: sessions.reduce((acc, s) => acc + s.duration, 0),
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
// Execução
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

  console.log('\n\x1b[1;34m=========================================\x1b[0m');
  console.log('\x1b[1;34m   GameDiary Mock Database Generator     \x1b[0m');
  console.log('\x1b[1;34m=========================================\x1b[0m\n');

  const { database, stats } = generateMockData(options);

  // Salva no arquivo de saída
  const jsonContent = JSON.stringify(database, null, 2);
  fs.writeFileSync(options.out, jsonContent, 'utf-8');

  const monthNamesPt = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthName = monthNamesPt[stats.month - 1] || `Mês ${stats.month}`;

  console.log(`\x1b[32m✔ Banco de dados gerado com sucesso!\x1b[0m`);
  console.log(`\x1b[1mArquivo:\x1b[0m ${path.relative(rootDir, options.out) || options.out}`);
  console.log(`\x1b[1mPeríodo:\x1b[0m 01 a ${String(stats.daysGenerated).padStart(2, '0')} de ${monthName} de ${stats.year}`);
  console.log(`\x1b[1mJogos no Catálogo:\x1b[0m ${stats.totalGames} (${stats.activeGamesCount} com sessões gravadas)`);
  console.log(`\x1b[1mTotal de Sessões:\x1b[0m ${stats.totalSessions}`);
  console.log(`\x1b[1mTempo Total Jogado:\x1b[0m ${formatDuration(stats.totalPlaytimeSec)}\n`);

  // Ranking dos jogos mais jogados no mês
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
  console.log(' 1. Abra o site GameDiary no navegador (npm run dev)');
  console.log(' 2. Vá em \x1b[1mFerramentas -> Gerenciamento de Dados\x1b[0m');
  console.log(' 3. Clique em \x1b[1m"Importar Backup"\x1b[0m e selecione o arquivo:');
  console.log(`    \x1b[36m${options.out}\x1b[0m`);
  console.log(' 4. Visualize a Timeline e o Dashboard com dados reais!\n');
}

main().catch(err => {
  console.error('\x1b[31mErro ao gerar dados mock:\x1b[0m', err);
  process.exit(1);
});
