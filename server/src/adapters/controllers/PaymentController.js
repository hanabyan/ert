import { SubmitBatchPaymentUseCase } from '../../use_cases/SubmitBatchPaymentUseCase.js';
import { VerifyTransactionUseCase } from '../../use_cases/VerifyTransactionUseCase.js';
import { TransactionRepository } from '../repositories/TransactionRepository.js';

export class PaymentController {
    constructor() {
        this.submitPaymentUseCase = new SubmitBatchPaymentUseCase();
        this.verifyTransactionUseCase = new VerifyTransactionUseCase();
        this.transactionRepo = new TransactionRepository();
    }

    async submitPayment(req, res) {
        try {
            const { paymentItems, proofImage } = req.body;
            const userId = req.user.userId;

            if (!paymentItems || !Array.isArray(paymentItems) || paymentItems.length === 0) {
                return res.status(400).json({ error: 'Payment items required' });
            }

            const transactionId = await this.submitPaymentUseCase.execute(userId, paymentItems, proofImage);

            res.status(201).json({
                transactionId,
                message: 'Payment submitted successfully'
            });
        } catch (error) {
            console.error('Submit payment error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async verifyPayment(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!['verified', 'rejected'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            await this.verifyTransactionUseCase.execute(id, status);

            res.json({ message: `Payment ${status} successfully` });
        } catch (error) {
            console.error('Verify payment error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async getPendingPayments(req, res) {
        try {
            const transactions = await this.verifyTransactionUseCase.getPendingTransactions();

            // Get payment items for each transaction
            const result = [];
            for (const transaction of transactions) {
                const items = await this.transactionRepo.getPaymentItems(transaction.id);
                result.push({
                    ...transaction,
                    items
                });
            }

            res.json(result);
        } catch (error) {
            console.error('Get pending payments error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getUserPayments(req, res) {
        try {
            const userId = req.user.userId;
            const transactions = await this.transactionRepo.findByUserId(userId);

            const result = [];
            for (const transaction of transactions) {
                const items = await this.transactionRepo.getPaymentItems(transaction.id);
                result.push({
                    ...transaction,
                    items
                });
            }

            res.json(result);
        } catch (error) {
            console.error('Get user payments error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
