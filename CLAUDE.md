# App per la Spesa — Project Memory

## Descrizione

PWA personale per la gestione della spesa con budget basato sui buoni pasto.
Single-user, local-first, offline-first, senza login: tutti i dati vivono sul dispositivo.

## Design reference

Il mockup di riferimento si trova in `doc/handoff/app-per-la-spesa/project/Spesa.dc.html`.
In caso di incongruenze tra questo file e altre istruzioni, il mockup è sempre la fonte di
verità per il design visivo. Chiedere all'utente prima di deviare.

Palette colori dal mockup:
- `#2A2A2C` — foreground / dark primary
- `#F2F2F0` — background principale
- `#F6F6F4` — sfondo leggermente più scuro (card secondarie)
- `#9B9B9F` — testo muted / label
- `#B5B5BA` — testo molto muted (simbolo €, helper)
- `#ECECEC` / `#D8D8D6` — bordi separatori
- `#fff` — card bianche

Font: system font stack (`-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Hanken Grotesk', ...`)
Pesi: 300 per i numeri grandi, 400 per il testo normale.

Navigazione (dalla v0.36.0, decisa con l'utente — prevale sul mockup):
- Home = Lista. Le due sezioni principali, Lista e Pasti, si alternano toccando i titoli
  grandi in alto (`SectionTitle`: attivo scuro, l'altro grigio). Nessun bottom tab bar.
- Floating bottom bar fissa: la pill apre un bottom sheet con il riepilogo della settimana
  e "Nuova spesa"; il cerchio apre il menu a gruppi ("Le tue spese", "Gestisci", Impostazioni).
- Le pagine del menu hanno la freccia ‹ che torna all'ultima sezione principale e si
  sostituiscono a vicenda; i dettagli tornano alla pagina precedente (`BackButton`).
- La barra in basso è visibile ovunque tranne nella spesa in corso (`/spesa`, fuori dalla shell).
- Transizioni: dissolvenza allo stesso livello, scorrimento laterale tra livelli (`navTransition`).
- Più liste (dalla v0.37.0): schede sottolineate sotto i titoli (`ListTabs`, attiva con ⌄ = modifica),
  una spesa parte da una lista (scelta nel pannello della pill), pagina "Liste" in "Gestisci".

## Stack

- **Vite** + **React** + **TypeScript** (strict mode)
- **TanStack Router** (SPA, type-safe file-based routing)
- **TanStack Query** sopra **Dexie** (introdotti nella fase data layer)
- **Dexie** (IndexedDB) per la persistenza locale
- **vite-plugin-pwa** (Workbox) per la PWA / offline
- **Sonner** per i toast
- **Vaul** per i bottom sheet
- **Tailwind CSS** per lo stile

## VNC (accesso grafico al container)

Il desktop remoto parte automaticamente all'avvio del container (via `postStartCommand`).
Connettiti con qualsiasi client VNC a `localhost:5901` — password: **password**.

Se il server VNC non risponde (es. dopo un rebuild o un crash), riavvialo manualmente:

```bash
vncserver -kill :1 2>/dev/null; vncserver :1 -geometry 1280x800 -depth 24 -localhost no
```

Il display `:1` è usato anche dal browser nei test e2e (MCP Playwright).

## Modo di lavorare

- Si procede per task numerate. Eseguire SOLO la task indicata, poi fermarsi.
- Ogni task si chiude con un commit in stile conventional commits. Non accorpare
  più task in un singolo commit, e non anticipare task future.
- Scrivi i commit message in inglese.
- Non creare file, dipendenze o strutture non richiesti dalla task corrente.
- TypeScript strict, niente `any`. Tutti gli importi monetari in centesimi interi.
- Se si incontra una scelta non specificata e non banale, fare l'opzione più semplice
  e segnalarla nel messaggio finale invece di bloccarsi o andare oltre lo scopo.
- Al termine di ogni task, creare un dump in `docs/roadmap/<N>.md`.
- Il progetto gira in un container Docker: tenere conto di questo per dev server, build, ecc.
- Quando fai un fix cambia versione patch.
- Quando fai una feature cambia versione minor.
- Prima di fare commit lanciare test e verificare che il coverage sia 100%, e poi `npx tsc --noEmit -p tsconfig.app.json && npx tsc --noEmit -p tsconfig.node.json` per verificare che non ci siano errori TypeScript (`npx tsc --noEmit` da solo non controlla nulla: il `tsconfig.json` radice ha solo `references`). Anche `npx eslint src` deve passare senza errori.
- Aggiorna sempre test/smoke.md in modo che sia coerente con le nuove feature e fix. Non eseguire i teste e2e ad ogni commit.
- Le traduzioni sono in `src/i18n/locales/it.ts` e `src/i18n/locales/en.ts`. Ogni chiave aggiunta a `it.ts` va aggiunta **anche** a `en.ts` — il tipo è condiviso e il build TypeScript fallisce se le due strutture non sono allineate.
- Ad ogni bump di versione (patch o minor) aggiungere una entry in `src/data/changelog.ts` — in cima alla mappa, chiave = versione, valori `it` e `en` con le modifiche rilevanti per l'utente.
- **Desktop e mobile vanno sempre insieme.** L'app ha due interfacce: mobile (`src/screens`, `src/components`, `src/router.ts`) e desktop (`src/desktop/`, viewport ≥ 768 px e ≥ 500 px di altezza; `src/AppRoot.tsx` sceglie in tempo reale). Ogni feature o fix visibile all'utente va fatta su ENTRAMBE, con le stesse funzioni. Se una cosa ha senso solo su una delle due, dirlo esplicitamente nel messaggio finale. Se aggiungi o sposti una pagina, mantieni la corrispondenza dei path fra i due router (le uniche differenze oggi sono `/lista` ↔ `/` e `/stats` ↔ `/statistiche`, tradotte da `translatePath` in `src/lib/viewMode.ts`) e aggiorna anche quella mappa se serve.
- **Tutto deve sempre funzionare.** Prima di considerare finita una task: `npx tsc --noEmit -p tsconfig.app.json` (il `tsc --noEmit` senza `-p` non controlla nulla, perché `tsconfig.json` ha `files: []`), `npx eslint src`, `npx vitest run --coverage` con coverage 100% e `npm run build`, tutti senza errori. Nessuna regressione sul mobile quando si lavora sul desktop e viceversa.
- **Test per ogni modifica.** La logica pura va in `src/lib/` con test vitest (`*.test.ts`) e il file va aggiunto a `coverage.include` in `vitest.config.ts` (soglia 100%); i componenti React non sono coperti dai test unitari, quindi vanno verificati anche nel browser (Playwright, vedi skill e2e), sia a viewport mobile (~390 px) sia desktop (~1280 px) e, se toccano il layout, alle larghezze vicine alla soglia (768–1100 px). Aggiorna `test/smoke.md` per entrambe le interfacce.
- Le tabelle desktop usano `SortableTable` (colonne ordinabili), le date mostrano l'anno (`formatDate`, `formatWeekLabelWithYear`), le stringhe passano da `t()` con le chiavi `desktop.*` per i testi solo-desktop.
