<?php
// API endpoint to list all customers
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT c.*,
              (SELECT COUNT(*) FROM addresses WHERE customer_id = c.id) as address_count,
              (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as order_count
              FROM customers c
              ORDER BY c.created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute();

    $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "customers" => $customers
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
