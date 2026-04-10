-- Update existing services to have default service times
-- Run this SQL script on your MySQL database if you have existing services with null times

UPDATE services 
SET service_start_time = '09:00:00', 
    service_end_time = '17:00:00'
WHERE service_start_time IS NULL 
   OR service_end_time IS NULL;

-- Verify the update
SELECT id, name, service_start_time, service_end_time 
FROM services;
