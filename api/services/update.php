<?php
require_once '../config/cors.php';
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Service ID is required']);
    exit;
}

try {
    $pdo = getConnection();

    $fields = [];
    $values = [];

    if (isset($data['category_id'])) {
        $fields[] = 'category_id = ?';
        $values[] = $data['category_id'];
    }
    if (isset($data['subcategory_id'])) {
        $fields[] = 'subcategory_id = ?';
        $values[] = $data['subcategory_id'];
    }
    if (isset($data['type'])) {
        $fields[] = 'type = ?';
        $values[] = $data['type'];
    }
    if (isset($data['item_name'])) {
        $fields[] = 'item_name = ?';
        $values[] = trim($data['item_name']);
    }
    if (isset($data['price'])) {
        $fields[] = 'price = ?';
        $values[] = $data['price'];
    }
    if (isset($data['currency'])) {
        $fields[] = 'currency = ?';
        $values[] = $data['currency'];
    }
    if (isset($data['status'])) {
        $fields[] = 'status = ?';
        $values[] = $data['status'];
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit;
    }

    $values[] = $data['id'];
    $sql = "UPDATE services SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Service not found']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Service updated successfully'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
