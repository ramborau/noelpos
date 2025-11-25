<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->token) || empty($data->items) || !is_array($data->items)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Token and items are required']);
    exit();
}

try {
    $db->beginTransaction();

    // Validate token and get service request
    $query = "SELECT sr.*, c.id as customer_id, a.id as address_id
              FROM service_requests sr
              JOIN customers c ON sr.customer_id = c.id
              LEFT JOIN addresses a ON sr.address_id = a.id
              WHERE sr.rider_token = :token";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':token', $data->token);
    $stmt->execute();
    $serviceRequest = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$serviceRequest) {
        $db->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Invalid token']);
        exit();
    }

    // Check if token has expired
    if ($serviceRequest['token_expires_at'] && strtotime($serviceRequest['token_expires_at']) < time()) {
        $db->rollBack();
        http_response_code(410);
        echo json_encode(['success' => false, 'message' => 'This pickup link has expired']);
        exit();
    }

    // Check if already completed
    if ($serviceRequest['status'] === 'completed') {
        $db->rollBack();
        http_response_code(410);
        echo json_encode(['success' => false, 'message' => 'This pickup has already been completed']);
        exit();
    }

    // Calculate totals
    $subtotal = 0;
    $items = [];
    foreach ($data->items as $item) {
        $itemTotal = floatval($item->price) * intval($item->quantity);
        $subtotal += $itemTotal;
        $items[] = [
            'id' => $item->id,
            'name' => $item->name,
            'type' => $item->type ?? 'Service',
            'quantity' => intval($item->quantity),
            'price' => floatval($item->price),
            'total' => $itemTotal
        ];
    }

    $totalAmount = $subtotal;
    $paymentMethod = $data->payment_method ?? 'cash';
    // For pay on pickup (cash), mark as paid immediately since rider collects the money
    // For other payment methods, mark as not_paid
    $paymentStatus = ($paymentMethod === 'cash') ? 'paid' : 'not_paid';

    // Generate order number
    $orderNumber = 'ORD-' . str_pad(mt_rand(0, 99999), 5, '0', STR_PAD_LEFT);

    // Create order with status 'picked_up' (since rider has the items)
    $orderQuery = "INSERT INTO orders (order_number, customer_id, address_id, items, subtotal, total_amount, payment_method, payment_status, pickup_date, pickup_time_slot, status, rider_id, notes, order_timestamp, created_at)
                   VALUES (:order_number, :customer_id, :address_id, :items, :subtotal, :total_amount, :payment_method, :payment_status, :pickup_date, :pickup_time_slot, 'picked_up', :rider_id, :notes, NOW(), NOW())";

    $orderStmt = $db->prepare($orderQuery);
    $orderStmt->bindParam(':order_number', $orderNumber);
    $orderStmt->bindParam(':customer_id', $serviceRequest['customer_id']);
    $orderStmt->bindParam(':address_id', $serviceRequest['address_id']);
    $orderStmt->bindValue(':items', json_encode($items));
    $orderStmt->bindParam(':subtotal', $subtotal);
    $orderStmt->bindParam(':total_amount', $totalAmount);
    $orderStmt->bindParam(':payment_method', $paymentMethod);
    $orderStmt->bindParam(':payment_status', $paymentStatus);
    $orderStmt->bindParam(':pickup_date', $serviceRequest['service_date']);
    $orderStmt->bindParam(':pickup_time_slot', $serviceRequest['service_time_slot']);
    $orderStmt->bindParam(':rider_id', $serviceRequest['rider_id']);
    $orderStmt->bindValue(':notes', "Created from service request: {$serviceRequest['request_number']}");
    $orderStmt->execute();

    $orderId = $db->lastInsertId();

    // Update service request to completed
    $updateQuery = "UPDATE service_requests SET status = 'completed', updated_at = NOW() WHERE id = :id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':id', $serviceRequest['id']);
    $updateStmt->execute();

    $db->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Order created successfully',
        'data' => [
            'order_id' => $orderId,
            'order_number' => $orderNumber,
            'items_count' => count($items),
            'subtotal' => $subtotal,
            'total_amount' => $totalAmount,
            'payment_method' => $paymentMethod,
            'status' => 'picked_up'
        ]
    ]);
} catch (PDOException $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
