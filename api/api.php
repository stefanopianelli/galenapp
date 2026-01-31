<?php
// Gestione API per GalenicoLab

// --- ERROR HANDLING GLOBALE ---
ini_set('display_errors', 0);
error_reporting(E_ALL);

register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE || $error['type'] === E_CORE_ERROR || $error['type'] === E_COMPILE_ERROR)) {
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=UTF-8');
            http_response_code(500);
        }
        echo json_encode(['error' => 'Errore Fatale PHP: ' . $error['message'] . ' in ' . $error['file'] . ' on line ' . $error['line']]);
    }
});

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

// Carica configurazione
$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    die(json_encode(['error' => 'Configuration file missing']));
}
$config = include($configPath);

if (!$config || !isset($config['jwt_secret'])) {
    http_response_code(500);
    die(json_encode(['error' => 'Invalid configuration: JWT secret missing']));
}

define('JWT_SECRET_KEY', $config['jwt_secret']);

// --- GESTIONE JWT E RUOLI ---
function create_jwt($user_id, $username, $role) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode(['user_id' => $user_id, 'username' => $username, 'role' => $role, 'exp' => time() + (60*60*8)]);
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET_KEY, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function validate_jwt($jwt) {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) return null;
    list($header, $payload, $signature) = $parts;
    $signature_from_token = base64_decode(str_replace(['-', '_'], ['+', '/'], $signature));
    $expected_signature = hash_hmac('sha256', $header . "." . $payload, JWT_SECRET_KEY, true);
    if (!hash_equals($expected_signature, $signature_from_token)) return null;
    $payload_data = json_decode(base64_decode($payload), true);
    if ($payload_data['exp'] < time()) return null;
    return $payload_data;
}

function get_jwt_from_header() {
    $authHeader = null;
    $token = null;
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                $authHeader = $value;
                break;
            }
        }
    }
    if (!$authHeader) {
        if (isset($_SERVER['Authorization'])) $authHeader = $_SERVER['Authorization'];
        elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    if ($authHeader) {
        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
        } else {
            $token = $authHeader;
        }
    }
    if (!$token) {
        if (isset($_POST['token'])) $token = $_POST['token'];
    }
    if (!$token && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['token'])) {
            $token = $input['token'];
        }
    }
    return $token;
}

function checkPermission($action, $role) {
    if ($action === 'login') return true;
    $adminOnlyActions = ['get_users', 'create_user', 'update_user', 'delete_user', 'clear_logs', 'delete_log', 'get_audit_logs'];
    if (in_array($action, $adminOnlyActions) && $role !== 'admin') return false;
    $admins = ['admin', 'pharmacist']; 
    $readers = ['operator']; 
    $readActions = ['get_all_data', 'ask_ai', 'get_settings', 'get_logs_paginated'];
    if (in_array($role, $admins)) return true;
    if (in_array($role, $readers) && in_array($action, $readActions)) return true;
    return false;
}

$action = $_GET['action'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

// Init UserData
$userData = null;

try {
    if ($action !== 'login') {
        $jwt = get_jwt_from_header();
        $userData = $jwt ? validate_jwt($jwt) : null;
        if (!$userData) {
            sendError(401, 'Accesso non autorizzato. Token mancante o non valido.');
            exit();
        }
        $userRole = $userData['role'] ?? 'operator';
        if (!checkPermission($action, $userRole)) {
            sendError(403, 'Permesso negato per questa operazione.');
            exit();
        }
    }

    switch ($action) {
        case 'login':
            if ($method === 'POST') login($pdo);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'get_all_data':
            if ($method === 'GET' || $method === 'POST') getAllData($pdo);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'get_contacts':
            if ($method === 'GET') getContacts($pdo);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'save_contact':
            if ($method === 'POST') saveContact($pdo, $userData);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'delete_contact':
            if ($method === 'POST') deleteContact($pdo, $userData);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'add_or_update_inventory':
            if ($method === 'POST') addOrUpdateInventory($pdo, $userData);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'dispose_inventory':
            if ($method === 'POST') disposeInventory($pdo, $userData);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'save_preparation':
            if ($method === 'POST') savePreparation($pdo, $userData);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'delete_preparation':
            if ($method === 'POST') deletePreparation($pdo, $userData);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'clear_logs':
            if ($method === 'POST') clearLogs($pdo, $userData);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'delete_log':
            if ($method === 'POST') deleteLog($pdo, $userData);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'get_users':
            if ($method === 'GET' || $method === 'POST') getUsers($pdo);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'create_user':
            if ($method === 'POST') createUser($pdo, $userData);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'update_user':
            if ($method === 'POST') updateUser($pdo, $userData);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'delete_user':
            if ($method === 'POST') deleteUser($pdo, $userData);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'ask_ai':
            if ($method === 'POST') askAI($pdo);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'get_settings':
            if ($method === 'GET') getSettings($pdo);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'save_settings':
            if ($method === 'POST') saveSettings($pdo, $userData);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'get_audit_logs':
            if ($method === 'GET') getAuditLogs($pdo);
            else sendError(405, 'Metodo non consentito.');
            break;
        case 'get_logs_paginated':
            if ($method === 'GET') getLogsPaginated($pdo);
            else sendError(405, 'Metodo non consentito.');
            break;
        default:
            sendError(404, 'Azione non valida o non specificata.');
            break;
    }
} catch (PDOException $e) {
    sendError(500, "Errore Database: " . $e->getMessage());
} catch (Exception $e) {
    sendError(500, "Errore Server: " . $e->getMessage());
}

// --- HELPER FUNCTIONS ---

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

function logAudit($pdo, $userId, $username, $role, $action, $entityId = null, $details = null) {
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, username, role, action, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $username, $role, $action, $entityId, $details, $ip]);
    } catch (Throwable $e) {
        error_log("Audit Log Failed: " . $e->getMessage());
    }
}

