import pool from '../../frameworks/database/connection.js';
import { AuditLog } from '../../entities/index.js';

export class AuditRepository {
    async log(userId, targetType, targetId, action, changes) {
        const [result] = await pool.query(
            'INSERT INTO audit_logs (user_id, target_type, target_id, action, changes) VALUES (?, ?, ?, ?, ?)',
            [userId, targetType, targetId, action, JSON.stringify(changes)]
        );
        return result.insertId;
    }

    async findByTarget(targetType, targetId) {
        const [rows] = await pool.query(
            'SELECT * FROM audit_logs WHERE target_type = ? AND target_id = ? ORDER BY created_at DESC',
            [targetType, targetId]
        );
        return rows.map(row => new AuditLog(row));
    }

    async findByUser(userId) {
        const [rows] = await pool.query(
            'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return rows.map(row => new AuditLog(row));
    }
}
