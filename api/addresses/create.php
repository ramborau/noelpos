<?php
// API endpoint to create a new address for a customer
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->customer_id)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "customer_id is required"
    ]);
    exit;
}

try {
    // Verify customer exists
    $checkQuery = "SELECT id FROM customers WHERE id = :customer_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':customer_id', $data->customer_id);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Customer not found"
        ]);
        exit;
    }

    $query = "INSERT INTO addresses (customer_id, formatted_address, location_type, block, city, governorate, road_no, flat_house_no, floor_no, place_id, latitude, longitude, is_default)
              VALUES (:customer_id, :formatted_address, :location_type, :block, :city, :governorate, :road_no, :flat_house_no, :floor_no, :place_id, :latitude, :longitude, :is_default)";

    $stmt = $db->prepare($query);

    $formattedAddress = $data->formatted_address ?? '';
    $locationType = $data->location_type ?? 'home';
    $block = $data->block ?? '';
    $city = $data->city ?? '';
    $governorate = $data->governorate ?? '';
    $roadNo = $data->road_no ?? '';
    $flatHouseNo = $data->flat_house_no ?? '';
    $floorNo = $data->floor_no ?? '';
    $placeId = $data->place_id ?? '';
    $latitude = $data->latitude ?? null;
    $longitude = $data->longitude ?? null;
    $isDefault = $data->is_default ?? false;

    $stmt->bindParam(':customer_id', $data->customer_id);
    $stmt->bindParam(':formatted_address', $formattedAddress);
    $stmt->bindParam(':location_type', $locationType);
    $stmt->bindParam(':block', $block);
    $stmt->bindParam(':city', $city);
    $stmt->bindParam(':governorate', $governorate);
    $stmt->bindParam(':road_no', $roadNo);
    $stmt->bindParam(':flat_house_no', $flatHouseNo);
    $stmt->bindParam(':floor_no', $floorNo);
    $stmt->bindParam(':place_id', $placeId);
    $stmt->bindParam(':latitude', $latitude);
    $stmt->bindParam(':longitude', $longitude);
    $stmt->bindParam(':is_default', $isDefault, PDO::PARAM_BOOL);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Address created successfully",
            "address_id" => $db->lastInsertId()
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Unable to create address"
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
