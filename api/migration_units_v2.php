<?php
require_once 'config.php';

echo "<h1>Migrazione Unità v2</h1>";

try {
    // 1. unitUsed: L'unità di misura usata nella ricetta (es. 'g' anche se stock è 'ml')
    $pdo->exec("ALTER TABLE preparation_ingredients ADD COLUMN unitUsed VARCHAR(20) DEFAULT NULL");
    echo "Colonna unitUsed aggiunta.<br>";
} catch (PDOException $e) {
    echo "Info unitUsed: " . $e->getMessage() . "<br>";
}

try {
    // 2. stockDeduction: La quantità reale da scaricare dal magazzino (es. 12.5)
    $pdo->exec("ALTER TABLE preparation_ingredients ADD COLUMN stockDeduction DECIMAL(10,2) DEFAULT NULL");
    echo "Colonna stockDeduction aggiunta.<br>";
} catch (PDOException $e) {
    echo "Info stockDeduction: " . $e->getMessage() . "<br>";
}
?>
