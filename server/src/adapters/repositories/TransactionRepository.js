import pool from '../../frameworks/database/connection.js';
import { Transaction, PaymentItem } from '../../entities/index.js';

export class TransactionRepository {
    async create(userId, totalAmount, proofImage = null) {
        const [result] = await pool.query(
            'INSERT INTO transactions (user_id, total_amount, proof_image, status) VALUES (?, ?, ?, ?)',
            [userId, totalAmount, proofImage, 'pending']
        );
        return result.insertId;
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]);
        return rows[0] ? new Transaction(rows[0]) : null;
    }

    async findByUserId(userId, status = null) {
        let query = 'SELECT * FROM transactions WHERE user_id = ?';
        const params = [userId];
        
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY created_at DESC';
        const [rows] = await pool.query(query, params);
        return rows.map(row => new Transaction(row));
    }

    async findPending() {
        const [rows] = await pool.query(
            'SELECT * FROM transactions WHERE status = ? ORDER BY created_at ASC',
            ['pending']
        );
        return rows.map(row => new Transaction(row));
    }

    async updateStatus(id, status) {
        await pool.query(
            'UPDATE transactions SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, id]
        );
    }

    async addPaymentItem(transactionId, propertyId, month, year, amount) {
        const [result] = await pool.query(
            'INSERT INTO payment_items (transaction_id, property_id, month, year, amount) VALUES (?, ?, ?, ?, ?)',
            [transactionId, propertyId, month, year, amount]
        );
        return result.insertId;
    }

    async getPaymentItems(transactionId) {
        const [rows] = await pool.query(
            'SELECT * FROM payment_items WHERE transaction_id = ?',
            [transactionId]
        );
        return rows.map(row => new PaymentItem(row));
    }

    async getPaymentItemsByProperty(propertyId, year = null) {
        let query = `
            SELECT pi.*, t.status, t.created_at as transaction_date
            FROM payment_items pi
            JOIN transactions t ON pi.transaction_id = t.id
            WHERE pi.property_id = ?
        `;
        const params = [propertyId];

        if (year) {
            query += ' AND pi.year = ?';
            params.push(year);
        }

        query += ' ORDER BY pi.year DESC, pi.month DESC';
        const [rows] = await pool.query(query, params);
        return rows;
    }

    async getPaymentItemsGroupedByMonth(propertyId, startMonth, startYear, endMonth, endYear) {
        const query = `
            SELECT 
                pi.year,
                pi.month,
                SUM(pi.amount) as total_paid,
                GROUP_CONCAT(t.id) as transaction_ids,
                MAX(t.status) as status
            FROM payment_items pi
            JOIN transactions t ON pi.transaction_id = t.id
            WHERE pi.property_id = ?
                AND ((pi.year = ? AND pi.month >= ?) OR pi.year > ?)
                AND ((pi.year = ? AND pi.month <= ?) OR pi.year < ?)
                AND t.status = 'verified'
            GROUP BY pi.year, pi.month
            ORDER BY pi.year, pi.month
        `;
        
        const [rows] = await pool.query(query, [
            propertyId,
            startYear, startMonth, startYear,
            endYear, endMonth, endYear
        ]);
        return rows;
    }
}
