# Piano — Versione Desktop (Phase A)

## Obiettivo

Creare una versione desktop dell'app come UI completamente separata, senza toccare nessun componente mobile esistente. Il focus è sulle statistiche avanzate. I due "mondi" condividono solo il data layer (Dexie + hook).

Il trigger è la larghezza del viewport: **≥ 768px → desktop**, < 768px → mobile esistente invariato.

---

## A1 — Platform detection & entry point split

**File modificato:** `src/main.tsx`

Aggiungere rilevamento viewport al root:

```tsx
const isDesktop = window.matchMedia('(min-width: 768px)').matches
// + listener per resize dinamico

return isDesktop ? <DesktopApp /> : <MobileApp /> // MobileApp = albero esistente invariato
```

Il desktop ha il proprio `RouterProvider` configurato in `src/desktop/router.ts`.

---

## A2 — Desktop shell & layout

**Struttura nuovi file:**

```
src/desktop/
  router.ts                    — TanStack Router config per le route desktop
  DesktopApp.tsx               — RouterProvider wrapper
  components/
    DesktopShell.tsx           — Sidebar fissa 220px + area contenuto principale
    Sidebar.tsx                — Link di navigazione (icona + label), highlight attivo
    StatCard.tsx               — Card KPI (numero + label + freccia trend)
    RangeSelector.tsx          — Pill switcher: 4W / 12W / 6M / 1Y / All
  screens/
    DashboardScreen.tsx        — Overview stats principale (landing page)
    AdvancedStatsScreen.tsx    — Analytics approfondite con tutti i grafici
    DesktopCatalogoScreen.tsx  — Browser catalogo (layout tabella)
    DesktopStoricoScreen.tsx   — Storico sessioni con filtri
    DesktopImpostazioniScreen.tsx — Impostazioni (riusa logica, non UI)
```

**Layout desktop:**
- Sidebar sinistra: 220px fissa, logo + voci nav
- Area principale: `calc(100vw - 220px)` scrollabile
- Palette colori e font invariati da `CLAUDE.md`

**Route desktop:**

| Path | Schermata |
|---|---|
| `/` | DashboardScreen |
| `/stats` | AdvancedStatsScreen |
| `/catalogo` | DesktopCatalogoScreen |
| `/storico` | DesktopStoricoScreen |
| `/impostazioni` | DesktopImpostazioniScreen |

---

## A3 — Extended stats repository

**Nuovo file:** `src/db/repositories/statsExtended.ts`

Nessuna modifica allo schema Dexie — solo query aggiuntive:

| Funzione | Output |
|---|---|
| `getDetailedStats(weekStartDay, rangeWeeks)` | weeklyTotals estesi + buoni-covered vs out-of-pocket per settimana |
| `getSupermarketStats(weekStartDay, rangeWeeks)` | Per supermercato: sessionCount, totalCents, avgCents, lastVisit |
| `getDayOfWeekPattern(weekStartDay, rangeWeeks)` | Sessioni per giorno della settimana (0=Lun…6=Dom) |
| `getCategoryEvolution(weekStartDay, rangeWeeks)` | Totali per categoria settimana per settimana |
| `getBudgetEfficiency(weekStartDay, rangeWeeks)` | Per settimana: totalCents, buoniCoveredCents, outOfPocketCents, coveragePercent |

**Nuovo hook:** `src/hooks/useDesktopStats.ts` — wrappa ogni funzione con `useQuery`.

**Dipendenza da installare:**
```
npm install recharts
```

---

## A4 — Dashboard & AdvancedStats screens

**DashboardScreen** — riga 4 KPI + grafici principali:
- KPI: Totale speso (range), Numero sessioni, Media per sessione, Out-of-pocket totale
- `<RangeSelector />` — stato condiviso via search param `?range=12w`
- Trend spesa: `<LineChart>` (recharts) — due linee (totale vs out-of-pocket) per range selezionato
- Efficienza buoni: `<BarChart>` stacked — buoni-coperti + out-of-pocket per settimana
- Ripartizione categorie: `<PieChart>` donut (recharts)
- Top supermercati: `<BarChart>` orizzontale — totalCents per store

**AdvancedStatsScreen** — analisi più profonde:
- Evoluzione categorie: `<AreaChart>` stacked — mix categorie nel tempo
- Pattern per giorno della settimana: `<BarChart>`
- Tabella dettaglio supermercati: sessioni, avg basket, ultima visita, totale
- Tracker prezzo articolo: dropdown selezione articolo → `<LineChart>` di `priceHistory`

Tutti i grafici usano la palette dell'app: `#2A2A2C` primario, `#9B9B9F` secondario.

---

## A5 — Schermate secondarie desktop

| Schermata | Contenuto |
|---|---|
| `DesktopCatalogoScreen` | Due colonne: lista articoli a sinistra, ripartizione categorie a destra. Riusa `useCatalogo()`. |
| `DesktopStoricoScreen` | Tabella full-width sessioni con filtro data + supermercato. Riusa `useShopping()`. |
| `DesktopImpostazioniScreen` | Card-based settings (giorno inizio settimana, valore buono, backup/restore). |

---

## A6 — i18n + changelog + versione

- Tutte le nuove stringhe in `src/i18n/locales/it.ts` e `en.ts` sotto namespace `desktop.*`
- Bump versione: minor (es. 0.21.0)
- Entry in `src/data/changelog.ts`

---

## Verifica

1. `npm run dev` → apri a `localhost:5173` con viewport ≥ 768px → shell desktop
2. Ridimensiona < 768px → shell mobile invariata
3. Naviga tutte le route desktop, grafici recharts renderizzano con dati reali
4. `npx tsc --noEmit` — zero errori
5. `npm run test` — coverage 100%
