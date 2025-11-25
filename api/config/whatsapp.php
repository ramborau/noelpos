<?php
/**
 * WhatsApp Configuration
 * Credentials are loaded from environment variables
 */

// Load .env file if it exists (for local development)
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
            putenv(trim($key) . '=' . trim($value));
        }
    }
}

/**
 * Get WhatsApp API configuration
 */
function getWhatsAppConfig() {
    $token = getenv('WHATSAPP_TOKEN') ?: ($_ENV['WHATSAPP_TOKEN'] ?? '');
    $phoneId = getenv('WHATSAPP_PHONE_ID') ?: ($_ENV['WHATSAPP_PHONE_ID'] ?? '');

    return [
        'token' => 'Bearer ' . $token,
        'phone_id' => $phoneId,
        'api_url' => 'https://crm.botpe.in/api/meta/v19.0/' . $phoneId . '/messages'
    ];
}

/**
 * Send WhatsApp message via API
 *
 * @param array $payload Message payload
 * @return bool Success status
 */
function sendWhatsAppMessage($payload) {
    $config = getWhatsAppConfig();

    if (empty($config['phone_id'])) {
        error_log("WhatsApp API Error: Missing phone_id configuration");
        return false;
    }

    $ch = curl_init($config['api_url']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: ' . $config['token']
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        error_log("WhatsApp API Error: " . $error);
        return false;
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        error_log("WhatsApp API Error: HTTP $httpCode - Response: $response");
        return false;
    }

    return true;
}

/**
 * Format phone number for WhatsApp (remove non-digits)
 */
function formatPhoneForWhatsApp($phone) {
    return preg_replace('/[^0-9]/', '', $phone);
}
