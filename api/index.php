<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers first
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Get the request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = str_replace('/api/', '', $_SERVER['REQUEST_URI']);
$path = rtrim($path, '/');

// Debug logging
error_log("API Request: $method $path");

try {
    switch ($method . ':' . $path) {
        case 'POST:login':
            handleLogin();
            break;
            
        case 'GET:cargaisons':
            handleGetCargaisons();
            break;
            
        case 'POST:cargaisons':
            handleCreateCargaison();
            break;
            
        case 'GET:colis':
            handleGetColis();
            break;
            
        case 'POST:colis':
            handleCreateColis();
            break;
            
        case 'GET:clients':
            handleGetClients();
            break;
            
        case preg_match('/^GET:colis\/track\/(.+)$/', $method . ':' . $path, $matches) ? $method . ':' . $path : '':
            handleTrackColis($matches[1]);
            break;
            
        default:
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Route not found',
                'path' => $path,
                'method' => $method
            ]);
            break;
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}

function handleLogin() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    error_log("Login attempt with data: " . print_r($data, true));
    
    if (!$data || !isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email and password required']);
        return;
    }
    
    if ($data['email'] === 'admin@gpdum.com' && $data['password'] === 'admin123') {
        echo json_encode([
            'success' => true,
            'token' => 'admin_token_' . time(),
            'user' => ['email' => $data['email'], 'role' => 'admin']
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }
}

function handleGetCargaisons() {
    header('Content-Type: application/json');
    
    $db = getDatabase();
    echo json_encode($db['cargaisons'] ?? []);
}

function handleCreateCargaison() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
        return;
    }
    
    $db = getDatabase();
    
    $cargaison = [
        'id' => 'CARG' . time(),
        'numero' => $data['numero'] ?? '',
        'poidsMax' => (float)($data['poidsMax'] ?? 0),
        'prix' => 0,
        'lieuDepart' => $data['lieuDepart'] ?? '',
        'lieuArrivee' => $data['lieuArrivee'] ?? '',
        'distance' => (float)($data['distance'] ?? 0),
        'type' => $data['type'] ?? 'ROUTIERE',
        'etatAvancement' => 'EN_ATTENTE',
        'etatGlobal' => 'OUVERT',
        'dateCreation' => date('Y-m-d H:i:s'),
        'produits' => []
    ];
    
    $db['cargaisons'][] = $cargaison;
    saveDatabase($db);
    
    echo json_encode(['success' => true, 'cargaison' => $cargaison]);
}

function handleGetColis() {
    $db = getDatabase();
    echo json_encode($db['colis'] ?? []);
}

function handleCreateColis() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
        return;
    }
    
    $db = getDatabase();
    
    $colis = [
        'id' => 'COL' . time(),
        'code' => generateTrackingCode(),
        'expediteur' => $data['expediteur'] ?? [],
        'destinataire' => $data['destinataire'] ?? [],
        'poids' => (float)($data['poids'] ?? 0),
        'typeProduit' => $data['typeProduit'] ?? 'MATERIEL',
        'typeCargaison' => $data['typeCargaison'] ?? 'ROUTIERE',
        'prix' => max(10000, calculatePrice((float)($data['poids'] ?? 0), $data['typeProduit'] ?? 'MATERIEL')),
        'etat' => 'EN_ATTENTE',
        'dateCreation' => date('Y-m-d H:i:s'),
        'cargaisonId' => null
    ];
    
    $db['colis'][] = $colis;
    
    // Add clients if they don't exist
    if (!isset($db['clients'])) {
        $db['clients'] = [];
    }
    
    // Add expediteur to clients
    $expediteurExists = false;
    foreach ($db['clients'] as $client) {
        if ($client['telephone'] === $colis['expediteur']['telephone']) {
            $expediteurExists = true;
            break;
        }
    }
    
    if (!$expediteurExists) {
        $db['clients'][] = array_merge($colis['expediteur'], [
            'id' => 'CLI' . time() . '_EXP',
            'dateCreation' => date('Y-m-d H:i:s')
        ]);
    }
    
    // Add destinataire to clients
    $destinataireExists = false;
    foreach ($db['clients'] as $client) {
        if ($client['telephone'] === $colis['destinataire']['telephone']) {
            $destinataireExists = true;
            break;
        }
    }
    
    if (!$destinataireExists) {
        $db['clients'][] = array_merge($colis['destinataire'], [
            'id' => 'CLI' . time() . '_DEST',
            'dateCreation' => date('Y-m-d H:i:s')
        ]);
    }
    
    saveDatabase($db);
    
    echo json_encode(['success' => true, 'colis' => $colis]);
}

