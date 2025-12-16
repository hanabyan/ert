-- Tariff Components Table (Master komponen tarif)
CREATE TABLE IF NOT EXISTS tariff_components (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_name (name)
);

-- Tariff Component Rates (Harga per komponen berdasarkan periode)
CREATE TABLE IF NOT EXISTS tariff_component_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    component_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE NULL,
    property_type ENUM('rumah', 'tanah', 'all') NOT NULL DEFAULT 'all',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (component_id) REFERENCES tariff_components(id) ON DELETE CASCADE,
    INDEX idx_component_date (component_id, valid_from, valid_to)
);

-- Property Component Subscriptions (Langganan komponen per properti)
CREATE TABLE IF NOT EXISTS property_component_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    component_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    status ENUM('pending', 'active', 'inactive', 'rejected') NOT NULL DEFAULT 'pending',
    requested_by INT NOT NULL, -- user_id yang request
    approved_by INT NULL, -- admin_id yang approve
    approved_at DATETIME NULL,
    rejection_reason TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (component_id) REFERENCES tariff_components(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_property_component (property_id, component_id),
    INDEX idx_status (status)
);

-- Insert default components
INSERT INTO tariff_components (name, description) VALUES
('Pengelolaan Sampah', 'Layanan pengangkutan dan pengelolaan sampah'),
('Keamanan 24 Jam', 'Layanan satpam 24 jam'),
('Kebersihan Lingkungan', 'Layanan kebersihan area umum');

-- Insert default component rates
INSERT INTO tariff_component_rates (component_id, amount, valid_from, property_type) VALUES
(1, 50000, '2018-01-01', 'rumah'),  -- Pengelolaan Sampah untuk rumah
(1, 25000, '2018-01-01', 'tanah'),  -- Pengelolaan Sampah untuk tanah
(2, 75000, '2018-01-01', 'all'),    -- Keamanan 24 Jam
(3, 25000, '2018-01-01', 'all');    -- Kebersihan Lingkungan
