# E2E — sincronizzazione reale tra due account GitHub

Questo file NON è lo smoke test: non controlla le funzioni una per una (quelle sono nei Flussi 47–51 di `smoke.md`).
Prova **un flusso reale, da cima a fondo, con due persone vere su GitHub**, e va a caccia dei problemi di sincronizzazione.
Si lancia solo su richiesta ("lancia gli e2e"), mai a ogni commit.

Regola d'oro: **si registrano i problemi, non si correggono.** Ogni problema va nella tabella in fondo (scenario, passi, atteso, ottenuto,
gravità) e poi nel dump `docs/roadmap/<N>.md`. Che diventi un fix lo decide l'utente, una task alla volta.

## Preparazione

### Account e token
- Due account GitHub di test dedicati (usa e getta, non quelli personali): **A** (`spesa-test-a`) e **B** (`spesa-test-b`).
- Un token classico per account, con i permessi `repo` e `delete_repo`. Lo stesso token serve all'app (Sincronizzazione → campo Token) e a `gh`.
  L'app ha UN solo token per dispositivo, usato per backup, creazione, inviti e sync delle liste condivise: non servono token per repo.
- I token stanno in `.env.e2e` (ignorato da git, mai committato):
  ```
  E2E_TOKEN_A=ghp_...
  E2E_TOKEN_B=ghp_...
  E2E_LOGIN_A=spesa-test-a
  E2E_LOGIN_B=spesa-test-b
  ```
- Nei log, negli screenshot e nei risultati si scrive "token A" / "token B", **mai il valore**. Il token si inserisce nell'app con `fill` nel campo Token,
  non dagli appunti.

### Repo
- Creati a mano, vuoti: `spesa-backup-a` (account A) e `spesa-backup-b` (account B), privati.
- `spesa-condivisa` NON si crea a mano: lo crea l'app (lista chiamata "condivisa" → repo proposto `spesa-condivisa`, Flusso 47).

### Reset prima di OGNI run
```bash
set -a; source .env.e2e; set +a
# 1. elimina la lista condivisa (se esiste)
GH_TOKEN=$E2E_TOKEN_A gh api -X DELETE repos/$E2E_LOGIN_A/spesa-condivisa 2>/dev/null || true
# 2. togli eventuali inviti pendenti di B (il repo non c'è più, quindi spariscono con lui)
# 3. svuota i backup: elimina e ricrea (privati, vuoti)
GH_TOKEN=$E2E_TOKEN_A gh api -X DELETE repos/$E2E_LOGIN_A/spesa-backup-a 2>/dev/null || true
GH_TOKEN=$E2E_TOKEN_A gh repo create $E2E_LOGIN_A/spesa-backup-a --private
GH_TOKEN=$E2E_TOKEN_B gh api -X DELETE repos/$E2E_LOGIN_B/spesa-backup-b 2>/dev/null || true
GH_TOKEN=$E2E_TOKEN_B gh repo create $E2E_LOGIN_B/spesa-backup-b --private
```
Se la cancellazione risponde 403 il token non ha `delete_repo`. I token NON vanno mai stampati (niente `set -x`, niente `echo $E2E_TOKEN_*`).

### Server e browser
- Build di produzione (prova anche la CSP, che ammette solo `api.github.com`): `npm run build && npx vite preview --host --port 4173`.
- Due utenti, due archivi separati nello stesso browser, perché IndexedDB è isolato per origine:
  - **A** → `http://localhost:4173`
  - **B** → `http://127.0.0.1:4173`
  Una scheda per utente (MCP Playwright). Prima di ogni run svuota i dati del sito su entrambe le origini.
- Collegamento: Sincronizzazione → campo Token, `fill` con il token dell'utente della scheda, owner = login dell'utente, repo = il suo backup.
  Poi nome utente ("Collegato come @…") e scelta del repo di backup.
- Viewport: ogni scenario gira due volte, **mobile 390×844** e **desktop 1280×800** (le due interfacce hanno gli stessi flussi). Un run per viewport,
  con le schede ridimensionate per tutti e due gli utenti.

### Tecniche per simulare il mondo reale
- **Offline di UNA scheda** (non di tutto il browser): in `browser_run_code_unsafe`
  `await page.route('https://api.github.com/**', r => r.abort())` e, per tornare online, `await page.unroute('https://api.github.com/**')`.
  L'app parla in rete solo con GitHub, quindi equivale a "niente rete".
- **Rete lenta** (sync "durante"): `page.route(..., async r => { await new Promise(s => setTimeout(s, 4000)); await r.continue() })`.
- **Telefono in tasca (sfondo)**: porta `document.visibilityState` a `hidden` con
  `Object.defineProperty(document, 'visibilityState', {value: 'hidden', configurable: true}); document.dispatchEvent(new Event('visibilitychange'))`
  e poi a `visible` allo stesso modo.
