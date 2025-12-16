-- Seeder untuk master tariffs
-- Hapus data tarif lama jika ada
TRUNCATE TABLE tariffs;

-- Periode 1: 1 Agustus 2018 - 31 Desember 2022 (Rp 60.000)
INSERT INTO tariffs (amount, valid_from, valid_to, property_type, created_at, updated_at) 
VALUES (60000.00, '2018-08-01', '2022-12-31', 'all', NOW(), NOW());

-- Periode 2: 1 Januari 2023 - 30 November 2023 (Rp 125.000)
INSERT INTO tariffs (amount, valid_from, valid_to, property_type, created_at, updated_at) 
VALUES (125000.00, '2023-01-01', '2023-11-30', 'all', NOW(), NOW());

-- Periode 3: 1 Desember 2023 - 31 Januari 2024 (Rp 150.000)
INSERT INTO tariffs (amount, valid_from, valid_to, property_type, created_at, updated_at) 
VALUES (150000.00, '2023-12-01', '2024-01-31', 'all', NOW(), NOW());

-- Periode 4: 1 Februari 2024 - 31 Desember 2024 (Rp 125.000)
INSERT INTO tariffs (amount, valid_from, valid_to, property_type, created_at, updated_at) 
VALUES (125000.00, '2024-02-01', '2024-12-31', 'all', NOW(), NOW());

-- Periode 5: 1 Januari 2025 - unlimited (Rp 150.000)
INSERT INTO tariffs (amount, valid_from, valid_to, property_type, created_at, updated_at) 
VALUES (150000.00, '2025-01-01', NULL, 'all', NOW(), NOW());

-- Verifikasi hasil
SELECT 
    id,
    amount,
    DATE_FORMAT(valid_from, '%d/%m/%Y') as dari,
    CASE 
        WHEN valid_to IS NULL THEN 'Unlimited'
        ELSE DATE_FORMAT(valid_to, '%d/%m/%Y')
    END as sampai,
    property_type,
    CONCAT('Rp ', FORMAT(amount, 0, 'id_ID')) as formatted_amount
FROM tariffs
ORDER BY valid_from;

-- Summary
SELECT 
    COUNT(*) as total_tariffs,
    MIN(amount) as min_tariff,
    MAX(amount) as max_tariff,
    SUM(CASE WHEN valid_to IS NULL THEN 1 ELSE 0 END) as active_unlimited
FROM tariffs;
