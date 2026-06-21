export type ChangelogEntry = { it: string[]; en: string[] }

// Ordine: più recente in cima. Aggiungere una entry ad ogni nuova versione.
export const changelog: Record<string, ChangelogEntry> = {
  '0.8.0': {
    it: ['Schermata novità (questa schermata)', 'Fix aggiornamento app: pulizia cache completa'],
    en: ["What's new screen (this screen)", 'Fix app update: full cache cleanup'],
  },
  '0.7.5': {
    it: ['Fix icona app: cerchio quasi full-bleed come Telegram'],
    en: ['Fix app icon: circle almost full-bleed like Telegram'],
  },
  '0.7.4': {
    it: ['Fix illustrazioni tutorial aggiornate'],
    en: ['Fix updated tutorial illustrations'],
  },
  '0.7.3': {
    it: ['Fix toast spostati in basso', 'Fix status bar torna al colore di default'],
    en: ['Fix toasts moved to bottom', 'Fix status bar returns to default color'],
  },
  '0.7.2': {
    it: ['Fix tutorial: naviga alla home al termine', 'Fix tour parte sempre dallo step 1'],
    en: ['Fix tutorial: navigate to home on finish', 'Fix tour always starts from step 1'],
  },
  '0.7.1': {
    it: ['Lista: rimosse le checkbox', 'Lista: aggiungi pulsante elimina articolo'],
    en: ['List: removed checkboxes', 'List: add delete item button'],
  },
  '0.7.0': {
    it: [
      'Tessere fedeltà per supermercati (foto, export, modalità spesa)',
      'Tutorial: slides introduttive + tour guidato',
    ],
    en: [
      'Loyalty cards for supermarkets (photo, export, shopping mode)',
      'Tutorial: intro slides + guided tour',
    ],
  },
  '0.6.4': {
    it: [
      'Sync git bidirezionale con rilevamento conflitti',
      'Export/import database come JSON',
    ],
    en: [
      'Bidirectional git sync with conflict detection',
      'Export/import database as JSON',
    ],
  },
}
