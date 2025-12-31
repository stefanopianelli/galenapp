# Istruzioni per il Deployment di GalenicoLab (www.galenapp.it)

Questo documento ti guiderà attraverso i passaggi necessari per deployare l'applicazione GalenicoLab sul tuo hosting con supporto PHP e MySQL.

---

## **Passo 1: Preparazione del Database MySQL**

1.  **Accedi a phpMyAdmin (o strumento equivalente) sul tuo hosting.**
2.  **Crea un nuovo database.** Assegna un nome al database (es. `galenapp_db`) e prendi nota delle credenziali di accesso (nome utente e password del database).
3.  **Importa lo schema del database:**
    *   Seleziona il database che hai appena creato.
    *   Vai alla sezione "Importa".
    *   Carica il file `src_prod/database_setup.sql` (fornito in questo pacchetto). Questo creerà tutte le tabelle necessarie.
    *   Esegui l'importazione.
4.  **Popola il database con i dati iniziali (opzionale):**
    *   Dopo aver creato le tabelle, puoi popolare il database con i dati di esempio che avevi nell'applicazione.
    *   Vai nuovamente alla sezione "Importa" del tuo database.
    *   Carica il file `src_prod/database_populate.sql` (fornito in questo pacchetto). Questo inserirà i dati di magazzino e preparazioni di esempio.
    *   Esegui l'importazione.

---

## **Passo 2: Configurazione dell'API PHP**

1.  **Apri il file `src_prod/config.php`** con un editor di testo.
2.  **Modifica le credenziali del database:**
    *   `DB_HOST`: Inserisci l'host del tuo database (solitamente `localhost`).
    *   `DB_USERNAME`: Inserisci il nome utente del database che hai creato.
    *   `DB_PASSWORD`: Inserisci la password del database.
    *   `DB_NAME`: Inserisci il nome del database che hai creato (es. `galenapp_db`).
3.  **Salva il file `config.php`**.

---

## **Passo 3: Caricamento dei File sull'Hosting**

1.  **Connettiti al tuo hosting** (tramite FTP/SFTP o il File Manager del pannello di controllo).
2.  **Identifica la cartella radice del tuo sito web.** Solitamente è `public_html`, `www`, `htdocs` o simile.
3.  **Carica il Frontend (Applicazione React):**
    *   Carica **tutto il contenuto** della cartella `/dist` (fornita in questo pacchetto) direttamente nella **cartella radice del tuo sito web**. Assicurati che file come `index.html`, `assets/`, ecc., si trovino direttamente nella radice.
4.  **Carica il Backend (API PHP):**
    *   Crea una nuova cartella all'interno della cartella radice del tuo sito web e chiamala `src_prod`.
    *   Carica i file `api.php` e `config.php` (forniti in questo pacchetto all'interno di `src_prod/`) all'interno di questa nuova cartella `src_prod`.

---

## **Passo 4: Test dell'Applicazione**

1.  **Apri il tuo browser** e naviga all'indirizzo `www.galenapp.it`.
2.  L'applicazione dovrebbe caricarsi. Se visualizzi la Dashboard e i dati (se hai popolato il DB), significa che il frontend si è caricato correttamente e sta comunicando con le API PHP.
3.  Prova a navigare tra le sezioni (Magazzino, Preparazioni).
4.  Prova ad aggiungere/modificare/eliminare un elemento nel Magazzino o nelle Preparazioni per verificare che le operazioni di scrittura funzionino correttamente.

---

**Nota sulla Sicurezza:**
*   `Access-Control-Allow-Origin: *` è utilizzato per semplicità in questa fase di sviluppo. In un ambiente di produzione reale, dovresti sostituirlo con il dominio specifico della tua applicazione (es. `https://www.galenapp.it`) in `src_prod/api.php` per motivi di sicurezza.
*   Assicurati che le credenziali del database in `config.php` siano gestite in modo sicuro sul tuo server e non siano accessibili pubblicamente.

Spero che queste istruzioni siano chiare e ti aiutino nel deployment!
