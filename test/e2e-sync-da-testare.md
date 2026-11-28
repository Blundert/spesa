# E2E sync — punti non testati nel run 1: esito nel run 2

I punti elencati dopo il run 1 (`docs/roadmap/122.md`) sono stati eseguiti nel run di verifica dopo i fix 1.4.2–1.4.8
(`docs/roadmap/130.md`), con la cache del browser ATTIVA (comportamento reale), desktop 1280×800 e mobile 390×844.

Legenda: ☑ eseguito e superato · ➖ non applicabile (e perché) · ☐ ancora da fare

## Mobile (390×844)
- ☑ **5** Esporta/importa dalle Impostazioni mobili e "Scarica da remoto". **5.6** nessun "Confronta e unisci" a vuoto.
- ☑ **0.4** Inviti a chi ha già accesso, a un utente inesistente e a se stessi (messaggio nuovo).
- ☑ **2.4**, **4.7** nella spesa mobile; **F9** (presa immediata dopo l'ingresso nella spesa).
- ☑ **6** Partner ↔ Estraneo dal foglio mobile (8,10 → 14,50 → 8,10). **6.4** Elimina settimana: le spese di B restano, le proprie non tornano.
- ☑ **8.2, 8.3, 8.4, 8.5, 8.7, 8.9, 8.10** e **F3** (chiusura a 2 s, riapertura su Storico).

## Desktop
- ☑ **6.4 / 6.6**: nello Storico desktop non esiste l'eliminazione per settimana (➖, solo mobile); lista normale invariata (nessuna etichetta, budget come prima).
- ☑ **3.5** Rete che cade DAVVERO durante un push (PUT abortito dopo 3 s, due volte): la voce non si perde, arriva una sola volta.
- ☑ **F9** su desktop; ☑ **F1**, **F5**, **F7**, **F8**.
- ➖ Rinomina di una voce e cambio categoria: non esistono comandi nelle liste (né mobile né desktop).

## Non testabile con account personali
- ☐ **"Solo guarda" reale** (permesso `pull` su GitHub): i repo di account personali non lo ammettono. L'app non lo offre più nell'invito (1.4.6); resta provata solo l'interfaccia in sola lettura simulata (`canWrite:false`), su desktop e mobile. Per provarlo davvero serve un repo di un'organizzazione.

## Infrastruttura del test
- ☑ **Reset dei repo** del piano eseguito su repo con commit (correzione: GitHub rifiuta un albero vuoto, ora si usa un README segnaposto).
- ☑ Creazione del repo condiviso **da zero** su desktop (`spesa-desk-nuova`) e su mobile (`spesa-mob2`).
- ☑ Tempi con la cache attiva, senza CDP (A→B ≈ 11 s, prima 33 s).
