export type ChangelogEntry = { it: string[]; en: string[] }

// Ordine: più recente in cima. Aggiungere una entry ad ogni nuova versione.
export const changelog: Record<string, ChangelogEntry> = {
  '0.10.3': {
    it: ['Fix: il prezzo stimato in lista non veniva azzerato dopo l\'eliminazione di una sessione di spesa'],
    en: ['Fix: estimated price in list was not cleared after deleting a shopping session'],
  },
  '0.10.2': {
    it: ['Fix bottom sheet: si sposta sopra la tastiera e diventa scorrevole quando la tastiera è aperta'],
    en: ['Fix bottom sheet: moves above keyboard and becomes scrollable when keyboard is open'],
  },
  '0.10.1': {
    it: ['Fix posizione titolo/bottone indietro: allineamento verticale uniforme su tutte le schermate'],
    en: ['Fix header position: consistent vertical alignment of title/back button across all screens'],
  },
  '0.10.0': {
    it: [
      'Nuova schermata Catalogo: gestisci categorie e articoli',
      'Aggiungi, rinomina ed elimina categorie personalizzate',
      'Rinomina, sposta di categoria o elimina articoli dal DB',
    ],
    en: [
      'New Catalog screen: manage categories and items',
      'Add, rename and delete custom categories',
      'Rename, move to another category or delete items from the database',
    ],
  },
  '0.9.0': {
    it: ['Test di unità con copertura 100% su money, date, budgetSelectors, normalize, debugFlag, imageUtils'],
    en: ['Unit tests with 100% coverage on money, date, budgetSelectors, normalize, debugFlag, imageUtils'],
  },
  '0.8.3': {
    it: ['Fix toast conflitto sync: pulsanti abbreviati per evitare testo verticale'],
    en: ['Fix sync conflict toast: shorter button labels to prevent vertical text'],
  },
  '0.8.2': {
    it: [
      'Fix dettaglio articolo: prezzo suggerito non si azzera rimuovendo un acquisto',
      'Fix aggiornamento cache storico prezzi dopo acquisto o rimozione',
    ],
    en: [
      'Fix item detail: suggested price now resets correctly when a purchase is removed',
      'Fix price history cache invalidation after purchase add or remove',
    ],
  },
  '0.8.1': {
    it: ['Fix toast di conflitto sync: testo non va a capo su ogni parola'],
    en: ['Fix sync conflict toast: text no longer wraps on every word'],
  },
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
