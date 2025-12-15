import pool from '../../frameworks/database/connection.js';
import { Property } from '../../entities/index.js';

export class PropertyRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM properties ORDER BY block, number');
        return rows.map(row => new Property(row));
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM properties WHERE id = ?', [id]);
        return rows[0] ? new Property(rows[0]) : null;
    }

    async findByBlockAndNumber(block, number) {
        const [rows] = await pool.query(
            'SELECT * FROM properties WHERE block = ? AND number = ?',
            [block, number]
        );
        return rows[0] ? new Property(rows[0]) : null;
    }

    async findByOwnerId(ownerId) {
        const [rows] = await pool.query(
            'SELECT * FROM properties WHERE owner_id = ? ORDER BY block, number',
            [ownerId]
        );
        return rows.map(row => new Property(row));
    }

    async updateOwner(propertyId, ownerId) {
        await pool.query(
            'UPDATE properties SET owner_id = ?, updated_at = NOW() WHERE id = ?',
            [ownerId, propertyId]
        );
    }

    async updateType(propertyId, type) {
        await pool.query(
            'UPDATE properties SET type = ?, updated_at = NOW() WHERE id = ?',
            [type, propertyId]
        );
    }

    async updateBastDate(propertyId, bastDate) {
        await pool.query(
            'UPDATE properties SET bast_date = ?, updated_at = NOW() WHERE id = ?',
            [bastDate, propertyId]
        );
    }
}
