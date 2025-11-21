<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->order_id) && !empty($data->rider_id)) {
    // Verify rider exists
    $checkRider = "SELECT id FROM riders WHERE id = :rider_id AND status = 'active'";
    $stmtCheck = $db->prepare($checkRider);
    $stmtCheck->bindParam(':rider_id', $data->rider_id);
    $stmtCheck->execute();

    if ($stmtCheck->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Rider not found or inactive"]);
        exit();
    }

    $query = "UPDATE orders SET rider_id = :rider_id, status = 'assigned', updated_at = NOW() WHERE id = :order_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':rider_id', $data->rider_id);
    $stmt->bindParam(':order_id', $data->order_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Rider assigned successfully"
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Unable to assign rider"
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "order_id and rider_id are required"
    ]);
}
