#!/bin/bash

# Script untuk membuat seeder baru dengan timestamp
# Usage: ./create-seeder.sh nama_seeder

if [ -z "$1" ]; then
    echo "Error: Nama seeder harus diberikan"
    echo "Usage: ./create-seeder.sh nama_seeder"
    exit 1
fi

# Generate timestamp: YYYYMMDDHHMMSS
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
SEEDER_NAME=$1
FILENAME="${TIMESTAMP}_${SEEDER_NAME}.sql"
SEEDERS_DIR="server/src/frameworks/database/seeders"

# Create file with template
cat > "${SEEDERS_DIR}/${FILENAME}" << 'EOF'
-- Seeder: 
-- Created at: 
-- Description: 

-- Add your SQL seed data here

EOF

echo "✅ Seeder created: ${SEEDERS_DIR}/${FILENAME}"
echo ""
echo "Edit the file to add your SQL seed data."
