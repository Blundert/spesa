# E2E sync — punti NON testati nel run 1

Elenco dei punti di `test/e2e-sync.md` che nel run 1 (`docs/roadmap/122.md`) non sono stati provati, o provati solo in parte.
Si spuntano quando vengono eseguiti nel run di verifica dopo i fix. Ogni riga dice dove manca la copertura e perché.

Legenda: ☐ da fare · ☑ fatto (con esito nel dump del run 2)

## Mobile (390×844) non rifatto
- ☐ **5** Esporta/importa dalle Impostazioni mobili con lista condivisa; "Scarica da remoto" dalla pagina Sincronizzazione mobile. (Solo desktop provato.)
- ☐ **5.6** Il backup personale su mobile non chiede "Confronta e unisci" a vuoto dopo che l'altro modifica la lista.
- ☐ **0.4** Invito a chi ha già accesso e a utente inesistente, dal foglio di modifica mobile.
- ☐ **2.4** B mette in carrello una voce che A elimina (spesa mobile).
- ☐ **4.7** A e B concludono insieme sul mobile con una scrittura rallentata.
- ☐ **6** Passaggio Partner ↔ Estraneo da "Persone" nel foglio mobile e numeri (pill, Storico, Statistiche) prima/dopo.
- ☐ **6.4** Eliminare una settimana dallo Storico mobile: le spese degli altri restano, le proprie già pubblicate non tornano.
- ☐ **8.2** Chiusura a ~6 s (dopo il push) e riapertura. **8.3** sfondo con push in attesa. **8.4** raffica sfondo/primo piano. **8.5** chiusura durante il PUT. **8.7** spesa in corso e telefono spento. **8.9** offline + sfondo. **8.10** push e sync manuale insieme.

## Desktop
- ☐ **6.4 / 6.6** Eliminare una settimana dallo Storico desktop (se non esiste il comando, dirlo); una lista normale resta senza etichette, senza pubblicazione e con budget invariato.
- ☐ **3.5** Rete che cade durante un push: nel run 1 il PUT è passato comunque, quindi il caso non è stato provato davvero (serve far fallire davvero la richiesta in corso).
- ☐ **F9** Riproduzione isolata su desktop: l'altro entra nella spesa e prende subito una voce; l'avviso "preso da" deve arrivare.
- ☐ Rinomina di una voce e cambio categoria da due dispositivi (nelle liste attuali non ci sono comandi: dire se esistono altrove, es. pagina Catalogo, e provarli lì).

## Non testabile con account personali
- ☐ **"Solo guarda" reale** (permesso `pull` su GitHub): i repo di account personali non lo ammettono (F5). Va provato con un repo di un'organizzazione; finché non c'è resta coperto solo dalla simulazione locale (`canWrite:false`) e dal comportamento scelto per F5.

## Infrastruttura del test
- ☐ Il **reset dei repo** del piano (`reset_branch`) con la guardia sui repo vuoti, eseguito davvero su repo con commit.
- ☐ Creazione del repo condiviso **da zero su desktop** (nel run 1 solo mobile; su desktop si è riusato un repo vuoto).
- ☐ Verifica di tutti i tempi con la cache **attiva** (comportamento reale) dopo il fix di F2, senza disattivarla via CDP.
