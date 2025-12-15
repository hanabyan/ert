import pool from '../../frameworks/database/connection.js';

export class PropertyUserRepository {
    async findByProperty(propertyId) {
        const [rows] = await pool.query(`
            SELECT pu.*, u.username, u.full_name, u.phone, u.email
            FROM property_users pu
            JOIN users u ON pu.user_id = u.id
            WHERE pu.property_id = ?
            ORDER BY pu.relation_type, u.full_name
        `, [propertyId]);
        return rows;
    }

    async findByUser(userId) {
        const [rows] = await pool.query(`
            SELECT pu.*, p.block, p.number, p.type
            FROM property_users pu
            JOIN properties p ON pu.property_id = p.id
            WHERE pu.user_id = ?
            ORDER BY p.block, p.number
        `, [userId]);
        return rows;
    }

    async add(propertyId, userId, relationType) {
        const [result] = await pool.query(
            'INSERT INTO property_users (property_id, user_id, relation_type) VALUES (?, ?, ?)',
            [propertyId, userId, relationType]
        );
        return result.insertId;
    }

    async update(id, relationType) {
        await pool.query(
            'UPDATE property_users SET relation_type = ?, updated_at = NOW() WHERE id = ?',
            [relationType, id]
        );
    }

    async delete(id) {
        await pool.query('DELETE FROM property_users WHERE id = ?', [id]);
    }

    async deleteByPropertyAndUser(propertyId, userId) {
        await pool.query(
            'DELETE FROM property_users WHERE property_id = ? AND user_id = ?',
            [propertyId, userId]
        );
    }

    async exists(propertyId, userId) {
        const [rows] = await pool.query(
            'SELECT id FROM property_users WHERE property_id = ? AND user_id = ?',
            [propertyId, userId]
        );
        return rows.length > 0;
    }
}
