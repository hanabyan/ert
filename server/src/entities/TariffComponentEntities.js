// Tariff Component Entity
export class TariffComponent {
    constructor({ id, name, description, is_active, created_at, updated_at }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.isActive = is_active;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
    }
}

// Tariff Component Rate Entity
export class TariffComponentRate {
    constructor({ id, component_id, amount, valid_from, valid_to, property_type, created_at, updated_at }) {
        this.id = id;
        this.componentId = component_id;
        this.amount = parseFloat(amount);
        this.validFrom = valid_from;
        this.validTo = valid_to;
        this.propertyType = property_type;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
    }

    isActive(date = new Date()) {
        const checkDate = new Date(date);
        const fromDate = new Date(this.validFrom);
        const toDate = this.validTo ? new Date(this.validTo) : null;

        return checkDate >= fromDate && (!toDate || checkDate <= toDate);
    }
}

// Property Component Subscription Entity
export class PropertyComponentSubscription {
    constructor({ id, property_id, component_id, start_date, end_date, status, requested_by, approved_by, approved_at, rejection_reason, created_at, updated_at }) {
        this.id = id;
        this.propertyId = property_id;
        this.componentId = component_id;
        this.startDate = start_date;
        this.endDate = end_date;
        this.status = status;
        this.requestedBy = requested_by;
        this.approvedBy = approved_by;
        this.approvedAt = approved_at;
        this.rejectionReason = rejection_reason;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
    }

    isPending() {
        return this.status === 'pending';
    }

    isActive() {
        return this.status === 'active';
    }

    isRejected() {
        return this.status === 'rejected';
    }

    isActiveOnDate(date = new Date()) {
        if (this.status !== 'active') return false;

        const checkDate = new Date(date);
        const startDate = new Date(this.startDate);
        const endDate = this.endDate ? new Date(this.endDate) : null;

        return checkDate >= startDate && (!endDate || checkDate <= endDate);
    }
}
