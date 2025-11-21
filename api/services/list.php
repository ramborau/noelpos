<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$category = isset($_GET['category']) ? $_GET['category'] : null;

if ($category) {
    $query = "SELECT * FROM services WHERE category = :category AND status = 'active' ORDER BY subcategory, item_name";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':category', $category);
} else {
    $query = "SELECT * FROM services WHERE status = 'active' ORDER BY category, subcategory, item_name";
    $stmt = $db->prepare($query);
}

$stmt->execute();
$services = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Group by category and subcategory
$grouped = [];
foreach ($services as $service) {
    $cat = $service['category'];
    $subcat = $service['subcategory'];
    if (!isset($grouped[$cat])) {
        $grouped[$cat] = [];
    }
    if (!isset($grouped[$cat][$subcat])) {
        $grouped[$cat][$subcat] = [];
    }
    $grouped[$cat][$subcat][] = $service;
}

http_response_code(200);
echo json_encode([
    "success" => true,
    "data" => $services,
    "grouped" => $grouped
]);
