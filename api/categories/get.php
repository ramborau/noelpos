<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$id = $_GET['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Category ID is required']);
    exit;
}

try {
    $pdo = getConnection();

    $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
    $stmt->execute([$id]);
    $category = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$category) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Category not found']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'data' => $category
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
