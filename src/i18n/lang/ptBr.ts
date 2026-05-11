import type { LanguageFile } from "../types/language";

export const ptBr: LanguageFile = {
  config: {
    code: "pt-BR",
    name: "Português Brasil",
    nativeName: "Português",
    flag: "br",
  },
  translations: {
    "nav.home": "Início",
    "nav.tools": "Ferramentas",
    "nav.download": "Download",
    "welcome.subtitle": "Seu diário pessoal de jogos.",
    "tools.gameSessions.title": "Sessões de Jogo",
    "tools.gameSessions.subtitle": "Editor visual para backup.json",
    "actions.exportBackup": "Exportar backup.json",
    "actions.dropBackupFile": "Arraste e solte seu arquivo backup.json aqui",
    "actions.dataManagement": "Gerenciamento de Dados",
    "actions.invalidFileBackup":
      "Formato inválido. Envie um arquivo backup.json.",

    "game.add": "Adicionar Jogo",
    "game.delete": "Excluir Jogo",
    "game.deleteWarning":
      "Excluir este jogo removerá todas as sessões relacionadas e reindexará os jogos restantes. Isso não pode ser desfeito.",
    "game.cancel": "Cancelar",
    "game.save": "Salvar",
    "game.edit": "Editar Jogo",
    "game.noGames": "Nenhum jogo adicionado ainda.",
    "game.category": "Categoria",
    "game.id": "ID do Jogo",
    "game.name": "Nome",
    "game.unknown": "Desconhecido",
    "game.manager": "Gerenciador de Jogos",
    "game.duplicateId": "Este ID de Jogo já está na sua lista.",
    "sessions.timeline": "Visão da Linha do Tempo",
    "sessions.edit": "Editar Sessão",
    "sessions.overlap": "Sobreposição Detectada!",
    "sessions.noGamesAvailable": "Nenhum jogo disponível",
    "sessions.duration": "Duração (minutos)",
    "sessions.time": "Hora",
    "sessions.date": "Data",
    "sessions.game": "Jogo",
    "tools.hub.title": "Ferramentas do Sistema",
    "tools.hub.subtitle": "Gerencie seus dados do GameDiary PSP com precisão.",
    "tools.dbMerge.title": "Mesclar Banco de Dados",
    "tools.dbMerge.subtitle": "Combine múltiplos bancos de dados facilmente",
    "dbMerge.addDataset": "Adicionar Conjunto",
    "dbMerge.mergeAndDownload": "Mesclar e Baixar",
    "dbMerge.datasetList": "Conjuntos para Mesclar",
    "dbMerge.noDatasets":
      "Nenhum conjunto adicionado. Adicione pelo menos dois para mesclar.",
    "dbMerge.games": "Jogos",
    "dbMerge.sessions": "Sessões",
    "dbMerge.errorParsing": "Erro ao ler conjunto. Arquivos inválidos.",
    "dbMerge.dropPrompt": "OU ARRASTE OS ARQUIVOS AQUI",
    "dbMerge.backToTools": "Voltar para Ferramentas",

    "download.title": "Obter GameDiary",
    "download.subtitle": "Acompanhe sua jornada gamer no PSP.",
    "download.latestVersion": "Última Versão",
    "download.releaseDate": "Data de Lançamento",
    "download.codename": "Codinome",
    "download.app.title": "App GameDiary",
    "download.app.desc":
      "O aplicativo principal para ver suas estatísticas e gerenciar seu diário.",
    "download.plugin.title": "Plugin GameDiary",
    "download.plugin.desc":
      "O plugin de fundo que registra seu tempo de jogo automaticamente.",
    "download.install.title": "Guia de Instalação",
    "download.install.app.step1": "Conecte seu PSP ao PC via USB.",
    "download.install.app.step2": "Copie a pasta GameDiary para PSP/GAME/.",
    "download.install.app.step3":
      "Inicie o GameDiary pelo menu de Jogos no seu PSP.",
    "download.install.plugin.step1":
      "Copie o arquivo GameDiary.prx para a pasta seplugins/ no seu cartão de memória.",
    "download.install.plugin.step2":
      'ARK-4: Adicione as linhas "psp, GameDiary.prx, on" e "ps1, GameDiary.prx, on" ao arquivo plugins.txt.',
    "download.install.plugin.step3":
      'PRO/ME: Adicione "ms0:/seplugins/GameDiary.prx 1" aos arquivos game.txt e pops.txt.',
    "download.install.plugin.step4":
      "Reinicie seu PSP ou recarregue seus plugins.",
    "download.requirements.title": "Requisitos",
    "download.requirements.cfw": "Custom Firmware (PRO, ME, ou ARK-4)",
    "download.requirements.storage":
      "Pelo menos 10MB de espaço livre no Memory Stick",
    "download.package.title": "Pacote Completo GameDiary",
    "download.package.desc":
      "Inclui o App (EBOOT.PBP) e o Plugin (PRX) em um único arquivo ZIP.",
    "download.package.button": "Baixar",
    "download.package.appIncluded": "App incluso",
    "download.package.pluginIncluded": "Plugin incluso",
    "download.viewOnGithub": "Ver no GitHub",
  },
};
