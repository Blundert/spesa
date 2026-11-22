export type ChangelogEntry = { it: string[]; en: string[] }

// Ordine: più recente in cima. Aggiungere una entry ad ogni nuova versione.
export const changelog: Record<string, ChangelogEntry> = {
  '1.2.0': {
    it: [
      'Sincronizzazione più corta: la cronologia delle versioni (con il ripristino e, su desktop, il grafo dei commit) è ora in una pagina a parte, "Cronologia e ripristino", e non devi più scorrere tanto per arrivare alla guida',
    ],
    en: [
      'Shorter Sync page: the version history (with restore and, on desktop, the commit graph) now lives on its own page, "History and restore", so you no longer have to scroll a lot to reach the guide',
    ],
  },
  '1.1.4': {
    it: [
      'Liste condivise: risolto "Un altro stava modificando la lista: riprova tra poco" che usciva subito dopo aver condiviso una lista anche senza aver invitato nessuno. Due sincronizzazioni partivano insieme e GitHub rifiutava la seconda; ora ce n\'è una sola alla volta e tra un tentativo e l\'altro c\'è una piccola pausa',
      'Se la prima scrittura non riesce, la lista resta condivisa e finisce da sola invece di tornare indietro. Se un tentativo precedente aveva lasciato un repository vuoto con lo stesso nome, lo riusa invece di dire "esiste già"',
    ],
    en: [
      'Shared lists: fixed "Someone else was editing the list: try again shortly" showing up right after sharing a list even with nobody invited. Two syncs started together and GitHub rejected the second; now there is only one at a time and a short pause between attempts',
      'If the first write fails, the list stays shared and finishes on its own instead of being undone. If an earlier attempt left an empty repository with the same name, it is reused instead of saying "already exists"',
    ],
  },
  '1.1.3': {
    it: [
      'Collega GitHub su iPhone e iPad: dove il browser non lascia leggere gli appunti (iOS) c\'è ora un campo dove incollare il token con il tocco prolungato; viene controllato e salvato da solo',
    ],
    en: [
      'Connect GitHub on iPhone and iPad: where the browser does not allow reading the clipboard (iOS) there is now a field to paste the token into with a long press; it is checked and saved on its own',
    ],
  },
  '1.1.2': {
    it: [
      'Liste condivise: se il token GitHub l\'avevi già inserito a mano, "Condividi con altre persone" non ti chiede più di collegare GitHub. L\'app ricava da sola il tuo nome utente e lo ricorda',
    ],
    en: [
      'Shared lists: if you had already entered the GitHub token by hand, "Share with other people" no longer asks you to connect GitHub. The app works out your username on its own and remembers it',
    ],
  },
  '1.1.1': {
    it: [
      'Sincronizzazione: risolto il "Confronta e unisci" che compariva di continuo senza niente da gestire. Succedeva con le liste condivise, perché i dati degli altri arrivano su ogni dispositivo per conto suo. Ora, se il contenuto è lo stesso, non ti viene chiesto niente',
      'Il backup personale non contiene più le voci delle liste condivise né le spese degli altri: vengono dal repository della lista e tornano da sole alla prima sincronizzazione',
    ],
    en: [
      'Sync: fixed the "Compare and merge" prompt that kept showing up with nothing to handle. It happened with shared lists, because other people\'s data reaches each device on its own. Now, if the content is the same, you are not asked anything',
      'The personal backup no longer contains the items of shared lists nor other people\'s shopping: they come from the list repository and return on their own at the first sync',
    ],
  },
  '1.1.0': {
    it: [
      'Liste condivise: puoi condividere una lista con altre persone. Dalla scheda di modifica della lista tocchi "Condividi con altre persone": l\'app crea su GitHub un repository privato solo per quella lista e, se vuoi, invita subito qualcuno (può modificare oppure solo guardare)',
      'Chi riceve l\'invito lo accetta direttamente nell\'app, da "Nuova lista" → "Aggiungi una lista condivisa", senza passare da GitHub. Le liste condivise hanno una piccola icona di persone',
      'Sempre aggiornate: con la lista aperta le modifiche partono dopo pochi secondi e quelle degli altri arrivano da sole in circa 15 secondi, senza schermate di conflitto. Funziona anche senza rete: le modifiche partono quando torna',
      'In negozio vedi cosa hanno già preso gli altri ("preso da Anna") e loro vedono cosa hai preso tu',
      'Persone: a ognuno dai un nome e dici se è un partner (buoni pasto in comune: le sue spese contano nel tuo budget) o un estraneo (le sue spese si vedono nello Storico ma non toccano budget, buoni e statistiche)',
      'Collega GitHub in pochi tocchi: crei il token da un link già compilato, lo incolli con un tocco e scegli il repository da un elenco. Nuovo pulsante "Dimentica il token su questo dispositivo"',
      'Più sicurezza: la versione pubblicata ammette solo script suoi e parla in rete soltanto con GitHub; le liste condivise sono lette con controlli rigidi. Il vecchio mockup di design non è più pubblicato',
    ],
    en: [
      'Shared lists: you can share a list with other people. From the list edit sheet tap "Share with other people": the app creates a private GitHub repository just for that list and, if you like, invites someone right away (can edit or view only)',
      'Whoever gets the invitation accepts it right in the app, from "New list" → "Add a shared list", without going through GitHub. Shared lists have a small people icon',
      'Always up to date: with the list open your changes go out after a few seconds and other people\'s arrive on their own in about 15 seconds, with no conflict screens. It also works offline: changes go out when the network is back',
      'In the shop you see what the others have already taken ("taken by Anna") and they see what you took',
      'People: give each one a name and say whether they are a partner (shared meal vouchers: their shopping counts in your budget) or a stranger (their shopping shows in History but never touches budget, vouchers and statistics)',
      'Connect GitHub in a few taps: create the token from a pre-filled link, paste it with one tap and pick the repository from a list. New "Forget the token on this device" button',
      'Safer: the published app only allows its own scripts and talks to the network only with GitHub; shared lists are read with strict checks. The old design mockup is no longer published',
    ],
  },
  '1.0.0': {
    it: [
      'Prima versione stabile: sincronizzazione GitHub con cronologia, ripristino, unione guidata, branch e grafo dei commit',
      'Più sicurezza: l\'app pubblicata ammette solo script suoi e parla in rete soltanto con GitHub, così un token rubato non può essere spedito altrove. Il vecchio mockup di design non è più pubblicato',
      'Sincronizzazione: nuovo pulsante "Dimentica il token su questo dispositivo", per togliere il token senza toccare repository e file',
    ],
    en: [
      'First stable release: GitHub sync with history, restore, guided merge, branches and the commit graph',
      'Safer: the published app only allows its own scripts and talks to the network only with GitHub, so a stolen token cannot be sent elsewhere. The old design mockup is no longer published',
      'Sync: new "Forget the token on this device" button, to remove the token without touching the repository or the file',
    ],
  },
  '0.49.0': {
    it: [
      'Desktop, pagina Sincronizzazione: nuovo "Grafo dei commit", con tutti i branch e le loro versioni disegnati come in git (corsie colorate, unioni, branch in punta). Toccando un commit vedi cosa ha cambiato, con prima e dopo affiancati, rispetto al commit precedente o ai dati di adesso',
      'Dal dettaglio di un commit puoi anche ripristinarlo, con le stesse protezioni di sempre (backup prima, un solo nuovo commit). Solo su desktop: sul telefono restano l\'elenco della cronologia e il confronto per tabella',
    ],
    en: [
      'Desktop, Sync page: new "Commit graph", with all branches and their versions drawn as in git (coloured lanes, merges, branch tips). Tap a commit to see what it changed, with before and after side by side, compared with the previous commit or with your data now',
      'From a commit\'s detail you can also restore it, with the usual protections (backup first, a single new commit). Desktop only: on the phone you keep the history list and the per-table comparison',
    ],
  },
  '0.48.0': {
    it: [
      'Branch: nella pagina Sincronizzazione c\'è ora la sezione "Branch" per provare una versione dei dati senza perdere le altre. "Crea da qui" crea un branch dai dati di adesso; "Passa a" sostituisce i dati di questo dispositivo con quelli di un altro branch e da lì il sync lavora su di lui; "Unisci qui" porta il contenuto di un altro branch in quello attivo con la schermata di unione',
      'Prima di passare a un altro branch, i dati non ancora sincronizzati vengono salvati in backups/ sul branch che lasci (se il salvataggio non riesce non cambia niente) e se ne tiene una copia anche sul dispositivo',
      'La guida di Sincronizzazione ha una nuova voce sui branch',
    ],
    en: [
      'Branches: the Sync page now has a "Branches" section to try a version of your data without losing the others. "Create from here" makes a branch from your current data; "Switch to" replaces this device\'s data with another branch\'s and sync then works on it; "Merge here" brings another branch\'s content into the active one using the merge screen',
      'Before switching to another branch, data that is not synced yet is saved under backups/ on the branch you leave (if saving fails nothing changes) and a copy is also kept on the device',
      'The Sync guide has a new entry about branches',
    ],
  },
  '0.47.0': {
    it: [
      'Conflitti di sincronizzazione: invece di due soli pulsanti ("Mantieni" / "Usa remoto"), l\'avviso ti porta a una schermata di unione. Le differenze sono raggruppate per settimana e per elemento (articoli, negozi, liste, piatti): di partenza si tiene tutto, quindi non si perde niente, e per ogni gruppo puoi scegliere cosa tenere (per le settimane presenti da entrambe le parti c\'è anche "Unione")',
      'Scorciatoie "Tieni tutto", "Tutto locale" e "Tutto remoto", e il risultato in anteprima, su questo dispositivo e nel repository, prima di applicare. Applicando, i due lati diventano uguali con un solo commit, dopo aver salvato in backups/ una copia di entrambe le versioni',
      'L\'unione si apre anche quando vuoi, dal pulsante "Confronta e unisci" nella pagina Sincronizzazione. Le statistiche degli articoli (ultimo prezzo, prezzo medio, quantità) vengono ricalcolate dagli acquisti',
    ],
    en: [
      'Sync conflicts: instead of just two buttons ("Keep" / "Use remote"), the notice takes you to a merge screen. Differences are grouped by week and by element (items, stores, lists, dishes): by default everything is kept, so nothing is lost, and for each group you choose what to keep (for weeks present on both sides there is also "Merge")',
      'Shortcuts "Keep everything", "All local" and "All remote", and a preview of the result, on this device and in the repository, before applying. Applying makes both sides equal with a single commit, after saving a copy of both versions in backups/',
      'You can also open the merge whenever you like, from the "Compare and merge" button on the Sync page. Item stats (last price, average price, quantity) are recalculated from the purchases',
    ],
  },
  '0.46.0': {
    it: [
      'Nuova pagina "Sincronizzazione" (menu → Gestisci, e nella barra laterale su desktop): ci sono ora il collegamento a GitHub, "Sincronizza ora", "Scarica da remoto" e il sync automatico, che prima stavano in Impostazioni (dove resta un link)',
      'Cronologia: elenca le versioni sincronizzate nel repository, i backup salvati in backups/ e le copie di sicurezza di questo dispositivo. Toccandone una vedi cosa cambierebbe rispetto ai dati di adesso (cosa si aggiungerebbe, sparirebbe o cambierebbe, con l\'elenco delle spese) e puoi ripristinarla',
      'Il ripristino non riscrive la cronologia: aggiunge una nuova versione nel repository e, prima, salva una copia di quello che sostituisce. Se il salvataggio non riesce, i tuoi dati restano com\'erano',
      'Guida: una sezione con accordion, chiusi all\'inizio, che spiega cosa fa ogni pulsante e ogni flusso di sincronizzazione',
    ],
    en: [
      'New "Sync" page (menu → Manage, and in the sidebar on desktop): it now holds the GitHub connection, "Sync now", "Pull from remote" and auto sync, which used to live in Settings (where a link remains)',
      'History: lists the synced versions in the repository, the backups saved in backups/ and the safety copies on this device. Tap one to see what would change compared with your data now (what would be added, disappear or change, with the list of trips) and restore it',
      'Restoring does not rewrite the history: it adds a new version to the repository and first saves a copy of what it replaces. If saving fails, your data stays as it was',
      'Guide: a section with accordions, closed at first, explaining what each button and each sync flow does',
    ],
  },
  '0.45.0': {
    it: ['Sincronizzazione su desktop: se attivi "Sync automatico" in Impostazioni, anche la versione desktop sincronizza da sola (all\'apertura, ogni 3 minuti e quando la finestra va in background), come già faceva il telefono. Prima sul desktop partiva solo dai pulsanti, e le modifiche fatte lì restavano indietro rispetto al telefono fino al conflitto successivo'],
    en: ['Sync on desktop: if you turn on "Auto sync" in Settings, the desktop version now syncs by itself too (on open, every 3 minutes and when the window goes to the background), as the phone already did. Before, on desktop it only ran from the buttons, so changes made there fell behind the phone until the next conflict'],
  },
  '0.44.0': {
    it: [
      'Sincronizzazione: quando scegli "Mantieni" o "Usa remoto" dopo un conflitto, l\'app salva nel repository GitHub, nella cartella backups/, una copia di quello che scarti, prima di sovrascriverlo. "Mantieni" fa un solo commit (dati nuovi + copia del remoto); "Usa remoto" salva prima la copia del tuo locale e solo se riesce scarica il remoto (se il salvataggio fallisce, i tuoi dati restano intatti)',
      'Anche "Scarica da remoto" in Impostazioni passa dalla stessa protezione. Prima di sostituire i dati con un sync o con un import da file, l\'app tiene anche una copia di sicurezza sul dispositivo (le ultime 10)',
      'Un dispositivo nuovo, con solo i dati iniziali, scarica direttamente il remoto invece di chiederti cosa tenere',
    ],
    en: [
      'Sync: when you pick "Keep this device" or "Use remote" after a conflict, the app saves a copy of what you discard in the GitHub repository, in the backups/ folder, before overwriting it. "Keep" makes a single commit (new data + copy of the remote); "Use remote" first saves a copy of your local data and only downloads the remote if that succeeds (if saving fails, your data stays untouched)',
      '"Pull from remote" in Settings goes through the same protection. Before replacing your data with a sync or a file import, the app also keeps a safety copy on the device (the last 10)',
      'A new device, holding only the initial data, downloads the remote directly instead of asking what to keep',
    ],
  },
  '0.43.3': {
    it: ['Impostazioni su desktop: le schede sono distribuite in due colonne di altezza simile (prima a sinistra ce n\'erano molte più che a destra); la Sincronizzazione GitHub, la più alta, occupa tutta la larghezza in fondo'],
    en: ['Settings on desktop: cards are spread across two columns of similar height (before, the left had many more than the right); GitHub sync, the tallest, spans the full width at the bottom'],
  },
  '0.43.2': {
    it: ['Impostazioni su desktop: le schede si dispongono a colonne senza spazi vuoti (due colonne al massimo, anche su schermi molto larghi) e i campioni dei temi stanno tutti su una riga, oppure 3 + 3'],
    en: ['Settings on desktop: cards now flow into columns with no gaps (two columns at most, even on very wide screens) and the theme swatches fit on one row, or 3 + 3'],
  },
  '0.43.1': {
    it: ['Impostazioni su desktop: tutte le schede, anche Lingua e Debug, hanno ora la stessa larghezza; prima una scheda rimasta sola in una riga si allargava a tutta la pagina'],
    en: ['Settings on desktop: all cards, Language and Debug included, now have the same width; before, a card left alone on a row stretched across the whole page'],
  },
  '0.43.0': {
    it: [
      'Temi: in Impostazioni → Aspetto puoi scegliere fra Chiaro (quello di sempre, invariato), Scuro, Salvia, Oceano, Notte blu e Contrasto alto. Cambiano colori di pagine, grafici e pulsanti, su telefono e su desktop',
      '"Segui il sistema" usa Chiaro di giorno e Scuro la sera, secondo il dispositivo; la scelta resta salvata',
    ],
    en: [
      'Themes: in Settings → Appearance you can pick Light (the usual one, unchanged), Dark, Sage, Ocean, Midnight blue and High contrast. They change the colours of pages, charts and buttons, on phone and desktop',
      '"Follow the system" uses Light by day and Dark at night, following your device; your choice is remembered',
    ],
  },
  '0.42.0': {
    it: [
      'Lista: per ogni lista puoi scegliere a mano i "Chip più proposti" (le scorciatoie sotto il campo di aggiunta) e la "Spesa solita". Dal pannello di modifica della lista passa da "Automatico" (come prima) a "Scelti da me" e spunta i prodotti del catalogo; i prodotti già in lista non vengono riproposti',
      'Vale sia su telefono sia su desktop e viaggia nei backup',
    ],
    en: [
      'List: for each list you can now hand-pick the "Suggested chips" (the shortcuts under the add field) and the "Usual shopping". In the list edit panel switch from "Automatic" (as before) to "My choice" and tick products from the catalogue; items already in the list are not suggested again',
      'Works on both phone and desktop and is included in backups',
    ],
  },
  '0.41.1': {
    it: ['Statistiche: con "7 giorni", "30 giorni", "3 mesi" o "6 mesi" la pagina restava bloccata sul caricamento. Ora si apre sempre e mostra i dati'],
    en: ['Statistics: with "7 days", "30 days", "3 months" or "6 months" the page got stuck on loading. It now always opens and shows the data'],
  },
  '0.41.0': {
    it: [
      'Desktop e mobile si scambiano al volo: ridimensionando la finestra l\'app passa da un\'interfaccia all\'altra senza ricaricare, restando sulla stessa pagina e con gli stessi dati',
      'Il menu laterale del desktop si può compattare (solo icone) con il pulsante in fondo; sotto i 1100 px si compatta da solo, e la scelta fatta a mano viene ricordata',
      'Layout più adatto alle larghezze vicine al telefono (da 768 px): spaziature ridotte, tabelle che scorrono di lato, griglia dei pasti che resta tutta visibile',
      'Un telefono in orizzontale resta sull\'interfaccia mobile',
    ],
    en: [
      'Desktop and mobile switch on the fly: resizing the window moves the app from one interface to the other without reloading, staying on the same page with the same data',
      'The desktop side menu can be collapsed (icons only) with the button at the bottom; below 1100 px it collapses by itself, and a manual choice is remembered',
      'Layout better suited to widths close to a phone (from 768 px): tighter spacing, tables that scroll sideways, a meals grid that stays fully visible',
      'A phone held sideways stays on the mobile interface',
    ],
  },
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
