<?php
require 'config.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Aggiungi colonna uniformityCheck
    $sql = "ALTER TABLE preparations ADD COLUMN uniformityCheck TEXT DEFAULT NULL";
    $pdo->exec($sql);
    echo "Colonna uniformityCheck aggiunta con successo.";

} catch (PDOException $e) {
    if (strpos($e->getMessage(), "Duplicate column name") !== false) {
        echo "La colonna uniformityCheck esiste già.";
    } else {
        echo "Errore: " . $e->getMessage();
    }
}
?>
