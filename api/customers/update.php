<?php
// API endpoint to update a customer
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Customer ID is required"
    ]);
    exit;
}

try {
    // Check if customer exists
    $checkQuery = "SELECT id FROM customers WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data->id);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Customer not found"
        ]);
        exit;
    }

    // Check if mobile already exists for another customer
    if (!empty($data->mobile)) {
        $mobileCheck = "SELECT id FROM customers WHERE mobile = :mobile AND id != :id";
        $mobileStmt = $db->prepare($mobileCheck);
        $mobileStmt->bindParam(':mobile', $data->mobile);
        $mobileStmt->bindParam(':id', $data->id);
        $mobileStmt->execute();

        if ($mobileStmt->fetch()) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Mobile number already exists for another customer"
            ]);
            exit;
        }
    }

    $query = "UPDATE customers SET
              name = :name,
              mobile = :mobile
              WHERE id = :id";

    $stmt = $db->prepare($query);

    $name = $data->name ?? '';
    $mobile = $data->mobile ?? '';

    $stmt->bindParam(':id', $data->id);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':mobile', $mobile);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Customer updated successfully"
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Unable to update customer"
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
