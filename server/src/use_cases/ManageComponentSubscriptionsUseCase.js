import { 
    TariffComponentRepository, 
    TariffComponentRateRepository, 
    PropertyComponentSubscriptionRepository 
} from '../adapters/repositories/TariffComponentRepositories.js';
import { PropertyRepository } from '../adapters/repositories/PropertyRepository.js';

export class ManageComponentSubscriptionsUseCase {
    constructor() {
        this.subscriptionRepo = new PropertyComponentSubscriptionRepository();
        this.componentRepo = new TariffComponentRepository();
        this.rateRepo = new TariffComponentRateRepository();
        this.propertyRepo = new PropertyRepository();
    }

    // Warga request subscribe to a component
    async requestSubscription(propertyId, componentId, startDate, endDate, userId) {
        // Validate property exists
        const property = await this.propertyRepo.findById(propertyId);
        if (!property) {
            throw new Error('Property not found');
        }

        // Validate component exists and is active
        const component = await this.componentRepo.findById(componentId);
        if (!component || !component.isActive) {
            throw new Error('Component not found or inactive');
        }

        // Validate dates
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : null;
        
        if (end && end <= start) {
            throw new Error('End date must be after start date');
        }

        // Check for overlapping active subscriptions
        const activeSubscriptions = await this.subscriptionRepo.findActiveSubscriptions(propertyId, startDate);
        const hasOverlap = activeSubscriptions.some(sub => sub.componentId === componentId);
        
        if (hasOverlap) {
            throw new Error('Already subscribed to this component for the specified period');
        }

        // Create subscription request
        const subscriptionId = await this.subscriptionRepo.create(
            propertyId,
            componentId,
            startDate,
            endDate,
            userId
        );

        return subscriptionId;
    }

    // Warga request unsubscribe (set end date)
    async requestUnsubscription(subscriptionId, endDate, userId) {
        const subscription = await this.subscriptionRepo.findById(subscriptionId);
        
        if (!subscription) {
            throw new Error('Subscription not found');
        }

        if (subscription.requestedBy !== userId) {
            throw new Error('Unauthorized to modify this subscription');
        }

        if (subscription.status !== 'active') {
            throw new Error('Can only unsubscribe from active subscriptions');
        }

        // Validate end date
        const end = new Date(endDate);
        const start = new Date(subscription.startDate);
        
        if (end <= start) {
            throw new Error('End date must be after start date');
        }

        // Create new request to update end date
        // In practice, this might update the existing subscription or create a new request
        // For simplicity, we'll deactivate the old one and create a new pending request
        await this.subscriptionRepo.deactivate(subscriptionId);
        
        const newSubscriptionId = await this.subscriptionRepo.create(
            subscription.propertyId,
            subscription.componentId,
            subscription.startDate,
            endDate,
            userId
        );

        return newSubscriptionId;
    }

    // Admin approve subscription request
    async approveRequest(subscriptionId, adminId) {
        const subscription = await this.subscriptionRepo.findById(subscriptionId);
        
        if (!subscription) {
            throw new Error('Subscription not found');
        }

        if (subscription.status !== 'pending') {
            throw new Error('Only pending subscriptions can be approved');
        }

        await this.subscriptionRepo.approve(subscriptionId, adminId);
        return true;
    }

    // Admin reject subscription request
    async rejectRequest(subscriptionId, adminId, reason) {
        const subscription = await this.subscriptionRepo.findById(subscriptionId);
        
        if (!subscription) {
            throw new Error('Subscription not found');
        }

        if (subscription.status !== 'pending') {
            throw new Error('Only pending subscriptions can be rejected');
        }

        if (!reason || reason.trim().length === 0) {
            throw new Error('Rejection reason is required');
        }

        await this.subscriptionRepo.reject(subscriptionId, adminId, reason);
        return true;
    }

    // Get all pending requests (for admin)
    async getPendingRequests() {
        return await this.subscriptionRepo.findPendingRequests();
    }

    // Get subscriptions for a property
    async getPropertySubscriptions(propertyId) {
        return await this.subscriptionRepo.findByProperty(propertyId);
    }

    // Get active subscriptions for a property on a specific date
    async getActiveSubscriptions(propertyId, date) {
        return await this.subscriptionRepo.findActiveSubscriptions(propertyId, date);
    }

    // Calculate total component cost for a property on a specific date
    async calculateComponentCost(propertyId, date, propertyType) {
        const activeSubscriptions = await this.subscriptionRepo.findActiveSubscriptions(propertyId, date);
        
        let totalCost = 0;
        const breakdown = [];

        for (const subscription of activeSubscriptions) {
            const rate = await this.rateRepo.findActiveRate(subscription.componentId, date, propertyType);
            
            if (rate) {
                totalCost += rate.amount;
                breakdown.push({
                    componentId: subscription.componentId,
                    componentName: subscription.component_name || 'Unknown',
                    amount: rate.amount
                });
            }
        }

        return {
            totalCost,
            breakdown
        };
    }

    // Get ALL active subscriptions (Global)
    async getAllActiveSubscriptions() {
        return await this.subscriptionRepo.findAllAllActiveSubscriptions();
    }
}

export class ManageComponentsUseCase {
    constructor() {
        this.componentRepo = new TariffComponentRepository();
        this.rateRepo = new TariffComponentRateRepository();
    }

    // Get all components
    async getAllComponents() {
        return await this.componentRepo.findAll();
    }

    // Get component with its rates
    async getComponentWithRates(componentId) {
        const component = await this.componentRepo.findById(componentId);
        if (!component) {
            throw new Error('Component not found');
        }

        const rates = await this.rateRepo.findByComponent(componentId);
        
        return {
            ...component,
            rates
        };
    }

    // Add new component
    async addComponent(name, description) {
        if (!name || name.trim().length === 0) {
            throw new Error('Component name is required');
        }

        return await this.componentRepo.create(name, description);
    }

    // Update component
    async updateComponent(id, name, description, isActive) {
        const component = await this.componentRepo.findById(id);
        if (!component) {
            throw new Error('Component not found');
        }

        await this.componentRepo.update(id, name, description, isActive);
        return true;
    }

    // Add component rate
    async addComponentRate(componentId, amount, validFrom, validTo, propertyType = 'all') {
        const component = await this.componentRepo.findById(componentId);
        if (!component) {
            throw new Error('Component not found');
        }

        // Validate dates
        const fromDate = new Date(validFrom);
        const toDate = validTo ? new Date(validTo) : null;

        if (toDate && toDate <= fromDate) {
            throw new Error('valid_to must be after valid_from');
        }

        return await this.rateRepo.create(componentId, amount, validFrom, validTo, propertyType);
    }

    // Update component rate
    async updateComponentRate(id, amount, validFrom, validTo, propertyType) {
        await this.rateRepo.update(id, amount, validFrom, validTo, propertyType);
        return true;
    }
}
