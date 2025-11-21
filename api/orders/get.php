<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$id = isset($_GET['id']) ? $_GET['id'] : null;

if (!$id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Order ID is required"]);
    exit();
}

$query = "SELECT o.*,
          c.name as customer_name, c.mobile as customer_phone,
          a.formatted_address as customer_address, a.city, a.governorate, a.block, a.road_no, a.flat_house_no, a.floor_no, a.latitude, a.longitude, a.location_type, a.place_id,
          r.name as rider_name, r.mobile as rider_mobile
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          LEFT JOIN addresses a ON o.address_id = a.id
          LEFT JOIN riders r ON o.rider_id = r.id
          WHERE o.id = :id";

$stmt = $db->prepare($query);
$stmt->bindParam(':id', $id);
$stmt->execute();

if ($stmt->rowCount() > 0) {
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    $order['items'] = json_decode($order['items'], true);

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "data" => $order
    ]);
} else {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "Order not found"
    ]);
}
