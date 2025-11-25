<?php
// API endpoint to set an address as default
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
    // Get address and customer_id
    $checkQuery = "SELECT id, customer_id FROM addresses WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data->id);
    $checkStmt->execute();
    $address = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$address) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Address not found"
        ]);
        exit;
    }

    // Start transaction
    $db->beginTransaction();

    // Unset all defaults for this customer
    $unsetQuery = "UPDATE addresses SET is_default = 0 WHERE customer_id = :customer_id";
    $unsetStmt = $db->prepare($unsetQuery);
    $unsetStmt->bindParam(':customer_id', $address['customer_id']);
    $unsetStmt->execute();

    // Set the specified address as default
    $setQuery = "UPDATE addresses SET is_default = 1 WHERE id = :id";
    $setStmt = $db->prepare($setQuery);
    $setStmt->bindParam(':id', $data->id);
    $setStmt->execute();

    $db->commit();

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Default address updated successfully"
    ]);
} catch (PDOException $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
