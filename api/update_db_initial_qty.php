<?php
require 'config.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Aggiungi colonna initialQuantity
    $sql = "ALTER TABLE inventory ADD COLUMN initialQuantity DECIMAL(10,2) DEFAULT NULL AFTER quantity";
    $pdo->exec($sql);
    
    // Inizializza i record esistenti: la quantità iniziale è uguale a quella attuale (approssimazione)
    $pdo->exec("UPDATE inventory SET initialQuantity = quantity WHERE initialQuantity IS NULL");
    
    echo "Colonna initialQuantity aggiunta e inizializzata con successo.";

} catch (PDOException $e) {
    if (strpos($e->getMessage(), "Duplicate column name") !== false) {
        echo "La colonna initialQuantity esiste già.";
    } else {
        echo "Errore: " . $e->getMessage();
    }
}
?>
