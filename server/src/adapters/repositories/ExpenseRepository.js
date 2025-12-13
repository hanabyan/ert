import pool from '../../frameworks/database/connection.js';
import { Expense, ExpenseRecipient } from '../../entities/index.js';

export class ExpenseRepository {
    async findAll(startDate = null, endDate = null) {
        let query = 'SELECT * FROM expenses';
        const params = [];

        if (startDate && endDate) {
            query += ' WHERE date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY date DESC';
        const [rows] = await pool.query(query, params);
        return rows.map(row => new Expense(row));
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ?', [id]);
        return rows[0] ? new Expense(rows[0]) : null;
    }

    async create(recipientId, description, amount, date) {
        const [result] = await pool.query(
            'INSERT INTO expenses (recipient_id, description, amount, date) VALUES (?, ?, ?, ?)',
            [recipientId, description, amount, date]
        );
        return result.insertId;
    }

    async update(id, recipientId, description, amount, date) {
        await pool.query(
            'UPDATE expenses SET recipient_id = ?, description = ?, amount = ?, date = ?, updated_at = NOW() WHERE id = ?',
            [recipientId, description, amount, date, id]
        );
    }

    async delete(id) {
        await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
    }

    async getTotalByMonth(year, month) {
        const [rows] = await pool.query(
            'SELECT SUM(amount) as total FROM expenses WHERE YEAR(date) = ? AND MONTH(date) = ?',
            [year, month]
        );
        return parseFloat(rows[0]?.total || 0);
    }
}

export class ExpenseRecipientRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM expense_recipients ORDER BY name');
        return rows.map(row => new ExpenseRecipient(row));
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM expense_recipients WHERE id = ?', [id]);
        return rows[0] ? new ExpenseRecipient(rows[0]) : null;
    }

    async create(name, identityNumber, type, description) {
        const [result] = await pool.query(
            'INSERT INTO expense_recipients (name, identity_number, type, description) VALUES (?, ?, ?, ?)',
            [name, identityNumber, type, description]
        );
        return result.insertId;
    }

    async update(id, name, identityNumber, type, description) {
        await pool.query(
            'UPDATE expense_recipients SET name = ?, identity_number = ?, type = ?, description = ?, updated_at = NOW() WHERE id = ?',
            [name, identityNumber, type, description, id]
        );
    }

    async delete(id) {
        await pool.query('DELETE FROM expense_recipients WHERE id = ?', [id]);
    }
}