function getLogsPaginated($pdo) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = ($page - 1) * $limit;
    
    $search = $_GET['search'] ?? '';
    $type = $_GET['type'] ?? 'all';
    
    $where = ["1=1"];
    $params = [];

    if (!empty($search)) {
        $where[] = "(substance LIKE :s1 OR ni LIKE :s2 OR notes LIKE :s3)";
        $params[':s1'] = "%$search%";
        $params[':s2'] = "%$search%";
        $params[':s3'] = "%$search%";
    }
    if ($type !== 'all') {
        $where[] = "`type` = :type";
        $params[':type'] = $type;
    }

    $whereSql = implode(' AND ', $where);

    try {
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM `logs` WHERE $whereSql");
        $countStmt->execute($params);
        $total = $countStmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT * FROM `logs` WHERE $whereSql ORDER BY `date` DESC, `id` DESC LIMIT :limit OFFSET :offset");
        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        echo json_encode([
            'data' => $stmt->fetchAll(),
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => ceil($total / $limit)
        ]);
    } catch (Throwable $e) {
        sendError(500, "Errore recupero log: " . $e->getMessage());
    }
}

function getAllData($pdo) {
    $stmt_inv = $pdo->query("SELECT * FROM `inventory` ORDER BY `name` ASC");
    $inventory = $stmt_inv->fetchAll();
    foreach ($inventory as &$item) {
        $item['securityData'] = json_decode($item['securityData'] ?? '{"pictograms":[]}', true);
    }
    unset($item);

    $stmt_preps = $pdo->query("SELECT * FROM `preparations` ORDER BY `date` DESC, `id` DESC");
    $preparations = $stmt_preps->fetchAll();
    $prep_ids = array_map(fn($p) => $p['id'], $preparations);
    
    if (!empty($prep_ids)) {
        $in_clause = implode(',', array_fill(0, count($prep_ids), '?'));
        $stmt_ingredients = $pdo->prepare(
            "SELECT pi.`preparationId`, pi.`amountUsed`, pi.`stockDeduction`, pi.`isExcipient` AS roleInPrep, i.`id`, i.`name`, i.`ni`, i.`lot`, i.`unit`, i.`costPerGram`, i.`isContainer`, i.`isDoping`, i.`isNarcotic`, i.`securityData`
             FROM `preparation_ingredients` pi JOIN `inventory` i ON pi.`inventoryId` = i.`id`
             WHERE pi.`preparationId` IN ($in_clause)"
        );
        $stmt_ingredients->execute($prep_ids);
        $all_ingredients = $stmt_ingredients->fetchAll(PDO::FETCH_GROUP);
        foreach ($preparations as $key => $prep) {
            $preparations[$key]['ingredients'] = array_map(function($ing) {
                if (isset($ing['securityData']) && is_string($ing['securityData'])) $ing['securityData'] = json_decode($ing['securityData'], true);
                $ing['savedIsExcipient'] = (isset($ing['roleInPrep']) && $ing['roleInPrep'] == 1);
                return $ing;
            }, $all_ingredients[$prep['id']] ?? []);
            $preparations[$key]['labelWarnings'] = json_decode($prep['labelWarnings'] ?? '[]', true);
            $preparations[$key]['techOps'] = json_decode($prep['techOps'] ?? '[]', true);
            $preparations[$key]['worksheetItems'] = json_decode($prep['worksheetItems'] ?? '[]', true);
            $preparations[$key]['batches'] = json_decode($prep['batches'] ?? '[]', true);
            $preparations[$key]['pricingData'] = json_decode($prep['pricingData'] ?? '{}', true);
            $preparations[$key]['uniformityCheck'] = json_decode($prep['uniformityCheck'] ?? 'null', true);
        }
    }
    
    $stmt_logs = $pdo->query("SELECT * FROM `logs` ORDER BY `date` DESC, `id` DESC LIMIT 50");
    $logs = $stmt_logs->fetchAll();
    echo json_encode(['inventory' => $inventory, 'preparations' => $preparations, 'logs' => $logs]);
}

