import pool from '../../frameworks/database/connection.js';
import { TariffComponent, TariffComponentRate, PropertyComponentSubscription } from '../../entities/TariffComponentEntities.js';

export class TariffComponentRepository {
    // Get all components
    async findAll() {
        const [rows] = await pool.query(
            'SELECT * FROM tariff_components WHERE is_active = TRUE ORDER BY name'
        );
        return rows.map(row => new TariffComponent(row));
    }

    async findById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM tariff_components WHERE id = ?',
            [id]
        );
        return rows[0] ? new TariffComponent(rows[0]) : null;
    }

    async create(name, description) {
        const [result] = await pool.query(
            'INSERT INTO tariff_components (name, description) VALUES (?, ?)',
            [name, description]
        );
        return result.insertId;
    }

    async update(id, name, description, isActive) {
        await pool.query(
            'UPDATE tariff_components SET name = ?, description = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
            [name, description, isActive, id]
        );
    }

    async delete(id) {
        await pool.query('DELETE FROM tariff_components WHERE id = ?', [id]);
    }
}

export class TariffComponentRateRepository {
    // Get all rates for a component
    async findByComponent(componentId) {
        const [rows] = await pool.query(
            'SELECT * FROM tariff_component_rates WHERE component_id = ? ORDER BY valid_from DESC',
            [componentId]
        );
        return rows.map(row => new TariffComponentRate(row));
    }

    // Get active rate for a component on a specific date
    async findActiveRate(componentId, date, propertyType = 'all') {
        const [rows] = await pool.query(
            `SELECT * FROM tariff_component_rates 
             WHERE component_id = ?
             AND valid_from <= ?
             AND (valid_to IS NULL OR valid_to >= ?)
             AND (property_type = ? OR property_type = 'all')
             ORDER BY valid_from DESC
             LIMIT 1`,
            [componentId, date, date, propertyType]
        );
        return rows[0] ? new TariffComponentRate(rows[0]) : null;
    }

    async create(componentId, amount, validFrom, validTo, propertyType = 'all') {
        const [result] = await pool.query(
            'INSERT INTO tariff_component_rates (component_id, amount, valid_from, valid_to, property_type) VALUES (?, ?, ?, ?, ?)',
            [componentId, amount, validFrom, validTo, propertyType]
        );
        return result.insertId;
    }

    async update(id, amount, validFrom, validTo, propertyType) {
        await pool.query(
            'UPDATE tariff_component_rates SET amount = ?, valid_from = ?, valid_to = ?, property_type = ?, updated_at = NOW() WHERE id = ?',
            [amount, validFrom, validTo, propertyType, id]
        );
    }

    async delete(id) {
        await pool.query('DELETE FROM tariff_component_rates WHERE id = ?', [id]);
    }
}

export class PropertyComponentSubscriptionRepository {
    // Get all subscriptions for a property
    async findByProperty(propertyId) {
        const [rows] = await pool.query(
            `SELECT pcs.*, tc.name as component_name, tc.description as component_description
             FROM property_component_subscriptions pcs
             JOIN tariff_components tc ON pcs.component_id = tc.id
             WHERE pcs.property_id = ?
             ORDER BY pcs.created_at DESC`,
            [propertyId]
        );
        return rows.map(row => new PropertyComponentSubscription(row));
    }

    // Get active subscriptions for a property on a specific date
    async findActiveSubscriptions(propertyId, date) {
        const [rows] = await pool.query(
            `SELECT pcs.*, tc.name as component_name
             FROM property_component_subscriptions pcs
             JOIN tariff_components tc ON pcs.component_id = tc.id
             WHERE pcs.property_id = ?
             AND pcs.status = 'active'
             AND pcs.start_date <= ?
             AND (pcs.end_date IS NULL OR pcs.end_date >= ?)`,
            [propertyId, date, date]
        );
        return rows.map(row => new PropertyComponentSubscription(row));
    }

