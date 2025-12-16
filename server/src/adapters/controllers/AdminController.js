import { ManageTariffsUseCase } from '../../use_cases/ManageTariffsUseCase.js';
import { PropertyRepository } from '../repositories/PropertyRepository.js';
import { PropertyUserRepository } from '../repositories/PropertyUserRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { UpdateUserProfileUseCase } from '../../use_cases/UpdateUserProfileUseCase.js';

export class AdminController {
    constructor() {
        this.tariffUseCase = new ManageTariffsUseCase();
        this.propertyRepo = new PropertyRepository();
        this.propertyUserRepo = new PropertyUserRepository();
        this.userRepo = new UserRepository();
        this.profileUseCase = new UpdateUserProfileUseCase();
    }

    // Tariff Management
    async addTariff(req, res) {
        try {
            const { amount, validFrom, validTo, propertyType, tariffType, description } = req.body;

            if (!amount || !validFrom) {
                return res.status(400).json({ error: 'Amount and validFrom required' });
            }

            const id = await this.tariffUseCase.addTariff(amount, validFrom, validTo, propertyType, tariffType, description);

            res.status(201).json({ id, message: 'Tariff added successfully' });
        } catch (error) {
            console.error('Add tariff error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async updateTariff(req, res) {
        try {
            const { id } = req.params;
            const { amount, validFrom, validTo, propertyType, tariffType, description } = req.body;

            await this.tariffUseCase.updateTariff(id, amount, validFrom, validTo, propertyType, tariffType, description);

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

    // Property-User Relationship Management
    async getPropertyUsers(req, res) {
        try {
            const { propertyId } = req.params;
            const users = await this.propertyUserRepo.findByProperty(propertyId);
            res.json(users);
        } catch (error) {
            console.error('Get property users error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async addPropertyUser(req, res) {
        try {
            const { propertyId } = req.params;
            const { userId, relationType } = req.body;

            if (!userId || !relationType) {
                return res.status(400).json({ error: 'userId and relationType required' });
            }

            if (!['pemilik', 'keluarga', 'sewa'].includes(relationType)) {
                return res.status(400).json({ error: 'Invalid relationType. Must be "pemilik", "keluarga", or "sewa"' });
            }

            // Check if user exists
            const user = await this.userRepo.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Check if property exists
            const property = await this.propertyRepo.findById(propertyId);
            if (!property) {
                return res.status(404).json({ error: 'Property not found' });
            }

            // Check if relationship already exists
            const exists = await this.propertyUserRepo.exists(propertyId, userId);
            if (exists) {
                return res.status(400).json({ error: 'User already linked to this property' });
            }

            const id = await this.propertyUserRepo.add(propertyId, userId, relationType);
            res.status(201).json({ id, message: 'User added to property successfully' });
        } catch (error) {
            console.error('Add property user error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async updatePropertyUser(req, res) {
        try {
            const { id } = req.params;
            const { relationType } = req.body;

            if (!relationType) {
                return res.status(400).json({ error: 'relationType required' });
            }

            if (!['pemilik', 'keluarga', 'sewa'].includes(relationType)) {
                return res.status(400).json({ error: 'Invalid relationType. Must be "pemilik", "keluarga", or "sewa"' });
            }

            await this.propertyUserRepo.update(id, relationType);
            res.json({ message: 'Relation type updated successfully' });
        } catch (error) {
            console.error('Update property user error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async deletePropertyUser(req, res) {
        try {
            const { id } = req.params;
            await this.propertyUserRepo.delete(id);
            res.json({ message: 'User removed from property successfully' });
        } catch (error) {
            console.error('Delete property user error:', error);
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

    // Admin Create Payment for User
    async createPaymentForUser(req, res) {
        try {
            const { userId, totalAmount, items, adminCreated } = req.body;
            const proofImage = req.file ? req.file.filename : null;

            if (!userId || !totalAmount || !items) {
                return res.status(400).json({ error: 'userId, totalAmount, and items required' });
            }

            const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

            if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
                return res.status(400).json({ error: 'Items must be a non-empty array' });
            }

            // Import TransactionRepository
            const { TransactionRepository } = await import('../repositories/TransactionRepository.js');
            const transactionRepo = new TransactionRepository();

            // Create transaction
            const transactionId = await transactionRepo.create(userId, totalAmount, proofImage);

            // Add payment items
            for (const item of parsedItems) {
                await transactionRepo.addPaymentItem(
                    transactionId,
                    item.propertyId,
                    item.month,
                    item.year,
                    item.amount
                );
            }

            // If admin created, auto-verify
            if (adminCreated === 'true') {
                await transactionRepo.updateStatus(transactionId, 'verified');
            }

            res.status(201).json({ 
                transactionId, 
                message: 'Payment created and verified successfully' 
            });
        } catch (error) {
            console.error('Create payment for user error:', error);
            res.status(400).json({ error: error.message });
        }
    }
}
