<?php
require_once '../config/cors.php';
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Support multiple formats:
// 1. POS format: customer_id, address_id, service_date
// 2. WhatsApp format: customer object, address object, schedule.pickupDate
// 3. Old format: customer object, address object, service_date

$serviceDate = $data['service_date'] ?? ($data['schedule']['pickupDate'] ?? null);
$serviceTimeSlot = $data['service_time_slot'] ?? ($data['schedule']['pickupTimeSlot'] ?? null);

// Check if using POS format (direct IDs)
if (isset($data['customer_id']) && isset($data['address_id']) && $serviceDate) {
    // POS format - use IDs directly
    try {
        $database = new Database();
        $pdo = $database->getConnection();

        $customerId = $data['customer_id'];
        $addressId = $data['address_id'];

        // Verify customer exists
        $stmt = $pdo->prepare("SELECT id FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        if (!$stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Customer not found']);
            exit;
        }

        // Verify address exists
        $stmt = $pdo->prepare("SELECT id FROM addresses WHERE id = ?");
        $stmt->execute([$addressId]);
        if (!$stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Address not found']);
            exit;
        }

        // Generate request number
        $requestNumber = 'SR-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));

        // Create service request
        $stmt = $pdo->prepare("INSERT INTO service_requests (request_number, customer_id, address_id, service_date, service_time_slot, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $requestNumber,
            $customerId,
            $addressId,
            $serviceDate,
            $serviceTimeSlot,
            $data['status'] ?? 'pending',
            $data['notes'] ?? null
        ]);
        $requestId = $pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => 'Service request created successfully',
            'id' => $requestId,
            'request_number' => $requestNumber
        ]);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}

// Validate required fields for other formats
if (!isset($data['customer']) || !isset($data['address']) || !$serviceDate) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Customer, address, and service_date (or schedule.pickupDate) are required']);
    exit;
}

// Map camelCase address fields to snake_case (support both formats)
$addressData = $data['address'];
$address = [
    'formatted_address' => $addressData['formatted_address'] ?? $addressData['formattedAddress'] ?? null,
    'location_type' => $addressData['location_type'] ?? $addressData['locationType'] ?? 'home',
    'block' => $addressData['block'] ?? null,
    'city' => $addressData['city'] ?? null,
    'governorate' => $addressData['governorate'] ?? null,
    'road_no' => $addressData['road_no'] ?? $addressData['roadNo'] ?? null,
    'flat_house_no' => $addressData['flat_house_no'] ?? $addressData['flatHouseNo'] ?? null,
    'floor_no' => $addressData['floor_no'] ?? $addressData['floorNo'] ?? null,
    'place_id' => $addressData['place_id'] ?? $addressData['placeId'] ?? null,
    'latitude' => $addressData['latitude'] ?? null,
    'longitude' => $addressData['longitude'] ?? null
];

// Extract source info (from WhatsApp)
$sourceWaba = $data['source']['waba'] ?? null;
$sourceName = $data['source']['name'] ?? null;

try {
    $database = new Database();
    $pdo = $database->getConnection();
    $pdo->beginTransaction();

    // Handle customer - find existing or create new
    $customer = $data['customer'];
    $stmt = $pdo->prepare("SELECT id FROM customers WHERE mobile = ?");
    $stmt->execute([$customer['mobile']]);
    $existingCustomer = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existingCustomer) {
        $customerId = $existingCustomer['id'];
        // Don't update customer name - it would affect all past orders/requests
    } else {
        $stmt = $pdo->prepare("INSERT INTO customers (name, mobile) VALUES (?, ?)");
        $stmt->execute([$customer['name'] ?? 'Customer', $customer['mobile']]);
        $customerId = $pdo->lastInsertId();
    }

    // Create address (using mapped address data)
    $stmt = $pdo->prepare("INSERT INTO addresses (customer_id, formatted_address, location_type, block, city, governorate, road_no, flat_house_no, floor_no, place_id, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $customerId,
        $address['formatted_address'],
        $address['location_type'],
        $address['block'],
        $address['city'],
        $address['governorate'],
        $address['road_no'],
        $address['flat_house_no'],
        $address['floor_no'],
        $address['place_id'],
        $address['latitude'],
        $address['longitude']
    ]);
    $addressId = $pdo->lastInsertId();

    // Generate request number
    $requestNumber = 'SR-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));

    // Create service request (with source tracking)
    $stmt = $pdo->prepare("INSERT INTO service_requests (request_number, customer_id, address_id, service_date, service_time_slot, status, notes, source_waba, source_name) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)");
    $stmt->execute([
        $requestNumber,
        $customerId,
        $addressId,
        $serviceDate,
        $serviceTimeSlot,
        $data['notes'] ?? null,
        $sourceWaba,
        $sourceName
    ]);
    $requestId = $pdo->lastInsertId();

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Service request created successfully',
        'id' => $requestId,
        'request_number' => $requestNumber
    ]);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
