<?php
require_once '../config/cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['origin']) || !isset($data['destination'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Origin and destination are required']);
    exit;
}

$origin = $data['origin'];
$destination = $data['destination'];

// Google Maps API Key - should be stored in environment/config
$apiKey = getenv('GOOGLE_MAPS_API_KEY') ?: '';

if (empty($apiKey)) {
    // Fallback to Haversine formula if no API key
    $distance = haversineDistance(
        $origin['lat'], $origin['lng'],
        $destination['lat'], $destination['lng']
    );

    // Estimate duration (assuming 30 km/h average speed in city)
    $durationSeconds = ($distance / 30) * 3600;

    echo json_encode([
        'success' => true,
        'distance' => formatDistance($distance),
        'duration' => formatDuration($durationSeconds),
        'distanceValue' => $distance * 1000, // meters
        'durationValue' => (int)$durationSeconds,
        'method' => 'estimate'
    ]);
    exit;
}

// Use Google Maps Distance Matrix API
$originStr = $origin['lat'] . ',' . $origin['lng'];
$destStr = $destination['lat'] . ',' . $destination['lng'];

$url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    . "?origins=" . urlencode($originStr)
    . "&destinations=" . urlencode($destStr)
    . "&mode=driving"
    . "&key=" . $apiKey;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    // Fallback to Haversine
    $distance = haversineDistance(
        $origin['lat'], $origin['lng'],
        $destination['lat'], $destination['lng']
    );
    $durationSeconds = ($distance / 30) * 3600;

    echo json_encode([
        'success' => true,
        'distance' => formatDistance($distance),
        'duration' => formatDuration($durationSeconds),
        'distanceValue' => $distance * 1000,
        'durationValue' => (int)$durationSeconds,
        'method' => 'estimate'
    ]);
    exit;
}

$result = json_decode($response, true);

if ($result['status'] === 'OK' && !empty($result['rows'][0]['elements'][0])) {
    $element = $result['rows'][0]['elements'][0];

    if ($element['status'] === 'OK') {
        echo json_encode([
            'success' => true,
            'distance' => $element['distance']['text'],
            'duration' => $element['duration']['text'],
            'distanceValue' => $element['distance']['value'],
            'durationValue' => $element['duration']['value'],
            'method' => 'google'
        ]);
        exit;
    }
}

// Fallback if Google API fails
$distance = haversineDistance(
    $origin['lat'], $origin['lng'],
    $destination['lat'], $destination['lng']
);
$durationSeconds = ($distance / 30) * 3600;

echo json_encode([
    'success' => true,
    'distance' => formatDistance($distance),
    'duration' => formatDuration($durationSeconds),
    'distanceValue' => $distance * 1000,
    'durationValue' => (int)$durationSeconds,
    'method' => 'estimate'
]);

// Helper functions
function haversineDistance($lat1, $lng1, $lat2, $lng2) {
    $R = 6371; // Earth's radius in km
    $dLat = deg2rad($lat2 - $lat1);
    $dLng = deg2rad($lng2 - $lng1);
    $a = sin($dLat / 2) * sin($dLat / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLng / 2) * sin($dLng / 2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $R * $c;
}

function formatDistance($km) {
    if ($km < 1) {
        return round($km * 1000) . ' m';
    }
    return number_format($km, 1) . ' km';
}

function formatDuration($seconds) {
    $minutes = round($seconds / 60);
    if ($minutes < 60) {
        return $minutes . ' min';
    }
    $hours = floor($minutes / 60);
    $mins = $minutes % 60;
    return $hours . ' hr ' . $mins . ' min';
}
