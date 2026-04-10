-- Add all services to all existing organizations
-- This script adds missing services to organizations that don't have them yet

-- Get organization IDs
SET @hospital_id = (SELECT id FROM organizations WHERE name = 'City Hospital' LIMIT 1);
SET @bank_id = (SELECT id FROM organizations WHERE name = 'National Bank' LIMIT 1);
SET @govt_id = (SELECT id FROM organizations WHERE name = 'Government Office' LIMIT 1);

-- Add all services to City Hospital (if not exists)
INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Doctor Consultation', 'General physician consultation', 15, '09:00:00', '17:00:00', 1, @hospital_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Doctor Consultation' AND organization_id = @hospital_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Lab Test', 'Blood, urine and other diagnostic tests', 20, '09:00:00', '17:00:00', 1, @hospital_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Lab Test' AND organization_id = @hospital_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Pharmacy', 'Medicine dispensing and prescription processing', 5, '09:00:00', '17:00:00', 1, @hospital_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Pharmacy' AND organization_id = @hospital_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Cash Deposit / Withdrawal', 'Deposit or withdraw money from account', 10, '09:00:00', '17:00:00', 1, @hospital_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Cash Deposit / Withdrawal' AND organization_id = @hospital_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Loan Enquiry', 'Home, personal and vehicle loan consultation', 20, '09:00:00', '17:00:00', 1, @hospital_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Loan Enquiry' AND organization_id = @hospital_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Account Opening', 'Open new savings or current account', 25, '09:00:00', '17:00:00', 1, @hospital_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Account Opening' AND organization_id = @hospital_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Document Submission', 'Submit official documents and applications', 15, '09:00:00', '17:00:00', 1, @hospital_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Document Submission' AND organization_id = @hospital_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Certificate Verification', 'Verify birth, marriage, and other certificates', 10, '09:00:00', '17:00:00', 1, @hospital_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Certificate Verification' AND organization_id = @hospital_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Application Processing', 'Track and process pending applications', 20, '09:00:00', '17:00:00', 1, @hospital_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Application Processing' AND organization_id = @hospital_id);

-- Add all services to National Bank (if not exists)
INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Doctor Consultation', 'General physician consultation', 15, '09:00:00', '17:00:00', 1, @bank_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Doctor Consultation' AND organization_id = @bank_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Lab Test', 'Blood, urine and other diagnostic tests', 20, '09:00:00', '17:00:00', 1, @bank_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Lab Test' AND organization_id = @bank_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Pharmacy', 'Medicine dispensing and prescription processing', 5, '09:00:00', '17:00:00', 1, @bank_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Pharmacy' AND organization_id = @bank_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Cash Deposit / Withdrawal', 'Deposit or withdraw money from account', 10, '09:00:00', '17:00:00', 1, @bank_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Cash Deposit / Withdrawal' AND organization_id = @bank_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Loan Enquiry', 'Home, personal and vehicle loan consultation', 20, '09:00:00', '17:00:00', 1, @bank_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Loan Enquiry' AND organization_id = @bank_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Account Opening', 'Open new savings or current account', 25, '09:00:00', '17:00:00', 1, @bank_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Account Opening' AND organization_id = @bank_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Document Submission', 'Submit official documents and applications', 15, '09:00:00', '17:00:00', 1, @bank_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Document Submission' AND organization_id = @bank_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Certificate Verification', 'Verify birth, marriage, and other certificates', 10, '09:00:00', '17:00:00', 1, @bank_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Certificate Verification' AND organization_id = @bank_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Application Processing', 'Track and process pending applications', 20, '09:00:00', '17:00:00', 1, @bank_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Application Processing' AND organization_id = @bank_id);

-- Add all services to Government Office (if not exists)
INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Doctor Consultation', 'General physician consultation', 15, '09:00:00', '17:00:00', 1, @govt_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Doctor Consultation' AND organization_id = @govt_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Lab Test', 'Blood, urine and other diagnostic tests', 20, '09:00:00', '17:00:00', 1, @govt_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Lab Test' AND organization_id = @govt_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Pharmacy', 'Medicine dispensing and prescription processing', 5, '09:00:00', '17:00:00', 1, @govt_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Pharmacy' AND organization_id = @govt_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Cash Deposit / Withdrawal', 'Deposit or withdraw money from account', 10, '09:00:00', '17:00:00', 1, @govt_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Cash Deposit / Withdrawal' AND organization_id = @govt_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Loan Enquiry', 'Home, personal and vehicle loan consultation', 20, '09:00:00', '17:00:00', 1, @govt_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Loan Enquiry' AND organization_id = @govt_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Account Opening', 'Open new savings or current account', 25, '09:00:00', '17:00:00', 1, @govt_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Account Opening' AND organization_id = @govt_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Document Submission', 'Submit official documents and applications', 15, '09:00:00', '17:00:00', 1, @govt_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Document Submission' AND organization_id = @govt_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Certificate Verification', 'Verify birth, marriage, and other certificates', 10, '09:00:00', '17:00:00', 1, @govt_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Certificate Verification' AND organization_id = @govt_id);

INSERT IGNORE INTO services (name, description, avg_service_time_minutes, service_start_time, service_end_time, active, organization_id)
SELECT 'Application Processing', 'Track and process pending applications', 20, '09:00:00', '17:00:00', 1, @govt_id
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Application Processing' AND organization_id = @govt_id);

-- Verify the results
SELECT o.name as organization, s.name as service, s.active
FROM services s
JOIN organizations o ON s.organization_id = o.id
ORDER BY o.name, s.name;
