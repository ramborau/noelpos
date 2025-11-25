<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->key) || !isset($data->value)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Key and value are required']);
    exit();
}

try {
    // Update or insert setting
    $query = "INSERT INTO settings (setting_key, setting_value) VALUES (:key, :value)
              ON DUPLICATE KEY UPDATE setting_value = :value2, updated_at = NOW()";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':key', $data->key);
    $stmt->bindParam(':value', $data->value);
    $stmt->bindParam(':value2', $data->value);
    $stmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Setting updated successfully',
        'data' => [
            'key' => $data->key,
            'value' => $data->value
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
