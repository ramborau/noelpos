<?php
require_once '../config/cors.php';
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$required = ['category_id', 'subcategory_id', 'type', 'item_name', 'price'];
foreach ($required as $field) {
    if (!isset($data[$field]) || (is_string($data[$field]) && empty(trim($data[$field])))) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Field '$field' is required"]);
        exit;
    }
}

try {
    $pdo = getConnection();

    $stmt = $pdo->prepare("INSERT INTO services (category_id, subcategory_id, type, item_name, price, currency, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['category_id'],
        $data['subcategory_id'],
        $data['type'],
        trim($data['item_name']),
        $data['price'],
        $data['currency'] ?? 'BHD',
        $data['status'] ?? 'active'
    ]);

    $serviceId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Service created successfully',
        'id' => $serviceId
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
