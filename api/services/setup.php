<?php
// Create services table and import data
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Create services table
$createTableSQL = "
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(100) NOT NULL,
    type ENUM('Service', 'Offer') NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BHD',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_subcategory (subcategory)
)";

try {
    $db->exec($createTableSQL);
    echo "Table 'services' created successfully.\n";
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to create table: " . $e->getMessage()]);
    exit();
}

// Read services.json
$jsonFile = __DIR__ . '/../../services.json';
if (!file_exists($jsonFile)) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "services.json not found at: " . $jsonFile]);
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
    $db->exec("DELETE FROM services");

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
        "message" => "Services table created and seeded successfully",
        "count" => $insertedCount
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Import failed: " . $e->getMessage()
    ]);
}
