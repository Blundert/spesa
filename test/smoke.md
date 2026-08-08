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

### Flusso 10 — Grafico andamento Statistiche e selettore range
1. Con almeno due sessioni di spesa completate (anche in settimane diverse), naviga su Statistiche
2. Verifica che il selettore range sia visibile sopra il riepilogo con le chip: "7 giorni", "30 giorni", "3 mesi", "6 mesi", "Tutto", "? giorni"
3. Il default è "30 giorni" (chip evidenziata in nero)
4. Nella sezione "ANDAMENTO" verifica che il grafico mostri barre per le settimane con spesa
5. Ogni barra deve avere: l'importo (€XX) sopra la barra e la data in formato "G/M" sotto
6. Le barre vuote (settimane senza spesa) devono essere basse e grigie; le settimane iniziali vuote non vengono mostrate
7. Seleziona "Tutto" → il grafico mostra tutte le settimane dalla prima sessione a oggi e i totali crescono
8. Seleziona "7 giorni" → solo le sessioni degli ultimi 7 giorni
9. Tap su "? giorni" → si apre un bottom sheet con un campo numerico → inserisci un numero (es. 45) → "Applica" → la chip mostra "45 giorni" e i dati si aggiornano
10. Ricarica la pagina → il range selezionato persiste
11. Se hai cambiato il giorno di inizio settimana nelle Impostazioni, le barre devono essere posizionate in base al nuovo giorno di inizio (non al vecchio)

### Flusso 9 — Modifica sessione di spesa dallo storico
1. Con almeno una sessione di spesa completata, naviga su Storico
2. Clicca su una sessione per aprire il dettaglio
3. **Modifica data**: clicca sulla data (testo sottolineato punteggiato) → si apre il date picker nativo → scegli una data diversa → verifica il toast "Modifiche salvate" e che la data si aggiorni; se la nuova data è in una settimana diversa, la sessione deve spostarsi nel gruppo corretto nello Storico
4. **Modifica supermercato**: clicca sul nome del supermercato nell'intestazione → si apre il picker supermercati → seleziona un negozio diverso → verifica il toast "Modifiche salvate" e che l'intestazione si aggiorni
5. **Modifica prezzo/quantità**: clicca su una riga acquisto → si apre il tastierino prezzi con il prezzo attuale precompilato e lo stepper quantità → modifica prezzo e/o quantità → clicca "Conferma" → verifica il toast "Modifiche salvate" e che il totale della sessione si aggiorni di conseguenza
6. **Sessione non completata**: una sessione con "Fine" non premuto appare nello Storico con badge arancione "Non completata" → tap su di essa → nell'intestazione appare la scritta "Non completata" sotto il nome del supermercato → pulsante "Concludi spesa" visibile sopra la lista acquisti → tap → si apre il tastierino con il totale pre-calcolato → conferma → sessione ora conclusa (badge sparisce, pulsante sparisce), gli articoli acquistati in questa sessione spariscono dalla lista della spesa (gli altri restano), toast "Spesa salvata"
7. **Modifica totale (spesa conclusa)**: su una sessione conclusa, tocca il numero totale grande → si apre il tastierino prezzi precompilato col totale attuale, senza stepper quantità → inserisci un nuovo importo → conferma → verifica il toast "Modifiche salvate" e che il totale mostrato cambi; ricarica la pagina e verifica che il nuovo totale persista. Prima della conclusione della spesa il totale **non** deve essere tappabile.
8. **Reset al totale calcolato**: dopo aver modificato il totale come sopra, tocca di nuovo il totale per riaprire il tastierino → deve comparire un bottone secondario "Usa il totale calcolato (€X)" con X pari alla somma dei prezzi degli articoli → tap → il totale mostrato torna a essere la somma degli articoli, toast "Modifiche salvate". Riapri il tastierino: il bottone secondario non deve più comparire (nessun override attivo) finché non si modifica di nuovo il totale a mano.

### Flusso 10 — Fine spesa non svuota gli articoli non acquistati
1. Vai su "Lista della spesa" e aggiungi due articoli, es. "Latte" e "Pane"
2. Naviga su http://localhost:5173/spesa, scegli un supermercato per avviare la sessione
3. Verifica che entrambi appaiano in "Da prendere"
4. Clicca su "Latte", inserisci un prezzo e conferma — verifica che si sposti in "Nel carrello"
5. Clicca "Termina spesa", conferma il totale
6. Vai su "Lista della spesa": verifica che "Pane" sia ancora presente (non acquistato) e che "Latte" sia sparito (acquistato)

