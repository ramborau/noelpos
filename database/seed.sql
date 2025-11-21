-- Seed data for lndr database
-- Based on sample order: {"pickupDate":"2025-11-21","pickupTimeSlot":"2:00 PM - 4:00 PM",...}

USE lndr;

-- Insert sample customer 1 (from provided data)
INSERT INTO customers (name, mobile) VALUES ('Rg', '+97394229422');
SET @customer_1 = LAST_INSERT_ID();

-- Insert sample address for customer 1
INSERT INTO addresses (customer_id, formatted_address, location_type, block, city, governorate, road_no, flat_house_no, floor_no, place_id, latitude, longitude, is_default) VALUES
(@customer_1, '4GMQ+C4X, Riffa, Bahrain', 'home', '333', 'Riffa', 'Central Governorate', '333', '333', '333', 'ChIJW7_MPyGtST4R_iYxl06R7ys', 26.13360120, 50.53786810, TRUE);
SET @addr_1 = LAST_INSERT_ID();

-- Insert sample order 1 (from provided data)
INSERT INTO orders (order_number, customer_id, address_id, items, subtotal, total_amount, payment_method, pickup_date, pickup_time_slot, status, order_timestamp) VALUES
('ORD-00001', @customer_1, @addr_1, '[{"id":"Boys-CHILDREN''S WEAR-School Uniform Set-Service-0.6","name":"School Uniform Set","type":"Service","price":0.6,"quantity":1}]', 0.60, 0.60, 'cash', '2025-11-21', '2:00 PM - 4:00 PM', 'pending', '2025-11-21 10:00:26');

-- Additional sample data for testing

-- Insert customer 2
INSERT INTO customers (name, mobile) VALUES ('Ahmed Ali', '+97333112233');
SET @customer_2 = LAST_INSERT_ID();

-- Insert address for customer 2
INSERT INTO addresses (customer_id, formatted_address, location_type, block, city, governorate, road_no, flat_house_no, floor_no, latitude, longitude, is_default) VALUES
(@customer_2, 'Block 123, Road 456, Manama, Bahrain', 'home', '123', 'Manama', 'Capital Governorate', '456', '10', '2', 26.22870000, 50.58610000, TRUE);
SET @addr_2 = LAST_INSERT_ID();

-- Insert customer 3
INSERT INTO customers (name, mobile) VALUES ('Fatima Hassan', '+97399887766');
SET @customer_3 = LAST_INSERT_ID();

-- Insert address for customer 3
INSERT INTO addresses (customer_id, formatted_address, location_type, block, city, governorate, road_no, flat_house_no, floor_no, latitude, longitude, is_default) VALUES
(@customer_3, 'Block 789, Road 321, Muharraq, Bahrain', 'office', '789', 'Muharraq', 'Muharraq Governorate', '321', '5', '1', 26.25740000, 50.61170000, TRUE);
SET @addr_3 = LAST_INSERT_ID();

-- Insert customer 4
INSERT INTO customers (name, mobile) VALUES ('Mohammed Saleh', '+97366554433');
SET @customer_4 = LAST_INSERT_ID();

-- Insert address for customer 4
INSERT INTO addresses (customer_id, formatted_address, location_type, block, city, governorate, road_no, flat_house_no, floor_no, latitude, longitude, is_default) VALUES
(@customer_4, 'Block 555, Road 888, Isa Town, Bahrain', 'home', '555', 'Isa Town', 'Southern Governorate', '888', '22', '3', 26.17330000, 50.54890000, TRUE);
SET @addr_4 = LAST_INSERT_ID();

-- Insert more sample orders
INSERT INTO orders (order_number, customer_id, address_id, items, subtotal, total_amount, payment_method, pickup_date, pickup_time_slot, status, order_timestamp) VALUES
('ORD-00002', @customer_2, @addr_2, '[{"id":"Men-CORPORATE WEAR-Suit 2Pc-Service-2.5","name":"Suit 2Pc","type":"Service","price":2.5,"quantity":2}]', 5.00, 5.00, 'card', '2025-11-22', '10:00 AM - 12:00 PM', 'pending', '2025-11-21 11:30:00'),
('ORD-00003', @customer_3, @addr_3, '[{"id":"Women-CASUAL WEAR-Blouse-Service-0.8","name":"Blouse","type":"Service","price":0.8,"quantity":3},{"id":"Women-CASUAL WEAR-Skirt-Service-0.9","name":"Skirt","type":"Service","price":0.9,"quantity":2}]', 4.20, 4.20, 'cash', '2025-11-22', '2:00 PM - 4:00 PM', 'assigned', '2025-11-21 12:15:00'),
('ORD-00004', @customer_4, @addr_4, '[{"id":"HOME ITEMS-BED LINEN-Bed Sheet Single-Service-1.2","name":"Bed Sheet Single","type":"Service","price":1.2,"quantity":4}]', 4.80, 4.80, 'online', '2025-11-23', '4:00 PM - 6:00 PM', 'pending', '2025-11-21 14:00:00');

-- Assign rider to order 3
UPDATE orders SET rider_id = 1 WHERE order_number = 'ORD-00003';

SELECT 'Seed data inserted successfully!' AS status;
