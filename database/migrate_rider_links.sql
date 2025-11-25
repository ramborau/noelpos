-- Migration: Add rider token support and settings table
-- Run this on existing database

-- Add rider token columns to service_requests
ALTER TABLE service_requests
ADD COLUMN rider_token VARCHAR(64) NULL UNIQUE AFTER rider_id,
ADD COLUMN token_expires_at TIMESTAMP NULL AFTER rider_token;

-- Create index for faster token lookups
CREATE INDEX idx_rider_token ON service_requests(rider_token);

-- Update orders status enum to include new statuses
ALTER TABLE orders
MODIFY COLUMN status ENUM('pending', 'rider_assigned', 'picked_up', 'delivered', 'cancelled') DEFAULT 'pending';

-- Update existing 'assigned' status to 'rider_assigned'
UPDATE orders SET status = 'rider_assigned' WHERE status = 'assigned';

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value) VALUES
('rider_link_expiry_hours', '96')
ON DUPLICATE KEY UPDATE setting_value = setting_value;