### Flusso 11 — Aggiornamento automatico app + notifica versione
Nota: il service worker è attivo solo in build di produzione (`npm run build` + `npm run preview`), non in `npm run dev`.
1. `npm run build` e `npm run preview`, apri l'app dalla preview
2. In devtools → Application → Service Workers, verifica che il SW sia registrato e attivo
3. Bumpa la versione in `package.json` (patch fittizia), rifai `npm run build`
4. Nella tab già aperta, metti l'app in background e poi torna in primo piano (o cambia tab e torna) — non ricaricare manualmente
5. Verifica che l'app si aggiorni e ricarichi da sola, senza alcun popup di conferma
6. Dopo il reload, verifica che compaia un toast "Aggiornato alla versione X" con la nuova versione
7. Tocca il toast: verifica che navighi alla schermata Changelog
8. Ricarica di nuovo la pagina: verifica che il toast non ricompaia (stessa versione già vista)
9. In Impostazioni, verifica che il bottone "Aggiorna app" sia ancora presente e funzioni come prima (reset forzato SW + cache + reload)

### Flusso 12 — Catalogo piatti
1. Dal menu principale, apri "Piatti"
2. Verifica il messaggio "Nessun piatto salvato." se non ce ne sono ancora
3. Tocca "Aggiungi piatto" → si apre un bottom sheet "Nuovo piatto"
4. Scrivi il nome del piatto (es. "Pasta al pomodoro")
5. Nel campo ingredienti digita parte del nome di un articolo esistente (es. "Pomodor") → verifica che compaiano suggerimenti dal catalogo
6. Tocca un suggerimento → verifica che diventi una chip rimovibile sotto il campo
7. Digita il nome di un articolo che non esiste ancora → verifica il bottone "Aggiungi “…”" → toccalo → verifica che diventi comunque una chip (e che l'articolo compaia poi anche nel Catalogo)
8. Tocca "Salva" → verifica che il piatto appaia nell'elenco con il conteggio ingredienti corretto
9. Tocca l'icona di modifica → verifica che nome e ingredienti siano precompilati; rimuovi un ingrediente toccando la sua chip → salva → verifica che il conteggio si aggiorni
10. Tocca l'icona cestino → conferma "Elimina piatto" nel bottom sheet → verifica che il piatto scompaia e appaia il toast "Piatto eliminato"
11. Ricarica la pagina → verifica che i piatti salvati persistano

### Flusso 13 — Pianificazione pasti: piatto dal catalogo + checklist ingredienti
1. Naviga su Pasti, tocca uno slot vuoto (es. "Pranzo" di lunedì) → si apre un bottom sheet con titolo "Lunedì · Pranzo"
2. Digita il nome di un piatto non esistente → verifica il bottone "Crea piatto “…”" → toccalo
3. Verifica che compaia la sezione INGREDIENTI con un campo "Aggiungi un ingrediente…"; digita e aggiungi 1-2 ingredienti (chip rimovibili) → tocca "Salva"
4. Verifica che lo slot nella grid mostri il nome del piatto appena creato
5. Vai su "Piatti" (catalogo) → verifica che il nuovo piatto sia presente con gli ingredienti aggiunti
6. Torna su Pasti, riapri lo stesso slot → verifica che gli ingredienti siano mostrati come checklist con checkbox tutte spuntate di default
7. Deseleziona un ingrediente → "Salva" → ricarica la pagina → riapri lo slot → verifica che la deselezione sia persistita
8. Tocca "Cambia piatto" → verifica che il campo si svuoti e digitando il nome di un piatto già esistente compaia come suggerimento → selezionalo → verifica che gli ingredienti tornino tutti spuntati
9. Tocca "Rimuovi piatto" → verifica che lo slot torni a "—" e che il piatto resti comunque nel catalogo "Piatti"

### Flusso 14 — Import ingredienti pianificati nella lista della spesa
1. Su Pasti, pianifica lo stesso piatto (con lo stesso ingrediente spuntato) per due pasti diversi della settimana (es. pranzo lunedì e cena martedì)
2. Verifica che in fondo alla pagina siano presenti due bottoni: "Vai alla lista della spesa" (comportamento invariato, solo navigazione) e "Importa piatti e vai alla lista"
3. Tocca "Importa piatti e vai alla lista" → verifica di essere portato su Lista della spesa
4. Verifica che l'ingrediente selezionato compaia con quantità 2 (una per ogni occorrenza pianificata) e il toast "2 ingredienti aggiunti alla lista"
5. Torna su Pasti senza aver pianificato nulla di nuovo (o con nessun ingrediente selezionato) → tocca "Importa piatti e vai alla lista" → verifica che navighi comunque alla lista, senza toast e senza errori
