import { ManageComponentSubscriptionsUseCase, ManageComponentsUseCase } from '../../use_cases/ManageComponentSubscriptionsUseCase.js';
import { BulkManageSubscriptionsUseCase } from '../../use_cases/BulkManageSubscriptionsUseCase.js';

export class ComponentSubscriptionController {
    constructor() {
        this.subscriptionUseCase = new ManageComponentSubscriptionsUseCase();
        this.componentUseCase = new ManageComponentsUseCase();
        this.bulkSubscriptionUseCase = new BulkManageSubscriptionsUseCase();
    }

    // Warga: Request subscribe to component
    async requestSubscription(req, res) {
        try {
            const { propertyId, componentId, startDate, endDate } = req.body;
            const userId = req.user.userId;

            if (!propertyId || !componentId || !startDate) {
                return res.status(400).json({ error: 'propertyId, componentId, and startDate are required' });
            }

            const subscriptionId = await this.subscriptionUseCase.requestSubscription(
                propertyId,
                componentId,
                startDate,
                endDate,
                userId
            );

            res.status(201).json({
                subscriptionId,
                message: 'Subscription request submitted. Waiting for admin approval.'
            });
        } catch (error) {
            console.error('Request subscription error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Warga: Request unsubscribe (set end date)
    async requestUnsubscription(req, res) {
        try {
            const { subscriptionId } = req.params;
            const { endDate } = req.body;
            const userId = req.user.userId;

            if (!endDate) {
                return res.status(400).json({ error: 'endDate is required' });
            }

            const newSubscriptionId = await this.subscriptionUseCase.requestUnsubscription(
                parseInt(subscriptionId),
                endDate,
                userId
            );

            res.json({
                subscriptionId: newSubscriptionId,
                message: 'Unsubscription request submitted. Waiting for admin approval.'
            });
        } catch (error) {
            console.error('Request unsubscription error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Warga: Get my subscriptions for a property
    async getMySubscriptions(req, res) {
        try {
            const { propertyId } = req.params;

            const subscriptions = await this.subscriptionUseCase.getPropertySubscriptions(parseInt(propertyId));

            res.json(subscriptions);
        } catch (error) {
            console.error('Get subscriptions error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Warga: Get available components
    async getAvailableComponents(req, res) {
        try {
            const components = await this.componentUseCase.getAllComponents();
            res.json(components);
        } catch (error) {
            console.error('Get components error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Admin: Get pending requests
    async getPendingRequests(req, res) {
        try {
            const requests = await this.subscriptionUseCase.getPendingRequests();
            res.json(requests);
        } catch (error) {
            console.error('Get pending requests error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Admin: Approve request
    async approveRequest(req, res) {
        try {
            const { id } = req.params;
            const adminId = req.user.userId;

            await this.subscriptionUseCase.approveRequest(parseInt(id), adminId);

            res.json({ message: 'Subscription request approved' });
        } catch (error) {
            console.error('Approve request error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Admin: Reject request
    async rejectRequest(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const adminId = req.user.userId;

            if (!reason) {
                return res.status(400).json({ error: 'Rejection reason is required' });
            }

            await this.subscriptionUseCase.rejectRequest(parseInt(id), adminId, reason);

            res.json({ message: 'Subscription request rejected' });
        } catch (error) {
            console.error('Reject request error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Admin: Get all components
    async getAllComponents(req, res) {
        try {
            const components = await this.componentUseCase.getAllComponents();
            res.json(components);
        } catch (error) {
            console.error('Get all components error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Admin: Get component with rates
    async getComponentWithRates(req, res) {
        try {
            const { id } = req.params;
            const component = await this.componentUseCase.getComponentWithRates(parseInt(id));
            res.json(component);
        } catch (error) {
            console.error('Get component error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Admin: Add component
    async addComponent(req, res) {
        try {
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Component name is required' });
            }

            const componentId = await this.componentUseCase.addComponent(name, description);

            res.status(201).json({ componentId, message: 'Component added successfully' });
        } catch (error) {
            console.error('Add component error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Admin: Update component
    async updateComponent(req, res) {
        try {
            const { id } = req.params;
            const { name, description, isActive } = req.body;

            await this.componentUseCase.updateComponent(parseInt(id), name, description, isActive);

            res.json({ message: 'Component updated successfully' });
        } catch (error) {
            console.error('Update component error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Admin: Add component rate
    async addComponentRate(req, res) {
        try {
            const { componentId, amount, validFrom, validTo, propertyType } = req.body;

            if (!componentId || !amount || !validFrom) {
                return res.status(400).json({ error: 'componentId, amount, and validFrom are required' });
            }

            const rateId = await this.componentUseCase.addComponentRate(
                componentId,
                amount,
                validFrom,
                validTo,
                propertyType
            );

            res.status(201).json({ rateId, message: 'Component rate added successfully' });
        } catch (error) {
            console.error('Add component rate error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Admin: Update component rate
    async updateComponentRate(req, res) {
        try {
            const { id } = req.params;
            const { amount, validFrom, validTo, propertyType } = req.body;

            await this.componentUseCase.updateComponentRate(
                parseInt(id),
                amount,
                validFrom,
                validTo,
                propertyType
            );

            res.json({ message: 'Component rate updated successfully' });
        } catch (error) {
            console.error('Update component rate error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Admin: Bulk Subscribe
    async bulkSubscribe(req, res) {
        try {
            const { propertyIds, componentId, action, startDate, endDate } = req.body;
            const adminId = req.user.userId;

            const result = await this.bulkSubscriptionUseCase.execute({
                propertyIds,
                componentId,
                action,
                adminId,
                startDate,
                endDate
            });

            res.json(result);
        } catch (error) {
            console.error('Bulk susbcription error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Admin: Get ALL active subscriptions for Bulk UI
    async getAllActiveSubscriptions(req, res) {
         try {
            // We can add this method to ManageComponentSubscriptionsUseCase too or access repo directly via it?
            // Cleanest is to expose it via the use case.
            // But since I didn't add it to ManageComponentSubscriptionsUseCase yet, I'll access the repo directly here?
            // No, that breaks Clean Arch.
            // I'll add `getAllActiveSubscriptions` to `ManageComponentSubscriptionsUseCase`.
            const subscriptions = await this.subscriptionUseCase.getAllActiveSubscriptions();
            res.json(subscriptions);
        } catch (error) {
            console.error('Get all active subscriptions error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
