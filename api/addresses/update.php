<?php
// API endpoint to update an address
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

    // If setting as default, first unset other defaults for this customer
    if (isset($data->is_default) && $data->is_default) {
        $unsetQuery = "UPDATE addresses SET is_default = 0 WHERE customer_id = :customer_id";
        $unsetStmt = $db->prepare($unsetQuery);
        $unsetStmt->bindParam(':customer_id', $address['customer_id']);
        $unsetStmt->execute();
    }

    $query = "UPDATE addresses SET
              formatted_address = :formatted_address,
              location_type = :location_type,
              block = :block,
              city = :city,
              governorate = :governorate,
              road_no = :road_no,
              flat_house_no = :flat_house_no,
              floor_no = :floor_no,
              latitude = :latitude,
              longitude = :longitude,
              is_default = :is_default
              WHERE id = :id";

    $stmt = $db->prepare($query);

    $formattedAddress = $data->formatted_address ?? '';
    $locationType = $data->location_type ?? 'home';
    $block = $data->block ?? '';
    $city = $data->city ?? '';
    $governorate = $data->governorate ?? '';
    $roadNo = $data->road_no ?? '';
    $flatHouseNo = $data->flat_house_no ?? '';
    $floorNo = $data->floor_no ?? '';
    $latitude = $data->latitude ?? null;
    $longitude = $data->longitude ?? null;
    $isDefault = $data->is_default ?? false;

    $stmt->bindParam(':id', $data->id);
    $stmt->bindParam(':formatted_address', $formattedAddress);
    $stmt->bindParam(':location_type', $locationType);
    $stmt->bindParam(':block', $block);
    $stmt->bindParam(':city', $city);
    $stmt->bindParam(':governorate', $governorate);
    $stmt->bindParam(':road_no', $roadNo);
    $stmt->bindParam(':flat_house_no', $flatHouseNo);
    $stmt->bindParam(':floor_no', $floorNo);
    $stmt->bindParam(':latitude', $latitude);
    $stmt->bindParam(':longitude', $longitude);
    $stmt->bindParam(':is_default', $isDefault, PDO::PARAM_BOOL);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Address updated successfully"
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Unable to update address"
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
