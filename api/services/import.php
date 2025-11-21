<?php
// Import services from JSON file
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Read services.json
$jsonFile = __DIR__ . '/../../services.json';
if (!file_exists($jsonFile)) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "services.json not found"]);
    exit();
}

$jsonData = file_get_contents($jsonFile);
$services = json_decode($jsonData, true);

if (!$services) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid JSON format"]);
    exit();
}

$insertedCount = 0;
$query = "INSERT INTO services (category, subcategory, type, item_name, price, currency) VALUES (:category, :subcategory, :type, :item_name, :price, :currency)";
$stmt = $db->prepare($query);

try {
    // Clear existing services first
    $db->exec("TRUNCATE TABLE services");

    foreach ($services as $category => $subcategories) {
        foreach ($subcategories as $subcategory => $items) {
            foreach ($items as $item) {
                $stmt->execute([
                    ':category' => $category,
                    ':subcategory' => $subcategory,
                    ':type' => $item['type'],
                    ':item_name' => $item['item_name'],
                    ':price' => $item['price'],
                    ':currency' => $item['currency'] ?? 'BHD'
                ]);
                $insertedCount++;
            }
        }
    }

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Services imported successfully",
        "count" => $insertedCount
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Import failed: " . $e->getMessage()
    ]);
}
