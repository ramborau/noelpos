<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

$validStatuses = ['pending', 'assigned', 'picked_up', 'delivered', 'cancelled'];

if (!empty($data->order_id) && !empty($data->status)) {
    if (!in_array($data->status, $validStatuses)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Invalid status. Valid statuses: " . implode(', ', $validStatuses)
        ]);
        exit();
    }

    $query = "UPDATE orders SET status = :status, updated_at = NOW() WHERE id = :order_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':status', $data->status);
    $stmt->bindParam(':order_id', $data->order_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Order status updated successfully"
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Unable to update order status"
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "order_id and status are required"
    ]);
}
