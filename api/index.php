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

// Parse query parameters
$queryParams = [];
if (strpos($path, '?') !== false) {
    list($path, $queryString) = explode('?', $path, 2);
    parse_str($queryString, $queryParams);
}

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
            
        case preg_match('/^PUT:colis\/(.+)\/recover$/', $method . ':' . $path, $matches) ? $method . ':' . $path : '':
            handleRecoverColis($matches[1]);
            break;
            
        case preg_match('/^PUT:colis\/(.+)\/lost$/', $method . ':' . $path, $matches) ? $method . ':' . $path : '':
            handleLostColis($matches[1]);
            break;
            
        case preg_match('/^PUT:colis\/(.+)\/archive$/', $method . ':' . $path, $matches) ? $method . ':' . $path : '':
            handleArchiveColis($matches[1]);
            break;
            
        case preg_match('/^PUT:colis\/(.+)\/state$/', $method . ':' . $path, $matches) ? $method . ':' . $path : '':
            handleChangeColisState($matches[1]);
            break;
            
        case preg_match('/^PUT:cargaisons\/(.+)\/close$/', $method . ':' . $path, $matches) ? $method . ':' . $path : '':
            handleCloseCargaison($matches[1]);
            break;
            
        case preg_match('/^PUT:cargaisons\/(.+)\/reopen$/', $method . ':' . $path, $matches) ? $method . ':' . $path : '':
            handleReopenCargaison($matches[1]);
            break;
            
        case preg_match('/^DELETE:cargaisons\/(.+)$/', $method . ':' . $path, $matches) ? $method . ':' . $path : '':
            handleDeleteCargaison($matches[1]);
            break;
            
        case preg_match('/^DELETE:colis\/(.+)$/', $method . ':' . $path, $matches) ? $method . ':' . $path : '':
            handleDeleteColis($matches[1]);
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
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
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
    
    // Generate coordinates for departure and arrival locations
    $departCoords = getLocationCoordinates($data['lieuDepart'] ?? '');
    $arriveeCoords = getLocationCoordinates($data['lieuArrivee'] ?? '');
    
    $cargaison = [
        'id' => 'CARG' . time(),
        'numero' => $data['numero'] ?? '',
        'poidsMax' => (float)($data['poidsMax'] ?? 0),
        'produits' => [],
        'prix' => 0,
        'trajet' => [
            'lieuDepart' => [
                'nom' => $data['lieuDepart'] ?? '',
                'coordonnees' => $departCoords
            ],
            'lieuArrivee' => [
                'nom' => $data['lieuArrivee'] ?? '',
                'coordonnees' => $arriveeCoords
            ]
        ],
        'lieuDepart' => $data['lieuDepart'] ?? '',
        'lieuArrivee' => $data['lieuArrivee'] ?? '',
        'distance' => (float)($data['distance'] ?? 0),
        'type' => $data['type'] ?? 'ROUTIERE',
        'etatAvancement' => $data['etatAvancement'] ?? 'EN_ATTENTE',
        'etatGlobal' => $data['etatGlobal'] ?? 'OUVERT',
        'dateCreation' => date('Y-m-d H:i:s'),
        'dateDepart' => null,
        'dateArrivee' => null,
        'typesProduits' => $data['typesProduits'] ?? ['MATERIEL']
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
    
    // Calculate price based on weight and product type
    $prix = calculatePrice((float)($data['poids'] ?? 0), $data['typeProduit'] ?? 'MATERIEL');
    
    $colis = [
        'id' => 'COL' . time(),
        'code' => generateTrackingCode(),
        'expediteur' => $data['expediteur'] ?? [],
        'destinataire' => $data['destinataire'] ?? [],
        'poids' => (float)($data['poids'] ?? 0),
        'typeProduit' => $data['typeProduit'] ?? 'MATERIEL',
        'typeCargaison' => $data['typeCargaison'] ?? 'ROUTIERE',
        'prix' => $prix,
        'etat' => 'EN_ATTENTE',
        'dateCreation' => date('Y-m-d H:i:s'),
        'cargaisonId' => $data['cargaisonId'] ?? null,
        'nombreColis' => (int)($data['nombreColis'] ?? 1)
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
    
    // If cargaison is specified, add colis to it
    if ($colis['cargaisonId']) {
        foreach ($db['cargaisons'] as &$cargaison) {
            if ($cargaison['id'] === $colis['cargaisonId']) {
                $cargaison['produits'][] = $colis['id'];
                $cargaison['prix'] += $colis['prix'];
                break;
            }
        }
    }
    
    saveDatabase($db);
    
    echo json_encode(['success' => true, 'colis' => $colis]);
}

function handleGetClients() {
    $db = getDatabase();
    echo json_encode($db['clients'] ?? []);
}

function handleTrackColis($code) {
    $db = getDatabase();
    
    foreach ($db['colis'] as $colis) {
        if ($colis['code'] === $code) {
            // Add estimated arrival time if in transit
            if ($colis['etat'] === 'EN_COURS') {
                $colis['estimatedArrival'] = calculateEstimatedArrival($colis);
            }
            
            echo json_encode([
                'success' => true,
                'colis' => $colis
            ]);
            return;
        }
    }
    
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Colis non trouvé ou annulé'
    ]);
}