- **Telefono spento/app chiusa**: `page.close()` e riapertura dello stesso indirizzo in una scheda nuova. IndexedDB resta, i timer in memoria spariscono.
- **Tempi reali**, niente orologio finto: il push parte 5 s dopo l'ultima modifica, il controllo ogni 15 s (solo con lista aperta e app visibile).
  Misura i secondi (es. con `Date.now()` in `browser_evaluate`) e segnali un ritardo oltre ±2 s.
- **Cosa c'è sul repo**: `GH_TOKEN=$E2E_TOKEN_A gh api repos/$E2E_LOGIN_A/spesa-condivisa/commits` (numero e ora dei commit) e
  `gh api repos/.../contents/lista.json --jq .content | base64 -d` per lo stato. Un commit in più del dovuto o un `lista.json` diverso dall'app è un problema.

## Storia di fondo (il filo conduttore)
A e B abitano insieme e fanno la spesa dalla stessa lista. A crea la lista "condivisa" e invita B. Durante la settimana aggiungono e tolgono voci
dal telefono, spesso senza rete o con l'app che si spegne in tasca. Il sabato fanno la spesa, a volte insieme. Ogni scenario è un pezzo di questa
storia visto dal lato che può rompersi.

## Scenario 0 — Avvio: i due si collegano (da fare sempre, prima degli altri)
1. A: collega GitHub (token A), imposta `spesa-backup-a`. B: stessa cosa con token B e `spesa-backup-b`. Entrambi: "Sincronizza ora" sul backup → commit nel repo del backup, nessun errore.
2. A: nuova lista "condivisa" → Condividi con altre persone → repo `spesa-condivisa`, invita `E2E_LOGIN_B` con "Può modificare". Su GitHub: repo privato con `lista.json` e invito pendente.
3. B: nuova lista (+) → "Aggiungi una lista condivisa" → "Inviti ricevuti" → "Accetta e aggiungi". B vede nome e voci di A.
4. A invita ancora B con "Solo guarda" in un secondo momento (Scenario 5/7 lo usano): verifica l'errore o il cambio di permesso, e che non si duplichi l'invito.
5. A aggiunge "latte", "pane", "uova". Entro ~5 s un solo commit; entro ~15 s B li vede senza toccare nulla.
Atteso: nessun errore, nessun doppione, "Persone" mostra entrambi. Questo è lo stato di partenza degli scenari 1–7.

## Scenario 1 — Modifiche concorrenti sulla stessa voce
1. A e B entrambi offline (`page.route` su entrambe le schede) con "latte" presente e uguale.
2. A: quantità 2 e categoria "Frigo". B: quantità 3 e nome "latte intero". Un secondo tra una modifica e l'altra, così l'ordine è noto.
3. Torna online A, aspetta il push (~5 s) e verifica il commit. Poi torna online B e aspetta ~15 s.
4. Atteso: vince la modifica più recente per ogni campo; **nessuna voce duplicata** ("latte" e "latte intero" insieme sono un problema); stesso risultato su A e B, e uguale a `lista.json`.
5. Ripeti invertendo l'ordine temporale delle modifiche e quello di ritorno online: il risultato deve dipendere solo dall'ora delle modifiche, non da chi si riconnette prima.
6. Attacca: la stessa voce aggiunta da A e da B con lo stesso nome in contemporanea (da offline) → una sola riga con quantità sommata (Flusso 48.8).

