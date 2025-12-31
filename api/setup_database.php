<?php
// Script per la creazione e popolamento automatico del database

// --- Include il file di configurazione del database ---
require_once 'config.php';

// --- Connessione al server MySQL (senza specificare un DB iniziale) ---
// Usiamo una connessione separata qui per poter creare il DB
try {
    $dsn_no_db = "mysql:host=" . DB_HOST . ";charset=" . $charset;
    $pdo_no_db = new PDO($dsn_no_db, DB_USERNAME, DB_PASSWORD, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'Errore di connessione al server MySQL: ' . $e->getMessage()]));
}

// --- Creazione del Database (se non esiste) ---
try {
    $pdo_no_db->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "`");
    echo "Database '" . DB_NAME . "' creato o già esistente.<br>";
} catch (\PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'Errore nella creazione del database: ' . $e->getMessage()]));
}

// --- Connessione al Database specifico ---
// Ora usiamo la connessione già definita in config.php che è collegata al DB specifico
// Assicurati che $pdo da config.php sia accessibile e connesso al DB corretto
// Se config.php termina in caso di errore di connessione al DB, la linea successiva non verrà mai raggiunta
// Per sicurezza, potremmo riconnetterci qui, ma si presuppone config.php funzioni.
// Se config.php è stato incluso, $pdo dovrebbe essere la connessione al DB_NAME.

// --- Creazione della struttura delle tabelle ---
$sql_setup_file = __DIR__ . '/database_setup.sql';
if (!file_exists($sql_setup_file)) {
    http_response_code(500);
    die(json_encode(['error' => 'File database_setup.sql non trovato.']));
}
$sql_setup_commands = file_get_contents($sql_setup_file);

try {
    $pdo->exec($sql_setup_commands);
    echo "Struttura delle tabelle creata con successo.<br>";
} catch (\PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'Errore nella creazione della struttura delle tabelle: ' . $e->getMessage()]));
}

// --- Popolamento del database con dati di esempio ---
$sql_populate_file = __DIR__ . '/database_populate.sql';
if (!file_exists($sql_populate_file)) {
    http_response_code(500);
    die(json_encode(['error' => 'File database_populate.sql non trovato.']));
}
$sql_populate_commands = file_get_contents($sql_populate_file);

try {
    $pdo->exec($sql_populate_commands);
    echo "Database popolato con i dati di esempio.<br>";
} catch (\PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'Errore nel popolamento del database con i dati di esempio: ' . $e->getMessage()]));
}

// --- Eliminazione dello script per sicurezza ---
if (unlink(__FILE__)) {
    echo "Script di setup eliminato con successo per sicurezza.<br>";
} else {
    echo "ATTENZIONE: Impossibile eliminare lo script di setup. Rimuovilo manualmente per sicurezza.<br>";
}

echo "<br>Setup del database completato con successo!";

?>