<?php
// API endpoint to get a single customer with addresses
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!isset($_GET['id']) || empty($_GET['id'])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Customer ID is required"
    ]);
    exit;
}

$customerId = $_GET['id'];

try {
    // Get customer details
    $query = "SELECT * FROM customers WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $customerId);
    $stmt->execute();

    $customer = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$customer) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Customer not found"
        ]);
        exit;
    }

    // Get customer addresses
    $addressQuery = "SELECT * FROM addresses WHERE customer_id = :customer_id ORDER BY is_default DESC, created_at DESC";
    $addressStmt = $db->prepare($addressQuery);
    $addressStmt->bindParam(':customer_id', $customerId);
    $addressStmt->execute();

    $addresses = $addressStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get customer orders
    $orderQuery = "SELECT o.*, r.name as rider_name
                   FROM orders o
                   LEFT JOIN riders r ON o.rider_id = r.id
                   WHERE o.customer_id = :customer_id
                   ORDER BY o.created_at DESC";
    $orderStmt = $db->prepare($orderQuery);
    $orderStmt->bindParam(':customer_id', $customerId);
    $orderStmt->execute();

    $orders = $orderStmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($orders as &$order) {
        $order['items'] = json_decode($order['items'], true);
    }

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "customer" => $customer,
        "addresses" => $addresses,
        "orders" => $orders
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
