import { 
    TariffComponentRepository, 
    PropertyComponentSubscriptionRepository 
} from '../adapters/repositories/TariffComponentRepositories.js';

export class BulkManageSubscriptionsUseCase {
    constructor() {
        this.componentRepo = new TariffComponentRepository();
        this.subscriptionRepo = new PropertyComponentSubscriptionRepository();
    }

    async execute({ propertyIds, componentId, action, adminId, startDate, endDate }) {
        if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
            throw new Error('No properties selected');
        }
        if (!componentId) {
            throw new Error('Component ID is required');
        }
        if (!startDate) {
            throw new Error('Start date is required');
        }

        const component = await this.componentRepo.findById(componentId);
        if (!component) {
            throw new Error('Component not found');
        }

        const results = [];
        const effectiveStartDate = startDate || new Date();
        const effectiveEndDate = endDate || null;

        for (const propertyId of propertyIds) {
            try {
                const existing = await this.subscriptionRepo.findByPropertyAndComponent(propertyId, componentId);

                if (action === 'assign') {
                    if (existing) {
                        if (existing.status !== 'active') {
                            await this.subscriptionRepo.updateStatusWithDates(existing.id, 'active', adminId, effectiveStartDate, effectiveEndDate);
                            results.push({ propertyId, status: 'reactivated' });
                        } else {
                            results.push({ propertyId, status: 'already_active' });
                        }
                    } else {
                        await this.subscriptionRepo.createActiveSubscription(propertyId, componentId, effectiveStartDate, adminId, effectiveEndDate);
                        results.push({ propertyId, status: 'assigned' });
                    }
                } else if (action === 'remove') {
                    if (existing && existing.status === 'active') {
                        await this.subscriptionRepo.deactivate(existing.id);
                        results.push({ propertyId, status: 'removed' });
                    } else {
                        results.push({ propertyId, status: 'skipped' });
                    }
                } else {
                    throw new Error('Invalid action');
                }
            } catch (error) {
                console.error(`Error processing property ${propertyId}:`, error);
                results.push({ propertyId, error: error.message });
            }
        }

        return {
            success: true,
            processed: results.length,
            details: results
        };
    }
}
