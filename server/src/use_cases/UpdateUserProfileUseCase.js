import { UserRepository } from '../adapters/repositories/UserRepository.js';
import { AuditRepository } from '../adapters/repositories/AuditRepository.js';

export class UpdateUserProfileUseCase {
    constructor() {
        this.userRepo = new UserRepository();
        this.auditRepo = new AuditRepository();
    }

    async execute(userId, fullName, phone, email, updatedBy) {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Store old values for audit
        const oldValues = {
            fullName: user.fullName,
            phone: user.phone,
            email: user.email
        };

        const newValues = { fullName, phone, email };

        // Update user
        await this.userRepo.update(userId, fullName, phone, email);

        // Log audit
        await this.auditRepo.log(updatedBy, 'user', userId, 'update', {
            before: oldValues,
            after: newValues
        });

        return true;
    }

    async getUserAuditHistory(userId) {
        return await this.auditRepo.findByTarget('user', userId);
    }
}
