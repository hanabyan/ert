-- Add tariff_type column to tariffs table
ALTER TABLE tariffs 
ADD COLUMN tariff_type ENUM('rutin', 'insidentil') NOT NULL DEFAULT 'rutin' 
AFTER property_type;

-- Add description column for insidentil tariffs
ALTER TABLE tariffs 
ADD COLUMN description VARCHAR(255) NULL 
AFTER tariff_type;
