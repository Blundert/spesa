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
11. Impostazioni → tutte quelle del mobile: versione (→ Novità), aggiorna/installa app, lingua, buoni, inizio settimana, tutorial, esporta/importa, azzera tutti i dati (con conferma), un link "Sincronizzazione e cronologia" (la sync GitHub sta nella sua pagina, vedi Flusso 41), debug viewport
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

### Flusso 37 — Temi (mobile e desktop)
1. Impostazioni → sezione "Aspetto" (sotto Lingua): sei temi con campioni di colore e una riga di descrizione (Chiaro, Scuro, Salvia, Oceano, Notte blu, Contrasto alto), poi "Segui il sistema". Il tema attivo ha il segno di spunta (su desktop anche il bordo marcato)
2. Primo avvio o dati vecchi: il tema è Chiaro e l'app è identica a prima di questa versione (stessi colori, nessuna differenza visibile)
3. Tocca "Scuro" → cambia subito tutta l'app, senza ricaricare: sfondo, schede, testi, pulsanti, grafici (desktop e Statistiche mobile), toast e finestre. Ricarica la pagina → resta Scuro e non compare nemmeno un lampo di tema chiaro all'avvio
4. Prova uno per uno Salvia, Oceano, Notte blu, Contrasto alto: testo sempre leggibile, i pulsanti principali cambiano colore col tema (verde, blu…), i grafici mantengono riconoscibili totale, buoni e di tasca tua
5. "Segui il sistema" attivo: i campioni dei temi si disattivano e compare "In uso: … (scelto dal sistema)"; con il dispositivo in chiaro l'app è Chiaro, in scuro è Scuro, e cambia da sola se il dispositivo cambia tema. Disattivalo → torna il tema scelto
6. Cambia tema da desktop, poi restringi la finestra sotto i 768 px: l'app mobile ha lo stesso tema (e viceversa)
7. Il colore della barra del browser (Android/Chrome, Safari) segue lo sfondo del tema. Su iPhone con l'app installata in Home la barra di stato resta chiara: limite noto di iOS
8. Controlla in un tema scuro: Lista, Pasti, Storico (etichette verde/arancione dello scostamento), Statistiche, Catalogo, Supermercati, finestre di conferma, tastierino prezzi, tutorial

### Flusso 38 — Impostazioni desktop: disposizione delle schede
1. Impostazioni su desktop (1280 px) → "Aspetto" a tutta larghezza in alto; sotto due colonne di larghezza uguale e altezza simile (a sinistra Buoni pasto, Inizio settimana, App; a destra Lingua, Dati, Tutorial, Debug); in fondo "Sincronizzazione (GitHub)" a tutta larghezza. Nessun buco grande, nessuna scheda che si allarga da sola, nemmeno Lingua e Debug
2. Lo stesso su schermi molto larghi (1600–2560 px): sempre due colonne. Sotto circa 700 px di contenuto (finestra stretta) diventa una colonna sola
3. I sei campioni dei temi stanno su una sola riga quando c'è spazio, altrimenti 3 + 3; mai un campione da solo su una riga

