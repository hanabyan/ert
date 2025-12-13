import pool from '../../frameworks/database/connection.js';
import { Tariff } from '../../entities/index.js';

export class TariffRepository {
    async findAll() {
        const [rows] = await pool.query(
            'SELECT * FROM tariffs ORDER BY valid_from DESC'
        );
        return rows.map(row => new Tariff(row));
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM tariffs WHERE id = ?', [id]);
        return rows[0] ? new Tariff(rows[0]) : null;
    }

    async findActiveForDate(date, propertyType = 'all') {
        const [rows] = await pool.query(
            `SELECT * FROM tariffs 
       WHERE valid_from <= ? 
       AND (valid_to IS NULL OR valid_to >= ?)
       AND (property_type = ? OR property_type = 'all')
       ORDER BY valid_from DESC
       LIMIT 1`,
            [date, date, propertyType]
        );
        return rows[0] ? new Tariff(rows[0]) : null;
    }

    async create(amount, validFrom, validTo, propertyType = 'all') {
        const [result] = await pool.query(
            'INSERT INTO tariffs (amount, valid_from, valid_to, property_type) VALUES (?, ?, ?, ?)',
            [amount, validFrom, validTo, propertyType]
        );
        return result.insertId;
    }

    async update(id, amount, validFrom, validTo, propertyType) {
        await pool.query(
            'UPDATE tariffs SET amount = ?, valid_from = ?, valid_to = ?, property_type = ?, updated_at = NOW() WHERE id = ?',
            [amount, validFrom, validTo, propertyType, id]
        );
    }

    async delete(id) {
        await pool.query('DELETE FROM tariffs WHERE id = ?', [id]);
    }
}
