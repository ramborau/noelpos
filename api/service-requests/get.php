<?php
// API endpoint to get a single service request
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!isset($_GET['id']) || empty($_GET['id'])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Service Request ID is required"
    ]);
    exit;
}

$requestId = $_GET['id'];

try {
    $query = "SELECT sr.*,
              c.name as customer_name, c.mobile as customer_phone,
              a.formatted_address, a.city, a.governorate, a.block, a.road_no, a.flat_house_no, a.floor_no, a.latitude, a.longitude, a.location_type,
              r.name as rider_name, r.mobile as rider_mobile
              FROM service_requests sr
              LEFT JOIN customers c ON sr.customer_id = c.id
              LEFT JOIN addresses a ON sr.address_id = a.id
              LEFT JOIN riders r ON sr.rider_id = r.id
              WHERE sr.id = :id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $requestId);
    $stmt->execute();

    $serviceRequest = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$serviceRequest) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Service Request not found"
        ]);
        exit;
    }

    // Get associated order if any
    $orderQuery = "SELECT * FROM orders WHERE service_request_id = :sr_id ORDER BY created_at DESC LIMIT 1";
    $orderStmt = $db->prepare($orderQuery);
    $orderStmt->bindParam(':sr_id', $requestId);
    $orderStmt->execute();
    $order = $orderStmt->fetch(PDO::FETCH_ASSOC);
    if ($order) {
        $order['items'] = json_decode($order['items'], true);
    }

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "data" => $serviceRequest,
        "order" => $order
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
