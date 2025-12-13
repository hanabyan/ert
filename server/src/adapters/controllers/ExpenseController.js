import { ManageExpensesUseCase, ManageRecipientsUseCase } from '../../use_cases/ManageExpensesUseCase.js';

export class ExpenseController {
    constructor() {
        this.expenseUseCase = new ManageExpensesUseCase();
        this.recipientUseCase = new ManageRecipientsUseCase();
    }

    // Expense CRUD
    async addExpense(req, res) {
        try {
            const { recipientId, description, amount, date } = req.body;

            if (!description || !amount || !date) {
                return res.status(400).json({ error: 'Description, amount, and date required' });
            }

            const id = await this.expenseUseCase.addExpense(recipientId, description, amount, date);

            res.status(201).json({ id, message: 'Expense added successfully' });
        } catch (error) {
            console.error('Add expense error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async updateExpense(req, res) {
        try {
            const { id } = req.params;
            const { recipientId, description, amount, date } = req.body;

            await this.expenseUseCase.updateExpense(id, recipientId, description, amount, date);

            res.json({ message: 'Expense updated successfully' });
        } catch (error) {
            console.error('Update expense error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async deleteExpense(req, res) {
        try {
            const { id } = req.params;

            await this.expenseUseCase.deleteExpense(id);

            res.json({ message: 'Expense deleted successfully' });
        } catch (error) {
            console.error('Delete expense error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async getExpenses(req, res) {
        try {
            const { startDate, endDate } = req.query;

            const expenses = await this.expenseUseCase.getExpenses(startDate, endDate);

            res.json(expenses);
        } catch (error) {
            console.error('Get expenses error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Recipient CRUD
    async addRecipient(req, res) {
        try {
            const { name, identityNumber, type, description } = req.body;

            if (!name || !type) {
                return res.status(400).json({ error: 'Name and type required' });
            }

            const id = await this.recipientUseCase.addRecipient(name, identityNumber, type, description);

            res.status(201).json({ id, message: 'Recipient added successfully' });
        } catch (error) {
            console.error('Add recipient error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async updateRecipient(req, res) {
        try {
            const { id } = req.params;
            const { name, identityNumber, type, description } = req.body;

            await this.recipientUseCase.updateRecipient(id, name, identityNumber, type, description);

            res.json({ message: 'Recipient updated successfully' });
        } catch (error) {
            console.error('Update recipient error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async deleteRecipient(req, res) {
        try {
            const { id } = req.params;

            await this.recipientUseCase.deleteRecipient(id);

            res.json({ message: 'Recipient deleted successfully' });
        } catch (error) {
            console.error('Delete recipient error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async getRecipients(req, res) {
        try {
            const recipients = await this.recipientUseCase.getAllRecipients();

            res.json(recipients);
        } catch (error) {
            console.error('Get recipients error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
