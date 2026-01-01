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

// --- FUNZIONE HELPER PER LOGGING ---
function createLog($pdo, $type, $notes, $details = []) {
    $sql = "INSERT INTO `logs` (`date`, `type`, `substance`, `ni`, `quantity`, `unit`, `notes`, `operator`, `preparationId`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        date('Y-m-d'),
        $type,
        $details['substance'] ?? null,
        $details['ni'] ?? null,
        $details['quantity'] ?? null,
        $details['unit'] ?? null,
        $notes,
        'Sistema',
        $details['preparationId'] ?? null
    ]);
}

// --- FUNZIONI API ---

function getAllData($pdo) {
    $stmt_inv = $pdo->query("SELECT * FROM `inventory` ORDER BY `name` ASC");
    $inventory = $stmt_inv->fetchAll();
    $stmt_preps = $pdo->query("SELECT * FROM `preparations` ORDER BY `date` DESC, `id` DESC");
    $preparations = $stmt_preps->fetchAll();
    $prep_ids = array_map(fn($p) => $p['id'], $preparations);
    
    if (!empty($prep_ids)) {
        $in_clause = implode(',', array_fill(0, count($prep_ids), '?'));
        $stmt_ingredients = $pdo->prepare(
            "SELECT pi.`preparationId`, pi.`amountUsed`, i.`id`, i.`name`, i.`ni`, i.`unit`, i.`isContainer`, i.`isDoping`, i.`isNarcotic`, i.`securityData`
             FROM `preparation_ingredients` pi JOIN `inventory` i ON pi.`inventoryId` = i.`id`
             WHERE pi.`preparationId` IN ($in_clause)"
        );
        $stmt_ingredients->execute($prep_ids);
        $all_ingredients = $stmt_ingredients->fetchAll(PDO::FETCH_GROUP);
        foreach ($preparations as $key => $prep) {
            $preparations[$key]['ingredients'] = array_map(function($ing) {
                if (isset($ing['securityData']) && is_string($ing['securityData'])) $ing['securityData'] = json_decode($ing['securityData'], true);
                return $ing;
            }, $all_ingredients[$prep['id']] ?? []);
            $preparations[$key]['labelWarnings'] = json_decode($prep['labelWarnings'] ?? '[]', true);
            $preparations[$key]['techOps'] = json_decode($prep['techOps'] ?? '[]', true);
            $preparations[$key]['worksheetItems'] = json_decode($prep['worksheetItems'] ?? '[]', true);
            $preparations[$key]['batches'] = json_decode($prep['batches'] ?? '[]', true);
        }
    }
    
    $stmt_logs = $pdo->query("SELECT * FROM `logs` ORDER BY `date` DESC, `id` DESC");
    $logs = $stmt_logs->fetchAll();
    echo json_encode(['inventory' => $inventory, 'preparations' => $preparations, 'logs' => $logs]);
}

function addOrUpdateInventory($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $isUpdate = isset($data['id']) && !empty($data['id']);

    $fields = ['name', 'ni', 'lot', 'expiry', 'quantity', 'unit', 'totalCost', 'costPerGram', 'supplier', 'purity', 'receptionDate', 'ddtNumber', 'ddtDate', 'isExcipient', 'isContainer', 'isDoping', 'isNarcotic', 'securityData'];
    $params = [];
    foreach ($fields as $field) {
        $value = $data[$field] ?? null;
        $params[':' . $field] = is_array($value) ? json_encode($value) : $value;
    }
    $params[':isExcipient'] = !empty($data['isExcipient']) ? 1 : 0;
    $params[':isContainer'] = !empty($data['isContainer']) ? 1 : 0;
    $params[':isDoping'] = !empty($data['isDoping']) ? 1 : 0;
    $params[':isNarcotic'] = !empty($data['isNarcotic']) ? 1 : 0;

    $pdo->beginTransaction();
    try {
        if ($isUpdate) {
            $params[':id'] = $data['id'];
            $update_fields_sql = implode(', ', array_map(fn($f) => "`$f`=:$f", $fields));
            $sql = "UPDATE `inventory` SET $update_fields_sql WHERE `id`=:id";
            createLog($pdo, 'RETTIFICA', 'Aggiornamento anagrafica', ['substance' => $data['name'], 'ni' => $data['ni']]);
        } else {
            $insert_fields_sql = implode(', ', array_map(fn($f) => "`$f`", $fields));
            $insert_values_sql = implode(', ', array_map(fn($f) => ":$f", $fields));
            $sql = "INSERT INTO `inventory` ($insert_fields_sql) VALUES ($insert_values_sql)";
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $newId = $data['id'] ?? $pdo->lastInsertId();

        if (!$isUpdate) {
             createLog($pdo, 'CARICO', 'Nuovo carico in magazzino', ['substance' => $data['name'], 'ni' => $data['ni'], 'quantity' => $data['quantity'], 'unit' => $data['unit']]);
        }
        
        $pdo->commit();
        echo json_encode(['success' => true, 'id' => $newId]);
    } catch (\Exception $e) {
        $pdo->rollBack();
        sendError(500, "Errore salvataggio sostanza: " . $e->getMessage());
    }
}

function disposeInventory($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    if (!$id) { sendError(400, 'ID mancante.'); return; }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("SELECT * FROM `inventory` WHERE `id` = ?");
        $stmt->execute([$id]);
        $item = $stmt->fetch();

        if ($item) {
            $sql = "UPDATE `inventory` SET `disposed`=1, `endUseDate`=? WHERE `id`=?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([date('Y-m-d'), $id]);
            createLog($pdo, 'SMALTIMENTO', 'Sostanza smaltita', ['substance' => $item['name'], 'ni' => $item['ni'], 'quantity' => $item['quantity'], 'unit' => $item['unit']]);
        }
        $pdo->commit();
        echo json_encode(['success' => true, 'id' => $id]);
    } catch (\Exception $e) {
        $pdo->rollBack();
        sendError(500, "Errore smaltimento: " . $e->getMessage());
    }
}

