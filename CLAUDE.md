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

Navigazione: side nav con push (effetto Vaul), nessun bottom tab bar —
invece una floating bottom bar fissa che apre un bottom sheet di riepilogo settimana.

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
- Non creare file, dipendenze o strutture non richiesti dalla task corrente.
- TypeScript strict, niente `any`. Tutti gli importi monetari in centesimi interi.
- Se si incontra una scelta non specificata e non banale, fare l'opzione più semplice
  e segnalarla nel messaggio finale invece di bloccarsi o andare oltre lo scopo.
- Al termine di ogni task, creare un dump in `doc/roadmap/<N>.md`.
- Il progetto gira in un container Docker: tenere conto di questo per dev server, build, ecc.
- Quando fai un fix cambia versione patch.
- Quando fai una feature cambia versione minor.
- Prima di fare commit lanciare test e verificare che il coverage sia 100%. 
- Aggiorna sempre test/smoke.md in modo che sia coerente con le nuove feature e fix. Non eseguire i teste e2e ad ogni commit.
- Le traduzioni sono in `src/i18n/locales/it.ts` e `src/i18n/locales/en.ts`. Ogni chiave aggiunta a `it.ts` va aggiunta **anche** a `en.ts` — il tipo è condiviso e il build TypeScript fallisce se le due strutture non sono allineate.
