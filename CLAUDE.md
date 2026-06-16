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

## Roadmap

### Fase 0 — Fondamenta
1. ✅ Scaffold Vite + React + TS + TanStack Router + Tailwind + lint
2. ✅ Setup PWA con vite-plugin-pwa (manifest, app shell offline)
3. Utility: importi in centesimi, helper data e ISO week
4. Database Dexie: schema, tipi entità, seed categorie

### Fase 1 — Data layer (TanStack Query su Dexie)
5. QueryClient + repository Dexie + convenzione query key
6. Items e Supermarkets con dedup su normalizedName
7. Week e budget: selettore rimanente derivato (Z, speso, "da pagare a parte")
8. Lista della spesa: query e mutation
9. Sessioni e acquisti: purchase mutation (quantità modificabile, default 1)
10. Storico prezzi e statistiche supermercato
11. Meal plan

### Fase 2 — Primitive UI
12. Sonner, Vaul, tastierino prezzo+quantità, layout, navigazione

### Fase 3 — Schermate
13. Modalità spesa (slice verticale, per prima)
14. Home / settimana
15. Lista della spesa
16. Pianificazione pasti
17. Storico sessioni
18. Dettaglio oggetto (storico prezzi)
19. Supermercati

### Fase 4 — Rifinitura
20. ✅ Polish PWA (icone, splash, install prompt, verifica offline)
