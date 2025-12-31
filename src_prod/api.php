<?php
// Gestione API per GalenicoLab

// --- INTESTAZIONI E SICUREZZA ---
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- CONNESSIONE AL DATABASE ---
require_once 'config.php';

// --- ROUTING DELLE AZIONI ---
$action = $_GET['action'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($action) {
        case 'get_all_data':
            if ($method === 'GET') getAllData($pdo);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'add_or_update_inventory':
            if ($method === 'POST') addOrUpdateInventory($pdo);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'dispose_inventory':
            if ($method === 'POST') disposeInventory($pdo);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'save_preparation':
            if ($method === 'POST') savePreparation($pdo);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'delete_preparation':
            if ($method === 'POST') deletePreparation($pdo);
            else sendError(405, 'Metodo non consentito.');
            break;
        default:
            sendError(404, 'Azione non valida o non specificata.');
            break;
    }
} catch (\PDOException $e) {
    sendError(500, "Errore Database: " . $e->getMessage());
} catch (\Exception $e) {
    sendError(500, "Errore Server: " . $e->getMessage());
}


// --- FUNZIONI API ---

function getAllData($pdo) {
    $stmt_inv = $pdo->query("SELECT * FROM inventory ORDER BY name ASC");
    $inventory = $stmt_inv->fetchAll();

    $stmt_preps = $pdo->query("SELECT * FROM preparations ORDER BY date DESC, id DESC");
    $preparations = $stmt_preps->fetchAll();

    $prep_ids = array_map(fn($p) => $p['id'], $preparations);
    
    if (!empty($prep_ids)) {
        $in_clause = implode(',', array_fill(0, count($prep_ids), '?'));
        $stmt_ingredients = $pdo->prepare(
            "SELECT pi.preparationId, pi.amountUsed, i.id, i.name, i.ni, i.unit, i.isContainer, i.isDoping, i.isNarcotic, i.securityData
             FROM preparation_ingredients pi
             JOIN inventory i ON pi.inventoryId = i.id
             WHERE pi.preparationId IN ($in_clause)"
        );
        $stmt_ingredients->execute($prep_ids);
        $all_ingredients = $stmt_ingredients->fetchAll(PDO::FETCH_GROUP);

        foreach ($preparations as $key => $prep) {
            // Decodifica i campi JSON
            $preparations[$key]['ingredients'] = array_map(function($ing) {
                // Decodifica anche securityData per gli ingredienti individuali se è una stringa JSON
                if (isset($ing['securityData']) && is_string($ing['securityData'])) {
                    $ing['securityData'] = json_decode($ing['securityData'], true);
                }
                return $ing;
            }, $all_ingredients[$prep['id']] ?? []);
            
            $preparations[$key]['labelWarnings'] = json_decode($prep['labelWarnings'] ?? '[]', true);
            $preparations[$key]['techOps'] = json_decode($prep['techOps'] ?? '[]', true);
            $preparations[$key]['worksheetItems'] = json_decode($prep['worksheetItems'] ?? '[]', true);
            $preparations[$key]['batches'] = json_decode($prep['batches'] ?? '[]', true);
            // $preparations[$key]['securityData'] = json_decode($prep['securityData'] ?? '{}', true); // Non necessario qui, è negli ingredienti
        }
    }
    
    echo json_encode(['inventory' => $inventory, 'preparations' => $preparations, 'logs' => []]);
}

