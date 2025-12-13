import { ManageTariffsUseCase } from '../../use_cases/ManageTariffsUseCase.js';
import { PropertyRepository } from '../repositories/PropertyRepository.js';
import { UpdateUserProfileUseCase } from '../../use_cases/UpdateUserProfileUseCase.js';

export class AdminController {
    constructor() {
        this.tariffUseCase = new ManageTariffsUseCase();
        this.propertyRepo = new PropertyRepository();
        this.profileUseCase = new UpdateUserProfileUseCase();
    }

    // Tariff Management
    async addTariff(req, res) {
        try {
            const { amount, validFrom, validTo, propertyType } = req.body;

            if (!amount || !validFrom) {
                return res.status(400).json({ error: 'Amount and validFrom required' });
            }

            const id = await this.tariffUseCase.addTariff(amount, validFrom, validTo, propertyType);

            res.status(201).json({ id, message: 'Tariff added successfully' });
        } catch (error) {
            console.error('Add tariff error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async updateTariff(req, res) {
        try {
            const { id } = req.params;
            const { amount, validFrom, validTo, propertyType } = req.body;

            await this.tariffUseCase.updateTariff(id, amount, validFrom, validTo, propertyType);

            res.json({ message: 'Tariff updated successfully' });
        } catch (error) {
            console.error('Update tariff error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async deleteTariff(req, res) {
        try {
            const { id } = req.params;

            await this.tariffUseCase.deleteTariff(id);

            res.json({ message: 'Tariff deleted successfully' });
        } catch (error) {
            console.error('Delete tariff error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async getTariffs(req, res) {
        try {
            const tariffs = await this.tariffUseCase.getAllTariffs();

            res.json(tariffs);
        } catch (error) {
            console.error('Get tariffs error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Property Management
    async getAllProperties(req, res) {
        try {
            const properties = await this.propertyRepo.findAll();

            res.json(properties);
        } catch (error) {
            console.error('Get properties error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updatePropertyOwner(req, res) {
        try {
            const { id } = req.params;
            const { ownerId } = req.body;

            await this.propertyRepo.updateOwner(id, ownerId);

            res.json({ message: 'Property owner updated successfully' });
        } catch (error) {
            console.error('Update property owner error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async updatePropertyType(req, res) {
        try {
            const { id } = req.params;
            const { type } = req.body;

            if (!['rumah', 'tanah'].includes(type)) {
                return res.status(400).json({ error: 'Invalid type. Must be "rumah" or "tanah"' });
            }

            await this.propertyRepo.updateType(id, type);

            res.json({ message: 'Property type updated successfully' });
        } catch (error) {
            console.error('Update property type error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // User Profile Management
    async updateUserProfile(req, res) {
        try {
            const { userId } = req.params;
            const { fullName, phone, email } = req.body;
            const updatedBy = req.user.userId;

            await this.profileUseCase.execute(userId, fullName, phone, email, updatedBy);

            res.json({ message: 'Profile updated successfully' });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async getUserAuditHistory(req, res) {
        try {
            const { userId } = req.params;

            const history = await this.profileUseCase.getUserAuditHistory(userId);

            res.json(history);
        } catch (error) {
            console.error('Get audit history error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
