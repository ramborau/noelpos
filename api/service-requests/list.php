<?php
require_once '../config/cors.php';
require_once '../config/database.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();

    $status = $_GET['status'] ?? null;

    $sql = "SELECT sr.*,
            c.name as customer_name, c.mobile as customer_mobile,
            a.formatted_address, a.location_type, a.block, a.city, a.governorate,
            a.road_no, a.flat_house_no, a.floor_no, a.latitude, a.longitude,
            r.name as rider_name, r.mobile as rider_mobile
            FROM service_requests sr
            JOIN customers c ON sr.customer_id = c.id
            JOIN addresses a ON sr.address_id = a.id
            LEFT JOIN riders r ON sr.rider_id = r.id
            WHERE 1=1";
    $params = [];

    if ($status) {
        $sql .= " AND sr.status = ?";
        $params[] = $status;
    }

    $sql .= " ORDER BY sr.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get status counts
    $countSql = "SELECT status, COUNT(*) as count FROM service_requests GROUP BY status";
    $countStmt = $pdo->query($countSql);
    $statusCounts = [];
    while ($row = $countStmt->fetch(PDO::FETCH_ASSOC)) {
        $statusCounts[$row['status']] = (int)$row['count'];
    }

    echo json_encode([
        'success' => true,
        'data' => $requests,
        'status_counts' => $statusCounts
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
