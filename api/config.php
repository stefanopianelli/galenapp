<?php
// Configurazione Database
$host = getenv('DB_HOST') ?: 'db5019179163.hosting-data.io';
$dbname = getenv('DB_DATABASE') ?: 'dbs15060154';
$username = getenv('DB_USER') ?: 'dbu4199584';
$password = getenv('DB_PASSWORD') ?: 'Pa4rucca__';
$socket_path = getenv('DB_SOCKET_PATH') ?: ''; // Lasciare vuoto se non si usa un socket

// Configurazione AI
const GEMINI_API_KEY = 'AIzaSyBvdnkwcplEH0IyjPJzZgJ4yUXzwSOUEBw'; // Sostituisci con la tua chiave da Google AI Studio

// Configurazione Sicurezza
const JWT_SECRET_KEY = '7f8e9d2a3b4c5e6f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f';

// DSN di connessione
if (!empty($socket_path)) {
    $dsn = "mysql:unix_socket=$socket_path;dbname=$dbname;charset=utf8mb4";
} else {
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
}

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (\PDOException $e) {
    // In un ambiente di produzione reale, non dovresti mostrare l'errore dettagliato
    // ma loggarlo e mostrare un messaggio generico.
    http_response_code(500);
    echo json_encode(['error' => 'Errore di connessione al database.']);
    // Per debug:
    // echo json_encode(['error' => 'Failed to connect to database: ' . $e->getMessage()]);
    exit;
}
// Ritorna la configurazione come array per api.php
return [
    'jwt_secret' => JWT_SECRET_KEY,
    'db_host' => $host,
    'db_name' => $dbname,
    'db_user' => $username,
    'db_pass' => $password
];
?>