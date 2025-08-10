<?php
class Router {
    private $routes = [];
    
    public function post($path, $callback) {
        $this->routes['POST'][$path] = $callback;
    }
    
    public function run() {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Handle OPTIONS requests for CORS
        if ($method === 'OPTIONS') {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type');
            exit(0);
        }
        
        // Remove /api prefix from path
        $path = str_replace('/api', '', $uri);
        
        if (!isset($this->routes[$method][$path])) {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed', 'path' => $path, 'method' => $method]);
            return;
        }
        
        echo $this->routes[$method][$path]();
    }
}
?>
