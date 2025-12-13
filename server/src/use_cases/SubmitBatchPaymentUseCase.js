import { TransactionRepository } from '../adapters/repositories/TransactionRepository.js';
import { PropertyRepository } from '../adapters/repositories/PropertyRepository.js';

export class SubmitBatchPaymentUseCase {
    constructor() {
        this.transactionRepo = new TransactionRepository();
        this.propertyRepo = new PropertyRepository();
    }

    async execute(userId, paymentItems, proofImage = null) {
        // paymentItems: [{ propertyId, month, year, amount }]
        
        // Validate all properties belong to user
        for (const item of paymentItems) {
            const property = await this.propertyRepo.findById(item.propertyId);
            if (!property) {
                throw new Error(`Property ${item.propertyId} not found`);
            }
            if (property.ownerId !== userId) {
                throw new Error(`Property ${item.propertyId} does not belong to user`);
            }
        }

        // Calculate total amount
        const totalAmount = paymentItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);

        // Create transaction
        const transactionId = await this.transactionRepo.create(userId, totalAmount, proofImage);

        // Add payment items
        for (const item of paymentItems) {
            await this.transactionRepo.addPaymentItem(
                transactionId,
                item.propertyId,
                item.month,
                item.year,
                item.amount
            );
        }

        return transactionId;
    }
}
