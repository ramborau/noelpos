<?php
// API endpoint to update a rider
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Rider ID is required"
    ]);
    exit;
}

try {
    // Check if rider exists
    $checkQuery = "SELECT id FROM riders WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data->id);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Rider not found"
        ]);
        exit;
    }

    $query = "UPDATE riders SET
              name = :name,
              mobile = :mobile,
              status = :status
              WHERE id = :id";

    $stmt = $db->prepare($query);

    $name = $data->name ?? '';
    $mobile = $data->mobile ?? '';
    $status = $data->status ?? 'active';

    $stmt->bindParam(':id', $data->id);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':mobile', $mobile);
    $stmt->bindParam(':status', $status);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Rider updated successfully"
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Unable to update rider"
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
