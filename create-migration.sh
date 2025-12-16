#!/bin/bash

# Script untuk membuat migration baru dengan timestamp
# Usage: ./create-migration.sh nama_migration

if [ -z "$1" ]; then
    echo "Error: Nama migration harus diberikan"
    echo "Usage: ./create-migration.sh nama_migration"
    exit 1
fi

# Generate timestamp: YYYYMMDDHHMMSS
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
MIGRATION_NAME=$1
FILENAME="${TIMESTAMP}_${MIGRATION_NAME}.sql"
MIGRATIONS_DIR="server/src/frameworks/database/migrations"

# Create file with template
cat > "${MIGRATIONS_DIR}/${FILENAME}" << 'EOF'
-- Migration: 
-- Created at: 
-- Description: 

-- Add your SQL migration here

EOF

echo "✅ Migration created: ${MIGRATIONS_DIR}/${FILENAME}"
echo ""
echo "Edit the file to add your SQL statements."
