<?php
// File di Configurazione del Database

// Attenzione: Modifica queste credenziali con quelle fornite dal tuo hosting.
define('DB_HOST', 'localhost');          // Solitamente 'localhost' o un indirizzo IP/dominio specifico
define('DB_USERNAME', 'tuo_utente_db');    // Il nome utente per il tuo database
define('DB_PASSWORD', 'tua_password_db'); // La password per il tuo database
define('DB_NAME', 'tuo_nome_db');          // Il nome del tuo database

// Impostazioni per la connessione
$charset = 'utf8mb4';
$dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . $charset;

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, DB_USERNAME, DB_PASSWORD, $options);
} catch (\PDOException $e) {
    // In un ambiente di produzione reale, non dovresti mostrare l'errore dettagliato
    // ma loggarlo e mostrare un messaggio generico.
    http_response_code(500);
    echo json_encode(['error' => 'Errore di connessione al database.']);
    // Per debug:
    // echo json_encode(['error' => 'Failed to connect to database: ' . $e->getMessage()]);
    exit;
}
?>