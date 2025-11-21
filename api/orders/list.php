<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT o.*,
          c.name as customer_name, c.mobile as customer_phone,
          a.formatted_address as customer_address, a.city, a.governorate, a.block, a.road_no, a.flat_house_no, a.floor_no, a.latitude, a.longitude, a.location_type,
          r.name as rider_name, r.mobile as rider_mobile
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          LEFT JOIN addresses a ON o.address_id = a.id
          LEFT JOIN riders r ON o.rider_id = r.id
          ORDER BY o.created_at DESC";

$stmt = $db->prepare($query);
$stmt->execute();

$orders = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $row['items'] = json_decode($row['items'], true);
    $orders[] = $row;
}

http_response_code(200);
echo json_encode([
    "success" => true,
    "data" => $orders
]);