function savePreparation($pdo) {
    $requestData = json_decode(file_get_contents('php://input'), true);
    $prepDetails = $requestData['prepDetails'];
    $itemsUsed = $requestData['itemsUsed'];
    $isDraft = $requestData['isDraft'];
    $oldPrepId = $prepDetails['id'] ?? null;

    $pdo->beginTransaction();
    try {
        // --- GESTIONE PREPARAZIONE (INSERT/UPDATE) ---
                $prepFields = [
                    'prepNumber', 'name', 'pharmaceuticalForm', 'quantity', 'prepUnit', 
                    'expiryDate', 'posology', 'date', 'patient', 'doctor', 'status', 
                    'totalPrice', 'prepType', 'notes', 'usage', 'operatingProcedures', 
                    'labelWarnings', 'customLabelWarning', 'techOps', 'worksheetItems', 'recipeDate', 'batches'
                ];
        $prepParams = [];
        foreach ($prepFields as $field) {
            $value = $prepDetails[$field] ?? null;
            $prepParams[':' . $field] = is_array($value) ? json_encode($value) : $value;
        }
        $prepParams[':status'] = $isDraft ? 'Bozza' : 'Completata';
        
        $wasDraft = true;
        $oldIngredients = [];
        if ($oldPrepId) {
            $stmt = $pdo->prepare("SELECT * FROM `preparation_ingredients` pi JOIN `inventory` i ON pi.inventoryId = i.id WHERE pi.`preparationId` = ?");
            $stmt->execute([$oldPrepId]);
            $oldIngredients = $stmt->fetchAll();

            $stmtStatus = $pdo->prepare("SELECT `status` FROM `preparations` WHERE `id` = ?");
            $stmtStatus->execute([$oldPrepId]);
            if ($stmtStatus->fetchColumn() === 'Completata') $wasDraft = false;
        }
        
        $newPrepId = $oldPrepId;
        if ($oldPrepId) {
            $update_fields_sql = implode(', ', array_map(fn($f) => "`$f`=:$f", $prepFields));
            $sql = "UPDATE `preparations` SET $update_fields_sql WHERE `id`=:id";
            $prepParams[':id'] = $oldPrepId;
        } else {
            $insert_fields_sql = implode(', ', array_map(fn($f) => "`$f`", $prepFields));
            $insert_values_sql = implode(', ', array_map(fn($f) => ":$f", $prepFields));
            $sql = "INSERT INTO `preparations` ($insert_fields_sql) VALUES ($insert_values_sql)";
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute($prepParams);
        if (!$oldPrepId) $newPrepId = $pdo->lastInsertId();

        // --- GESTIONE MAGAZZINO E LOGS ---
        if (!$isDraft) {
            if ($wasDraft) { // Passaggio da Bozza/Nuova a Completata: scarico semplice
                foreach ($itemsUsed as $item) {
                    $stmt = $pdo->prepare("UPDATE `inventory` SET `quantity` = `quantity` - ? WHERE `id` = ?");
                    $stmt->execute([$item['amountUsed'], $item['id']]);
                    createLog($pdo, 'SCARICO', "Completata Prep. #{$prepDetails['prepNumber']}", ['substance' => $item['name'], 'ni' => $item['ni'] ?? '', 'quantity' => $item['amountUsed'], 'unit' => $item['unit'], 'preparationId' => $newPrepId]);
                }
            } else { // Modifica di una prep già completa: logica delta
                $logNote = "Modifica Prep. #{$prepDetails['prepNumber']}";
                $newIngredientsMap = array_column($itemsUsed, null, 'id');
                $oldIngredientsMap = array_column($oldIngredients, null, 'inventoryId');

                // Itera sui nuovi ingredienti per calcolare scarichi o rettifiche
                foreach ($newIngredientsMap as $newIng) {
                    $oldIng = $oldIngredientsMap[$newIng['id']] ?? null;
                    $diff = $newIng['amountUsed'] - ($oldIng ? $oldIng['amountUsed'] : 0);
                    if ($diff > 0) {
                        $stmt = $pdo->prepare("UPDATE `inventory` SET `quantity` = `quantity` - ? WHERE `id` = ?");
                        $stmt->execute([$diff, $newIng['id']]);
                        createLog($pdo, 'SCARICO', $logNote, ['substance' => $newIng['name'], 'ni' => $newIng['ni'] ?? '', 'quantity' => $diff, 'unit' => $newIng['unit'], 'preparationId' => $newPrepId]);
                    } elseif ($diff < 0) {
                        $stmt = $pdo->prepare("UPDATE `inventory` SET `quantity` = `quantity` + ? WHERE `id` = ?");
                        $stmt->execute([abs($diff), $newIng['id']]);
                        createLog($pdo, 'ANNULLAMENTO', $logNote, ['substance' => $newIng['name'], 'ni' => $newIng['ni'] ?? '', 'quantity' => abs($diff), 'unit' => $newIng['unit'], 'preparationId' => $newPrepId]);
                    }
                }
                // Itera sui vecchi ingredienti per trovare quelli rimossi
                foreach ($oldIngredientsMap as $oldIng) {
                    if (!isset($newIngredientsMap[$oldIng['inventoryId']])) {
                        $stmt = $pdo->prepare("UPDATE `inventory` SET `quantity` = `quantity` + ? WHERE `id` = ?");
                        $stmt->execute([$oldIng['amountUsed'], $oldIng['inventoryId']]);
                        createLog($pdo, 'ANNULLAMENTO', $logNote, ['substance' => $oldIng['name'], 'ni' => $oldIng['ni'] ?? '', 'quantity' => $oldIng['amountUsed'], 'unit' => $oldIng['unit'], 'preparationId' => $newPrepId]);
                    }
                }
            }
        }
        
        // --- GESTIONE INGREDIENTI ---
        $stmt = $pdo->prepare("DELETE FROM `preparation_ingredients` WHERE `preparationId` = ?");
        $stmt->execute([$newPrepId]);
        foreach ($itemsUsed as $item) {
            $stmt = $pdo->prepare("INSERT INTO `preparation_ingredients` (`preparationId`, `inventoryId`, `amountUsed`) VALUES (?, ?, ?)");
            $stmt->execute([$newPrepId, $item['id'], $item['amountUsed']]);
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
    if (!$prepId) { sendError(400, 'ID preparazione mancante.'); return; }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("SELECT i.name, i.ni, i.unit, pi.inventoryId, pi.amountUsed FROM `preparation_ingredients` pi JOIN `inventory` i ON pi.inventoryId = i.id WHERE pi.`preparationId` = ?");
        $stmt->execute([$prepId]);
        $ingredientsToRefund = $stmt->fetchAll();

        foreach ($ingredientsToRefund as $item) {
            $stmt = $pdo->prepare("UPDATE `inventory` SET `quantity` = `quantity` + ? WHERE `id` = ?");
            $stmt->execute([$item['amountUsed'], $item['inventoryId']]);
            createLog($pdo, 'ANNULLAMENTO', "Annullata preparazione", ['substance' => $item['name'], 'ni' => $item['ni'], 'quantity' => $item['amountUsed'], 'unit' => $item['unit'], 'preparationId' => $prepId]);
        }

        $stmt = $pdo->prepare("DELETE FROM `preparation_ingredients` WHERE `preparationId` = ?");
        $stmt->execute([$prepId]);
        $stmt = $pdo->prepare("DELETE FROM `preparations` WHERE `id` = ?");
        $stmt->execute([$prepId]);

        $pdo->commit();
        echo json_encode(['success' => true, 'id' => $prepId]);
    } catch (\Exception $e) {
        $pdo->rollBack();
        sendError(500, "Errore eliminazione preparazione: " . $e->getMessage());
    }
}

function sendError($statusCode, $message) {
    http_response_code($statusCode);
    echo json_encode(['error' => $message]);
}

?>