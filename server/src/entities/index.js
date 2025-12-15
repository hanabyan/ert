// User Entity
export class User {
    constructor({ id, username, password, full_name, phone, email, role, created_at, updated_at }) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.fullName = full_name;
        this.phone = phone;
        this.email = email;
        this.role = role;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
    }

    isAdmin() {
        return this.role === 'admin';
    }

    toJSON() {
        const { password, ...userWithoutPassword } = this;
        return userWithoutPassword;
    }
}

// Property Entity
export class Property {
    constructor({ id, block, number, type, owner_id, bast_date, created_at, updated_at }) {
        this.id = id;
        this.block = block;
        this.number = number;
        this.type = type;
        this.ownerId = owner_id;
        this.bastDate = bast_date;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
    }

    getDisplayName() {
        return `${this.block}${this.number}`;
    }

    isHouse() {
        return this.type === 'rumah';
    }

    isLand() {
        return this.type === 'tanah';
    }
}

// Transaction Entity
export class Transaction {
    constructor({ id, user_id, total_amount, proof_image, status, created_at, updated_at }) {
        this.id = id;
        this.userId = user_id;
        this.totalAmount = parseFloat(total_amount);
        this.proofImage = proof_image;
        this.status = status;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
    }

    isPending() {
        return this.status === 'pending';
    }

    isVerified() {
        return this.status === 'verified';
    }

    isRejected() {
        return this.status === 'rejected';
    }
}

// Payment Item Entity
export class PaymentItem {
    constructor({ id, transaction_id, property_id, month, year, amount, created_at }) {
        this.id = id;
        this.transactionId = transaction_id;
        this.propertyId = property_id;
        this.month = month;
        this.year = year;
        this.amount = parseFloat(amount);
        this.createdAt = created_at;
    }

    getMonthYear() {
        return `${this.year}-${String(this.month).padStart(2, '0')}`;
    }
}

// Tariff Entity
export class Tariff {
    constructor({ id, amount, valid_from, valid_to, property_type, created_at, updated_at }) {
        this.id = id;
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

    appliesToPropertyType(propertyType) {
        return this.propertyType === 'all' || this.propertyType === propertyType;
    }
}

// Expense Entity
export class Expense {
    constructor({ id, recipient_id, description, amount, date, created_at, updated_at }) {
        this.id = id;
        this.recipientId = recipient_id;
        this.description = description;
        this.amount = parseFloat(amount);
        this.date = date;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
    }
}

// Expense Recipient Entity
export class ExpenseRecipient {
    constructor({ id, name, identity_number, type, description, created_at, updated_at }) {
        this.id = id;
        this.name = name;
        this.identityNumber = identity_number;
        this.type = type;
        this.description = description;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
    }
}

// Audit Log Entity
export class AuditLog {
    constructor({ id, user_id, target_type, target_id, action, changes, created_at }) {
        this.id = id;
        this.userId = user_id;
        this.targetType = target_type;
        this.targetId = target_id;
        this.action = action;
        this.changes = typeof changes === 'string' ? JSON.parse(changes) : changes;
        this.createdAt = created_at;
    }
}
