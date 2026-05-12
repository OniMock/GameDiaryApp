import type { LanguageFile } from "../types/language";

export const de: LanguageFile = {
  config: {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "de",
  },
  translations: {
    "nav.home": "Startseite",
    "nav.tools": "Tools",
    "nav.download": "Herunterladen",
    "home.getStarted": "Loslegen",
    "home.download": "Herunterladen",
    "welcome.subtitle": "Dein persönliches Spieltagebuch.",
    "tools.gameSessions.title": "Spiel-Sitzungen",
    "tools.gameSessions.subtitle": "Visueller Editor für backup.json",
    "actions.dataManagement": "Datenverwaltung",
    "game.add": "Spiel hinzufügen",
    "game.delete": "Spiel löschen",
    "game.deleteWarning":
      "Beim Löschen werden alle zugehörigen Sitzungen entfernt und die übrigen Spiele neu indexiert. Dies kann nicht rückgängig gemacht werden.",
    "game.cancel": "Abbrechen",
    "game.save": "Speichern",
    "game.edit": "Spiel bearbeiten",
    "game.noGames": "Noch keine Spiele vorhanden.",
    "game.category": "Kategorie",
    "game.id": "Spiel-ID",
    "game.name": "Name",
    "game.unknown": "Unbekannt",
    "game.manager": "Spielverwaltung",
    "game.duplicateId": "Diese Spiel-ID existiert bereits.",
    "game.search": "Spiele nach Name oder ID suchen...",
    "sessions.timeline": "Zeitachsenansicht",
    "sessions.edit": "Sitzung bearbeiten",
    "sessions.overlap": "Überschneidung erkannt!",
    "sessions.noGamesAvailable": "Keine Spiele verfügbar",
    "sessions.duration": "Dauer (Minuten)",
    "sessions.time": "Uhrzeit",
    "sessions.date": "Datum",
    "sessions.game": "Spiel",
    "tools.hub.title": "System-Tools",
    "tools.hub.subtitle": "Verwalte deine GameDiary-PSP-Daten präzise.",
    "tools.dbMerge.title": "Datenbank zusammenführen",
    "tools.dbMerge.subtitle": "Mehrere Datensätze einfach kombinieren",
    "dbMerge.addDataset": "Datensatz hinzufügen",
    "dbMerge.mergeAndDownload": "Zusammenführen & herunterladen",
    "dbMerge.datasetList": "Zu kombinierende Datensätze",
    "dbMerge.noDatasets":
      "Noch keine Datensätze hinzugefügt. Mindestens zwei erforderlich.",
    "dbMerge.games": "Spiele",
    "dbMerge.sessions": "Sitzungen",
    "dbMerge.errorParsing": "Fehler beim Verarbeiten der Daten.",
    "dbMerge.dropPrompt": "ODER HIER ABLEGEN",
    "dbMerge.backToTools": "Zurück zu Tools",

    "download.title": "GameDiary herunterladen",
    "download.subtitle": "Verfolge deine Gaming-Reise auf der PSP.",
    "download.latestVersion": "Neueste Version",
    "download.releaseDate": "Veröffentlichungsdatum",
    "download.codename": "Codename",
    "download.app.title": "GameDiary App",
    "download.app.desc": "Die Hauptanwendung zum Anzeigen von Statistiken.",
    "download.plugin.title": "GameDiary Plugin",
    "download.plugin.desc":
      "Hintergrund-Plugin zur automatischen Zeiterfassung.",
    "download.install.title": "Installationsanleitung",
    "download.install.app.step1": "Verbinde deine PSP per USB mit dem PC.",
    "download.install.app.step2":
      "Kopiere den GameDiary-Ordner nach PSP/GAME/.",
    "download.install.app.step3":
      "Starte GameDiary über das Spiel-Menü deiner PSP.",
    "download.install.plugin.step1":
      "Kopiere GameDiary.prx in den seplugins/-Ordner.",
    "download.install.plugin.step2":
      'ARK-4: Füge "psp, GameDiary.prx, on" und "ps1, GameDiary.prx, on" zu plugins.txt hinzu.',
    "download.install.plugin.step3":
      'PRO/ME: Füge "ms0:/seplugins/GameDiary.prx 1" zu game.txt und pops.txt hinzu.',
    "download.install.plugin.step4":
      "Starte deine PSP neu oder lade Plugins neu.",
    "download.requirements.title": "Anforderungen",
    "download.requirements.cfw": "Custom Firmware (PRO, ME oder ARK-4)",
    "download.requirements.storage":
      "Mindestens 10 MB freier Speicherplatz auf dem Memory Stick",
    "download.package.title": "GameDiary Gesamtpaket",
    "download.package.desc":
      "Enthält die App (EBOOT.PBP) und das Plugin (PRX) in einer ZIP-Datei.",
    "download.package.button": "Herunterladen",
    "download.package.appIncluded": "App enthalten",
    "download.package.pluginIncluded": "Plugin enthalten",
    "download.viewOnGithub": "Auf GitHub ansehen",
  },
};
