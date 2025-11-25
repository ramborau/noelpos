<?php
require_once '../config/cors.php';
require_once '../config/database.php';

// This script seeds all services from services.json into the database

try {
    $pdo = getConnection();

    // Read services.json
    $jsonPath = __DIR__ . '/../../services.json';
    if (!file_exists($jsonPath)) {
        throw new Exception('services.json not found');
    }

    $servicesData = json_decode(file_get_contents($jsonPath), true);
    if (!$servicesData) {
        throw new Exception('Failed to parse services.json');
    }

    $pdo->beginTransaction();

    $categoriesInserted = 0;
    $subcategoriesInserted = 0;
    $servicesInserted = 0;

    // Process each category
    foreach ($servicesData as $categoryName => $subcategories) {
        // Insert or get category
        $stmt = $pdo->prepare("INSERT IGNORE INTO categories (name, status, sort_order) VALUES (?, 'active', ?)");
        $stmt->execute([$categoryName, $categoriesInserted]);

        $stmt = $pdo->prepare("SELECT id FROM categories WHERE name = ?");
        $stmt->execute([$categoryName]);
        $category = $stmt->fetch(PDO::FETCH_ASSOC);
        $categoryId = $category['id'];
        $categoriesInserted++;

        // Process each subcategory
        $subcatOrder = 0;
        foreach ($subcategories as $subcategoryName => $services) {
            // Insert or get subcategory
            $stmt = $pdo->prepare("INSERT IGNORE INTO subcategories (category_id, name, status, sort_order) VALUES (?, ?, 'active', ?)");
            $stmt->execute([$categoryId, $subcategoryName, $subcatOrder]);

            $stmt = $pdo->prepare("SELECT id FROM subcategories WHERE category_id = ? AND name = ?");
            $stmt->execute([$categoryId, $subcategoryName]);
            $subcategory = $stmt->fetch(PDO::FETCH_ASSOC);
            $subcategoryId = $subcategory['id'];
            $subcategoriesInserted++;
            $subcatOrder++;

            // Insert services
            foreach ($services as $service) {
                $stmt = $pdo->prepare("INSERT INTO services (category_id, subcategory_id, type, item_name, price, currency, status) VALUES (?, ?, ?, ?, ?, ?, 'active')");
                $stmt->execute([
                    $categoryId,
                    $subcategoryId,
                    $service['type'],
                    $service['item_name'],
                    $service['price'],
                    $service['currency'] ?? 'BHD'
                ]);
                $servicesInserted++;
            }
        }
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Services seeded successfully',
        'stats' => [
            'categories' => $categoriesInserted,
            'subcategories' => $subcategoriesInserted,
            'services' => $servicesInserted
        ]
    ]);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
