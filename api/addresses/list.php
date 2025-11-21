<?php
// API endpoint to list addresses for a customer
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!isset($_GET['customer_id']) || empty($_GET['customer_id'])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "customer_id is required"
    ]);
    exit;
}

$customerId = $_GET['customer_id'];

try {
    $query = "SELECT * FROM addresses WHERE customer_id = :customer_id ORDER BY is_default DESC, created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':customer_id', $customerId);
    $stmt->execute();

    $addresses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "addresses" => $addresses
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
