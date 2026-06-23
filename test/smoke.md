### Flusso 1 — Onboarding prima apertura
1. Vai su http://localhost:5173 (con dati resettati / prima apertura)
2. Verifica che venga mostrata la schermata di onboarding (slide 1: "Benvenuto in Spesa")
3. Avanza tra le 4 slide tramite il pulsante "Avanti"
4. Verifica che l'ultima slide mostri il pulsante "Inizia"
5. Clicca "Inizia"
6. Verifica che si apra il tour in-app (indicatore "1 / 4" visibile)
7. Clicca "Salta" per chiudere il tour
8. Verifica che la schermata principale sia visibile senza overlay

### Flusso 2 — Aggiunta articolo alla lista
1. Dalla schermata principale, clicca su "Lista della spesa"
2. Nel campo "Aggiungi un oggetto…", digita "Latte" e premi Invio
3. Verifica che "Latte" appaia nella lista sotto la categoria corretta (es. Frigo)

### Flusso 3 — Avvia sessione di spesa e aggiungi articolo al carrello
1. Naviga su http://localhost:5173/spesa
2. Verifica che compaia il prompt per scegliere il negozio
3. Clicca il pulsante per scegliere il negozio e seleziona un supermercato qualsiasi
4. Verifica che la sessione parta e che "Latte" appaia nella sezione "Da prendere"
5. Clicca sulla riga "Latte" — verifica che si apra il tastierino prezzi
6. Inserisci un prezzo (es. 1,50) e clicca "Aggiungi al carrello"
7. Verifica che "Latte" si sposti nella sezione "Nel carrello"

### Flusso 4 — Persistenza dopo reload
1. Ricarica la pagina (F5 / navigation reload)
2. Vai su "Lista della spesa"
3. Verifica che "Latte" sia ancora presente nella lista

### Flusso 5 — Giorno di inizio settimana
1. Vai su Impostazioni
2. Trova la sezione "Inizio settimana"
3. Verifica che "Lun" sia selezionato (spunta visibile) per default
4. Seleziona "Sab"
5. Verifica che appaia il toast "Impostazione salvata"
6. Torna alla schermata principale
7. Verifica che la floating bar mostri l'intervallo corretto (sabato–venerdì)
8. Torna su Impostazioni e verifica che "Sab" risulti ancora selezionato dopo il reload
