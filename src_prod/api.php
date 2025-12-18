<?php
// File: api.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

require_once 'config.php';

// Connessione al database
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Controllo connessione
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['message' => 'Connessione al database fallita: ' . $conn->connect_error]);
    exit();
}
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $data = [
        'inventory' => [],
        'preparations' => [],
        'logs' => [],
        'pharmacySettings' => (object)[]
    ];

    // Inventory
    $result = $conn->query("SELECT * FROM inventory");
    while ($row = $result->fetch_assoc()) {
        $row['disposed'] = (bool)$row['disposed'];
        $row['securityData'] = $row['securityData'] ? json_decode($row['securityData']) : null;
        $data['inventory'][] = $row;
    }

    // Preparations
    $result = $conn->query("SELECT * FROM preparations");
    while ($row = $result->fetch_assoc()) {
        $row['ingredients'] = $row['ingredients'] ? json_decode($row['ingredients']) : [];
        $data['preparations'][] = $row;
    }

    // Logs
    $result = $conn->query("SELECT * FROM logs");
    while ($row = $result->fetch_assoc()) {
        $data['logs'][] = $row;
    }

    // Settings
    $result = $conn->query("SELECT * FROM pharmacy_settings LIMIT 1");
    if ($result->num_rows > 0) {
        $data['pharmacySettings'] = $result->fetch_assoc();
    }

    echo json_encode($data);

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $conn->begin_transaction();

    try {
        $conn->begin_transaction();

        // Logica di salvataggio condizionale e non distruttiva
        if (isset($input['inventory'])) {
            $conn->query("TRUNCATE TABLE inventory");
            if (!empty($input['inventory'])) {
                $stmt = $conn->prepare("INSERT INTO inventory (id, name, ni, lot, expiry, quantity, unit, totalCost, costPerGram, supplier, purity, receptionDate, ddtNumber, ddtDate, firstUseDate, endUseDate, disposed, sdsFile, securityData) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                foreach ($input['inventory'] as $item) {
                    $securityData = $item['securityData'] ? json_encode($item['securityData']) : null;
                    $stmt->bind_param("issssidddssssssisss", $item['id'], $item['name'], $item['ni'], $item['lot'], $item['expiry'], $item['quantity'], $item['unit'], $item['totalCost'], $item['costPerGram'], $item['supplier'], $item['purity'], $item['receptionDate'], $item['ddtNumber'], $item['ddtDate'], $item['firstUseDate'], $item['endUseDate'], $item['disposed'], $item['sdsFile'], $securityData);
                    $stmt->execute();
                }
                $stmt->close();
            }
        }

        if (isset($input['preparations'])) {
            $conn->query("TRUNCATE TABLE preparations");
            if (!empty($input['preparations'])) {
                $stmt = $conn->prepare("INSERT INTO preparations (id, prepNumber, name, pharmaceuticalForm, quantity, prepUnit, expiryDate, posology, date, patient, doctor, status, totalPrice, ingredients) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                foreach ($input['preparations'] as $p) {
                    $ingredients = $p['ingredients'] ? json_encode($p['ingredients']) : '[]';
                    $stmt->bind_param("isssissssssds", $p['id'], $p['prepNumber'], $p['name'], $p['pharmaceuticalForm'], $p['quantity'], $p['prepUnit'], $p['expiryDate'], $p['posology'], $p['date'], $p['patient'], $p['doctor'], $p['status'], $p['totalPrice'], $ingredients);
                    $stmt->execute();
                }
                $stmt->close();
            }
        }
        
        if (isset($input['logs'])) {
            $conn->query("TRUNCATE TABLE logs");
            if (!empty($input['logs'])) {
                 $stmt = $conn->prepare("INSERT INTO logs (id, date, type, substance, ni, quantity, unit, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                 foreach ($input['logs'] as $log) {
                    $stmt->bind_param("issssdss", $log['id'], $log['date'], $log['type'], $log['substance'], $log['ni'], $log['quantity'], $log['unit'], $log['notes']);
                    $stmt->execute();
                }
                $stmt->close();
            }
        }
        
        if (isset($input['pharmacySettings'])) {
            $conn->query("TRUNCATE TABLE pharmacy_settings");
            if (!empty($input['pharmacySettings'])) {
                $stmt = $conn->prepare("INSERT INTO pharmacy_settings (id, name, address, zip, city, province, phone) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $s = $input['pharmacySettings'];
                $id = 1;
                $stmt->bind_param("issssss", $id, $s['name'], $s['address'], $s['zip'], $s['city'], $s['province'], $s['phone']);
                $stmt->execute();
                $stmt->close();
            }
        }

        $conn->commit();
        echo json_encode(['message' => 'Dati salvati con successo.']);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['message' => 'Errore durante il salvataggio dei dati: ' . $e->getMessage()]);
    }
} else if ($method === 'OPTIONS') {
    // Gestisce le richieste pre-flight CORS
    http_response_code(200);
    exit();
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Metodo non consentito.']);
}

$conn->close();
?>
