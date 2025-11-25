<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$search = $_GET['search'] ?? null;
$categoryId = $_GET['category_id'] ?? null;

try {
    // Build query for services with category and subcategory info
    $sql = "SELECT s.id, s.item_name, s.type, s.price, s.currency,
            c.id as category_id, c.name as category_name,
            sc.id as subcategory_id, sc.name as subcategory_name
            FROM services s
            JOIN categories c ON s.category_id = c.id
            JOIN subcategories sc ON s.subcategory_id = sc.id
            WHERE s.status = 'active' AND c.status = 'active' AND sc.status = 'active'";

    $params = [];

    if ($search) {
        $sql .= " AND s.item_name LIKE :search";
        $params[':search'] = "%{$search}%";
    }

    if ($categoryId) {
        $sql .= " AND s.category_id = :category_id";
        $params[':category_id'] = $categoryId;
    }

    $sql .= " ORDER BY c.sort_order ASC, sc.sort_order ASC, s.item_name ASC";

    $stmt = $db->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get categories for filter
    $catQuery = "SELECT id, name FROM categories WHERE status = 'active' ORDER BY sort_order ASC, name ASC";
    $catStmt = $db->query($catQuery);
    $categories = $catStmt->fetchAll(PDO::FETCH_ASSOC);

    // Group services by category and subcategory
    $grouped = [];
    foreach ($services as $service) {
        $catName = $service['category_name'];
        $subcatName = $service['subcategory_name'];

        if (!isset($grouped[$catName])) {
            $grouped[$catName] = [
                'category_id' => $service['category_id'],
                'subcategories' => []
            ];
        }

        if (!isset($grouped[$catName]['subcategories'][$subcatName])) {
            $grouped[$catName]['subcategories'][$subcatName] = [
                'subcategory_id' => $service['subcategory_id'],
                'services' => []
            ];
        }

        $grouped[$catName]['subcategories'][$subcatName]['services'][] = [
            'id' => $service['id'],
            'item_name' => $service['item_name'],
            'type' => $service['type'],
            'price' => $service['price'],
            'currency' => $service['currency']
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => $services,
        'grouped' => $grouped,
        'categories' => $categories,
        'total' => count($services)
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
