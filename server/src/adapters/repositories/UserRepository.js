import pool from '../../frameworks/database/connection.js';
import { User } from '../../entities/index.js';
import bcrypt from 'bcryptjs';

export class UserRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM users ORDER BY username');
        return rows.map(row => new User(row));
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0] ? new User(rows[0]) : null;
    }

    async findByUsername(username) {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0] ? new User(rows[0]) : null;
    }

    async create(username, password, fullName, phone, email, role = 'warga') {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (username, password, full_name, phone, email, role) VALUES (?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, fullName, phone, email, role]
        );
        return result.insertId;
    }

    async update(id, fullName, phone, email) {
        await pool.query(
            'UPDATE users SET full_name = ?, phone = ?, email = ?, updated_at = NOW() WHERE id = ?',
            [fullName, phone, email, id]
        );
    }

    async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, id]
        );
    }

    async verifyPassword(user, password) {
        return await bcrypt.compare(password, user.password);
    }

    async delete(id) {
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
    }
}