function handleFileUpload($fileInputName) {
    if (!isset($_FILES[$fileInputName])) return null;
    $fileError = $_FILES[$fileInputName]['error'];
    if ($fileError === UPLOAD_ERR_NO_FILE) return null;
    if ($fileError !== UPLOAD_ERR_OK) {
        $msg = "Errore upload file ($fileError).";
        if ($fileError === UPLOAD_ERR_INI_SIZE || $fileError === UPLOAD_ERR_FORM_SIZE) $msg = "File troppo grande.";
        sendError(400, $msg);
        exit;
    }
    $allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    $allowedMimeTypes = [
        'application/pdf', 
        'image/jpeg', 
        'image/png'
    ];
    
    $fileName = $_FILES[$fileInputName]['name'];
    $fileTmpPath = $_FILES[$fileInputName]['tmp_name'];
    $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    // 1. Controllo Estensione
    if (!in_array($fileExt, $allowedExtensions)) {
        sendError(400, "Tipo file non consentito (estensione). Solo PDF e immagini.");
        exit;
    }

    // 2. Controllo MIME Type Reale
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $fileTmpPath);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedMimeTypes)) {
        sendError(400, "Tipo file non consentito (MIME non valido: $mimeType).");
        exit;
    }

    $uploadDir = __DIR__ . '/uploads/';
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            sendError(500, "Impossibile creare cartella uploads. Verifica permessi.");
            exit;
        }
    }
    $fileTmpPath = $_FILES[$fileInputName]['tmp_name'];
    $newFileName = time() . '_' . preg_replace('/[^a-zA-Z0-9_\-\.]/', '', $fileName);
    $destPath = $uploadDir . $newFileName;
    if(move_uploaded_file($fileTmpPath, $destPath)) {
        return $newFileName;
    } else {
        sendError(500, "Errore spostamento file su server. Verifica permessi cartella uploads.");
        exit;
    }
}

// --- HANDLERS CON AUDIT ---

