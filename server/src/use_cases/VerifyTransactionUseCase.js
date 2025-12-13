import { TransactionRepository } from '../adapters/repositories/TransactionRepository.js';

export class VerifyTransactionUseCase {
    constructor() {
        this.transactionRepo = new TransactionRepository();
    }

    async execute(transactionId, status) {
        // status: 'verified' or 'rejected'
        if (!['verified', 'rejected'].includes(status)) {
            throw new Error('Invalid status. Must be "verified" or "rejected"');
        }

        const transaction = await this.transactionRepo.findById(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        if (!transaction.isPending()) {
            throw new Error('Transaction has already been processed');
        }

        await this.transactionRepo.updateStatus(transactionId, status);
        
        return true;
    }

    async getPendingTransactions() {
        return await this.transactionRepo.findPending();
    }
}
