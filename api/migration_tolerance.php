<?php
// Script di Migrazione per aggiungere il supporto alla Tolleranza (stockDeduction)
// Da eseguire una volta sola.

require_once 'config.php';

echo "<h1>Migrazione Database: Supporto Tolleranza e Perdite</h1>";

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. Verifica se la colonna stockDeduction esiste già in preparation_ingredients
    $stmt = $pdo->query("SHOW COLUMNS FROM `preparation_ingredients` LIKE 'stockDeduction'");
    $exists = $stmt->fetch();

    if (!$exists) {
        // Aggiungi la colonna
        $sql = "ALTER TABLE `preparation_ingredients` ADD COLUMN `stockDeduction` DECIMAL(10, 4) DEFAULT NULL COMMENT 'Quantità effettiva scaricata dal magazzino (inclusa tolleranza)' AFTER `amountUsed`";
        $pdo->exec($sql);
        echo "<p style='color: green;'>✅ Colonna <code>stockDeduction</code> aggiunta con successo alla tabella <code>preparation_ingredients</code>.</p>";
    } else {
        echo "<p style='color: orange;'>⚠️ La colonna <code>stockDeduction</code> esiste già. Nessuna modifica necessaria.</p>";
    }

    echo "<p>Migrazione completata. Puoi chiudere questa pagina.</p>";

} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Errore durante la migrazione: " . $e->getMessage() . "</p>";
}
?>
