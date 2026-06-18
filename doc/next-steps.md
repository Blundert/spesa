# Prossimi step (backlog)

Funzionalità rimandate per concentrarci ora sul **flusso utente**. Le decisioni di design
sono già prese (vedi sotto): quando si riprende, sono pronte da pianificare/implementare.

---

## 1. Export / Import del database (JSON)

**Obiettivo:** salvare/ripristinare tutti i dati in un file comodo.

- **Formato:** JSON (round-trip completo dei dati relazionali; CSV scartato perché lossy).
- **Export:** serializza tutte le tabelle Dexie (`categories`, `items`, `supermarkets`,
  `weekBudgets`, `listItems`, `sessions`, `purchases`, `mealPlans`) in un unico file con
  `version` (schema) + `exportedAt`; download via `Blob` + `<a download>`.
- **Import:** file picker → parse → valida versione/struttura → in transazione svuota e
  ripopola le tabelle (riusa il pattern di `wipeAllData` in `src/db/db.ts`) → poi
  `queryClient.invalidateQueries()` per rinfrescare le viste attive.
- **UI:** in Impostazioni due voci "Esporta dati" / "Importa dati"; l'import chiede conferma
  (sovrascrive tutto, drawer di conferma come per "Azzera dati").
- **Note:** gestire import di versioni schema diverse (almeno un avviso). È la **base** per il
  sync git (stesso payload JSON).

## 2. Sync git del database (GitHub Contents API)

**Obiettivo:** sincronizzare il DB verso una repo Git (anche diversa da quella dell'app).

- **Approccio:** **GitHub Contents API** (`api.github.com`) — supporta CORS → niente proxy,
  niente `isomorphic-git`. Si sincronizza **un solo file** (il DB esportato in JSON).
- **Config in Impostazioni** (persistita in localStorage/IndexedDB):
  **token** (PAT fine-grained, scope `contents` su una sola repo), **owner/repo** (configurabile),
  **branch**, **path** (es. `spesa-db.json`). Solo **HTTPS**.
- **Push** ("Sync ora" + auto a intervallo): export → JSON → `PUT /repos/{owner}/{repo}/contents/{path}`
  con `content` base64 + `message` + `sha` corrente del file (= **un commit**).
- **Pull:** `GET .../contents/{path}` → decode base64 → import nel DB.
- **Conflitti:** single-user → **last-write-wins** via `sha`; se la remota è cambiata
  (409 / sha diverso) → GET + avviso/sovrascrittura.
- **Auto:** a intervallo (es. ogni X min) se ci sono modifiche locali → push; opzionale pull
  all'avvio.
- **Caveat:** il token vive nel browser → rischio in caso di XSS; mitigato dal PAT fine-grained
  su una sola repo. Dipende da (1) — riusa l'export/import JSON.

---

_Ordine consigliato: prima (1) export/import JSON, poi (2) sync git che ci si appoggia._
