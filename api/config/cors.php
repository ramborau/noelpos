<?php
// CORS Headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    // Add your Vercel domains here after deployment
    // 'https://your-app.vercel.app',
    // 'https://your-custom-domain.com',
];

// Also allow any *.vercel.app subdomain for preview deployments
$is_vercel = preg_match('/^https:\/\/.*\.vercel\.app$/', $origin);

if (in_array($origin, $allowed_origins) || $is_vercel) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    header("Access-Control-Allow-Origin: http://localhost:3001");
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
