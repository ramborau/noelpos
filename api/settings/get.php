<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$key = $_GET['key'] ?? null;

try {
    if ($key) {
        // Get specific setting
        $query = "SELECT setting_key, setting_value FROM settings WHERE setting_key = :key";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':key', $key);
        $stmt->execute();
        $setting = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$setting) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Setting not found']);
            exit();
        }

        echo json_encode([
            'success' => true,
            'data' => $setting
        ]);
    } else {
        // Get all settings
        $query = "SELECT setting_key, setting_value FROM settings ORDER BY setting_key";
        $stmt = $db->query($query);
        $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Convert to key-value object
        $settingsObject = [];
        foreach ($settings as $setting) {
            $settingsObject[$setting['setting_key']] = $setting['setting_value'];
        }

        echo json_encode([
            'success' => true,
            'data' => $settingsObject
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
