<?php
require_once '../config/cors.php';
require_once '../config/database.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();

    $categoryId = $_GET['category_id'] ?? null;

    $sql = "SELECT s.*, c.name as category_name
            FROM subcategories s
            JOIN categories c ON s.category_id = c.id";
    $params = [];

    if ($categoryId) {
        $sql .= " WHERE s.category_id = ?";
        $params[] = $categoryId;
    }

    $sql .= " ORDER BY c.sort_order ASC, s.sort_order ASC, s.name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $subcategories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $subcategories
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
