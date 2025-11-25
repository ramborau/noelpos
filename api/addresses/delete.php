<?php
// API endpoint to delete an address
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Address ID is required"
    ]);
    exit;
}

try {
    // Check if address exists
    $checkQuery = "SELECT id FROM addresses WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data->id);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Address not found"
        ]);
        exit;
    }

    // Check if address is used in any orders
    $orderQuery = "SELECT COUNT(*) as count FROM orders WHERE address_id = :address_id";
    $orderStmt = $db->prepare($orderQuery);
    $orderStmt->bindParam(':address_id', $data->id);
    $orderStmt->execute();
    $orderCount = $orderStmt->fetch(PDO::FETCH_ASSOC)['count'];

    if ($orderCount > 0) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Cannot delete address. It is used in {$orderCount} order(s)."
        ]);
        exit;
    }

    // Check if address is used in any service requests
    $srQuery = "SELECT COUNT(*) as count FROM service_requests WHERE address_id = :address_id";
    $srStmt = $db->prepare($srQuery);
    $srStmt->bindParam(':address_id', $data->id);
    $srStmt->execute();
    $srCount = $srStmt->fetch(PDO::FETCH_ASSOC)['count'];

    if ($srCount > 0) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Cannot delete address. It is used in {$srCount} service request(s)."
        ]);
        exit;
    }

    $query = "DELETE FROM addresses WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data->id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Address deleted successfully"
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Unable to delete address"
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
