<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$token = $_GET['token'] ?? null;

if (!$token) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Token is required']);
    exit();
}

try {
    // Get service request by token
    $query = "SELECT sr.*, c.name as customer_name, c.mobile as customer_mobile,
              a.formatted_address, a.latitude, a.longitude, a.block, a.city,
              a.governorate, a.road_no, a.flat_house_no, a.floor_no, a.location_type,
              r.name as rider_name, r.mobile as rider_mobile
              FROM service_requests sr
              JOIN customers c ON sr.customer_id = c.id
              LEFT JOIN addresses a ON sr.address_id = a.id
              LEFT JOIN riders r ON sr.rider_id = r.id
              WHERE sr.rider_token = :token";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    $serviceRequest = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$serviceRequest) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
        exit();
    }

    // Check if token has expired
    if ($serviceRequest['token_expires_at'] && strtotime($serviceRequest['token_expires_at']) < time()) {
        http_response_code(410);
        echo json_encode(['success' => false, 'message' => 'This pickup link has expired']);
        exit();
    }

    // Check if service request is already completed
    if ($serviceRequest['status'] === 'completed') {
        http_response_code(410);
        echo json_encode(['success' => false, 'message' => 'This pickup has already been completed']);
        exit();
    }

    // Return service request details
    echo json_encode([
        'success' => true,
        'data' => [
            'id' => $serviceRequest['id'],
            'request_number' => $serviceRequest['request_number'],
            'status' => $serviceRequest['status'],
            'service_date' => $serviceRequest['service_date'],
            'service_time_slot' => $serviceRequest['service_time_slot'],
            'notes' => $serviceRequest['notes'],
            'customer' => [
                'name' => $serviceRequest['customer_name'],
                'mobile' => $serviceRequest['customer_mobile']
            ],
            'address' => [
                'formatted_address' => $serviceRequest['formatted_address'],
                'location_type' => $serviceRequest['location_type'],
                'block' => $serviceRequest['block'],
                'city' => $serviceRequest['city'],
                'governorate' => $serviceRequest['governorate'],
                'road_no' => $serviceRequest['road_no'],
                'flat_house_no' => $serviceRequest['flat_house_no'],
                'floor_no' => $serviceRequest['floor_no'],
                'latitude' => $serviceRequest['latitude'],
                'longitude' => $serviceRequest['longitude']
            ],
            'rider' => [
                'name' => $serviceRequest['rider_name'],
                'mobile' => $serviceRequest['rider_mobile']
            ],
            'token_expires_at' => $serviceRequest['token_expires_at']
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
