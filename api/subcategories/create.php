<?php
require_once '../config/cors.php';
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['category_id']) || !isset($data['name']) || empty(trim($data['name']))) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Category ID and name are required']);
    exit;
}

try {
    $pdo = getConnection();

    $stmt = $pdo->prepare("INSERT INTO subcategories (category_id, name, status, sort_order) VALUES (?, ?, ?, ?)");
    $stmt->execute([
        $data['category_id'],
        trim($data['name']),
        $data['status'] ?? 'active',
        $data['sort_order'] ?? 0
    ]);

    $subcategoryId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Subcategory created successfully',
        'id' => $subcategoryId
    ]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Subcategory already exists in this category']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
