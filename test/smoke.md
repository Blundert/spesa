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
4. Verifica che le chip rapide (scroll orizzontale) mostrino articoli predefiniti alla prima apertura
5. Dopo una sessione di spesa completata: le chip mostrano in cima gli articoli acquistati più spesso

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

### Flusso 7 — Eliminazione settimana dallo storico
1. Naviga su http://localhost:5173/storico (con almeno una sessione di spesa salvata)
2. Verifica che le sessioni siano raggruppate per settimana con intestazione (es. "9 – 15 giu") e icona cestino
3. Clicca l'icona cestino accanto a una settimana
4. Verifica che si apra un BottomSheet con il titolo "Eliminare la settimana …?" e i pulsanti "Elimina settimana" e "Annulla"
5. Clicca "Annulla" — verifica che il sheet si chiuda e la settimana sia ancora visibile
6. Clicca nuovamente il cestino e poi "Elimina settimana"
7. Verifica che la settimana scompaia dalla lista e appaia il toast "Settimana eliminata"

### Flusso 8 — Modifiche nel Catalogo si riflettono subito nella Lista
1. Vai su Lista → aggiungi "Latte" (categoria: Frigo)
2. Catalogo → sposta "Latte" in "Dispensa" → Lista: "Latte" sotto "Dispensa" (non "Frigo") ✓
3. Catalogo → rinomina "Latte" in "Latte Fresco" → Lista: compare "Latte Fresco" senza flash ✓
4. Catalogo → rinomina la categoria "Dispensa" in "Dispensa 2" → Lista: intestazione gruppo mostra "Dispensa 2" ✓
5. Catalogo → elimina "Latte Fresco" → Lista: l'articolo scompare immediatamente ✓

### Flusso 6 — Pianificazione inizia dal giorno configurato
1. Vai su Impostazioni → imposta il giorno di inizio su "Mer"
2. Naviga su Pasti
3. Verifica che il primo giorno visualizzato sia "MER" e l'ultimo "MAR"
4. Torna su Impostazioni → reimposta il giorno di inizio su "Lun"
5. Verifica che i giorni nella schermata Pasti tornino a LUN→DOM

### Flusso 9 — Modifica sessione di spesa dallo storico
1. Con almeno una sessione di spesa completata, naviga su Storico
2. Clicca su una sessione per aprire il dettaglio
3. **Modifica data**: clicca sulla data (testo sottolineato punteggiato) → si apre il date picker nativo → scegli una data diversa → verifica il toast "Modifiche salvate" e che la data si aggiorni; se la nuova data è in una settimana diversa, la sessione deve spostarsi nel gruppo corretto nello Storico
4. **Modifica supermercato**: clicca sul nome del supermercato nell'intestazione → si apre il picker supermercati → seleziona un negozio diverso → verifica il toast "Modifiche salvate" e che l'intestazione si aggiorni
5. **Modifica prezzo/quantità**: clicca su una riga acquisto → si apre il tastierino prezzi con il prezzo attuale precompilato e lo stepper quantità → modifica prezzo e/o quantità → clicca "Conferma" → verifica il toast "Modifiche salvate" e che il totale della sessione si aggiorni di conseguenza
6. **Sessione non completata**: una sessione con "Fine" non premuto appare nello Storico con badge arancione "Non completata" → tap su di essa → nell'intestazione appare la scritta "Non completata" sotto il nome del supermercato → pulsante "Concludi spesa" visibile sopra la lista acquisti → tap → si apre il tastierino con il totale pre-calcolato → conferma → sessione ora conclusa (badge sparisce, pulsante sparisce), lista della spesa svuotata, toast "Spesa salvata"
