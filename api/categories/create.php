<?php
require_once '../config/cors.php';
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['name']) || empty(trim($data['name']))) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Category name is required']);
    exit;
}

try {
    $pdo = getConnection();

    $stmt = $pdo->prepare("INSERT INTO categories (name, status, sort_order) VALUES (?, ?, ?)");
    $stmt->execute([
        trim($data['name']),
        $data['status'] ?? 'active',
        $data['sort_order'] ?? 0
    ]);

    $categoryId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Category created successfully',
        'id' => $categoryId
    ]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Category name already exists']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
