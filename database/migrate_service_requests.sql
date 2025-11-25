-- Migration: Add source columns to service_requests table
-- Run this SQL to add source tracking fields

ALTER TABLE service_requests
ADD COLUMN source_waba VARCHAR(20) NULL AFTER notes,
ADD COLUMN source_name VARCHAR(100) NULL AFTER source_waba;
