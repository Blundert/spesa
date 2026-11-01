export type ChangelogEntry = { it: string[]; en: string[] }

// Ordine: più recente in cima. Aggiungere una entry ad ogni nuova versione.
export const changelog: Record<string, ChangelogEntry> = {
  '0.40.0': {
    it: [
      'Versione desktop completa: tutte le pagine dell\'app sono ora disponibili anche su schermo largo (Lista, Pasti, Spesa in corso, Storico e dettaglio spesa, Liste, Catalogo, Piatti, Supermercati, Novità e Impostazioni complete di sincronizzazione GitHub), con il pulsante "Inizia la spesa" nel menu laterale',
      'Tabelle ordinabili: clicca sull\'intestazione di una colonna per ordinare, di nuovo per invertire. Nel Catalogo puoi ordinare per nome, categoria e prezzo',
      'Le date mostrano anche l\'anno, e le settimane nei grafici pure',
      'Statistiche e Dashboard a colori; nella Dashboard i supermercati mostrano l\'importo in euro',
    ],
    en: [
      'Complete desktop version: every page of the app is now available on wide screens too (List, Meals, Shopping in progress, History and trip details, Lists, Catalogue, Dishes, Supermarkets, What\'s new and full Settings including GitHub sync), with the "Start shopping" button in the side menu',
      'Sortable tables: click a column header to sort, click again to reverse. In the Catalogue you can sort by name, category and price',
      'Dates now show the year too, and so do the weeks in the charts',
      'Statistics and Dashboard in colour; on the Dashboard supermarkets show the amount in euros',
    ],
  },
  '0.39.0': {
    it: [
      'Versione desktop: aprendo l\'app su uno schermo largo (da 768 px) trovi un\'interfaccia dedicata con menu laterale fisso. Su telefono non cambia nulla',
      'Dashboard con totale speso, sessioni, spesa media, andamento settimanale, categorie e supermercati, su 4 settimane, 12 settimane, 6 mesi, 1 anno o tutto lo storico',
      'Statistiche avanzate: spese per giorno della settimana, copertura dei buoni pasto, evoluzione delle categorie e dettaglio per supermercato',
      'Catalogo, Storico (con filtri per supermercato e date) e Impostazioni (lingua, valore del buono, inizio settimana, backup) anche su desktop',
    ],
    en: [
      'Desktop version: opening the app on a wide screen (768 px and up) gives you a dedicated interface with a fixed side menu. Nothing changes on phones',
      'Dashboard with total spent, trips, average spend, weekly trend, categories and supermarkets, over 4 weeks, 12 weeks, 6 months, 1 year or all history',
      'Advanced statistics: trips by day of the week, meal voucher coverage, category evolution and per-supermarket details',
      'Catalogue, History (with supermarket and date filters) and Settings (language, voucher value, week start, backup) on desktop too',
    ],
  },
  '0.38.2': {
    it: ['Ordine alfabetico ovunque: categorie e prodotti dentro ogni categoria in Lista, in corsia durante la spesa e nel Catalogo'],
    en: ['Alphabetical order everywhere: categories and the items inside each one in the List, in the aisle while shopping and in the Catalogue'],
  },
  '0.38.1': {
    it: ['iPhone: lo scroll non dovrebbe più bloccarsi dopo essere arrivati in cima o in fondo a una pagina (prima ripartiva solo con un tap)'],
    en: ['iPhone: scrolling should no longer get stuck after reaching the top or bottom of a page (before, it only came back after a tap)'],
  },
  '0.38.0': {
    it: [
      'Tastierino calcolatrice: quando inserisci un prezzo tocca ±×÷ in alto a sinistra per fare i conti con + − × ÷, parentesi e % (es. "4,50 − 30%" = 3,15). Il risultato si aggiorna mentre scrivi, e 123 torna al tastierino di sempre',
      'L\'app ricorda la modalità che hai usato l\'ultima volta; la calcolatrice c\'è ovunque si inserisce un importo (carrello, fine spesa, Storico)',
    ],
    en: [
      'Calculator keypad: when entering a price, tap ±×÷ at the top left to do the maths with + − × ÷, brackets and % (e.g. "4.50 − 30%" = 3.15). The result updates as you type, and 123 brings back the usual keypad',
      'The app remembers the mode you used last; the calculator is available wherever you enter an amount (cart, end of shopping, History)',
    ],
  },
  '0.37.0': {
    it: [
      'Più liste della spesa: sotto il titolo "Lista" trovi una scheda per ogni lista (la tua lista attuale si chiama "Spesa"). Tocca + per crearne una, ritocca quella attiva (con ⌄) per rinominarla, darle un supermercato o archiviarla',
      'Ogni lista ha la sua "spesa solita" e lo stesso prodotto può stare in più liste: finita la spesa esce solo dalla lista usata',
      'Nuova spesa: nel pannello della pill scegli la lista (parte da quella aperta). Se la lista ha un supermercato la spesa parte subito lì, altrimenti lo scegli come prima',
      'Pasti: con più liste, "Importa piatti e vai alla lista" ti chiede in quale lista mettere gli ingredienti',
      'Nuova pagina "Liste" nel menu (Gestisci): ordine delle schede, liste archiviate da ripristinare o eliminare definitivamente',
      'Il nome della lista compare in corsia, nello Storico e nel riepilogo della settimana',
    ],
    en: [
      'Multiple shopping lists: under the "List" title there is a tab for each list (your current list is called "Spesa"). Tap + to create one, tap the active one again (marked ⌄) to rename it, give it a supermarket or archive it',
      'Each list has its own "usual shopping", and the same item can be in more than one list: after a trip it only leaves the list you used',
      'New shopping: choose the list in the pill sheet (it starts from the open one). If the list has a supermarket the trip starts right there, otherwise you pick it as before',
      'Meals: with more than one list, "Import dishes and go to list" asks which list the ingredients go to',
      'New "Lists" page in the menu (Manage): tab order, and archived lists to restore or delete for good',
      'The list name shows in the aisle, in History and in the week summary',
    ],
  },
  '0.36.1': {
    it: ['Pasti: il link in alto a destra si chiama ora "Settimane" (prima "Storico", che si confondeva con lo Storico delle spese) e apre "Settimane pianificate"'],
    en: ['Meals: the top-right link is now called "Weeks" (it was "History", easy to confuse with the shopping history) and opens "Planned weeks"'],
  },
  '0.36.0': {
    it: [
      'Navigazione ripensata: l\'app si apre sulla Lista e in alto tocchi "Pasti" per passare alla pianificazione della settimana (e "Lista" per tornare)',
      'La barra in basso apre il riepilogo della settimana (di tasca tua, speso, buoni spesi e rimanenti, ultime spese) insieme a "Nuova spesa"; la schermata "La mia settimana" non c\'è più',
      'Menu diviso in "Le tue spese" (Storico, Statistiche), "Gestisci" (Catalogo, Piatti, Supermercati) e Impostazioni; le sue pagine hanno la freccia ‹ che riporta a Lista o Pasti',
      'La barra in basso è ora visibile ovunque, tranne durante la spesa; i cambi pagina sono animati',
      'Tutorial e tour aggiornati alla nuova navigazione, incluso come iniziare una spesa',
    ],
    en: [
      'Redesigned navigation: the app opens on the List, and tapping "Meals" at the top switches to weekly meal planning (tap "List" to go back)',
      'The bottom bar opens the week summary (out of pocket, spent, vouchers used and remaining, latest trips) together with "New shopping"; the "My week" screen is gone',
      'The menu is split into "Your spending" (History, Statistics), "Manage" (Catalog, Dishes, Supermarkets) and Settings; its pages have a ‹ arrow back to List or Meals',
      'The bottom bar now shows everywhere except during a shopping trip; page changes are animated',
      'Intro and tour updated for the new navigation, including how to start shopping',
    ],
  },
  '0.35.0': {
    it: ['Statistiche: nuova sezione "Buoni pasto e di tasca tua" con quanto del totale speso è stato coperto dai buoni e quanto hai pagato tu, in euro e in percentuale, più il numero di buoni usati nel periodo'],
    en: ['Statistics: new "Meal vouchers and out of pocket" section showing how much of the total was covered by vouchers and how much you paid yourself, in euros and percent, plus the number of vouchers used in the period'],
  },
  '0.34.0': {
    it: ['Storico: in fondo a ogni spesa vedi i buoni pasto usati (e quanto hanno coperto) e quanto hai pagato di tasca tua'],
    en: ['History: at the bottom of each trip you now see the meal vouchers used (and how much they covered) and how much you paid out of pocket'],
  },
  '0.33.0': {
    it: ['Storico: per ogni spesa confermata vedi anche il totale calcolato dagli oggetti ("calc. €…") e lo scarto in percentuale dello scontrino: arancione se hai pagato di più, verde se di meno'],
    en: ['History: each confirmed trip now also shows the total computed from its items ("calc. €…") and how much the receipt differs in percent: orange if you paid more, green if less'],
  },
  '0.32.0': {
    it: ['Lista: nuovo bottone "Svuota" in alto per togliere tutti gli oggetti in un colpo (con conferma). Catalogo e prezzi restano'],
    en: ['List: new "Clear" button at the top to remove all items at once (with confirmation). Catalog and prices are kept'],
  },
  '0.31.1': {
    it: ['La barra di stato in alto resta sempre chiara; quando si apre un menu dal basso, lo sfondo scurito ha gli angoli superiori arrotondati, paralleli a quelli del menu'],
    en: ['The status bar at the top now always stays light; when a bottom sheet opens, the dimmed background has rounded top corners, parallel to the sheet\'s'],
  },
  '0.31.0': {
    it: ['Spesa → "Aggiungi fuori lista": nel tastierino c\'è ora "Aggiungi senza prezzo". L\'oggetto finisce tra quelli da prendere e il prezzo lo inserisci dopo, toccandolo'],
    en: ['Shopping → "Add off-list item": the keypad now has "Add without price". The item goes to the ones to pick up and you enter the price later by tapping it'],
  },
  '0.30.0': {
    it: ['Impostazioni → Buoni pasto: scegli il valore predefinito di un buono, proposto ogni volta che inizi una nuova spesa (prima era sempre €8,00)'],
    en: ['Settings → Meal vouchers: choose the default value of a voucher, suggested every time you start a new shopping trip (it used to be always €8.00)'],
  },
  '0.29.6': {
    it: ['Pasti: il bottone "Salva" non compare più (disabilitato) mentre scrivi il nome del piatto, ma solo dopo aver scelto un piatto o toccato "Crea piatto"'],
    en: ['Meals: the "Save" button no longer shows (disabled) while you type the dish name; it appears only after picking a dish or tapping "Create dish"'],
  },
  '0.29.5': {
    it: ["Fix: secondo tentativo per la barra di stato in alto su iPhone: deve scurirsi quando si apre un menu dal basso e tornare chiara quando lo chiudi (la 0.29.3 la lasciava sempre chiara)"],
    en: ['Fix: second attempt at the iPhone status bar color: it should darken when a bottom sheet opens and turn light again when you close it (0.29.3 left it always light)'],
  },
  '0.29.4': {
    it: ['Fix: su iPhone toccare un campo di testo (es. "Aggiungi un ingrediente") non fa più zoom sulla pagina'],
    en: ['Fix: on iPhone, tapping a text field (e.g. "Add an ingredient") no longer zooms the page'],
  },
  '0.29.3': {
    it: ["Fix: il colore della barra di stato in alto (ora, batteria) segue sempre l'app: si scurisce quando si apre un menu dal basso e torna chiaro quando lo chiudi"],
    en: ['Fix: the status bar color at the top (time, battery) now always matches the app: it darkens when a bottom sheet opens and turns light again when you close it'],
  },
  '0.29.2': {
    it: ['Fix: su iOS, aprendo un menu dal basso con campo di testo (es. Pasti → slot vuoto), la vista non diventa più bianca: il campo si attiva solo quando il menu ha finito di aprirsi. Se la tastiera non compare da sola, tocca il campo'],
    en: ['Fix: on iOS, opening a bottom sheet with a text field (e.g. Meals → empty slot) no longer turns the view white: the field is focused only once the sheet has finished opening. If the keyboard does not appear on its own, tap the field'],
  },
  '0.29.1': {
    it: ['Fix: su iOS i menu dal basso con campo di testo (es. nome piatto nei Pasti) restano fermi quando si apre la tastiera, senza più diventare una schermata bianca'],
    en: ['Fix: on iOS, bottom sheets with a text field (e.g. dish name in Meals) stay put when the keyboard opens, no longer turning into a blank white screen'],
  },
  '0.29.0': {
    it: ['Buoni pasto modificabili: tocca "N buoni" durante la spesa o nel dettaglio di una spesa dello Storico per cambiare numero e valore dei buoni usati'],
    en: ['Editable meal vouchers: tap "N vouchers" while shopping or in a past session\'s detail to change how many vouchers you used and their value'],
  },
  '0.28.2': {
    it: ['Fix: i menu dal basso con campo di testo (aggiungi categoria/articolo/supermercato, piatti, pasti, range date) si aprono quasi a schermo intero per evitare glitch con la tastiera su iOS'],
    en: ['Fix: bottom sheets with a text field (add category/item/store, dishes, meals, date range) now open near full-screen to avoid keyboard glitches on iOS'],
  },
  '0.28.1': {
    it: ['Fix: rinominare una categoria si riflette ora ovunque (prima la Lista e le Statistiche ignoravano la rinomina per le categorie predefinite come Frigo o Dispensa)'],
    en: ['Fix: renaming a category is now reflected everywhere (previously the List and Statistics screens ignored renames for built-in categories like Fridge or Pantry)'],
  },
  '0.28.0': {
    it: ['Statistiche: il range personalizzato ora è un vero intervallo di date (da / a), con scorciatoia "Mese corrente"'],
    en: ['Statistics: the custom range is now a real date interval (from / to), with a "Current month" shortcut'],
  },
  '0.27.0': {
    it: ['Spesa: "Aggiungi fuori lista" mostra ora suggerimenti dal catalogo mentre digiti, per evitare di creare doppioni'],
    en: ['Shopping: "Add off-list" now shows catalog suggestions as you type, to avoid creating duplicate items'],
  },
  '0.26.0': {
    it: ['Pianificazione pasti: nuovo bottone "Importa piatti e vai alla lista" — aggiunge gli ingredienti selezionati nei pasti della settimana alla lista della spesa, unendo le quantità dei duplicati'],
    en: ['Meal planning: new "Import dishes and go to list" button — adds the ingredients selected for the week\'s meals to the shopping list, merging quantities for duplicates'],
  },
  '0.25.0': {
    it: ['Pianificazione pasti: tocca un pasto per scegliere un piatto salvato (o crearne uno al volo) e spuntare gli ingredienti che ti servono davvero'],
    en: ['Meal planning: tap a meal to pick a saved dish (or create one on the fly) and check off the ingredients you actually need'],
  },
  '0.24.0': {
    it: ['Nuova schermata "Piatti": salva i tuoi piatti con gli ingredienti necessari, per non doverli riscrivere ogni volta'],
    en: ['New "Dishes" screen: save your dishes with their ingredients, so you don\'t have to rewrite them every time'],
  },
  '0.23.0': {
    it: ['App: aggiornamento automatico alla nuova versione al resume dell\'app, con notifica del cambio versione (tap per vedere le novità)'],
    en: ['App: app now updates automatically on resume to the latest version, with a notification of the version change (tap to see what\'s new)'],
  },
  '0.22.0': {
    it: ['Storico: modifica il totale di una spesa conclusa, con opzione per tornare al totale calcolato dagli articoli'],
    en: ['History: edit the total of a completed shopping session, with an option to revert to the total calculated from items'],
  },
  '0.21.1': {
    it: ['Fix: gli articoli non acquistati non vengono più cancellati dalla lista a fine spesa'],
    en: ['Fix: unpurchased items are no longer removed from the list when finishing a shopping trip'],
  },
  '0.21.0': {
    it: ['Statistiche: selettore range di date (7 giorni, 30 giorni, 3 mesi, 6 mesi, tutto, giorni personalizzati) — default 30 giorni'],
    en: ['Statistics: date range selector (7 days, 30 days, 3 months, 6 months, all, custom days) — default 30 days'],
  },
  '0.20.6': {
    it: ['Fix: le statistiche si aggiornano subito dopo rinomina/sposta/elimina articoli o categorie nel Catalogo'],
    en: ['Fix: statistics now update immediately after renaming, moving or deleting items or categories in the Catalog'],
  },
  '0.20.5': {
    it: ['Fix: grafico andamento non mostra le settimane iniziali vuote'],
    en: ['Fix: weekly trend chart no longer shows leading empty weeks'],
  },
  '0.20.4': {
    it: ['Fix: grafico andamento usa il giorno di inizio settimana attuale per posizionare correttamente le sessioni passate'],
    en: ['Fix: weekly trend chart now uses the current week start day to correctly place past sessions'],
  },
  '0.20.3': {
    it: ['Fix: grafico andamento settimanale mostra l\'importo sopra ogni barra e la data come giorno/mese'],
    en: ['Fix: weekly trend chart now shows the amount above each bar and the date as day/month'],
  },
  '0.20.2': {
    it: ['Fix: modifica data nello storico ora funziona su iOS e Android'],
    en: ['Fix: date editing in session history now works on iOS and Android'],
  },
  '0.20.1': {
    it: ['Fix: sessione non completata ora concludibile dallo storico; badge visivo per sessioni non completate; lista svuotata automaticamente alla conclusione'],
    en: ['Fix: abandoned sessions can now be finished from history; visual badge for incomplete sessions; list cleared automatically on finish'],
  },
  '0.20.0': {
    it: ['Storico: modifica data, supermercato e prezzo/quantità di ogni voce direttamente dalla schermata di dettaglio'],
    en: ['History: edit date, supermarket and price/quantity of each item directly from the session detail screen'],
  },
  '0.19.0': {
    it: ['Nuova schermata Statistiche: totali, andamento settimanale, articoli più acquistati e ripartizione per categoria'],
    en: ['New Statistics screen: totals, weekly trend, top items and category breakdown'],
  },
  '0.18.0': {
    it: ['Lista: "Carica la tua spesa solita" — aggiunge in un tap gli articoli che acquisti più spesso'],
    en: ['List: "Load your usual shopping" — adds your most-purchased items in one tap'],
  },
  '0.17.0': {
    it: ['Lista: stepper − / + per modificare la quantità di ogni articolo direttamente dalla lista'],
    en: ['List: − / + stepper to change item quantity directly from the list'],
  },
  '0.16.0': {
    it: ['Spesa: indicatore variazione prezzo rispetto all\'ultima volta durante l\'inserimento'],
    en: ['Shopping: price change indicator vs last purchase while entering a price'],
  },
  '0.15.0': {
    it: ['Lista: i suggerimenti rapidi mostrano ora i prodotti che compri di più'],
    en: ['List: quick suggestions now show your most purchased items first'],
  },
  '0.14.6': {
    it: ['Fix: categorie in ordine alfabetico nel Catalogo, nella Lista e nella Spesa'],
    en: ['Fix: categories now sorted alphabetically in Catalog, List and Shopping'],
  },
  '0.14.5': {
    it: ['Fix: categorie custom (es. Cosmesi, Colazione) mostrate correttamente nella Lista e nella Spesa invece di "Altro"'],
    en: ['Fix: custom categories (e.g. Cosmesi, Colazione) now shown correctly in List and Shopping instead of "Other"'],
  },
  '0.14.4': {
    it: ['Fix: Lista e categorie sempre aggiornate subito dopo modifiche dal Catalogo o dalla Spesa'],
    en: ['Fix: List and categories always update immediately after changes from Catalog or Shopping'],
  },
  '0.14.3': {
    it: ['Fix: spostando un articolo di categoria nel Catalogo, la Lista si aggiorna subito senza mostrare la vecchia categoria'],
    en: ['Fix: moving an item to a different category in the Catalog now immediately updates the List without showing the old category'],
  },
  '0.14.2': {
    it: ['Fix: icona app su iOS home screen senza bordo bianco'],
    en: ['Fix: app icon on iOS home screen no longer has a white border'],
  },
  '0.14.1': {
    it: ['Fix: splash screen e icone tutte con sfondo beige'],
    en: ['Fix: splash screen and all icons now use the beige background'],
  },
  '0.14.0': {
    it: ['Storico pianificazioni: elimina una settimana pianificata'],
    en: ['Planning history: delete a planned week'],
  },
  '0.13.1': {
    it: ['Fix: icona app ripristinata con sfondo bianco e carrello scuro'],
    en: ['Fix: app icon restored with white background and dark cart'],
  },
  '0.13.0': {
    it: ['Storico: elimina una settimana intera con tutte le sessioni di spesa collegate'],
    en: ['History: delete an entire week including all its shopping sessions'],
  },
  '0.12.0': {
    it: [
      'La pianificazione pasti inizia dal giorno di inizio settimana configurato',
      'Il giorno di inizio settimana è incluso nell\'export/import del backup',
    ],
    en: [
      'Meal planning starts from the configured week start day',
      'The week start day setting is included in backup export/import',
    ],
  },
  '0.11.1': {
    it: ['Fix: rimosso il padding bianco dall\'icona app (apple-touch-icon)'],
    en: ['Fix: removed white padding from the app icon (apple-touch-icon)'],
  },
  '0.11.0': {
    it: ['Impostazioni: scegli il giorno di inizio settimana (default lunedì)'],
    en: ['Settings: choose the week start day (default Monday)'],
  },
  '0.10.5': {
    it: ['Fix UX Catalogo: rinomina e cambia categoria articolo sono ora due azioni separate'],
    en: ['Fix UX Catalog: rename and change category for items are now two separate actions'],
  },
  '0.10.4': {
    it: ['Fix: migrazione automatica azzera prezzi stimati su articoli senza acquisti'],
    en: ['Fix: automatic migration clears stale estimated prices on items with no purchases'],
  },
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