function handleRecoverColis($code) {
    $db = getDatabase();
    $found = false;
    
    foreach ($db['colis'] as &$colis) {
        if ($colis['code'] === $code) {
            $colis['etat'] = 'RECUPERE';
            $colis['dateRecuperation'] = date('Y-m-d H:i:s');
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
            $colis['datePerdu'] = date('Y-m-d H:i:s');
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

function handleArchiveColis($code) {
    $db = getDatabase();
    $found = false;
    
    foreach ($db['colis'] as &$colis) {
        if ($colis['code'] === $code) {
            $colis['etat'] = 'ARCHIVE';
            $colis['dateArchivage'] = date('Y-m-d H:i:s');
            $found = true;
            break;
        }
    }
    
    if ($found) {
        saveDatabase($db);
        echo json_encode(['success' => true, 'message' => 'Colis archivé']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Colis non trouvé']);
    }
}

function handleChangeColisState($code) {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['etat'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'État requis']);
        return;
    }
    
    $db = getDatabase();
    $found = false;
    
    foreach ($db['colis'] as &$colis) {
        if ($colis['code'] === $code) {
            $colis['etat'] = $data['etat'];
            $colis['dateModification'] = date('Y-m-d H:i:s');
            $found = true;
            break;
        }
    }
    
    if ($found) {
        saveDatabase($db);
        echo json_encode(['success' => true, 'message' => 'État du colis modifié']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Colis non trouvé']);
    }
}

function handleCloseCargaison($id) {
    $db = getDatabase();
    $found = false;
    
    foreach ($db['cargaisons'] as &$cargaison) {
        if ($cargaison['id'] === $id) {
            $cargaison['etatGlobal'] = 'FERME';
            $cargaison['dateFermeture'] = date('Y-m-d H:i:s');
            $found = true;
            break;
        }
    }
    
    if ($found) {
        saveDatabase($db);
        echo json_encode(['success' => true, 'message' => 'Cargaison fermée']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Cargaison non trouvée']);
    }
}

function handleReopenCargaison($id) {
    $db = getDatabase();
    $found = false;
    
    foreach ($db['cargaisons'] as &$cargaison) {
        if ($cargaison['id'] === $id) {
            if ($cargaison['etatAvancement'] === 'EN_ATTENTE') {
                $cargaison['etatGlobal'] = 'OUVERT';
                $cargaison['dateReouverture'] = date('Y-m-d H:i:s');
                $found = true;
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Impossible de rouvrir une cargaison qui n\'est pas en attente']);
                return;
            }
            break;
        }
    }
    
    if ($found) {
        saveDatabase($db);
        echo json_encode(['success' => true, 'message' => 'Cargaison rouverte']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Cargaison non trouvée']);
    }
}

function handleDeleteCargaison($id) {
    $db = getDatabase();
    $found = false;
    
    foreach ($db['cargaisons'] as $index => $cargaison) {
        if ($cargaison['id'] === $id) {
            unset($db['cargaisons'][$index]);
            $db['cargaisons'] = array_values($db['cargaisons']); // Reindex array
            $found = true;
            break;
        }
    }
    
    if ($found) {
        saveDatabase($db);
        echo json_encode(['success' => true, 'message' => 'Cargaison supprimée']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Cargaison non trouvée']);
    }
}

function handleDeleteColis($id) {
    $db = getDatabase();
    $found = false;
    
    foreach ($db['colis'] as $index => $colis) {
        if ($colis['id'] === $id) {
            unset($db['colis'][$index]);
            $db['colis'] = array_values($db['colis']); // Reindex array
            $found = true;
            break;
        }
    }
    
    if ($found) {
        saveDatabase($db);
        echo json_encode(['success' => true, 'message' => 'Colis supprimé']);
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
            $basePrice *= 1.5;
            break;
        case 'CHIMIQUE':
            $basePrice *= 2;
            break;
        case 'ALIMENTAIRE':
            $basePrice *= 1.2;
            break;
        default:
            // MATERIEL - no multiplier
            break;
    }
    
    // Minimum price is 10,000 FCFA
    return max(10000, $basePrice);
}

function calculateEstimatedArrival($colis) {
    // Simple estimation based on cargo type
    $daysToAdd = 0;
    switch ($colis['typeCargaison']) {
        case 'MARITIME':
            $daysToAdd = 15;
            break;
        case 'AERIENNE':
            $daysToAdd = 2;
            break;
        case 'ROUTIERE':
            $daysToAdd = 7;
            break;
    }
    
    $estimatedDate = date('Y-m-d H:i:s', strtotime($colis['dateCreation'] . " +$daysToAdd days"));
    return $estimatedDate;
}

function getLocationCoordinates($location) {
    // Simple mapping of common locations to coordinates
    $coordinates = [
        'Paris' => ['latitude' => 48.8566, 'longitude' => 2.3522],
        'New York' => ['latitude' => 40.7128, 'longitude' => -74.0060],
        'Dakar' => ['latitude' => 14.7167, 'longitude' => -17.4677],
        'Dubai' => ['latitude' => 25.2048, 'longitude' => 55.2708],
        'Shanghai' => ['latitude' => 31.2304, 'longitude' => 121.4737],
        'London' => ['latitude' => 51.5074, 'longitude' => -0.1278],
        'Tokyo' => ['latitude' => 35.6762, 'longitude' => 139.6503],
        'Sydney' => ['latitude' => -33.8688, 'longitude' => 151.2093]
    ];
    
    return $coordinates[$location] ?? ['latitude' => 0, 'longitude' => 0];
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