### Flusso 39 — Sync: backup della scelta scartata (mobile e desktop)
Serve un repo GitHub di prova con token (Impostazioni → Sincronizzazione) e due dispositivi, o due profili del browser.
1. Dispositivo A: "Sincronizza ora" → nel repo compare `spesa-db.json`. Dispositivo B (profilo nuovo, solo dati iniziali): "Sincronizza ora" → scarica direttamente il remoto, senza toast di conflitto
2. Modifica qualcosa su A e su B (due articoli diversi), poi sincronizza da B → compare il toast "Dati diversi qui e sul remoto" con il solo pulsante "Rivedi e unisci" (vedi Flusso 42), senza scrivere nulla nel repo
3. Dalla schermata di unione scegli "Tutto locale" e applica → UN solo commit ("Merge …") con `spesa-db.json` aggiornato e in `backups/` le copie di locale e remoto scartati; toast "Unione applicata"
4. Rifai il conflitto e scegli "Tutto remoto" → stesso commit unico, con i dati del remoto; l'app ora ha i dati del remoto
5. "Scarica da remoto" o "Applica unione" con il token revocato (o offline): errore nel toast e i dati locali NON cambiano
6. "Scarica da remoto" in Impostazioni (con locale modificato dall'ultimo sync) → stesso backup `…-local.json`; con locale invariato dall'ultimo sync non crea nessun commit
7. Se il remoto cambia mentre si salva il backup compare "Il remoto è cambiato durante il salvataggio: riprova" e non si scrive nulla
8. Importa un file di backup da Impostazioni → i dati vengono sostituiti; in DevTools → Application → IndexedDB → spesa → safetySnapshots c'è la copia di prima (massimo 10)
9. Stessi passaggi 2–6 da desktop (≥ 768 px): il toast e i messaggi sono identici

### Flusso 40 — Sync automatico anche su desktop
1. Impostazioni su desktop (≥ 768 px) → attiva "Sync automatico" con un repo configurato. Ricarica la pagina → parte un sync all'apertura (se il remoto è cambiato compare "Dati scaricati")
2. Modifica un articolo dal desktop e lascia la pagina aperta oltre 3 minuti → il remoto riceve il commit "Backup …" senza premere nulla
3. Modifica qualcosa e passa a un'altra scheda del browser (o chiudi la scheda) → il push parte in background, senza toast
4. Con il sync automatico spento il desktop non sincronizza da solo (solo "Sincronizza ora")
5. Stesso comportamento di prima sul mobile (<768 px): nessuna regressione

### Flusso 41 — Pagina Sincronizzazione, cronologia e ripristino (mobile e desktop)
Serve un repo GitHub di prova con almeno due commit di `spesa-db.json` (e, per i backup, un conflitto risolto come nel Flusso 39).
1. Mobile: menu (cerchio in basso) → Gestisci → "Sincronizzazione"; la pagina ha "Collegamento" (guida token, campi, Salva, Sync automatico, Sincronizza ora, Scarica da remoto), "Cronologia" e "Guida". Impostazioni → "Sincronizzazione e cronologia" porta alla stessa pagina e non ha più i campi di sync
2. Desktop (≥ 768 px): voce "Sincronizzazione" nella barra laterale (sopra Impostazioni); collegamento a sinistra, cronologia a destra in tabella ordinabile per data, guida sotto. Impostazioni ha solo la scheda "Sincronizzazione (GitHub)" con il pulsante che apre la pagina; le altre schede restano bilanciate in due colonne
3. Senza repo configurato la cronologia dice "Collega un repository…"; con token sbagliato compare "Impossibile leggere la cronologia" e "Riprova"
4. Con il repo: la cronologia elenca "Versione sincronizzata" (commit del file dei dati), "Backup dei dati di questo dispositivo" / "Backup del repository" (file in backups/) e "Copia di sicurezza sul dispositivo" (con il motivo), dalla più recente
5. Tocca una voce → riepilogo "Rispetto ai dati di adesso": una riga per tabella (Si aggiungerebbero / Sparirebbero / Cambierebbero) e l'elenco delle spese con negozio e data; se è identica ai dati di adesso lo dice. Le statistiche degli articoli non contano come differenze
6. "Ripristina questa versione" → testo di conferma → "Ripristina": toast "Versione ripristinata" (con il backup salvato, se serviva) e i dati cambiano; nel repo c'è UN commit "Restore …" sopra la cronologia (nessun force-push) e, se il locale o il remoto non erano sincronizzati, il relativo file in backups/. Riaprendo la stessa voce è "Identica ai dati di adesso"
7. Ripristino con token revocato: errore e dati locali invariati. Una copia di sicurezza locale si ripristina senza rete e senza commit
8. "Guida": sette accordion, tutti chiusi all'apertura della pagina; ognuno si apre e si chiude da solo
9. Navigazione: la pagina si apre con scorrimento laterale dal menu e ‹ torna alla sezione principale; tra pagine del menu è dissolvenza. Cambiando tema (es. Scuro) e passando fra mobile e desktop resta leggibile

### Flusso 42 — Unione dei dati con anteprima (mobile e desktop)
Serve un repo di prova e due dispositivi con modifiche diverse (es. una settimana solo su uno, un articolo nuovo sull'altro).
1. In caso di conflitto il toast ha un solo pulsante "Rivedi e unisci" e resta finché non lo tocchi; lo stesso schermo si apre anche da Sincronizzazione → "Confronta e unisci" (disattivato senza repo configurato)
2. Mobile: la schermata ha ‹ che torna a Sincronizzazione, le scorciatoie "Tieni tutto / Tutto locale / Tutto remoto" e i gruppi per tipo (Settimane, Liste, Articoli, Negozi, Categorie, Piatti) con contatore. Desktop: gruppi a sinistra, "Risultato" fisso a destra, pulsante "Indietro"
3. Ogni gruppo mostra stato ("Solo su questo dispositivo", "Solo nel repository", "Diverso"), cosa contiene da una parte e dall'altra (es. "Spese 3 · Acquisti 32") e i pulsanti di scelta: Tieni/Togli, Non portare/Porta qui; per le settimane presenti da entrambe le parti anche Unione/Locale/Remoto
4. Di partenza è selezionato "tieni tutto" e il risultato mostra solo cose che si aggiungono (nessuna sparisce). Cambia una scelta (es. "Togli" su una settimana) → il risultato si aggiorna subito: "Sparirebbero" per quella settimana, su questo dispositivo e/o nel repository
5. Una settimana portata dal remoto con articoli, negozio o piatti che qui non esistono li aggiunge da sola, anche se il loro gruppo è su "Non portare"
6. Se i due lati coincidono: "I dati … coincidono: non c'è niente da unire." Se la lettura del remoto fallisce: messaggio di errore
7. "Applica unione" → conferma → toast "Unione applicata" (con il backup salvato) e si torna a Sincronizzazione. Nel repo UN commit "Merge …" con il file dei dati e i file in `backups/` (locale e remoto); le spese portate hanno id nuovi e gli acquisti restano collegati; le statistiche degli articoli sono coerenti con gli acquisti
8. Con il token revocato o il branch avanzato nel frattempo: errore e dati locali invariati

### Flusso 43 — Branch (mobile e desktop)
Serve un repo di prova con almeno due branch che contengono `spesa-db.json` (puoi crearne uno col passo 2 e poi sincronizzare).
1. Pagina Sincronizzazione → sezione "Branch" (su desktop sotto "Collegamento"): elenca i branch, quello attivo ha "· attivo" e non ha pulsanti; gli altri hanno "Passa a" e "Unisci qui". Senza repo configurato dice di collegarne uno
2. Scrivi un nome con spazi o caratteri speciali → "Nome non valido" e "Crea da qui" disattivato. Con un nome valido → toast "Branch creato" e compare nell'elenco (parte dal commit attuale del branch attivo); un nome già esistente dà errore e non crea niente
3. "Passa a" su un altro branch → conferma in riga ("I dati di adesso vengono sostituiti…") → "Passa": toast `Ora lavori su "…"`, i dati sono quelli di quel branch e il campo "Branch" del modulo mostra il nuovo nome. "Annulla" richiude la conferma senza cambiare niente
4. Con dati locali non ancora sincronizzati: prima del passaggio nel branch che lasci compare un commit "Back up local before switching to …" con il file in `backups/`; il toast indica il backup. Con il token revocato: errore e nessun cambiamento (né dati né branch)
5. Dopo il passaggio la Cronologia mostra le versioni del nuovo branch e "Sincronizza ora" lavora su di lui; ripassando al branch di prima i dati tornano quelli di prima
6. "Unisci qui" su un branch → schermata di unione con "Si porta qui il branch …" e le differenze rispetto al branch attivo; applicando c'è UN commit "Merge …" sul branch attivo
7. La guida ha la voce "Branch"

### Flusso 44 — Grafo dei commit con diff affiancato (solo desktop)
Solo interfaccia desktop (≥ 768 px): su mobile non c'è il grafo, la Cronologia (Flusso 41) copre l'elenco e il confronto. Serve un repo con almeno due branch e un'unione (Flusso 43).
1. Pagina Sincronizzazione su desktop → scheda "Grafo dei commit" sotto Collegamento/Cronologia: una riga per commit, dal più recente, con messaggio, data e a sinistra le corsie colorate; i branch hanno un'etichetta sul commit in punta; un commit di unione ha due linee in uscita e un branch che si apre/chiude ha una corsia in più
2. I colori delle corsie seguono il tema (provarne uno scuro); senza repo configurato la scheda dice di collegarne uno, con errore compare "Impossibile leggere il grafo" e "Riprova"
3. Tocca un commit → finestra con messaggio e sigla, "Confronta con" = "Commit precedente" (di partenza) e due colonne "Prima" / "Dopo": a sinistra in rosso ciò che sparisce o cambia, a destra ciò che compare, tabella per tabella; un commit senza modifiche dei dati dice "Nessuna differenza nei dati."
4. Cambia in "Dati di adesso": le colonne diventano "Dati di adesso" / "Questo commit"; per il primo commit del repo il confronto è con un backup vuoto
5. "Ripristina questo commit" → testo di conferma → "Ripristina": come nel Flusso 41 (un commit "Restore …" sopra la cronologia, backup prima, toast "Versione ripristinata"); con errori i dati non cambiano
6. Dopo un ripristino o un'unione il grafo mostra il nuovo commit (si aggiorna riaprendo la pagina o da "Sincronizza ora")
7. A 768–1000 px la scheda sta nella pagina senza scorrimento orizzontale e il messaggio lungo viene troncato con "…" (verificato a 800, 1000 e 1280 px)


### Flusso 45 — Sicurezza: CSP e token (mobile e desktop)
Va provato sul **build di produzione** (`npm run build && npm run preview`): in `npm run dev` la CSP non c'è di proposito (Vite ha bisogno di script inline e websocket).
1. Apri l'app dal preview e controlla la console: nessun errore "Content Security Policy"; il tema scelto si applica al primo disegno (lo script inline del tema è ammesso dal suo hash) e il service worker si registra
2. In `dist/index.html` c'è un `<meta http-equiv="Content-Security-Policy">` con `connect-src 'self' https://api.github.com` e `script-src 'self'` più un solo hash; la stessa riga c'è in `dist/404.html` (copia fatta dal deploy)
3. `dist/` non contiene `spesa-design.html` né `support.js`, e `dist/sw.js` non li nomina; `/spesa-design.html` sul preview mostra l'app, non il mockup (in `npm run dev` il mockup resta raggiungibile)
4. Sincronizzazione con un token (anche finto): le chiamate a `api.github.com` partono (un token finto dà 401, non un blocco CSP); nessuna richiesta verso altri domini
5. Mobile (≈390 px): sotto "Salva configurazione" c'è "Dimentica il token su questo dispositivo"; toccandolo il campo Token si svuota, compare il toast "Token rimosso da questo dispositivo", owner/repo/branch/file restano e il pulsante si disattiva; senza token il pulsante è già disattivato
6. Desktop (1280 px e 800 px): lo stesso pulsante è tra "Salva configurazione" e "Sincronizza ora", fa le stesse cose e non crea scroll orizzontale
7. Dopo "Dimentica il token" "Sincronizza ora" dice di configurare owner, repo e token; incollando di nuovo il token e salvando tutto torna a funzionare

### Flusso 46 — Collega GitHub: token e scelta del repo (mobile e desktop)
Serve un account GitHub (anche di prova) e, per il passo 2, un repo privato. Su desktop la pagina è la stessa, con la scheda a sinistra.
1. Pagina Sincronizzazione → in "Collegamento" c'è la scheda "Collega GitHub" con tre passi, "Crea token su GitHub ↗" e "Incolla il token dagli appunti", e in fondo l'avviso sul token. I vecchi passi per il token fine-grained non ci sono più
2. "Crea token su GitHub" apre github.com/settings/tokens/new già compilato: nota "Spesa" e permesso `repo` spuntato. La scadenza NON è precompilata: lasciare i 30 giorni proposti. "Generate token" e copia
3. Appunti con altro testo → "Incolla il token": toast "Negli appunti non c'è un token GitHub…" e niente cambia. Appunti con un token che non vale → toast "Token non valido o scaduto" e il token NON viene salvato (il campo Token resta com'era)
4. Appunti con il token vero → "Controllo il token…", poi "Collegato come @tuo-login", toast "Configurazione salvata", il campo Token si riempie e compare "Repository dei backup" con i repo su cui puoi scrivere (non quelli di sola lettura). Se il browser nega l'accesso agli appunti il toast dice di incollare nel campo Token (che resta usabile a mano)
5. Scegli un repo dall'elenco → toast "Repository salvato" e i campi Owner e Repo si riempiono da soli (branch `main` e file `spesa-db.json` restano); "Sincronizza ora" funziona
6. Chiudi e riapri la pagina: senza fare nulla compare di nuovo "Collegato come @…" con il repo scelto già selezionato. Con un token scaduto compare "Token non valido o scaduto. Creane uno nuovo."
7. "Dimentica il token su questo dispositivo" (Flusso 45): sparisce "Collegato come…" e l'elenco, il campo Token si svuota, owner e repo restano
8. Mobile (≈390 px) e desktop (1280 e 800 px): la scheda sta nella colonna senza scroll orizzontale; i token funzionano anche con un tema scuro (colori dai token del tema)
9. In produzione (`npm run build && npm run preview`) le chiamate a `api.github.com` non sono bloccate dalla CSP

### Flusso 47 — Condividere una lista e aggiungerne una condivisa (mobile e desktop)
Serve il collegamento a GitHub con token classico (Flusso 46) e, per provare davvero, un secondo account GitHub. Stessi passi su mobile (scheda di modifica in basso) e desktop (finestra "Modifica lista").
1. Senza token GitHub salvato: tocca la scheda attiva della lista → "Modifica lista" → in fondo "Condivisione" dice "Per condividere una lista collega prima GitHub" con il pulsante "Collega GitHub" che porta a Sincronizzazione (e chiude la scheda). Lo stesso testo compare in "Aggiungi una lista condivisa"
2. Collegato: "Condividi con altre persone" apre il modulo: nome del repository proposto (`spesa-` + nome della lista senza accenti), username da invitare (facoltativo; scritto, compare "Può modificare / Solo guarda") e "Condividi". Toast "Lista condivisa. Invito mandato a @…"; su GitHub c'è un nuovo repo privato con `lista.json` e l'invito in sospeso. Un nome di repo già usato dà "Esiste già un repository con questo nome"; un nome con spazi disattiva il pulsante
3. La lista ha l'icona delle persone nella scheda (mobile e desktop), nella pagina Liste (mobile e tabella desktop). La sezione ora dice "Condivisa su owner/repo", "Puoi modificare", "Aggiorna ora", "Persone" e, solo per chi possiede il repo, "Invita un'altra persona" (dopo aver condiviso il campo invito è vuoto); "Invita" dà "Invito mandato a @…", un utente inesistente "Utente GitHub non trovato"
4. Secondo account: nuova lista (+) → "Aggiungi una lista condivisa" → "Inviti ricevuti" elenca il repo con "da @…". "Accetta e aggiungi" accetta l'invito senza passare da github.com e aggiunge la lista con il nome e gli articoli dell'altro. In alternativa si incolla `owner/repo` o l'indirizzo GitHub e "Aggiungi"; un testo che non è un repo dà "Non è un repository GitHub valido", un repo che non si vede "Il repository non esiste o non hai accesso…"; aggiungere una lista già presente apre quella
5. Se l'invito era "Solo guarda": nella lista c'è il riquadro "Lista condivisa in sola lettura…", non ci sono il campo di aggiunta, i suggerimenti, "Svuota", i pulsanti + − (resta la quantità) né × (desktop); nel pannello "Nuova spesa" quella lista non è tra le scelte; "Aggiorna ora" funziona comunque
6. "Persone": chi compare nel file (autore delle voci, proprietario del repo) è elencato con "@login", un nome visibile (si salva uscendo dal campo) e "Partner" / "Estraneo" (di partenza "Estraneo"). Nome e tipo restano dopo aver chiuso e riaperto la scheda e valgono solo su questo dispositivo
7. "Smetti di condividere" → conferma → toast "Lista non più condivisa": la lista resta con i suoi articoli come lista normale (di nuovo modificabile, senza icona); il repo su GitHub non è toccato e l'altra persona continua a vederlo
8. A 390, 800 e 1280 px nessuno scroll orizzontale; i colori dei nuovi riquadri seguono il tema (provarne uno scuro). Gli altri cambiamenti arrivano da soli (vedi Flusso 48), non solo con "Aggiorna ora"

### Flusso 48 — Liste condivise dal vivo (mobile e desktop)
Serve una lista condivisa (Flusso 47) e un secondo dispositivo o account che la modifica (anche solo scrivendo nel repo `lista.json` da GitHub). Con la lista condivisa aperta e l'app in primo piano.
1. Sotto le schede compare una riga piccola: "Sincronizzo…" e poi "Aggiornata alle HH:MM". Toccandola si sincronizza subito. Con una lista normale la riga non c'è e non parte nessuna sincronizzazione
2. Aggiungi un articolo (o cambia una quantità, o toglilo): su GitHub arriva UN solo commit circa 5 secondi dopo l'ultima modifica, anche se ne fai diverse di seguito; non subito
3. L'altra persona aggiunge o cambia qualcosa: entro circa 15 secondi lo vedi comparire da solo, senza toccare niente. Se l'ha già preso lei, sotto il nome c'è "preso da Anna" (il nome che hai dato in "Persone", altrimenti il suo login); le voci prese da te dicono "preso da te"
4. Spesa partita da una lista condivisa (mobile e desktop): le voci già prese dagli altri restano nell'elenco "Da prendere" con "preso da Anna"; quando registri un articolo nel carrello, gli altri lo vedono come preso da te entro circa 5 secondi; se lo togli dal carrello torna da prendere. A fine spesa le voci acquistate spariscono per tutti
5. Senza rete: aggiungi un articolo, la riga dice "Offline: le modifiche partiranno appena torna la rete" e l'articolo resta nella lista; al ritorno della rete parte da solo (anche prima dei 15 secondi)
6. App in background (cambia scheda o blocca lo schermo): nessuna richiesta a GitHub; al ritorno in primo piano si sincronizza subito. Chiudendo la schermata della lista il controllo ogni 15 secondi si ferma; le modifiche appena fatte partono comunque
7. Token scaduto o accesso perso: la riga diventa rossa con il motivo ("Il token non è più valido…", "Il repository non esiste o non hai accesso…") e il controllo ogni 15 secondi si ferma finché non si riapre la lista o si torna in primo piano
8. Sola lettura: lo stato si aggiorna come sopra, ma non parte mai nessuna scrittura. Due persone che aggiungono lo stesso articolo (es. "latte") nello stesso momento ne vedono uno solo, con le quantità sommate
9. A 390, 800 e 1280 px la riga di stato non crea scroll orizzontale

### Flusso 49 — Spese concluse condivise e budget (mobile e desktop)
Serve una lista condivisa (Flusso 47) con un'altra persona che fa spese (o, per provare, una spesa scritta nel repo come `sessions` di `lista.json`). Usare il build di produzione.
1. Una mia spesa partita da una lista condivisa, a fine spesa ("Conferma spesa"): dopo circa 5 secondi nel repo c'è la spesa con il tuo login, negozio, importi, buoni e gli acquisti; gli articoli acquistati escono dalla lista per tutti. Le spese fatte PRIMA di condividere la lista non vanno mai nel repo
2. La spesa fatta da un'altra persona arriva da sola (entro circa 15 secondi) nello Storico, con "fatta da Anna" sotto il negozio (desktop: accanto al negozio, nel nome che hai scelto in "Persone", altrimenti il login). Se per te è un **estraneo** (di partenza) c'è anche "non conta nel tuo budget": **non** entra in "Di tasca tua", speso, buoni spesi/rimanenti (home, pannello, riepilogo settimana), nelle Statistiche (totali, per supermercato, giorno, categorie, budget settimanale) né nei totali per negozio; non compare nelle "ultime spese" della home
3. In "Persone" passa quella persona a **Partner**: subito la sua spesa conta (di tasca tua, speso, buoni, statistiche) e perde "non conta nel tuo budget"; con i buoni che ha usato scalano da quelli che hai impostato tu. Rimettila su **Estraneo**: torna fuori dai conti
4. Tocca una spesa di un'altra persona: il dettaglio (mobile e desktop) dice "Spesa di Anna: solo da consultare" (+ "non conta…"), non ci sono eliminazione, cambio del negozio, modifica di totale/buoni/data né degli acquisti. Dallo Storico la settimana si può eliminare: le spese di altri restano; le tue già pubblicate non tornano alla sync dopo
5. Eliminare una tua spesa già pubblicata (dal suo dettaglio) la toglie anche dal repo (dopo circa 5 secondi) e non ricompare; una spesa mai pubblicata si elimina come sempre
6. Gli articoli e i negozi comprati dagli altri compaiono nel Catalogo e tra i supermercati (per nome); prezzo medio e ultimo prezzo degli articoli tengono conto anche dei loro acquisti
7. Su un dispositivo nuovo (stesso account GitHub) la tua spesa pubblicata torna nello storico come tua e conta; le spese di altri tornano con la loro etichetta
8. Una lista normale non cambia: nessuna etichetta, nessuna pubblicazione, budget e statistiche come prima

### Flusso 50 — Liste condivise: accesso perso, ripristino da backup, scollegamento (mobile e desktop)
1. Con una lista condivisa aperta, togli all'altro dispositivo l'accesso al repo (o elimina il repo su GitHub): entro circa 15 secondi (o toccando la riga di stato) la riga diventa rossa con "Non hai più accesso a questa lista condivisa" e compare "Tieni come lista normale". La lista e i suoi articoli restano com'erano; il controllo ogni 15 secondi si ferma. Il pulsante scollega: icona e riga di stato spariscono e la lista è una normale, modificabile; il repo non viene toccato
2. Esporta i dati (Impostazioni → Esporta) con una lista condivisa, cancella tutti i dati e reimporta: la lista torna con il suo collegamento (icona, persone con nome e tipo) ma senza il token e senza le sue voci né le spese degli altri (si ripopolano dal repo alla prima sync; le tue spese su quella lista restano nel backup): dopo aver ricollegato GitHub, la **prima** sincronizzazione scarica e unisce e NON scrive nel repo; solo dalla sync dopo partono le tue modifiche. Il file di backup non contiene il token né l'ultimo stato di sync
3. Scarica dal remoto ("Scarica da remoto" nel backup personale) con liste condivise: tornano com'erano nel backup e si riallineano con il repo alla sync dopo, senza sovrascrivere il lavoro degli altri
4. Token scaduto: la riga dice "Il token non è più valido: creane uno nuovo in Sincronizzazione" e il controllo si ferma; dopo aver creato un nuovo token (Flusso 46) basta riaprire la lista
5. Versione 1.1.0 nel badge dei README e in "Novità" (Impostazioni → versione): c'è una sola voce 1.1.0 con le liste condivise

### Flusso 51 — Nessun "Confronta e unisci" a vuoto con le liste condivise (mobile e desktop)
Serve la sync del backup personale attiva (Sincronizzazione → Sync automatico) su DUE dispositivi, entrambi con la stessa lista condivisa aperta, e un terzo utente (o uno script) che la modifica.
1. L'altra persona aggiunge articoli e fa una spesa; lascia girare entrambi i dispositivi qualche minuto (la lista aperta si aggiorna da sola)
2. Il backup personale si sincronizza tra i due dispositivi senza mai mostrare il toast "Rivedi e unisci" né richiedere la schermata di unione: se cambia solo l'ordine interno dei dati (id diversi) lo riconosce da solo e non chiede niente
3. Se invece si cambia davvero qualcosa di personale su entrambi (es. una lista normale diversa) il conflitto compare ancora, con le scelte da fare in "Confronta e unisci"
4. "Confronta e unisci" aperto a mano con dati uguali dice che non c'è niente da gestire
5. Nel backup esportato non ci sono le voci delle liste condivise né le spese degli altri (si riconoscono dal campo `doneBy`)

### Flusso 52 — Condividere con un token inserito a mano (mobile e desktop)
1. Con un token salvato PRIMA di "Collega GitHub" (campo Token scritto a mano, nessun "Collegato come @…" mai mostrato): "Modifica lista" → "Condivisione" mostra "Condividi con altre persone", non "collega prima GitHub"; lo stesso per "Aggiungi una lista condivisa"
2. Condividendo, l'app chiede a GitHub chi sei e lo ricorda: aprendo Sincronizzazione compare "Collegato come @…"
3. Con un token scaduto o non valido compare "Collega prima GitHub…"; un token a repo singolo (fine-grained) non può creare repository e dà "Il token non ha il permesso di farlo: crea un token con il permesso repo"
