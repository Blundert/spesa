### Flusso 1 — Onboarding prima apertura
1. Vai su http://localhost:5173 (con dati resettati / prima apertura)
2. Verifica che venga mostrata la schermata di onboarding (slide 1: "Benvenuto in Spesa")
3. Avanza tra le 4 slide tramite il pulsante "Avanti": "Benvenuto in Spesa", "Pianifica la settimana", "La tua lista", "Al supermercato"
4. Verifica che l'ultima slide mostri il pulsante "Inizia"
5. Clicca "Inizia"
6. Verifica che si apra il tour in-app sulla Lista (indicatore "1 / 4"): evidenzia i titoli "Lista Pasti"
7. "Avanti" → 2/4 evidenzia la pill in basso → "Avanti" → 3/4 il pannello della pill si apre da solo ed è evidenziato il blocco "Nuova spesa" (buoni + "Inizia la spesa"); toccare "Inizia la spesa" non fa nulla
8. "Avanti" → il pannello si richiude, 4/4 evidenzia il cerchio del menu; "Indietro" riapre il pannello al passo 3
9. Clicca "Salta" (o "Fine" all'ultimo passo) → il tour si chiude, nessun pannello resta aperto, la Lista è visibile senza overlay
10. Il tour parte dalla Lista anche se lo si riavvia da Impostazioni → "Ripeti tutorial"

### Flusso 2 — Aggiunta articolo alla lista
1. Apri l'app: la schermata principale è la Lista
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
2. La Lista si apre come home
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

### Flusso 6 — Eliminazione settimana dallo storico
1. Naviga su http://localhost:5173/storico (con almeno una sessione di spesa salvata)
2. Verifica che le sessioni siano raggruppate per settimana con intestazione (es. "9 – 15 giu") e icona cestino
3. Clicca l'icona cestino accanto a una settimana
4. Verifica che si apra un BottomSheet con il titolo "Eliminare la settimana …?" e i pulsanti "Elimina settimana" e "Annulla"
5. Clicca "Annulla" — verifica che il sheet si chiuda e la settimana sia ancora visibile
6. Clicca nuovamente il cestino e poi "Elimina settimana"
7. Verifica che la settimana scompaia dalla lista e appaia il toast "Settimana eliminata"

### Flusso 7 — Modifiche nel Catalogo si riflettono subito nella Lista
1. Vai su Lista → aggiungi "Latte" (categoria: Frigo)
2. Catalogo → sposta "Latte" in "Dispensa" → Lista: "Latte" sotto "Dispensa" (non "Frigo") ✓
3. Catalogo → rinomina "Latte" in "Latte Fresco" → Lista: compare "Latte Fresco" senza flash ✓
4. Catalogo → rinomina la categoria "Dispensa" in "Dispensa 2" → Lista: intestazione gruppo mostra "Dispensa 2" ✓
5. Catalogo → elimina "Latte Fresco" → Lista: l'articolo scompare immediatamente ✓

### Flusso 8 — Pianificazione inizia dal giorno configurato
1. Vai su Impostazioni → imposta il giorno di inizio su "Mer"
2. Naviga su Pasti
3. Verifica che il primo giorno visualizzato sia "MER" e l'ultimo "MAR"
4. Torna su Impostazioni → reimposta il giorno di inizio su "Lun"
5. Verifica che i giorni nella schermata Pasti tornino a LUN→DOM

### Flusso 9 — Grafico andamento Statistiche e selettore range
1. Con almeno due sessioni di spesa completate (anche in settimane diverse), naviga su Statistiche
2. Verifica che il selettore range sia visibile sopra il riepilogo con le chip: "7 giorni", "30 giorni", "3 mesi", "6 mesi", "Tutto", "Personalizzato"
3. Il default è "30 giorni" (chip evidenziata in nero)
4. Nella sezione "ANDAMENTO" verifica che il grafico mostri barre per le settimane con spesa
5. Ogni barra deve avere: l'importo (€XX) sopra la barra e la data in formato "G/M" sotto
6. Le barre vuote (settimane senza spesa) devono essere basse e grigie; le settimane iniziali vuote non vengono mostrate
7. Seleziona "Tutto" → il grafico mostra tutte le settimane dalla prima sessione a oggi e i totali crescono
8. Seleziona "7 giorni" → solo le sessioni degli ultimi 7 giorni
9. Se hai cambiato il giorno di inizio settimana nelle Impostazioni, le barre devono essere posizionate in base al nuovo giorno di inizio (non al vecchio)

### Flusso 10 — Statistiche: range di date personalizzato e "Mese corrente"
1. Su Statistiche, tocca la chip "Personalizzato" → si apre un bottom sheet "Intervallo personalizzato" con un bottone "Mese corrente" e due campi data "Da"/"A" (precompilati a oggi)
2. Tocca "Mese corrente" → verifica che lo sheet si chiuda subito e che la chip mostri l'intervallo dal 1° del mese a oggi (es. "1 ago – 8 ago")
3. Verifica che il grafico "ANDAMENTO" e il riepilogo si aggiornino di conseguenza
4. Ricarica la pagina → verifica che il range personalizzato applicato persista
5. Riapri la chip "Personalizzato" → cambia manualmente "Da" e "A" a un intervallo completamente nel passato (es. un mese intero precedente) → tocca "Applica"
6. Verifica che il grafico "ANDAMENTO" si fermi alla settimana del campo "A" (non si estenda fino a oggi) e che il riepilogo mostri solo le sessioni in quell'intervallo
7. Verifica che il campo "A" non permetta di selezionare una data futura (max = oggi) e che "Da" non possa superare "A"
8. Seleziona di nuovo un preset (es. "30 giorni") → verifica che la chip "Personalizzato" torni all'etichetta generica "Personalizzato" (non mostri più le date)

### Flusso 11 — Modifica sessione di spesa dallo storico
1. Con almeno una sessione di spesa completata, naviga su Storico
2. Clicca su una sessione per aprire il dettaglio
3. **Modifica data**: clicca sulla data (testo sottolineato punteggiato) → si apre il date picker nativo → scegli una data diversa → verifica il toast "Modifiche salvate" e che la data si aggiorni; se la nuova data è in una settimana diversa, la sessione deve spostarsi nel gruppo corretto nello Storico
4. **Modifica supermercato**: clicca sul nome del supermercato nell'intestazione → si apre il picker supermercati → seleziona un negozio diverso → verifica il toast "Modifiche salvate" e che l'intestazione si aggiorni
5. **Modifica prezzo/quantità**: clicca su una riga acquisto → si apre il tastierino prezzi con il prezzo attuale precompilato e lo stepper quantità → modifica prezzo e/o quantità → clicca "Conferma" → verifica il toast "Modifiche salvate" e che il totale della sessione si aggiorni di conseguenza
6. **Sessione non completata**: una sessione con "Fine" non premuto appare nello Storico con badge arancione "Non completata" → tap su di essa → nell'intestazione appare la scritta "Non completata" sotto il nome del supermercato → pulsante "Concludi spesa" visibile sopra la lista acquisti → tap → si apre il tastierino con il totale pre-calcolato → conferma → sessione ora conclusa (badge sparisce, pulsante sparisce), gli articoli acquistati in questa sessione spariscono dalla lista della spesa (gli altri restano), toast "Spesa salvata"
7. **Modifica totale (spesa conclusa)**: su una sessione conclusa, tocca il numero totale grande → si apre il tastierino prezzi precompilato col totale attuale, senza stepper quantità → inserisci un nuovo importo → conferma → verifica il toast "Modifiche salvate" e che il totale mostrato cambi; ricarica la pagina e verifica che il nuovo totale persista. Prima della conclusione della spesa il totale **non** deve essere tappabile.
8. **Reset al totale calcolato**: dopo aver modificato il totale come sopra, tocca di nuovo il totale per riaprire il tastierino → deve comparire un bottone secondario "Usa il totale calcolato (€X)" con X pari alla somma dei prezzi degli articoli → tap → il totale mostrato torna a essere la somma degli articoli, toast "Modifiche salvate". Riapri il tastierino: il bottone secondario non deve più comparire (nessun override attivo) finché non si modifica di nuovo il totale a mano.

### Flusso 12 — Fine spesa non svuota gli articoli non acquistati
1. Vai sulla Lista (titolo "Lista" in alto) e aggiungi due articoli, es. "Latte" e "Pane"
2. Naviga su http://localhost:5173/spesa, scegli un supermercato per avviare la sessione
3. Verifica che entrambi appaiano in "Da prendere"
4. Clicca su "Latte", inserisci un prezzo e conferma — verifica che si sposti in "Nel carrello"
5. Clicca "Termina spesa", conferma il totale
6. Vai sulla Lista (titolo "Lista" in alto): verifica che "Pane" sia ancora presente (non acquistato) e che "Latte" sia sparito (acquistato)

### Flusso 13 — Aggiornamento automatico app + notifica versione
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

### Flusso 14 — Catalogo piatti
1. Dal menu (cerchio nero) → gruppo "Gestisci", apri "Piatti"
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

### Flusso 15 — Pianificazione pasti: piatto dal catalogo + checklist ingredienti
1. Tocca il titolo grigio "Pasti" accanto a "Lista", tocca uno slot vuoto (es. "Pranzo" di lunedì) → si apre un bottom sheet con titolo "Lunedì · Pranzo"
2. Verifica che, finché stai scrivendo il nome del piatto, il bottone "Salva" **non** sia visibile. Digita il nome di un piatto non esistente → verifica il bottone "Crea piatto “…”" → toccalo → ora compare "Salva"
3. Verifica che compaia la sezione INGREDIENTI con un campo "Aggiungi un ingrediente…"; digita e aggiungi 1-2 ingredienti (chip rimovibili) → tocca "Salva"
4. Verifica che lo slot nella grid mostri il nome del piatto appena creato
5. Vai su "Piatti" (catalogo) → verifica che il nuovo piatto sia presente con gli ingredienti aggiunti
6. Torna su Pasti, riapri lo stesso slot → verifica che gli ingredienti siano mostrati come checklist con checkbox tutte spuntate di default
7. Deseleziona un ingrediente → "Salva" → ricarica la pagina → riapri lo slot → verifica che la deselezione sia persistita
8. Tocca "Cambia piatto" → verifica che il campo si svuoti e digitando il nome di un piatto già esistente compaia come suggerimento (senza bottone "Salva" visibile durante la ricerca) → selezionalo → verifica che gli ingredienti tornino tutti spuntati e che "Salva" ricompaia
9. Tocca "Rimuovi piatto" → verifica che lo slot torni a "—" e che il piatto resti comunque nel catalogo "Piatti"

### Flusso 16 — Import ingredienti pianificati nella lista della spesa
1. Su Pasti, pianifica lo stesso piatto (con lo stesso ingrediente spuntato) per due pasti diversi della settimana (es. pranzo lunedì e cena martedì)
2. Verifica che in fondo alla pagina siano presenti due bottoni: "Vai alla lista della spesa" (comportamento invariato, solo navigazione) e "Importa piatti e vai alla lista"
3. Tocca "Importa piatti e vai alla lista" → verifica di essere portato sulla Lista
4. Verifica che l'ingrediente selezionato compaia con quantità 2 (una per ogni occorrenza pianificata) e il toast "2 ingredienti aggiunti alla lista"
5. Torna su Pasti senza aver pianificato nulla di nuovo (o con nessun ingrediente selezionato) → tocca "Importa piatti e vai alla lista" → verifica che navighi comunque alla lista, senza toast e senza errori

### Flusso 17 — Autocomplete in "Aggiungi fuori lista" (durante la spesa)
1. Avvia una sessione di spesa, tocca "Aggiungi fuori lista"
2. Digita parte del nome di un articolo già esistente nel catalogo (es. le prime lettere di "Latte") → verifica che compaiano suggerimenti con nome e categoria
3. Tocca un suggerimento → verifica che si apra direttamente il tastierino prezzi (senza dover toccare "Continua") → conferma un prezzo
4. Vai su Catalogo → verifica che l'articolo sia comparso nella categoria corretta (quella del suggerimento), non in "Altro"
5. Torna su Spesa, tocca di nuovo "Aggiungi fuori lista", digita un nome che non corrisponde a nulla → verifica che non compaia alcun suggerimento, solo il bottone "Continua" → conferma un prezzo
6. Vai su Catalogo → verifica che questo secondo articolo sia comparso sotto "Altro"
7. Tocca "Aggiungi fuori lista", digita un nome nuovo (es. "Zenzero candito") → "Continua" → nel tastierino verifica i due bottoni "Aggiungi senza prezzo" e "Aggiungi al carrello"
8. Tocca "Aggiungi senza prezzo" → toast "… aggiunto da prendere" → l'oggetto compare tra le voci da prendere (categoria corretta, qui "Altro"), il totale non cambia
9. Tocca l'oggetto → tastierino → inserisci un prezzo → "Aggiungi al carrello" → l'oggetto passa in "Nel carrello" col prezzo e il totale si aggiorna
10. Ripeti con un suggerimento (es. "Latte"): toccando il suggerimento si apre il tastierino, "Aggiungi senza prezzo" lo mette da prendere nella sua categoria

### Flusso 18 — Bottom sheet con input e tastiera (test su dispositivo iOS reale)
1. Su un iPhone reale (non simulabile in desktop), apri uno dei bottom sheet con un campo di testo: Catalogo → "Aggiungi categoria" (o "Rinomina categoria/articolo"), Supermercati → "Nuovo supermercato", Spesa → "Aggiungi fuori lista", Piatti → "Aggiungi piatto", Pasti → tocca uno slot vuoto, Statistiche → chip "Personalizzato"
2. Verifica che il sheet si apra quasi a schermo intero (non all'altezza parziale usata dagli altri sheet, es. le conferme di eliminazione)
3. Senza toccare nulla, verifica che il campo riceva il focus solo **dopo** che il sheet ha finito di salire (mai durante l'animazione). Se la tastiera non compare da sola, tocca il campo → la tastiera compare e il sheet **resta fermo**: titolo, campo e bottone restano visibili in alto, la tastiera copre solo la parte bassa (vuota) del sheet. Mai una schermata bianca senza contenuto
4. Su un piatto/pasto con lista ingredienti lunga: con la tastiera aperta scrolla il contenuto del sheet → tutto, fino al bottone in fondo, si può portare sopra la tastiera
5. Chiudi la tastiera (✓ della barra iOS o tap fuori dal campo) → il sheet resta quasi a schermo intero, senza salti
6. In Sessione/Spesa → store picker: il sheet ha l'altezza normale finché non tocchi "Aggiungi supermercato" → si espande quasi a schermo intero e la tastiera si comporta come al punto 3
7. Verifica che il drag-to-dismiss (swipe verso il basso sull'handle) funzioni ancora normalmente
8. Chiudi il sheet con la tastiera aperta → la pagina sottostante (es. Pasti) torna intatta, senza aree bianche o scroll spostato

### Flusso 19 — Modifica buoni pasto di una spesa (durante e dopo)
1. Avvia una nuova spesa con 2 buoni da €8,00 (barra in basso → stepper → "Inizia la spesa") e scegli un supermercato
2. Nella riga sotto l'hero ("€X spesi · N oggetti nel carrello · 2 buoni") tocca "2 buoni" (sottolineato punteggiato) → si apre il sheet "Modifica buoni" con gli stepper precompilati a 2 / €8,00
3. Porta i buoni a 3 e il valore a €7,50 → "Salva" → la riga mostra "3 buoni" e il "Di tasca tua" si ricalcola con 3 × €7,50, toast "Modifiche salvate"
4. Porta i buoni a 0 → "Salva" → la riga mostra "0 buoni" (resta visibile e tappabile)
5. Riapri il sheet, modifica gli stepper e chiudilo con swipe/tap fuori senza salvare → i valori non cambiano; riaprendolo riparte dai valori salvati
6. Aggiungi un articolo al carrello (es. €30,00) → "Di tasca tua" = spesa − buoni × valore; modifica di nuovo i buoni, ricarica la pagina e verifica che il valore persista
7. Tocca "Fine" e conferma la spesa → apri la sessione dallo Storico → sotto il totale c'è la riga "N buoni · €Y" (visibile anche con 0 buoni) → tocca → sheet con i valori della sessione → modifica → "Salva" → toast "Modifiche salvate", riga aggiornata
8. Tocca la pill in basso: nel riepilogo della settimana "Di tasca tua", "Buoni spesi" e "Rimanenti" riflettono i nuovi buoni della sessione
9. Ripeti il punto 7 su una sessione "Non completata" dello Storico

### Flusso 20 — Barra di stato chiara e velo con angoli arrotondati (test su iPhone, app installata in Home)
1. Apri l'app dalla Home: la barra di stato (ora, batteria) è chiara come lo sfondo dell'app
2. Apri un qualsiasi bottom sheet (es. Pasti → slot vuoto, menu ☰, conferma eliminazione) → la barra **resta chiara**; il velo grigio sotto di essa ha gli angoli superiori sinistro e destro arrotondati (si vede il chiaro negli angoli). Negli sheet a tutto schermo con campo di testo la fascia di velo sopra lo sheet è sottile (12px) e le due curve sono parallele (concentriche); ai lati dello sheet non c'è grigio. La pagina non scorre in orizzontale
3. Chiudi il sheet → nessun residuo grigio, barra sempre chiara. Ripeti più volte
4. In Spesa tocca un prezzo → tastierino prezzi: stesso velo con angoli arrotondati
5. In Spesa con tessera fedeltà → apri la tessera: velo quasi nero, anch'esso con angoli superiori arrotondati

### Flusso 21 — Nessuno zoom al tocco dei campi di testo (test su iPhone)
1. Pasti → slot vuoto → scrivi un nome piatto e conferma → tocca "Aggiungi un ingrediente…" → la pagina **non** fa zoom (lo sheet resta a tutta larghezza, bordi arrotondati visibili)
2. Ripeti su Piatti → modifica piatto → campo ingrediente, e su Statistiche → "Personalizzato" → campi data
3. Chiudi la tastiera e prova lo zoom con due dita → deve ancora funzionare (accessibilità)

### Flusso 22 — Valore predefinito dei buoni pasto
1. Impostazioni → sezione "Buoni pasto" → "Valore predefinito" mostra €8,00 (al primo avvio)
2. Tocca "+" quattro volte → €10,00; tocca "−" fino in fondo → si ferma a €0,50; riporta a €10,00
3. Ricarica la pagina → il valore resta €10,00
4. Pill in basso → "Nuova spesa": "Valore buono" parte da €10,00 → avvia la spesa con 1 buono → "Di tasca tua" usa €10,00
5. Apri una spesa precedente dallo Storico → i suoi buoni mantengono il valore con cui era stata fatta (non diventano €10,00)

### Flusso 23 — Svuota lista
1. Vai su Lista con la lista vuota → in alto a destra **non** c'è "Svuota"
2. Aggiungi 3 oggetti (es. Latte, Pane, Uova) → compare "Svuota" accanto al titolo
3. Tocca "Svuota" → sheet "Svuotare «Spesa»?" con "Tutti gli oggetti della lista (3) verranno rimossi…" → "Annulla" → la lista è intatta
4. Tocca di nuovo "Svuota" → "Svuota lista" → toast "Lista svuotata", messaggio di lista vuota, "Svuota" sparisce
5. Vai su Catalogo → Latte, Pane e Uova sono ancora presenti (con i loro prezzi)

### Flusso 24 — Storico: totale calcolato e scarto dello scontrino
1. Avvia una spesa, metti nel carrello oggetti per un totale di es. €27,55 → "Fine" → cambia l'importo in €28,80 → "Conferma spesa"
2. Vai su Storico → la card mostra "… · 2 oggetti · calc. €27,55", a destra €28,80 e sotto l'etichetta arancione "+4,5%"
3. Ripeti con uno scontrino più basso degli oggetti → etichetta verde con "−…%"
4. Ripeti confermando esattamente il totale proposto → etichetta grigia "0%"
5. Una spesa "Non completata" (senza totale confermato) o con 0 oggetti → niente "calc." e niente etichetta
6. Apri una spesa e modificane il totale dal dettaglio → tornando allo Storico calcolato e scarto sono aggiornati

### Flusso 25 — Storico: buoni usati e di tasca tua
1. Vai su Storico → ogni card ha in fondo, separata da una linea sottile, la riga "N buoni" a sinistra e "di tasca tua €X" a destra
2. Spesa con buoni (es. 2 da €8,00, scontrino €28,80) → "2 buoni · −€16,00" e "di tasca tua €12,80"
3. Spesa senza buoni → "0 buoni" e "di tasca tua" uguale al totale
4. Buoni che coprono più del totale → "di tasca tua €0,00" (mai negativo)
5. Apri una spesa, modifica i buoni dal dettaglio → tornando allo Storico la riga è aggiornata

### Flusso 26 — Statistiche: buoni pasto e di tasca tua
1. Vai su Statistiche → filtro "Tutto" → sotto "Riepilogo" c'è la card "Buoni pasto e di tasca tua"
2. La barra è divisa in grigio (coperto dai buoni) e scuro (di tasca tua) in proporzione; sotto, le due voci con importo e percentuale (le percentuali sommano a 100%) e "Buoni usati"
3. Verifica i conti: "Coperto dai buoni" + "Di tasca tua" = "Totale speso" del Riepilogo
4. Una spesa con più buoni del totale (es. €10,00 con 3 buoni da €8,00) conta €10,00 come coperto e €0 di tasca tua (mai negativo)
5. Cambia filtro (7 giorni, 30 giorni, Personalizzato) → la card segue il periodo; in un periodo senza spese la card non compare

### Flusso 27 — Navigazione: Lista e Pasti, pill, menu e frecce
1. Apri l'app → si apre la Lista; in alto "Lista" scuro e "Pasti" grigio. Visita http://localhost:5173/lista → reindirizza a `/`
2. Tocca "Pasti" → dissolvenza breve, ora "Pasti" è scuro e "Lista" grigio; non c'è freccia indietro e la barra in basso resta visibile. Cambia settimana con le frecce. In alto a destra il link "Settimane" apre "Settimane pianificate" (‹ torna a Pasti)
3. Tocca la pill → il pannello mostra "Questa settimana · …", la card "Di tasca tua", Speso / Buoni spesi / Rimanenti, le ultime spese (al massimo 3, con "Vedi tutte (N)" se sono di più) e sotto "Nuova spesa" con la riga "Lista", i buoni e "Inizia la spesa". Tocca una spesa → si chiude il pannello e si apre il suo dettaglio
4. Apri il menu → tre gruppi: "Le tue spese" (Storico, Statistiche), "Gestisci" (Liste, Catalogo, Piatti, Supermercati), Impostazioni; nessuna voce "Lista" o "Settimana"
5. Da Pasti apri Storico → la pagina entra da destra, con la freccia ‹ e la barra in basso. Dal menu apri Statistiche → dissolvenza; premi ‹ → torni su Pasti, sulla stessa settimana di prima
6. Storico → tocca una spesa → il dettaglio entra da destra con la barra in basso; ‹ → torni allo Storico (la pagina rientra da sinistra); ‹ → torni alla sezione principale
7. Apri direttamente http://localhost:5173/storico/<id> (senza cronologia) → ‹ porta allo Storico; apri http://localhost:5173/changelog → ‹ porta a Impostazioni
8. Avvia una spesa → la schermata della spesa in corso è a schermo intero, senza pill né menu
9. Con "Riduci movimento" attivo nel sistema → i cambi pagina avvengono senza animazioni

### Flusso 28 — Più liste della spesa
1. Apri la Lista → sotto "Lista  Pasti" c'è la riga delle schede con "Spesa ⌄" sottolineata e "+". Le voci di prima sono in "Spesa"
2. Tocca "+" → "Nuova lista": scrivi "Casa", scegli "Coop" → "Crea lista" → toast "«Casa» creata", la scheda "Casa · Coop" è attiva e vuota
3. Aggiungi "Latte" a Casa e anche a Spesa → le due voci hanno quantità indipendenti. Tocca "Spesa" e "Casa" per passare dall'una all'altra; ricarica → resta aperta l'ultima
4. Ritocca la scheda attiva → "Modifica lista" con nome e supermercato; cambia nome → "Salva" → la scheda si aggiorna
5. Pill → riga "Lista" su "Casa · Coop" → toccala, scegli "Spesa" e poi di nuovo "Casa" → "Inizia la spesa" → si entra subito in corsia da Coop (niente scelta del negozio), con "CASA" sopra la pillola del supermercato. In corsia c'è solo Latte
6. Prendi Latte → "Fine" → conferma → Latte esce da Casa ma resta in Spesa. Nello Storico la card mostra "CASA" sopra "Coop"; nel pannello della pill la spesa mostra "Casa · <data>"
7. Con una lista senza supermercato (Spesa) → "Inizia la spesa" mostra la scelta del supermercato come prima
8. "Carica la tua spesa solita" in Casa propone solo i prodotti comprati con Casa; una lista nuova senza spese non lo mostra
9. Pasti → "Importa piatti e vai alla lista" → sheet "In quale lista aggiungo gli ingredienti?" con l'ultima usata per i pasti selezionata → "Aggiungi a «…»" → si apre la Lista su quella scheda. Con una sola lista non chiede niente
10. Ritocca "Casa" → "Archivia lista" → toast, la scheda sparisce. Con una sola lista attiva "Archivia lista" non c'è
11. Menu → Gestisci → "Liste": frecce ↑↓ per riordinare (l'ordine delle schede segue); in "Archiviate" Casa con "Ripristina" (torna tra le schede con i suoi prodotti) ed "Elimina" → conferma "Elimina definitivamente" → sparisce, la spesa di Casa resta nello Storico senza etichetta
12. Impostazioni → esporta un backup e reimportalo → liste, schede e voci tornano uguali

### Flusso 29 — Tastierino calcolatrice
1. Avvia una spesa e tocca un prodotto da prendere → nel tastierino, in alto a sinistra, l'interruttore `123 | ±×÷` con `123` attivo; il tastierino di sempre funziona come prima
2. Digita `1 2 0` (€1,20) → tocca `±×÷` → la calcolatrice (5 colonne: cifre, `( ) × ÷ + − % C`, `,` e `⌫`) parte con `1,20` nella riga sopra il risultato
3. Digita `− 3 0 %` → la riga mostra `1,20 − 30%` e il risultato grande è €0,84, il bottone dice "Aggiungi al carrello €0,84"
4. Digita `×` → espressione incompleta: il risultato resta €0,84 in grigio e il bottone è disattivato. Digita `(` → diventa `× (`; digita `2` → il risultato torna nero (la parentesi aperta si chiude da sola)
5. Prova le regole: due operazioni di fila → la seconda sostituisce la prima; `)` senza parentesi aperte non fa nulla; `,` due volte nello stesso numero → una sola; più di due decimali → ignorati; `C` svuota (€0,00); `5 ÷ 0` → bottone disattivato
6. Tocca `123` → torna il tastierino semplice con il risultato (arrotondato al centesimo). Conferma → nel carrello col prezzo calcolato e la quantità scelta con lo stepper (il risultato è il prezzo unitario)
7. Tocca un altro prodotto dopo aver scelto `±×÷` → si riapre in calcolatrice; ricarica la pagina → la modalità resta quella
8. "Fine" → "Quanto hai speso?" in calcolatrice parte dal totale calcolato (es. `42,80`) → `− 10%` → conferma il risultato
9. Nello Storico, modifica un acquisto e il totale di una spesa: la calcolatrice c'è anche lì, con lo stesso comportamento

### Flusso 30 — Scroll che non si blocca (test su iPhone, app installata in Home)
1. Apri la Lista (o lo Storico) con abbastanza voci da scorrere. Scorri fino in cima e continua a trascinare verso il basso più volte di fila → la pagina rimbalza ma, appena trascini verso l'alto, scorre subito (senza bisogno di un tap)
2. Ripeti in fondo alla pagina, trascinando verso l'alto oltre la fine e poi subito verso il basso
3. Ripeti dentro un pannello lungo (es. menu o riepilogo della pill) e sulle schede delle liste in orizzontale
4. In nessun caso lo scroll resta "congelato" finché non si tocca lo schermo

### Flusso 31 — Ordine alfabetico di categorie e prodotti
1. Aggiungi alla lista prodotti di categorie diverse, in ordine sparso (es. Zucchine, Pane, Banane, Acqua, Latte)
2. Lista → le categorie sono in ordine alfabetico e, dentro ognuna, i prodotti pure (Banane prima di Zucchine), indipendentemente dall'ordine di inserimento; maiuscole e accenti non contano
3. Avvia una spesa → in corsia le categorie e i prodotti "da prendere" sono nello stesso ordine alfabetico (prima seguivano l'ordine di creazione delle categorie). Il carrello resta in ordine di acquisto
4. Menu → Catalogo → dentro ogni categoria i prodotti sono in ordine alfabetico

### Flusso 32 — Versione desktop (viewport ≥ 768 px)
1. Apri l'app con la finestra larga almeno 768 px → menu laterale fisso a sinistra (Dashboard, Statistiche, Catalogo, Storico, Impostazioni), nessuna bottom bar. Con la finestra stretta (< 768 px, poi ricarica) torna l'app mobile identica a prima
2. Dashboard → a tutta larghezza accanto al menu, scroll interno nell'area contenuto; 4 card (Totale speso, Sessioni, Spesa media, Supermercato preferito), grafico "Andamento spesa settimanale" con due linee (totale e di tasca), torta categorie e barre supermercati. Cambia l'intervallo (4 sett. / 12 sett. / 6 mesi / 1 anno / Tutto) → i numeri e i grafici si aggiornano. Senza spese concluse nel periodo → messaggio "Nessuna sessione completata…"
3. Statistiche → spese per giorno della settimana (lun…dom), copertura buoni (buoni + di tasca impilati), evoluzione categorie (le 6 principali più "Altre", legenda sotto il grafico) e tabella dettaglio supermercati con data ultima visita nel formato dell'app
4. Catalogo → colonna categorie con conteggi (clic su una categoria filtra, "Tutte" li mostra tutti), elenco articoli in ordine alfabetico con categoria e ultimo prezzo, ricerca per nome; con filtro senza risultati → "Nessun articolo trovato."
5. Storico → tabella delle spese (data, supermercato, lista, buoni, di tasca, totale); filtro per supermercato e intervallo date (inclusi gli estremi); "Azzera filtri" li toglie; una spesa in corso mostra "In corso" al posto del totale
6. Impostazioni → cambia lingua (tutto il desktop passa subito in inglese/italiano), valore predefinito del buono con − / +, giorno di inizio settimana (toast "Impostazione salvata", i grafici si ricalcolano), "Esporta dati" scarica il JSON, "Importa dati" con un file valido chiede conferma e poi toast "Dati importati"; con un file non valido → "File non valido"
7. I valori impostati qui (lingua, buono, inizio settimana) sono gli stessi dell'app mobile: ricarica a viewport stretto e verifica che siano rimasti

### Flusso 33 — Desktop: pagine, ordinamento, anno, colori
1. Menu laterale desktop: Dashboard, Lista, Pasti, Storico, Statistiche; gruppo "Gestisci": Liste, Catalogo, Piatti, Supermercati; poi Impostazioni. In alto "Inizia la spesa" con il riepilogo della settimana (di tasca tua, speso, buoni)
2. Tabelle ordinabili (Storico, Catalogo, dettaglio supermercati nelle Statistiche, Supermercati, Liste, Piatti, Pianificazioni, acquisti di una spesa, storico prezzi): clic sull'intestazione → ordina (▲), secondo clic → inverte (▼); i valori vuoti restano sempre in fondo
3. Catalogo → ordina per Articolo, Categoria e Ultimo prezzo; clic su una riga apre il dettaglio articolo (prezzo medio/ultimo/min/max, storico prezzi, per supermercato)
4. Storico → clic su una riga apre il dettaglio della spesa ("← Storico" per tornare); dentro: acquisti ordinabili, "Modifica importo/data/buoni/supermercato", "Elimina sessione"
5. Date con anno ovunque (es. "7 giu 2026", settimana "31 ott – 6 nov 2026", a cavallo d'anno "29 dic 2025 – 4 gen 2026")
6. Statistiche e Dashboard a colori: blu = totale, verde = coperto dai buoni, arancione = di tasca tua, categorie con colori distinti; nella Dashboard ogni supermercato mostra l'importo in euro accanto alla barra
7. Lista → aggiungi voci (suggerimenti, chip), stepper quantità, ×, "Carica la tua spesa solita", schede delle liste (+ per crearne una, tocca la scheda per modificare/archiviare)
8. Pasti → griglia settimanale giorni × pranzo/cena; clic su una cella: scegli o crea il piatto, spunta gli ingredienti, Salva/Rimuovi; "Importa piatti e vai alla lista" (con più liste chiede in quale); "Settimane" apre le pianificazioni
9. "Inizia la spesa" → pannello con riepilogo, lista, buoni e valore → "Inizia la spesa" apre la spesa in corso (se la lista non ha supermercato chiede di sceglierlo). Clic su un prodotto → importo (accetta calcoli come `3,50-10%`) e quantità → "Aggiungi al carrello"; "Fine spesa" → importo calcolato precompilato → "Conferma spesa" porta allo Storico
10. Supermercati → aggiungi/elimina, tessera fedeltà (carica/sostituisci/rimuovi), ultima visita con anno. Piatti → aggiungi/modifica/elimina con ingredienti. Liste → riordino con frecce, archiviate da ripristinare/eliminare
11. Impostazioni → tutte quelle del mobile: versione (→ Novità), aggiorna/installa app, lingua, buoni, inizio settimana, tutorial, esporta/importa, azzera tutti i dati (con conferma), sincronizzazione GitHub (guida token, campi, sync automatico, sincronizza ora, scarica da remoto), debug viewport
12. Con la finestra < 768 px (e ricarica) l'app mobile è identica a prima

### Flusso 34 — Desktop ↔ mobile al volo e menu compatto
1. Da desktop (es. 1280 px) apri Statistiche (`/stats`), poi restringi la finestra sotto i 768 px senza ricaricare → compare l'app mobile sulla stessa pagina (`/statistiche`), niente schermo vuoto lungo, nessun errore in console. Riallarga → torna il desktop su `/stats`
2. Ripeti da una pagina qualsiasi (Storico, Pasti, Catalogo, Impostazioni): si resta sulla stessa pagina. Da desktop `/lista` ↔ mobile `/` (Lista); la Dashboard desktop (`/`) su mobile mostra la Lista
3. Apri direttamente `/stats` con la finestra stretta → atterri su `/statistiche`; apri `/` con la finestra larga → è la Dashboard (non la Lista)
4. I dati e lo stato (es. spesa in corso, liste) sono gli stessi nelle due interfacce
5. Telefono in orizzontale (es. 900×420, altezza sotto i 500 px) → resta l'interfaccia mobile
6. Menu laterale: in fondo il pulsante ‹ / › compatta e riespande (solo icone con tooltip, "Inizia la spesa" diventa un'icona carrello, le voci "Gestisci" sono separate da una linea). Ricarica: la scelta resta
7. Senza una scelta manuale il menu è compatto sotto i 1100 px e esteso sopra; con la scelta manuale vale quella a qualsiasi larghezza
8. A 768 px e 800 px ogni pagina è utilizzabile: spaziature ridotte, tabelle che scorrono di lato, griglia dei pasti tutta visibile (Sab → Ven)

### Flusso 35 — Statistiche mobile non resta sul caricamento
1. Menu → Statistiche con l'intervallo "30 giorni" (quello predefinito) e dei dati → la pagina mostra subito Riepilogo, Buoni pasto e Andamento; non resta mai ferma sulla scritta "Conferma" al centro
2. Tocca "7 giorni", "3 mesi", "6 mesi", "Tutto", poi di nuovo "30 giorni" → ogni volta i numeri si aggiornano (i totali crescono passando da 7 giorni a 6 mesi) senza restare sul caricamento
3. Lascia la pagina aperta e riaprila dopo la mezzanotte: l'intervallo "N giorni" parte dalla mezzanotte di N giorni fa (cambia solo al cambio di giorno)
4. Su desktop (finestra larga) apri Statistiche, restringi sotto i 768 px: la pagina mobile Statistiche si apre e mostra i dati

### Flusso 36 — Chip e spesa solita personalizzabili per lista (mobile e desktop)
1. Lista → tocca la scheda attiva (⌄) → "Modifica lista": sotto il supermercato ci sono "Chip più proposti" e "Spesa solita", entrambi su "Automatico" con una riga che spiega da dove arrivano i prodotti. Nella creazione di una lista nuova non ci sono (si personalizzano dopo)
2. "Chip più proposti" → "Scelti da me": parte con i prodotti proposti adesso già selezionati ("N prodotti scelti"), mostrati come etichette con ×; tocca × per toglierne, cerca nel catalogo e spunta per aggiungerne (i nuovi vanno in fondo). Salva → i chip sotto il campo di aggiunta sono esattamente quelli scelti, nell'ordine scelto, senza limite di numero
3. Aggiungi alla lista uno dei prodotti scelti → il suo chip sparisce; rimuovilo dalla lista → il chip torna
4. "Spesa solita" → "Scelti da me": la card "Carica la tua spesa solita" propone i prodotti scelti (solo se la lista ha meno di 3 voci) e "Carica" li aggiunge tutti; quelli già in lista non sono riproposti
5. "Scelti da me" senza nessun prodotto: non compare niente (né chip né card) e il testo dice "Nessun prodotto scelto: non verrà proposto niente"
6. Torna ad "Automatico" e Salva → tornano i chip più comprati (6 su mobile, 10 su desktop) e la spesa solita calcolata dalle spese (8)
7. Con due liste le scelte sono indipendenti; elimina dal catalogo un prodotto scelto → sparisce dai suggerimenti senza errori
8. Passa da desktop a mobile (e viceversa) ridimensionando la finestra: le stesse scelte compaiono nell'altra interfaccia. Esporta e reimporta un backup: le scelte restano
