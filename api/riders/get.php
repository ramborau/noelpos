<?php
// API endpoint to get a single rider with stats
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!isset($_GET['id']) || empty($_GET['id'])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Rider ID is required"
    ]);
    exit;
}

$riderId = $_GET['id'];

try {
    // Get rider details
    $query = "SELECT * FROM riders WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $riderId);
    $stmt->execute();

    $rider = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$rider) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Rider not found"
        ]);
        exit;
    }

    // Get order stats
    $statsQuery = "SELECT
                   COUNT(*) as total_orders,
                   SUM(CASE WHEN status IN ('pending', 'rider_assigned', 'picked_up') THEN 1 ELSE 0 END) as active_orders,
                   SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_orders,
                   SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
                   SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END) as total_delivered_amount
                   FROM orders WHERE rider_id = :rider_id";
    $statsStmt = $db->prepare($statsQuery);
    $statsStmt->bindParam(':rider_id', $riderId);
    $statsStmt->execute();
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

    // Get recent orders
    $ordersQuery = "SELECT o.*, c.name as customer_name, c.mobile as customer_phone
                    FROM orders o
                    LEFT JOIN customers c ON o.customer_id = c.id
                    WHERE o.rider_id = :rider_id
                    ORDER BY o.created_at DESC
                    LIMIT 20";
    $ordersStmt = $db->prepare($ordersQuery);
    $ordersStmt->bindParam(':rider_id', $riderId);
    $ordersStmt->execute();
    $orders = $ordersStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($orders as &$order) {
        $order['items'] = json_decode($order['items'], true);
    }

    // Get service requests assigned to rider
    $srQuery = "SELECT sr.*, c.name as customer_name, c.mobile as customer_phone
                FROM service_requests sr
                LEFT JOIN customers c ON sr.customer_id = c.id
                WHERE sr.rider_id = :rider_id
                ORDER BY sr.created_at DESC
                LIMIT 10";
    $srStmt = $db->prepare($srQuery);
    $srStmt->bindParam(':rider_id', $riderId);
    $srStmt->execute();
    $serviceRequests = $srStmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "rider" => $rider,
        "stats" => $stats,
        "orders" => $orders,
        "service_requests" => $serviceRequests
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