## Scenario 2 — Eliminazione contro modifica
1. Offline entrambi. A elimina "pane". B cambia la quantità di "pane" (dopo l'eliminazione di A).
2. Online A, poi B. Atteso: una scelta coerente e uguale ovunque (vince la più recente, con tombstone). Il caso grave: la voce **riappare** su A dopo aver vinto l'eliminazione, o sparisce su B senza che l'eliminazione fosse più recente.
3. Inverti: B modifica prima e A elimina dopo → la voce sparisce per tutti e **non ricompare** dopo altre sync (aspetta almeno due controlli da 15 s).
4. B prende "uova" nel carrello (spesa in corso) mentre A le elimina dalla lista: a fine spesa non devono comparire acquisti fantasma né errori.
5. Elimina una voce, riaggiungila con lo stesso nome: deve tornare come voce nuova, non restare cancellata dal tombstone.

## Scenario 3 — Offline e ritorno
1. B offline (`page.route`). B aggiunge 3 voci, ne cambia una e ne elimina una. La riga di stato dice "Offline: le modifiche partiranno appena torna la rete" e le modifiche restano nella lista.
2. Nel frattempo A aggiunge 2 voci e modifica una delle stesse che ha toccato B.
3. B torna online (`unroute`): la sync parte da sola, anche prima dei 15 s. Atteso: merge corretto, nessuna perdita da nessun lato, uguale a `lista.json`.
4. Offline lungo: B resta offline oltre un controllo da 15 s; non devono esserci errori rossi né il polling deve fermarsi per sempre (l'errore di rete non è fatale).
5. Rete che torna a metà push: usa la rete lenta e rimetti offline durante il push; nessuna modifica persa, nessun commit doppio al ritorno.

## Scenario 4 — Spese in contemporanea
1. Con la lista "condivisa" (voci: latte, pane, uova, mele), A e B iniziano la spesa dalla stessa lista (pill → Nuova spesa → lista condivisa).
2. A mette "latte" nel carrello. Entro ~5 s B vede "preso da @A"/nome scelto e "latte" resta in "Da prendere" con quella etichetta. B mette "pane": A lo vede preso da B.
3. A toglie "latte" dal carrello: torna da prendere anche per B entro ~5 s.
4. A e B prendono la **stessa** voce quasi insieme: nessun doppione, nessuna voce persa; l'etichetta finale è coerente su entrambi.
5. A conclude per prima ("Conferma spesa"): entro ~5 s sul repo c'è la spesa di A con login, negozio, importi, buoni e acquisti; le voci acquistate escono dalla lista **per tutti**, anche per B che sta ancora facendo la spesa.
6. B conclude dopo: la sua spesa si pubblica a sua volta; le voci che A aveva già tolto non tornano; le voci prese solo da B spariscono. Alla fine la lista contiene solo ciò che nessuno ha preso.
7. Attacca: B conclude **mentre** A pubblica (rete lenta su B, push di A in corso): nessuna spesa persa, nessuna spesa duplicata.

## Scenario 5 — Ripristino da backup a metà condivisione
1. A ha la lista condivisa con voci e spese di entrambi. Esporta (Impostazioni → Esporta), cancella tutti i dati del sito, reimporta.
2. Atteso: la lista torna col collegamento (icona, persone) ma **senza token** e senza le voci né le spese di B; le spese di A su quella lista restano.
3. Ricollega GitHub (token A). La **prima** sync scarica e unisce e **non scrive** nel repo (commit invariati); solo dalla sync dopo partono le modifiche di A.
4. Nel frattempo B ha aggiunto voci: dopo il ripristino di A non devono sparire (il backup è vecchio, quelle voci non lo erano).
5. "Scarica da remoto" nel backup personale (`spesa-backup-a`) con liste condivise: tornano com'erano nel backup e si riallineano alla sync dopo, senza sovrascrivere il lavoro di B.
6. Il file di backup non contiene token né ultimo stato di sync. La sync del backup di A **non** chiede "Confronta e unisci" a vuoto dopo che B ha modificato la lista condivisa (Flusso 51).

## Scenario 6 — Budget e statistiche con le spese degli altri
1. B (estraneo per A) fa una spesa da 40 € con buoni. In "Persone" di A, B è "Estraneo": entro ~15 s la spesa compare in Storico con "fatta da …" e "non conta nel tuo budget".
2. Atteso: NON cambia "Di tasca tua", speso, buoni spesi/rimanenti (home, pannello, riepilogo settimana), Statistiche (totali, per supermercato, giorno, categoria, budget settimanale) né le "ultime spese" in home.
3. A passa B a **Partner**: subito la spesa di B conta e perde l'etichetta; i buoni usati scalano da quelli impostati da A. Rimetti "Estraneo": torna fuori dai conti. I numeri tornano **esattamente** quelli del punto 2.
4. A elimina la settimana in Storico: le spese di B restano; quelle di A già pubblicate non tornano alla sync dopo.
5. Prezzo medio e ultimo prezzo di un articolo tengono conto anche degli acquisti di B, ma budget e statistiche di A no (se estraneo).
6. Una lista normale (non condivisa) non cambia: nessuna etichetta, nessuna pubblicazione, budget come prima.

## Scenario 7 — Accesso perso a metà sync
1. B ha la lista aperta e sincronizza. A rimuove B dai collaboratori con
   `GH_TOKEN=$E2E_TOKEN_A gh api -X DELETE repos/$E2E_LOGIN_A/spesa-condivisa/collaborators/$E2E_LOGIN_B`.
2. Entro ~15 s (o toccando la riga) la riga di B diventa rossa: "Non hai più accesso a questa lista condivisa" con "Tieni come lista normale". La lista e le voci restano; il controllo ogni 15 s si ferma.
3. Rimuovi B **mentre B sta scrivendo** (rete lenta su B, push in corso): errore chiaro, nessun crash, nessuna voce persa localmente.
4. "Tieni come lista normale": icona e riga spariscono, la lista è normale e modificabile; il repo non viene toccato e A continua a vederlo.
5. A rinvita B come "Solo guarda": B riaggiunge la lista; non ci sono campo di aggiunta, suggerimenti, "Svuota", + − né ×; quella lista non è tra le scelte di "Nuova spesa"; "Aggiorna ora" funziona. Nessuna scrittura parte mai da B.
6. A elimina il repo (`gh api -X DELETE`) mentre B ha la lista aperta: stesso errore di accesso perso, nessuna voce persa su B.
7. Token B revocato (cancellalo da GitHub) o sbagliato: "Il token non è più valido…" e polling fermo; dopo un token nuovo basta riaprire la lista.

## Scenario 8 — Ciclo di vita del telefono (il caso reale)
Il telefono al supermercato si apre e si spegne in continuo. Qui si prova il confine tra timer in memoria (5 s di push, 15 s di controllo) e vita dell'app.
Per ogni punto: fai la modifica, poi agisci **al secondo indicato**, poi riapri e guarda commit sul repo e stato dell'altro.
1. **Chiusura prima del push (~2 s)**: A aggiunge "mele" e a ~2 s fa `page.close()`. Riapre `localhost:4173` e apre la lista. Domanda chiave: la modifica è rimasta sul dispositivo (deve) e parte da sola? Quando? Su GitHub il commit arriva solo dopo la riapertura e dopo l'apertura della lista, o anche **senza aprirla**? Se solo con lista aperta, B resta senza "mele" finché A non riapre quella lista: **registralo come problema**.
2. **Chiusura dopo il push (~6 s)**: come sopra ma a ~6 s. Il commit è già su GitHub, nessun commit doppio alla riapertura.
3. **Sfondo prima del push**: modifica, vai in `hidden` a ~2 s e resta in sfondo 30 s. Il push da 5 s parte comunque? Il polling da 15 s **non** deve partire in sfondo (nessuna richiesta a GitHub a parte l'eventuale push). Torna `visible`: sync subito, senza aspettare i 15 s.
4. **Aperture e chiusure a raffica**: 10 cicli `hidden`/`visible` di 1–3 s con una modifica ogni due cicli. Nessun commit duplicato, nessun errore, una sola sync alla volta; alla fine `lista.json` e app coincidono.
5. **Chiusura durante una sync**: rete lenta (4 s), parte il push, `page.close()` a metà. Riapri: nessuna modifica persa, nessuna lista corrotta, la sync dopo riesce. Controlla che il repo non abbia un `lista.json` a metà o un commit con meno voci del dovuto.
6. **Polling con la lista chiusa**: lista chiusa (torni alla home) → nessun controllo ogni 15 s. L'altro modifica: l'altro lo vedi solo alla riapertura della lista; alla riapertura sync subito. Registra per quanto tempo A può restare indietro con la lista chiusa.
7. **Spesa in corso e telefono spento**: A è nella spesa (`/spesa`, fuori dalla shell, ha messo 2 articoli nel carrello). `page.close()` e riapertura: la spesa è ancora lì, gli articoli nel carrello ci sono e B li vede come presi da A entro ~5 s dalla riapertura. Verifica anche cosa succede se la riapertura avviene a ~2 s dal carrello.
8. **Riapertura a freddo**: chiudi tutto, B modifica 3 voci, riapri A su un'altra pagina (non la lista). Quando si allinea? Apri la lista: sync subito (poi ogni 15 s).
9. **Rete e visibilità insieme**: offline + `hidden`, torna `visible` ancora offline, poi online: nessun errore fatale e al ritorno della rete parte da sola, anche prima dei 15 s.
10. **Due sync che si pestano**: `syncNow` (riga di stato) e push da 5 s quasi insieme: una sola alla volta, una dopo l'altra, nessuna perdita (lo scheduler ha `again`).

## Registro dei problemi (da compilare durante il run)
Un problema per riga. Gravità: **dati persi**, **duplicato/incoerente**, **ritardo anomalo**, **errore non chiaro**, **estetico**.

| # | Scenario | Passi per riprodurre | Atteso | Ottenuto | Gravità | Mobile/Desktop |
|---|----------|----------------------|--------|----------|---------|----------------|
|   |          |                      |        |          |         |                |

## A fine run
- Chiudi `vite preview`, lascia i repo `spesa-backup-*` (si ricreano col reset) e **non** lasciare token in nessun file tracciato.
- Il dump `docs/roadmap/<N>.md` contiene la tabella compilata e l'elenco di ciò che NON è stato provato (e perché).
