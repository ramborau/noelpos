<?php
require_once '../config/cors.php';
require_once '../config/database.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();

    $sql = "SELECT * FROM categories ORDER BY sort_order ASC, name ASC";
    $stmt = $pdo->query($sql);
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $categories
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
