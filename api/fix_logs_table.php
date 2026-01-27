<?php
require 'config.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $columns = ['substance', 'ni', 'notes', 'operator'];
    
    foreach ($columns as $col) {
        try {
            $pdo->query("SELECT 1 FROM logs WHERE $col = 'test' LIMIT 0");
        } catch (Exception $e) {
            // Colonna mancante
            echo "Colonna $col mancante. Aggiungo...
";
            $sql = "ALTER TABLE logs ADD COLUMN $col VARCHAR(255) DEFAULT NULL";
            if ($col === 'notes') $sql = "ALTER TABLE logs ADD COLUMN $col TEXT DEFAULT NULL";
            $pdo->exec($sql);
        }
    }
    echo "Check colonne completato.";

} catch (PDOException $e) {
    echo "Errore: " . $e->getMessage();
}
?>
