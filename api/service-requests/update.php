<?php
require_once '../config/cors.php';
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Service request ID is required']);
    exit;
}

try {
    $pdo = getConnection();

    $fields = [];
    $values = [];

    if (isset($data['status'])) {
        $fields[] = 'status = ?';
        $values[] = $data['status'];
    }
    if (isset($data['rider_id'])) {
        $fields[] = 'rider_id = ?';
        $values[] = $data['rider_id'] ?: null;
    }
    if (isset($data['service_date'])) {
        $fields[] = 'service_date = ?';
        $values[] = $data['service_date'];
    }
    if (isset($data['service_time_slot'])) {
        $fields[] = 'service_time_slot = ?';
        $values[] = $data['service_time_slot'];
    }
    if (isset($data['notes'])) {
        $fields[] = 'notes = ?';
        $values[] = $data['notes'];
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit;
    }

    $values[] = $data['id'];
    $sql = "UPDATE service_requests SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Service request not found']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Service request updated successfully'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