    // Get all pending requests
    async findPendingRequests() {
        const [rows] = await pool.query(
            `SELECT pcs.*, 
                    tc.name as component_name,
                    p.block, p.number,
                    u.full_name as requester_name
             FROM property_component_subscriptions pcs
             JOIN tariff_components tc ON pcs.component_id = tc.id
             JOIN properties p ON pcs.property_id = p.id
             JOIN users u ON pcs.requested_by = u.id
             WHERE pcs.status = 'pending'
             ORDER BY pcs.created_at ASC`
        );
        return rows.map(row => new PropertyComponentSubscription(row));
    }

    async findById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM property_component_subscriptions WHERE id = ?',
            [id]
        );
        return rows[0] ? new PropertyComponentSubscription(rows[0]) : null;
    }

    async create(propertyId, componentId, startDate, endDate, requestedBy) {
        const [result] = await pool.query(
            'INSERT INTO property_component_subscriptions (property_id, component_id, start_date, end_date, requested_by, status) VALUES (?, ?, ?, ?, ?, ?)',
            [propertyId, componentId, startDate, endDate, requestedBy, 'pending']
        );
        return result.insertId;
    }

    async approve(id, adminId) {
        await pool.query(
            'UPDATE property_component_subscriptions SET status = ?, approved_by = ?, approved_at = NOW(), updated_at = NOW() WHERE id = ?',
            ['active', adminId, id]
        );
    }

    async reject(id, adminId, reason) {
        await pool.query(
            'UPDATE property_component_subscriptions SET status = ?, approved_by = ?, rejection_reason = ?, approved_at = NOW(), updated_at = NOW() WHERE id = ?',
            ['rejected', adminId, reason, id]
        );
    }

    async deactivate(id) {
        await pool.query(
            'UPDATE property_component_subscriptions SET status = ?, updated_at = NOW() WHERE id = ?',
            ['inactive', id]
        );
    }

    async delete(id) {
        await pool.query('DELETE FROM property_component_subscriptions WHERE id = ?', [id]);
    }

    // [New] Check if subscription exists (active or inactive)
    async findByPropertyAndComponent(propertyId, componentId) {
        const [rows] = await pool.query(
            'SELECT * FROM property_component_subscriptions WHERE property_id = ? AND component_id = ?',
            [propertyId, componentId]
        );
        return rows[0] ? new PropertyComponentSubscription(rows[0]) : null;
    }

    // [New] Direct create active subscription (For Admin Bulk)
    async createActiveSubscription(propertyId, componentId, startDate, adminId, endDate = null) {
        const [result] = await pool.query(
            'INSERT INTO property_component_subscriptions (property_id, component_id, start_date, end_date, status, requested_by, approved_by, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [propertyId, componentId, startDate, endDate, 'active', adminId, adminId]
        );
        return result.insertId;
    }

    // [New] Reactivate/Update existing subscription
    async updateStatus(id, status, adminId) {
        await pool.query(
            'UPDATE property_component_subscriptions SET status = ?, approved_by = ?, updated_at = NOW() WHERE id = ?',
            [status, adminId, id]
        );
    }

    // [New] Update status with dates
    async updateStatusWithDates(id, status, adminId, startDate, endDate = null) {
        await pool.query(
            'UPDATE property_component_subscriptions SET status = ?, approved_by = ?, start_date = ?, end_date = ?, updated_at = NOW() WHERE id = ?',
            [status, adminId, startDate, endDate, id]
        );
    }

    // [New] Get ALL active subscriptions (Global)
    async findAllAllActiveSubscriptions() {
        const [rows] = await pool.query(
            `SELECT pcs.*, tc.name as component_name
             FROM property_component_subscriptions pcs
             JOIN tariff_components tc ON pcs.component_id = tc.id
             WHERE pcs.status = 'active'`
        );
        return rows;
    }
}
