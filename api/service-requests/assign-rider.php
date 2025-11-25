<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/whatsapp.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->service_request_id) && !empty($data->rider_id)) {
    // Verify rider exists and get rider details
    $checkRider = "SELECT id, name, mobile FROM riders WHERE id = :rider_id AND status = 'active'";
    $stmtCheck = $db->prepare($checkRider);
    $stmtCheck->bindParam(':rider_id', $data->rider_id);
    $stmtCheck->execute();
    $rider = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$rider) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Rider not found or inactive"]);
        exit();
    }

    // Get service request details for WhatsApp notification
    $requestQuery = "SELECT sr.*, c.name as customer_name, c.mobile as customer_mobile,
                   a.formatted_address, a.latitude, a.longitude, a.block, a.city,
                   a.governorate, a.road_no, a.flat_house_no, a.floor_no
                   FROM service_requests sr
                   JOIN customers c ON sr.customer_id = c.id
                   LEFT JOIN addresses a ON sr.address_id = a.id
                   WHERE sr.id = :request_id";
    $requestStmt = $db->prepare($requestQuery);
    $requestStmt->bindParam(':request_id', $data->service_request_id);
    $requestStmt->execute();
    $serviceRequest = $requestStmt->fetch(PDO::FETCH_ASSOC);

    if (!$serviceRequest) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Service request not found"]);
        exit();
    }

    // Generate unique rider token
    $riderToken = bin2hex(random_bytes(32)); // 64 character hex token

    // Get expiry hours from settings
    $expiryQuery = "SELECT setting_value FROM settings WHERE setting_key = 'rider_link_expiry_hours'";
    $expiryStmt = $db->query($expiryQuery);
    $expirySetting = $expiryStmt->fetch(PDO::FETCH_ASSOC);
    $expiryHours = $expirySetting ? intval($expirySetting['setting_value']) : 96;

    // Calculate expiry timestamp
    $tokenExpiresAt = date('Y-m-d H:i:s', strtotime("+{$expiryHours} hours"));

    // Update service request with rider and token
    $query = "UPDATE service_requests SET rider_id = :rider_id, rider_token = :rider_token, token_expires_at = :token_expires_at, status = 'confirmed', updated_at = NOW() WHERE id = :request_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':rider_id', $data->rider_id);
    $stmt->bindParam(':rider_token', $riderToken);
    $stmt->bindParam(':token_expires_at', $tokenExpiresAt);
    $stmt->bindParam(':request_id', $data->service_request_id);

    if ($stmt->execute()) {
        // Generate rider pickup link
        $baseUrl = isset($_SERVER['HTTP_HOST']) ? (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] : 'http://localhost:3345';
        // For frontend, use port 3345 or configured frontend URL
        $frontendUrl = getenv('FRONTEND_URL') ?: 'http://localhost:3345';
        $riderLink = $frontendUrl . '/rider/' . $riderToken;

        // Send WhatsApp notifications to rider (including the link)
        $whatsappSent = sendServiceRequestNotification($rider, $serviceRequest, $riderLink);

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Rider assigned successfully",
            "rider_link" => $riderLink,
            "rider_token" => $riderToken,
            "token_expires_at" => $tokenExpiresAt,
            "whatsapp_sent" => $whatsappSent
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Unable to assign rider"
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "service_request_id and rider_id are required"
    ]);
}

/**
 * Send WhatsApp notification to rider for service request
 */
function sendServiceRequestNotification($rider, $serviceRequest, $riderLink = null) {
    // Format rider phone number
    $riderPhone = formatPhoneForWhatsApp($rider['mobile']);

    // Format service date
    $serviceDate = date('F j, Y', strtotime($serviceRequest['service_date']));

    // Build request details text
    $requestDetails = "🧺 *New Pickup Request*\n\n";
    $requestDetails .= "Request: {$serviceRequest['request_number']}\n";
    $requestDetails .= "Customer: {$serviceRequest['customer_name']}\n";
    $requestDetails .= "Phone: {$serviceRequest['customer_mobile']}\n\n";
    $requestDetails .= "📅 Pickup Date: {$serviceDate}";
    if ($serviceRequest['service_time_slot']) {
        $requestDetails .= "\n⏰ Time: {$serviceRequest['service_time_slot']}";
    }
    if ($serviceRequest['notes']) {
        $requestDetails .= "\n\n📝 Notes: {$serviceRequest['notes']}";
    }

    // Build address
    $addressParts = [];
    if ($serviceRequest['flat_house_no']) $addressParts[] = "Flat {$serviceRequest['flat_house_no']}";
    if ($serviceRequest['floor_no']) $addressParts[] = "Floor {$serviceRequest['floor_no']}";
    if ($serviceRequest['block']) $addressParts[] = "Block {$serviceRequest['block']}";
    if ($serviceRequest['road_no']) $addressParts[] = "Road {$serviceRequest['road_no']}";
    if ($serviceRequest['city']) $addressParts[] = $serviceRequest['city'];
    if ($serviceRequest['governorate']) $addressParts[] = $serviceRequest['governorate'];
    $locationAddress = !empty($addressParts) ? implode(', ', $addressParts) : ($serviceRequest['formatted_address'] ?? 'Address not available');

    $result = ['message1' => false, 'message2' => false, 'message3' => false];

    // Message 1: Request details with CTA to call customer
    $message1 = [
        'messaging_product' => 'whatsapp',
        'recipient_type' => 'individual',
        'to' => $riderPhone,
        'type' => 'interactive',
        'interactive' => [
            'type' => 'cta_url',
            'header' => [
                'type' => 'text',
                'text' => $serviceRequest['request_number']
            ],
            'body' => [
                'text' => $requestDetails
            ],
            'action' => [
                'name' => 'cta_url',
                'parameters' => [
                    'display_text' => "Call {$serviceRequest['customer_name']}",
                    'url' => "tel:{$serviceRequest['customer_mobile']}"
                ]
            ],
            'footer' => [
                'text' => 'Tap to call customer'
            ]
        ]
    ];

    $result['message1'] = sendWhatsAppMessage($message1);

    // Message 2: Location message (only if coordinates available)
    if ($serviceRequest['latitude'] && $serviceRequest['longitude']) {
        $message2 = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $riderPhone,
            'type' => 'location',
            'location' => [
                'latitude' => (string)$serviceRequest['latitude'],
                'longitude' => (string)$serviceRequest['longitude'],
                'name' => $serviceRequest['customer_name'],
                'address' => $locationAddress
            ]
        ];

        $result['message2'] = sendWhatsAppMessage($message2);
    }

    // Message 3: Pickup link (if provided)
    if ($riderLink) {
        $linkMessage = "📱 *Start Pickup*\n\n";
        $linkMessage .= "Use this link to add items and complete the pickup:\n\n";
        $linkMessage .= "👉 {$riderLink}";

        $message3 = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $riderPhone,
            'type' => 'interactive',
            'interactive' => [
                'type' => 'cta_url',
                'body' => [
                    'text' => $linkMessage
                ],
                'action' => [
                    'name' => 'cta_url',
                    'parameters' => [
                        'display_text' => 'Open Pickup Form',
                        'url' => $riderLink
                    ]
                ]
            ]
        ];

        $result['message3'] = sendWhatsAppMessage($message3);
    }

    return $result;
}
