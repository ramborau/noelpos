<?php
// API endpoint to create a new customer
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->name) || empty($data->mobile)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "name and mobile are required"
    ]);
    exit;
}

try {
    // Check if customer with this mobile already exists
    $checkQuery = "SELECT id FROM customers WHERE mobile = :mobile";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':mobile', $data->mobile);
    $checkStmt->execute();

    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "Customer with this mobile number already exists"
        ]);
        exit;
    }

    $query = "INSERT INTO customers (name, mobile) VALUES (:name, :mobile)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':name', $data->name);
    $stmt->bindParam(':mobile', $data->mobile);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Customer created successfully",
            "customer_id" => $db->lastInsertId()
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Unable to create customer"
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