function handleGetClients() {
    $db = getDatabase();
    echo json_encode($db['clients'] ?? []);
}

function handleTrackColis($code) {
    // Définir les en-têtes avant toute sortie
    header('Content-Type: application/json');
    
    // Chemin absolu vers db.json
    $dbPath = __DIR__ . '/db.json';
    
    // Vérifier si le fichier existe
    if (!file_exists($dbPath)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database file not found'
        ]);
        return;
    }
    
    try {
        // Lire le contenu du fichier
        $jsonContent = file_get_contents($dbPath);
        $db = json_decode($jsonContent, true);
        
        // Vérifier si la lecture a réussi
        if ($db === null) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error reading database'
            ]);
            return;
        }
        
        // Chercher le colis
        foreach ($db['colis'] as $colis) {
            if ($colis['code'] === $code) {
                echo json_encode([
                    'success' => true,
                    'colis' => $colis
                ]);
                return;
            }
        }
        
        // Si le colis n'est pas trouvé
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Colis non trouvé'
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erreur serveur: ' . $e->getMessage()
        ]);
    }
}

function handleRecoverColis($code) {
    $db = getDatabase();
    $found = false;
    
    foreach ($db['colis'] as &$colis) {
        if ($colis['code'] === $code) {
            $colis['etat'] = 'RECUPERE';
            $found = true;
            break;
        }
    }
    
    if ($found) {
        saveDatabase($db);
        echo json_encode(['success' => true, 'message' => 'Colis marqué comme récupéré']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Colis non trouvé']);
    }
}

function handleLostColis($code) {
    $db = getDatabase();
    $found = false;
    
    foreach ($db['colis'] as &$colis) {
        if ($colis['code'] === $code) {
            $colis['etat'] = 'PERDU';
            $found = true;
            break;
        }
    }
    
    if ($found) {
        saveDatabase($db);
        echo json_encode(['success' => true, 'message' => 'Colis marqué comme perdu']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Colis non trouvé']);
    }
}

function generateTrackingCode() {
    return 'GP' . strtoupper(substr(md5(time() . rand()), 0, 8));
}

function calculatePrice($poids, $typeProduit) {
    $basePrice = $poids * 100;
    
    switch ($typeProduit) {
        case 'FRAGILE':
            return $basePrice * 1.5;
        case 'CHIMIQUE':
            return $basePrice * 2;
        case 'ALIMENTAIRE':
            return $basePrice * 1.2;
        default:
            return $basePrice;
    }
}

function getDatabase() {
    if (!file_exists('db.json')) {
        $defaultData = ['cargaisons' => [], 'colis' => [], 'clients' => []];
        file_put_contents('db.json', json_encode($defaultData, JSON_PRETTY_PRINT));
        return $defaultData;
    }
    
    $content = file_get_contents('db.json');
    $data = json_decode($content, true);
    
    if ($data === null) {
        $defaultData = ['cargaisons' => [], 'colis' => [], 'clients' => []];
        file_put_contents('db.json', json_encode($defaultData, JSON_PRETTY_PRINT));
        return $defaultData;
    }
    
    return $data;
}

function saveDatabase($data) {
    file_put_contents('db.json', json_encode($data, JSON_PRETTY_PRINT));
}
?>