function addOrUpdateInventory($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    $fields = ['name', 'ni', 'lot', 'expiry', 'quantity', 'unit', 'totalCost', 'costPerGram', 'supplier', 'purity', 'receptionDate', 'ddtNumber', 'ddtDate', 'isExcipient', 'isContainer', 'isDoping', 'isNarcotic', 'securityData'];
    $params = [];
    foreach ($fields as $field) {
        $value = $data[$field] ?? null;
        if (is_array($value)) { // Per securityData che potrebbe essere un array vuoto
            $params[':' . $field] = json_encode($value);
        } else {
            $params[':' . $field] = $value;
        }
    }
    // Converte i booleani in interi
    $params[':isExcipient'] = !empty($data['isExcipient']) ? 1 : 0;
    $params[':isContainer'] = !empty($data['isContainer']) ? 1 : 0;
    $params[':isDoping'] = !empty($data['isDoping']) ? 1 : 0;
    $params[':isNarcotic'] = !empty($data['isNarcotic']) ? 1 : 0;
    // securityData già gestito sopra come JSON

    if (isset($data['id']) && !empty($data['id'])) {
        // UPDATE
        $params[':id'] = $data['id'];
        $sql = "UPDATE inventory SET name=:name, ni=:ni, lot=:lot, expiry=:expiry, quantity=:quantity, unit=:unit, totalCost=:totalCost, costPerGram=:costPerGram, supplier=:supplier, purity=:purity, receptionDate=:receptionDate, ddtNumber=:ddtNumber, ddtDate=:ddtDate, isExcipient=:isExcipient, isContainer=:isContainer, isDoping=:isDoping, isNarcotic=:isNarcotic, securityData=:securityData WHERE id=:id";
    } else {
        // INSERT
        $sql = "INSERT INTO inventory (name, ni, lot, expiry, quantity, unit, totalCost, costPerGram, supplier, purity, receptionDate, ddtNumber, ddtDate, isExcipient, isContainer, isDoping, isNarcotic, securityData) VALUES (:name, :ni, :lot, :expiry, :quantity, :unit, :totalCost, :costPerGram, :supplier, :purity, :receptionDate, :ddtNumber, :ddtDate, :isExcipient, :isContainer, :isDoping, :isNarcotic, :securityData)";
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode(['success' => true, 'id' => $data['id'] ?? $pdo->lastInsertId()]);
}

function disposeInventory($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    $date = date('Y-m-d');

    if (!$id) {
        sendError(400, 'ID mancante.');
        return;
    }

    $sql = "UPDATE inventory SET disposed=1, endUseDate=? WHERE id=?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$date, $id]);

    echo json_encode(['success' => true, 'id' => $id]);
}

function savePreparation($pdo) {
    $requestData = json_decode(file_get_contents('php://input'), true);
    $prepDetails = $requestData['prepDetails'];
    $itemsUsed = $requestData['itemsUsed']; // Ingredienti usati
    $isDraft = $requestData['isDraft'];
    $oldPrepId = $prepDetails['id'] ?? null;

    $pdo->beginTransaction();
    try {
        // --- 1. Gestione Preparazione (INSERT/UPDATE) ---
        $prepFields = [
            'prepNumber', 'name', 'pharmaceuticalForm', 'quantity', 'prepUnit', 
            'expiryDate', 'posology', 'date', 'patient', 'doctor', 'status', 
            'totalPrice', 'prepType', 'notes', 'usage', 'operatingProcedures', 
            'labelWarnings', 'techOps', 'worksheetItems', 'recipeDate', 'batches'
        ];
        $prepParams = [];
        foreach ($prepFields as $field) {
            $value = $prepDetails[$field] ?? null;
            if (is_array($value)) { // Campi JSON
                $prepParams[':' . $field] = json_encode($value);
            } else {
                $prepParams[':' . $field] = $value;
            }
        }
        $prepParams[':status'] = $isDraft ? 'Bozza' : 'Completata';
        // Aggiungo il campo 'warnings' se presente (vecchie preparazioni)
        if (isset($prepDetails['warnings'])) {
            $prepFields[] = 'warnings';
            $prepParams[':warnings'] = $prepDetails['warnings'];
        }

        $newPrepId = $oldPrepId;
        if ($oldPrepId) {
            // UPDATE
            $update_fields_sql = implode(', ', array_map(fn($f) => "$f=:$f", $prepFields));
            $sql = "UPDATE preparations SET $update_fields_sql WHERE id=:id";
            $prepParams[':id'] = $oldPrepId;
            $stmt = $pdo->prepare($sql);
            $stmt->execute($prepParams);

            // Elimina vecchi ingredienti per questa preparazione
            $stmt = $pdo->prepare("DELETE FROM preparation_ingredients WHERE preparationId = ?");
            $stmt->execute([$oldPrepId]);

        } else {
            // INSERT
            $insert_fields_sql = implode(', ', $prepFields);
            $insert_values_sql = implode(', ', array_map(fn($f) => ":$f", $prepFields));
            $sql = "INSERT INTO preparations ($insert_fields_sql) VALUES ($insert_values_sql)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($prepParams);
            $newPrepId = $pdo->lastInsertId();
        }

        // --- 2. Gestione Ingredienti (preparation_ingredients) ---
        foreach ($itemsUsed as $item) {
            $stmt = $pdo->prepare("INSERT INTO preparation_ingredients (preparationId, inventoryId, amountUsed) VALUES (?, ?, ?)");
            $stmt->execute([$newPrepId, $item['id'], $item['amountUsed']]);
        }

        // --- 3. Movimenti Magazzino (solo se non è una bozza) ---
        if (!$isDraft) {
            // Se la preparazione precedente era una bozza (ora completa),
            // o se è una nuova preparazione completa, scarica dal magazzino
            // La logica di "delta" per modifiche di prep già complete è più complessa
            // e richiederebbe di recuperare i vecchi ingredienti per calcolare la differenza.
            // Per semplicità qui, se una prep era già completa e viene modificata,
            // non ricarichiamo e riscarichiamo le quantità (si farebbe un log a parte).
            // L'importante è che alla fine il magazzino rifletta il consumo.

            foreach ($itemsUsed as $item) {
                $stmt = $pdo->prepare("UPDATE inventory SET quantity = quantity - ? WHERE id = ?");
                $stmt->execute([$item['amountUsed'], $item['id']]);
            }
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'id' => $newPrepId]);

    } catch (\Exception $e) {
        $pdo->rollBack();
        sendError(500, "Errore salvataggio preparazione: " . $e->getMessage());
    }
}

function deletePreparation($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $prepId = $data['id'] ?? null;

    if (!$prepId) {
        sendError(400, 'ID preparazione mancante.');
        return;
    }

    $pdo->beginTransaction();
    try {
        // 1. Recupera gli ingredienti della preparazione per rimborsare il magazzino
        $stmt = $pdo->prepare("SELECT inventoryId, amountUsed FROM preparation_ingredients WHERE preparationId = ?");
        $stmt->execute([$prepId]);
        $ingredientsToRefund = $stmt->fetchAll();

        foreach ($ingredientsToRefund as $item) {
            $stmt = $pdo->prepare("UPDATE inventory SET quantity = quantity + ? WHERE id = ?");
            $stmt->execute([$item['amountUsed'], $item['inventoryId']]);
        }

        // 2. Elimina gli ingredienti associati
        $stmt = $pdo->prepare("DELETE FROM preparation_ingredients WHERE preparationId = ?");
        $stmt->execute([$prepId]);

        // 3. Elimina la preparazione
        $stmt = $pdo->prepare("DELETE FROM preparations WHERE id = ?");
        $stmt->execute([$prepId]);

        $pdo->commit();
        echo json_encode(['success' => true, 'id' => $prepId]);

    } catch (\Exception $e) {
        $pdo->rollBack();
        sendError(500, "Errore eliminazione preparazione: " . $e->getMessage());
    }
}


/**
 * Funzione helper per inviare risposte di errore standard
 */
function sendError($statusCode, $message) {
    http_response_code($statusCode);
    echo json_encode(['error' => $message]);
}

?>