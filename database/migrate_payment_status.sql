-- Migration: Add payment_status column to orders table
-- Run this SQL to add the payment_status field
-- Values: 'paid' (payment collected), 'not_paid' (payment pending - DEFAULT)

-- Step 1: Drop column if exists (to re-add with correct ENUM values)
-- ALTER TABLE orders DROP COLUMN IF EXISTS payment_status;

-- Step 2: Add payment_status column with correct ENUM values
ALTER TABLE orders
ADD COLUMN payment_status ENUM('paid', 'not_paid') DEFAULT 'not_paid' AFTER payment_method;

-- Step 3: Update existing orders based on status
-- Mark delivered and picked_up orders as paid (assuming payment was collected)
UPDATE orders SET payment_status = 'paid' WHERE status IN ('delivered', 'picked_up');
