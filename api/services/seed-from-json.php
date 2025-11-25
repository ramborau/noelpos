<?php
require_once '../config/database.php';

$database = new Database();
$pdo = $database->getConnection();

// Read services.json
$jsonFile = __DIR__ . '/../../services.json';
$jsonData = json_decode(file_get_contents($jsonFile), true);

if (!$jsonData) {
    echo json_encode(['success' => false, 'message' => 'Error reading services.json']);
    exit;
}

try {
    // Clear existing data (TRUNCATE auto-commits, so do it before transaction)
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $pdo->exec("TRUNCATE TABLE services");
    $pdo->exec("TRUNCATE TABLE subcategories");
    $pdo->exec("TRUNCATE TABLE categories");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    $pdo->beginTransaction();

    $categoryOrder = 1;
    $stats = ['categories' => 0, 'subcategories' => 0, 'services' => 0];

    foreach ($jsonData as $categoryName => $subcategories) {
        // Insert category
        $stmt = $pdo->prepare("INSERT INTO categories (name, status, sort_order) VALUES (?, 'active', ?)");
        $stmt->execute([$categoryName, $categoryOrder++]);
        $categoryId = $pdo->lastInsertId();
        $stats['categories']++;

        $subcategoryOrder = 1;
        foreach ($subcategories as $subcategoryName => $services) {
            // Insert subcategory
            $stmt = $pdo->prepare("INSERT INTO subcategories (category_id, name, status, sort_order) VALUES (?, ?, 'active', ?)");
            $stmt->execute([$categoryId, $subcategoryName, $subcategoryOrder++]);
            $subcategoryId = $pdo->lastInsertId();
            $stats['subcategories']++;

            // Insert services
            $stmt = $pdo->prepare("INSERT INTO services (category_id, subcategory_id, type, item_name, price, currency, status) VALUES (?, ?, ?, ?, ?, ?, 'active')");
            foreach ($services as $service) {
                $stmt->execute([
                    $categoryId,
                    $subcategoryId,
                    $service['type'],
                    $service['item_name'],
                    $service['price'],
                    $service['currency'] ?? 'BHD'
                ]);
                $stats['services']++;
            }
        }
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Data seeded successfully',
        'stats' => $stats
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
