<?php
// Simple PHP development server router
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Handle API routes first
if (strpos($uri, '/api/') === 0) {
    // Set correct headers for API responses
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }

    // Set the correct script name for API routes
    $_SERVER['SCRIPT_NAME'] = '/api/index.php';
    $_SERVER['REQUEST_URI'] = $uri;
    
    // Include the API handler
    require_once __DIR__ . '/api/index.php';
    exit;
}

// Handle static files (CSS, JS, images, etc.)
if ($uri !== '/' && file_exists(__DIR__ . '/public' . $uri)) {
    return false; // serve the requested resource as-is
}

// Handle HTML routes
switch ($uri) {
    case '/':
        readfile(__DIR__ . '/public/templates/index.html');
        break;
    case '/login':
        readfile(__DIR__ . '/public/templates/login.html');
        break;
    case '/dashboard':
        readfile(__DIR__ . '/public/dashboard.html');
        break;
    case '/create-cargaison':
        readfile(__DIR__ . '/public/templates/create-cargaison.html');
        break;
    // Route pour la page des cargaisons
    case '/cargaisons.html':
        require __DIR__ . '/public/templates/cargaisons.html';
        exit;
    default:
        // Check if it's a direct file access
        if (file_exists(__DIR__ . '/public' . $uri)) {
            return false;
        }
        
        http_response_code(404);
        echo '404 Not Found';
        break;
}

return true;
?>
