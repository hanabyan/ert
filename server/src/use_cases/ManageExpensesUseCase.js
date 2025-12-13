import { ExpenseRepository, ExpenseRecipientRepository } from '../adapters/repositories/ExpenseRepository.js';

export class ManageExpensesUseCase {
    constructor() {
        this.expenseRepo = new ExpenseRepository();
        this.recipientRepo = new ExpenseRecipientRepository();
    }

    async addExpense(recipientId, description, amount, date) {
        // Validate recipient if provided
        if (recipientId) {
            const recipient = await this.recipientRepo.findById(recipientId);
            if (!recipient) {
                throw new Error('Recipient not found');
            }
        }

        return await this.expenseRepo.create(recipientId, description, amount, date);
    }

    async updateExpense(id, recipientId, description, amount, date) {
        const expense = await this.expenseRepo.findById(id);
        if (!expense) {
            throw new Error('Expense not found');
        }

        await this.expenseRepo.update(id, recipientId, description, amount, date);
        return true;
    }

    async deleteExpense(id) {
        await this.expenseRepo.delete(id);
        return true;
    }

    async getExpenses(startDate = null, endDate = null) {
        return await this.expenseRepo.findAll(startDate, endDate);
    }

    async getMonthlyTotal(year, month) {
        return await this.expenseRepo.getTotalByMonth(year, month);
    }
}

export class ManageRecipientsUseCase {
    constructor() {
        this.recipientRepo = new ExpenseRecipientRepository();
    }

    async addRecipient(name, identityNumber, type, description) {
        return await this.recipientRepo.create(name, identityNumber, type, description);
    }

    async updateRecipient(id, name, identityNumber, type, description) {
        const recipient = await this.recipientRepo.findById(id);
        if (!recipient) {
            throw new Error('Recipient not found');
        }

        await this.recipientRepo.update(id, name, identityNumber, type, description);
        return true;
    }

    async deleteRecipient(id) {
        await this.recipientRepo.delete(id);
        return true;
    }

    async getAllRecipients() {
        return await this.recipientRepo.findAll();
    }
}
