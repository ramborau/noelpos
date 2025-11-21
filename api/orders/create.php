<?php
// API endpoint to receive orders from external sources
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if (empty($data->customer) || empty($data->customer->name) || empty($data->customer->mobile)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "customer.name and customer.mobile are required"
    ]);
    exit;
}

if (empty($data->total) || !isset($data->items)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "total and items are required"
    ]);
    exit;
}

try {
    $db->beginTransaction();

    // 1. Find or create customer by mobile
    $customerQuery = "SELECT id FROM customers WHERE mobile = :mobile";
    $customerStmt = $db->prepare($customerQuery);
    $customerStmt->bindParam(':mobile', $data->customer->mobile);
    $customerStmt->execute();
    $existingCustomer = $customerStmt->fetch(PDO::FETCH_ASSOC);

    if ($existingCustomer) {
        $customerId = $existingCustomer['id'];
        // Update customer name if changed
        $updateCustomerQuery = "UPDATE customers SET name = :name WHERE id = :id";
        $updateStmt = $db->prepare($updateCustomerQuery);
        $updateStmt->bindParam(':name', $data->customer->name);
        $updateStmt->bindParam(':id', $customerId);
        $updateStmt->execute();
    } else {
        $insertCustomerQuery = "INSERT INTO customers (name, mobile) VALUES (:name, :mobile)";
        $insertCustomerStmt = $db->prepare($insertCustomerQuery);
        $insertCustomerStmt->bindParam(':name', $data->customer->name);
        $insertCustomerStmt->bindParam(':mobile', $data->customer->mobile);
        $insertCustomerStmt->execute();
        $customerId = $db->lastInsertId();
    }

    // 2. Create address for the order
    $addressId = null;
    if (!empty($data->address)) {
        $addr = $data->address;

        // Check if address with same place_id exists for this customer
        if (!empty($addr->placeId)) {
            $checkAddrQuery = "SELECT id FROM addresses WHERE customer_id = :customer_id AND place_id = :place_id";
            $checkAddrStmt = $db->prepare($checkAddrQuery);
            $checkAddrStmt->bindParam(':customer_id', $customerId);
            $checkAddrStmt->bindParam(':place_id', $addr->placeId);
            $checkAddrStmt->execute();
            $existingAddr = $checkAddrStmt->fetch(PDO::FETCH_ASSOC);

            if ($existingAddr) {
                $addressId = $existingAddr['id'];
            }
        }

        if (!$addressId) {
            $insertAddrQuery = "INSERT INTO addresses (customer_id, formatted_address, location_type, block, city, governorate, road_no, flat_house_no, floor_no, place_id, latitude, longitude)
                               VALUES (:customer_id, :formatted_address, :location_type, :block, :city, :governorate, :road_no, :flat_house_no, :floor_no, :place_id, :latitude, :longitude)";

            $insertAddrStmt = $db->prepare($insertAddrQuery);

            $formattedAddress = $addr->formattedAddress ?? '';
            $locationType = $addr->locationType ?? 'home';
            $block = $addr->block ?? '';
            $city = $addr->city ?? '';
            $governorate = $addr->governorate ?? '';
            $roadNo = $addr->roadNo ?? '';
            $flatHouseNo = $addr->flatHouseNo ?? '';
            $floorNo = $addr->floorNo ?? '';
            $placeId = $addr->placeId ?? '';
            $latitude = $addr->latitude ?? null;
            $longitude = $addr->longitude ?? null;

            $insertAddrStmt->bindParam(':customer_id', $customerId);
            $insertAddrStmt->bindParam(':formatted_address', $formattedAddress);
            $insertAddrStmt->bindParam(':location_type', $locationType);
            $insertAddrStmt->bindParam(':block', $block);
            $insertAddrStmt->bindParam(':city', $city);
            $insertAddrStmt->bindParam(':governorate', $governorate);
            $insertAddrStmt->bindParam(':road_no', $roadNo);
            $insertAddrStmt->bindParam(':flat_house_no', $flatHouseNo);
            $insertAddrStmt->bindParam(':floor_no', $floorNo);
            $insertAddrStmt->bindParam(':place_id', $placeId);
            $insertAddrStmt->bindParam(':latitude', $latitude);
            $insertAddrStmt->bindParam(':longitude', $longitude);
            $insertAddrStmt->execute();
            $addressId = $db->lastInsertId();
        }
    }

    // 3. Generate order number and create order
    $orderNumber = 'ORD-' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

    $orderQuery = "INSERT INTO orders (order_number, customer_id, address_id, items, subtotal, total_amount, payment_method, pickup_date, pickup_time_slot, notes, order_timestamp)
                   VALUES (:order_number, :customer_id, :address_id, :items, :subtotal, :total_amount, :payment_method, :pickup_date, :pickup_time_slot, :notes, :order_timestamp)";

    $orderStmt = $db->prepare($orderQuery);

    $items = json_encode($data->items);
    $subtotal = $data->subtotal ?? $data->total;
    $totalAmount = $data->total;
    $paymentMethod = $data->paymentMethod ?? 'cash';
    $pickupDate = $data->pickupDate ?? null;
    $pickupTimeSlot = $data->pickupTimeSlot ?? null;
    $notes = $data->notes ?? '';
    $orderTimestamp = isset($data->timestamp) ? date('Y-m-d H:i:s', strtotime($data->timestamp)) : null;

    $orderStmt->bindParam(':order_number', $orderNumber);
    $orderStmt->bindParam(':customer_id', $customerId);
    $orderStmt->bindParam(':address_id', $addressId);
    $orderStmt->bindParam(':items', $items);
    $orderStmt->bindParam(':subtotal', $subtotal);
    $orderStmt->bindParam(':total_amount', $totalAmount);
    $orderStmt->bindParam(':payment_method', $paymentMethod);
    $orderStmt->bindParam(':pickup_date', $pickupDate);
    $orderStmt->bindParam(':pickup_time_slot', $pickupTimeSlot);
    $orderStmt->bindParam(':notes', $notes);
    $orderStmt->bindParam(':order_timestamp', $orderTimestamp);

    $orderStmt->execute();
    $orderId = $db->lastInsertId();

    $db->commit();

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "message" => "Order created successfully",
        "order_id" => $orderId,
        "order_number" => $orderNumber,
        "customer_id" => $customerId,
        "address_id" => $addressId
    ]);

} catch (PDOException $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
