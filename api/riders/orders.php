<?php
// API endpoint to get orders for a specific rider
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!isset($_GET['rider_id']) || empty($_GET['rider_id'])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Rider ID is required"
    ]);
    exit;
}

$riderId = $_GET['rider_id'];
$status = $_GET['status'] ?? null;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

try {
    $query = "SELECT o.*,
              c.name as customer_name, c.mobile as customer_phone,
              a.formatted_address as customer_address, a.city, a.governorate
              FROM orders o
              LEFT JOIN customers c ON o.customer_id = c.id
              LEFT JOIN addresses a ON o.address_id = a.id
              WHERE o.rider_id = :rider_id";

    $params = [':rider_id' => $riderId];

    if ($status) {
        $query .= " AND o.status = :status";
        $params[':status'] = $status;
    }

    $query .= " ORDER BY o.created_at DESC LIMIT :limit OFFSET :offset";

    $stmt = $db->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($orders as &$order) {
        $order['items'] = json_decode($order['items'], true);
    }

    // Get total count
    $countQuery = "SELECT COUNT(*) as total FROM orders WHERE rider_id = :rider_id";
    if ($status) {
        $countQuery .= " AND status = :status";
    }
    $countStmt = $db->prepare($countQuery);
    $countStmt->bindParam(':rider_id', $riderId);
    if ($status) {
        $countStmt->bindParam(':status', $status);
    }
    $countStmt->execute();
    $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "data" => $orders,
        "total" => intval($total),
        "limit" => $limit,
        "offset" => $offset
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