function addOrUpdateInventory($pdo, $userData) {
    $userId = $userData['user_id']; $username = $userData['username']; $role = $userData['role'];
    $data = $_POST;
    $fields = ['name', 'ni', 'lot', 'expiry', 'quantity', 'initialQuantity', 'unit', 'totalCost', 'costPerGram', 'supplier', 'purity', 'receptionDate', 'ddtNumber', 'ddtDate', 'firstUseDate', 'minStock', 'isExcipient', 'isContainer', 'isDoping', 'isNarcotic', 'securityData'];
    $params = [];
    
    // Per nuovi record, se initialQuantity non è passato, usa la quantità corrente
    $isUpdate = isset($data['id']) && !empty($data['id']);
    if (!$isUpdate && (!isset($data['initialQuantity']) || empty($data['initialQuantity']))) {
        $data['initialQuantity'] = $data['quantity'] ?? 0;
    }

    foreach ($fields as $field) {
        $value = $data[$field] ?? null;
        if ($value === 'null' || $value === '') $value = null;
        $params[':' . $field] = $value;
    }
    $params[':isExcipient'] = filter_var($data['isExcipient'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
    $params[':isContainer'] = filter_var($data['isContainer'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
    $params[':isDoping'] = filter_var($data['isDoping'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
    $params[':isNarcotic'] = filter_var($data['isNarcotic'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;

    $sdsFileName = handleFileUpload('sdsFile');
    $techSheetFileName = handleFileUpload('technicalSheetFile');

    $isUpdate = isset($data['id']) && !empty($data['id']);

    if ($isUpdate) {
        $params[':id'] = $data['id'];
        $updateFields = array_map(fn($f) => "`$f`=:$f", $fields);
        if ($sdsFileName) { $updateFields[] = "`sdsFile`=:sdsFile"; $params[':sdsFile'] = $sdsFileName; }
        if ($techSheetFileName) { $updateFields[] = "`technicalSheetFile`=:technicalSheetFile"; $params[':technicalSheetFile'] = $techSheetFileName; }
        $sql = "UPDATE `inventory` SET " . implode(', ', $updateFields) . " WHERE `id`=:id";
        createLog($pdo, 'RETTIFICA', 'Aggiornamento anagrafica', ['substance' => $data['name'], 'ni' => $data['ni']]);
        logAudit($pdo, $userId, $username, $role, 'UPDATE_STOCK', $data['id'], "Modifica anagrafica sostanza: {$data['name']}");
    } else {
        $insertFields = $fields;
        $insertPlaceholders = array_map(fn($f) => ":$f", $fields);
        if ($sdsFileName) { $insertFields[] = 'sdsFile'; $insertPlaceholders[] = ':sdsFile'; $params[':sdsFile'] = $sdsFileName; }
        if ($techSheetFileName) { $insertFields[] = 'technicalSheetFile'; $insertPlaceholders[] = ':technicalSheetFile'; $params[':technicalSheetFile'] = $techSheetFileName; }
        $sql = "INSERT INTO `inventory` (" . implode(', ', array_map(fn($f) => "`$f`", $insertFields)) . ") VALUES (" . implode(', ', $insertPlaceholders) . ")";
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $newId = $data['id'] ?? $pdo->lastInsertId();
    if (!$isUpdate) {
         createLog($pdo, 'CARICO', 'Nuovo carico in magazzino', ['substance' => $data['name'], 'ni' => $data['ni'], 'quantity' => $data['quantity'], 'unit' => $data['unit']]);
         logAudit($pdo, $userId, $username, $role, 'CREATE_STOCK', $newId, "Carico nuova sostanza: {$data['name']}");
    }
    echo json_encode(['success' => true, 'id' => $newId]);
}

function disposeInventory($pdo, $userData) {
    $userId = $userData['user_id']; $username = $userData['username']; $role = $userData['role'];
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
            logAudit($pdo, $userId, $username, $role, 'DISPOSE_STOCK', $id, "Smaltimento sostanza: {$item['name']}");
        }
        $pdo->commit();
        echo json_encode(['success' => true, 'id' => $id]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        sendError(500, "Errore smaltimento: " . $e->getMessage());
    }
}

function savePreparation($pdo, $userData) {
    $userId = $userData['user_id']; $username = $userData['username']; $role = $userData['role'];
    $requestData = json_decode(file_get_contents('php://input'), true);
    $prepDetails = $requestData['prepDetails'];
    $itemsUsed = $requestData['itemsUsed'];
    $isDraft = $requestData['isDraft'];
    $oldPrepId = $prepDetails['id'] ?? null;

    $pdo->beginTransaction();
    try {
        $prepFields = ['prepNumber', 'name', 'pharmaceuticalForm', 'quantity', 'prepUnit', 'expiryDate', 'posology', 'date', 'patient', 'patientPhone', 'doctor', 'status', 'totalPrice', 'prepType', 'notes', 'usage', 'operatingProcedures', 'labelWarnings', 'customLabelWarning', 'techOps', 'worksheetItems', 'recipeDate', 'batches', 'pricingData', 'uniformityCheck'];
        $prepParams = [];
        foreach ($prepFields as $field) {
            $value = $prepDetails[$field] ?? null;
            $prepParams[':' . $field] = is_array($value) ? json_encode($value) : $value;
        }
        $prepParams[':status'] = $isDraft ? 'Bozza' : 'Completata';

        $wasDraft = true;
        $oldIngredients = [];
        if ($oldPrepId) {
            $stmt = $pdo->prepare("SELECT pi.`amountUsed`, pi.`stockDeduction`, pi.`inventoryId`, i.`name`, i.`ni`, i.`lot`, i.`unit` FROM `preparation_ingredients` pi JOIN `inventory` i ON pi.inventoryId = i.id WHERE pi.`preparationId` = ?");
            $stmt->execute([$oldPrepId]);
            $oldIngredients = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stmtStatus = $pdo->prepare("SELECT `status` FROM `preparations` WHERE `id` = ?");
            $stmtStatus->execute([$oldPrepId]);
            if ($stmtStatus->fetchColumn() === 'Completata') $wasDraft = false;
        }

        $newPrepId = $oldPrepId;
        if ($oldPrepId) {
            $update_fields_sql = implode(', ', array_map(fn($f) => "`$f`=:$f", $prepFields));
            $sql = "UPDATE `preparations` SET $update_fields_sql WHERE `id`=:id";
            $prepParams[':id'] = $oldPrepId;
            $stmt = $pdo->prepare($sql);
            $stmt->execute($prepParams);

            $stmt = $pdo->prepare("DELETE FROM `preparation_ingredients` WHERE `preparationId` = ?");
            $stmt->execute([$oldPrepId]);
            
            logAudit($pdo, $userId, $username, $role, 'UPDATE_PREP', $oldPrepId, "Modificata preparazione: {$prepDetails['name']} (Stato: {$prepParams[':status']})");
        } else {
            $insert_fields_sql = implode(', ', array_map(fn($f) => "`$f`", $prepFields));
            $insert_values_sql = implode(', ', array_map(fn($f) => ":$f", $prepFields));
            $sql = "INSERT INTO `preparations` ($insert_fields_sql) VALUES ($insert_values_sql)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($prepParams);
            $newPrepId = $pdo->lastInsertId();
            
            logAudit($pdo, $userId, $username, $role, 'CREATE_PREP', $newPrepId, "Creata preparazione: {$prepDetails['name']} (Stato: {$prepParams[':status']})");
        }

        foreach ($itemsUsed as $item) {
            $stmt = $pdo->prepare("INSERT INTO `preparation_ingredients` (`preparationId`, `inventoryId`, `amountUsed`, `stockDeduction`, `isExcipient`) VALUES (?, ?, ?, ?, ?)");
            $isExcipient = filter_var($item['isExcipient'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $sDed = (!empty($item['stockDeduction']) && $item['stockDeduction'] > 0) ? $item['stockDeduction'] : null;

            $stmt->execute([
                $newPrepId, 
                $item['id'], 
                $item['amountUsed'], 
                $sDed,
                $isExcipient ? 1 : 0
            ]);
        }

        $disposedItems = [];

        if (!$isDraft) {
            if ($wasDraft) { 
                foreach ($itemsUsed as $item) {
                    $qtyToDeduct = (!empty($item['stockDeduction']) && $item['stockDeduction'] > 0) ? $item['stockDeduction'] : $item['amountUsed'];
                    
                    // 1. Aggiorna quantità
                    $stmt = $pdo->prepare("UPDATE `inventory` SET 
                        `quantity` = `quantity` - ?, 
                        `firstUseDate` = COALESCE(`firstUseDate`, CURDATE())
                        WHERE `id` = ?");
                    $stmt->execute([$qtyToDeduct, $item['id']]);

                    // 2. Controlla residuo e smaltisci se necessario
                    $stmt = $pdo->prepare("UPDATE `inventory` SET `disposed` = 1, `endUseDate` = CURDATE() WHERE `id` = ? AND `quantity` <= 0.0001");
                    $stmt->execute([$item['id']]);
                    
                    if ($stmt->rowCount() > 0) {
                        $stmtInfo = $pdo->prepare("SELECT name, ni, lot FROM inventory WHERE id = ?");
                        $stmtInfo->execute([$item['id']]);
                        $disposedItems[] = $stmtInfo->fetch(PDO::FETCH_ASSOC);
                    }

                    createLog($pdo, 'SCARICO', "Completata Prep. #{$prepDetails['prepNumber']}", ['substance' => $item['name'], 'ni' => $item['ni'] ?? '', 'quantity' => $qtyToDeduct, 'unit' => $item['unit'], 'preparationId' => $newPrepId]);
                }
            } else { 
                // LOGICA DELTA
                $logNote = "Modifica Prep. #{$prepDetails['prepNumber']}";
                $newIngredientsMap = [];
                foreach($itemsUsed as $item) $newIngredientsMap[$item['id']] = $item;
                $oldIngredientsMap = [];
                foreach($oldIngredients as $item) $oldIngredientsMap[$item['inventoryId']] = $item;

                foreach ($newIngredientsMap as $invId => $newIng) {
                    $oldIng = $oldIngredientsMap[$invId] ?? null;
                    $newQty = (!empty($newIng['stockDeduction']) && $newIng['stockDeduction'] > 0) ? $newIng['stockDeduction'] : $newIng['amountUsed'];
                    $oldQty = 0;
                    if ($oldIng) {
                         $oldQty = (!empty($oldIng['stockDeduction']) && $oldIng['stockDeduction'] > 0) ? $oldIng['stockDeduction'] : $oldIng['amountUsed'];
                    }
                    $diff = $newQty - $oldQty;
                    
                    if ($diff > 0.0001) {
                        // 1. Aggiorna quantità
                        $stmt = $pdo->prepare("UPDATE `inventory` SET 
                            `quantity` = `quantity` - ?, 
                            `firstUseDate` = COALESCE(`firstUseDate`, CURDATE())
                            WHERE `id` = ?");
                        $stmt->execute([$diff, $invId]);

                        // 2. Controlla residuo
                        $stmt = $pdo->prepare("UPDATE `inventory` SET `disposed` = 1, `endUseDate` = CURDATE() WHERE `id` = ? AND `quantity` <= 0.0001");
                        $stmt->execute([$invId]);
                        
                        if ($stmt->rowCount() > 0) {
                            $stmtInfo = $pdo->prepare("SELECT name, ni, lot FROM inventory WHERE id = ?");
                            $stmtInfo->execute([$invId]);
                            $disposedItems[] = $stmtInfo->fetch(PDO::FETCH_ASSOC);
                        }

                        createLog($pdo, 'SCARICO', $logNote, ['substance' => $newIng['name'], 'ni' => $newIng['ni'] ?? '', 'quantity' => $diff, 'unit' => $newIng['unit'], 'preparationId' => $newPrepId]);
                    } elseif ($diff < -0.0001) {
                        $absDiff = abs($diff);
                        $stmt = $pdo->prepare("UPDATE `inventory` SET `quantity` = `quantity` + ? WHERE `id` = ?");
                        $stmt->execute([$absDiff, $invId]);
                        createLog($pdo, 'ANNULLAMENTO', $logNote, ['substance' => $newIng['name'], 'ni' => $newIng['ni'] ?? '', 'quantity' => $absDiff, 'unit' => $newIng['unit'], 'preparationId' => $newPrepId]);
                    }
                }
                foreach ($oldIngredientsMap as $invId => $oldIng) {
                    if (!isset($newIngredientsMap[$invId])) {
                        $oldQty = (!empty($oldIng['stockDeduction']) && $oldIng['stockDeduction'] > 0) ? $oldIng['stockDeduction'] : $oldIng['amountUsed'];
                        $stmt = $pdo->prepare("UPDATE `inventory` SET `quantity` = `quantity` + ? WHERE `id` = ?");
                        $stmt->execute([$oldQty, $invId]);
                        createLog($pdo, 'ANNULLAMENTO', $logNote, ['substance' => $oldIng['name'], 'ni' => $oldIng['ni'] ?? '', 'quantity' => $oldQty, 'unit' => $oldIng['unit'], 'preparationId' => $newPrepId]);
                    }
                }
            }
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'id' => $newPrepId, 'disposedItems' => $disposedItems]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        sendError(500, "Errore salvataggio preparazione: " . $e->getMessage());
    }
}

function deletePreparation($pdo, $userData) {
    $userId = $userData['user_id']; $username = $userData['username']; $role = $userData['role'];
    $data = json_decode(file_get_contents('php://input'), true);
    $prepId = $data['id'] ?? null;
    if (!$prepId) { sendError(400, 'ID preparazione mancante.'); return; }

    $pdo->beginTransaction();
    try {
        $stmtStatus = $pdo->prepare("SELECT `status` FROM `preparations` WHERE `id` = ?");
        $stmtStatus->execute([$prepId]);
        $status = $stmtStatus->fetchColumn();

        if (!$status) { sendError(404, 'Preparazione non trovata.'); $pdo->rollBack(); return; }

        if ($status !== 'Bozza' && $role !== 'admin') {
            sendError(403, 'Solo l\'amministratore può eliminare preparazioni completate.');
            $pdo->rollBack();
            return;
        }

        if ($status !== 'Bozza') {
            $stmt = $pdo->prepare("SELECT i.name, i.ni, i.unit, pi.inventoryId, pi.amountUsed, pi.stockDeduction FROM `preparation_ingredients` pi JOIN `inventory` i ON pi.inventoryId = i.id WHERE pi.`preparationId` = ?");
            $stmt->execute([$prepId]);
            $ingredientsToRefund = $stmt->fetchAll();

            foreach ($ingredientsToRefund as $item) {
                $qtyToRefund = (!empty($item['stockDeduction']) && $item['stockDeduction'] > 0) ? $item['stockDeduction'] : $item['amountUsed'];
                $stmt = $pdo->prepare("UPDATE `inventory` SET `quantity` = `quantity` + ? WHERE `id` = ?");
                $stmt->execute([$qtyToRefund, $item['inventoryId']]);
                createLog($pdo, 'ANNULLAMENTO', "Annullata preparazione", ['substance' => $item['name'], 'ni' => $item['ni'], 'quantity' => $qtyToRefund, 'unit' => $item['unit'], 'preparationId' => $prepId]);
            }
        }

        $stmt = $pdo->prepare("DELETE FROM `preparation_ingredients` WHERE `preparationId` = ?");
        $stmt->execute([$prepId]);
        $stmt = $pdo->prepare("DELETE FROM `preparations` WHERE `id` = ?");
        $stmt->execute([$prepId]);
        
        logAudit($pdo, $userId, $username, $role, 'DELETE_PREP', $prepId, "Eliminata preparazione (Stato precedente: $status)");

        $pdo->commit();
        echo json_encode(['success' => true, 'id' => $prepId]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        sendError(500, "Errore eliminazione preparazione: " . $e->getMessage());
    }
}

function clearLogs($pdo, $userData) {
    $userId = $userData['user_id']; $username = $userData['username']; $role = $userData['role'];
    $data = json_decode(file_get_contents('php://input'), true);
    $mode = $data['mode'] ?? 'range';
    $pdo->beginTransaction();
    try {
        if ($mode === 'all') {
            $stmt = $pdo->prepare("DELETE FROM `logs`");
            $stmt->execute();
            logAudit($pdo, $userId, $username, $role, 'CLEAR_LOGS', null, "Cancellazione totale registri");
        } elseif ($mode === 'range') {
            $startDate = $data['startDate'] ?? null;
            $endDate = $data['endDate'] ?? null;
            if (!$startDate || !$endDate) { sendError(400, 'Date mancanti.'); $pdo->rollBack(); return; }
            $stmt = $pdo->prepare("DELETE FROM `logs` WHERE `date` >= ? AND `date` <= ?");
            $stmt->execute([$startDate, $endDate]);
            logAudit($pdo, $userId, $username, $role, 'CLEAR_LOGS', null, "Cancellazione registri dal $startDate al $endDate");
        }
        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        sendError(500, "Errore cancellazione log: " . $e->getMessage());
    }
}

function deleteLog($pdo, $userData) {
    $userId = $userData['user_id']; $username = $userData['username']; $role = $userData['role'];
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    if (!$id) { sendError(400, 'ID mancante.'); return; }
    try {
        $stmt = $pdo->prepare("DELETE FROM `logs` WHERE `id` = ?");
        $stmt->execute([$id]);
        logAudit($pdo, $userId, $username, $role, 'DELETE_LOG', $id, "Eliminato singolo log");
        echo json_encode(['success' => true]);
    } catch (Throwable $e) {
        sendError(500, "Errore eliminazione log: " . $e->getMessage());
    }
}

function getUsers($pdo) {
    $stmt = $pdo->query("SELECT id, username, role, createdAt FROM users ORDER BY username ASC");
    echo json_encode($stmt->fetchAll());
}

function createUser($pdo, $userData) {
    $adminId = $userData['user_id']; $adminName = $userData['username']; $adminRole = $userData['role'];
    $data = json_decode(file_get_contents('php://input'), true);
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    $role = $data['role'] ?? 'operator';
    if (empty($username) || empty($password)) { sendError(400, 'Username e password obbligatori.'); return; }
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    try {
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)");
        $stmt->execute([$username, $password_hash, $role]);
        $newId = $pdo->lastInsertId();
        logAudit($pdo, $adminId, $adminName, $adminRole, 'CREATE_USER', $newId, "Creato utente: $username ($role)");
        echo json_encode(['success' => true, 'id' => $newId]);
    } catch (PDOException $e) { sendError(400, 'Errore: Username già esistente.'); }
}

function updateUser($pdo, $userData) {
    $adminId = $userData['user_id']; $adminName = $userData['username']; $adminRole = $userData['role'];
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    $username = $data['username'] ?? '';
    $role = $data['role'] ?? '';
    $password = $data['password'] ?? '';
    if (!$id || empty($username) || empty($role)) { sendError(400, 'Dati mancanti.'); return; }
    try {
        if (!empty($password)) {
            $password_hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET username = ?, role = ?, password_hash = ? WHERE id = ?");
            $stmt->execute([$username, $role, $password_hash, $id]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET username = ?, role = ? WHERE id = ?");
            $stmt->execute([$username, $role, $id]);
        }
        logAudit($pdo, $adminId, $adminName, $adminRole, 'UPDATE_USER', $id, "Modificato utente: $username");
        echo json_encode(['success' => true]);
    } catch (PDOException $e) { sendError(400, 'Errore durante l\'aggiornamento.'); }
}

function deleteUser($pdo, $userData) {
    $adminId = $userData['user_id']; $adminName = $userData['username']; $adminRole = $userData['role'];
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    if (!$id) { sendError(400, 'ID mancante.'); return; }
    if ($id == $adminId) { sendError(400, 'Non puoi eliminare il tuo stesso account.'); return; }
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);
    logAudit($pdo, $adminId, $adminName, $adminRole, 'DELETE_USER', $id, "Eliminato utente ID: $id");
    echo json_encode(['success' => true]);
}

function askAI($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $userPrompt = $data['prompt'] ?? '';
    if (empty($userPrompt)) { sendError(400, 'Domanda vuota.'); return; }
    if (!defined('GEMINI_API_KEY') || GEMINI_API_KEY === 'INSERISCI_QUI_LA_TUA_CHIAVE') { sendError(500, 'Chiave API AI non configurata sul server.'); return; }
    $apiKey = trim(GEMINI_API_KEY);
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey";
    $systemInstruction = "Sei un esperto Farmacista Galenista in un laboratorio italiano. Rispondi in modo tecnico, preciso e professionale. Usi le norme NBP come riferimento. Sii conciso ma esaustivo.";
    $requestBody = [ "contents" => [ [ "parts" => [ ["text" => $systemInstruction . "\n\nDomanda Utente: " . $userPrompt] ] ] ] ];
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestBody));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if (curl_errno($ch)) { sendError(500, 'Errore connessione AI: ' . curl_error($ch)); curl_close($ch); return; }
    curl_close($ch);
    if ($httpCode !== 200) { $errorData = json_decode($response, true); $errorMsg = $errorData['error']['message'] ?? 'Errore sconosciuto da Google AI'; sendError(500, "Errore AI ($httpCode): $errorMsg"); return; }
    $responseData = json_decode($response, true);
    $aiText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? 'Nessuna risposta.';
    echo json_encode(['success' => true, 'response' => $aiText]);
}

function getSettings($pdo) {
    try {
        $stmt = $pdo->query("SELECT settingKey, settingValue FROM settings");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $settings = [];
        foreach ($rows as $row) { $settings[$row['settingKey']] = $row['settingValue']; }
        echo json_encode($settings);
    } catch (Throwable $e) { sendError(500, "Errore recupero impostazioni: " . $e->getMessage()); }
}

function saveSettings($pdo, $userData) {
    $userId = $userData['user_id']; $username = $userData['username']; $role = $userData['role'];
    $data = [];
    $contentType = $_SERVER["CONTENT_TYPE"] ?? '';
    if (strpos($contentType, 'multipart/form-data') !== false) {
        $data = $_POST;
        if (isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
            $logoName = handleFileUpload('logo');
            if ($logoName) { $data['logo'] = $logoName; }
        }
    } else {
        $data = json_decode(file_get_contents('php://input'), true);
    }
    if (!is_array($data)) { sendError(400, 'Dati non validi.'); return; }
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("INSERT INTO settings (settingKey, settingValue) VALUES (:key, :valInsert) ON DUPLICATE KEY UPDATE settingValue = :valUpdate");
        foreach ($data as $key => $value) {
            if (empty($key)) continue;
            $valToSave = $value;
            if (!is_string($value) && !is_null($value)) $valToSave = (string)$value;
            $stmt->execute([':key' => $key, ':valInsert' => $valToSave, ':valUpdate' => $valToSave]);
        }
        logAudit($pdo, $userId, $username, $role, 'UPDATE_SETTINGS', null, "Modifica impostazioni farmacia");
        $pdo->commit();
        echo json_encode(['success' => true, 'data' => $data]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        sendError(500, "Errore salvataggio impostazioni: " . $e->getMessage());
    }
}

function getAuditLogs($pdo) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    if ($page < 1) $page = 1;
    if ($limit < 1) $limit = 50;
    $offset = ($page - 1) * $limit;

    try {
        // Conta totale
        $countStmt = $pdo->query("SELECT COUNT(*) FROM audit_logs");
        $total = $countStmt->fetchColumn();

        // Recupera dati paginati
        $stmt = $pdo->prepare("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $logs = $stmt->fetchAll();

        echo json_encode([
            'data' => $logs,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => ceil($total / $limit)
        ]);
    } catch (Throwable $e) {
        sendError(500, "Errore recupero audit: " . $e->getMessage());
    }
}

function login($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    if (empty($username) || empty($password)) { sendError(400, 'Username e password sono obbligatori.'); return; }
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    if ($user && password_verify($password, $user['password_hash'])) {
        $role = $user['role'] ?? 'operator';
        $token = create_jwt($user['id'], $user['username'], $role);
        logAudit($pdo, $user['id'], $user['username'], $role, 'LOGIN', null, "Accesso eseguito");
        echo json_encode(['success' => true, 'token' => $token, 'role' => $role, 'username' => $user['username']]);
    } else {
        sendError(401, 'Credenziali non valide.');
    }
}

function sendError($statusCode, $message) {
    http_response_code($statusCode);
    echo json_encode(['error' => $message]);
}
function getContacts($pdo) {
    try {
        $stmt = $pdo->query("SELECT * FROM contacts ORDER BY name ASC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Throwable $e) {
        sendError(500, "Errore recupero contatti: " . $e->getMessage());
    }
}

function saveContact($pdo, $userData) {
    $userId = $userData['user_id']; $username = $userData['username']; $role = $userData['role'];
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $data['id'] ?? null;
    $type = $data['type'] ?? 'customer';
    $name = trim($data['name'] ?? '');
    
    if (empty($name)) { sendError(400, 'Nome obbligatorio.'); return; }

    $fields = ['type', 'name', 'taxId', 'email', 'phone', 'address', 'city', 'zip', 'province', 'notes'];
    $params = [];
    foreach ($fields as $f) $params[":$f"] = $data[$f] ?? null;

    try {
        if ($id) {
            $setClause = implode(', ', array_map(fn($f) => "`$f` = :$f", $fields));
            $stmt = $pdo->prepare("UPDATE contacts SET $setClause WHERE id = :id");
            $params[':id'] = $id;
            $stmt->execute($params);
            logAudit($pdo, $userId, $username, $role, 'UPDATE_CONTACT', $id, "Modificato contatto: $name");
        } else {
            $cols = implode(', ', array_map(fn($f) => "`$f`", $fields));
            $vals = implode(', ', array_map(fn($f) => ":$f", $fields));
            $stmt = $pdo->prepare("INSERT INTO contacts ($cols) VALUES ($vals)");
            $stmt->execute($params);
            $id = $pdo->lastInsertId();
            logAudit($pdo, $userId, $username, $role, 'CREATE_CONTACT', $id, "Creato contatto: $name");
        }
        echo json_encode(['success' => true, 'id' => $id]);
    } catch (Throwable $e) {
        sendError(500, "Errore salvataggio contatto: " . $e->getMessage());
    }
}

function deleteContact($pdo, $userData) {
    $userId = $userData['user_id']; $username = $userData['username']; $role = $userData['role'];
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    
    if (!$id) { sendError(400, 'ID mancante.'); return; }

    try {
        $stmt = $pdo->prepare("DELETE FROM contacts WHERE id = ?");
        $stmt->execute([$id]);
        logAudit($pdo, $userId, $username, $role, 'DELETE_CONTACT', $id, "Eliminato contatto ID: $id");
        echo json_encode(['success' => true]);
    } catch (Throwable $e) {
        sendError(500, "Errore eliminazione contatto: " . $e->getMessage());
    }
}
?>