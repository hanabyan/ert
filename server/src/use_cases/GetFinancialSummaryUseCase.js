import { TransactionRepository } from '../adapters/repositories/TransactionRepository.js';
import { ExpenseRepository } from '../adapters/repositories/ExpenseRepository.js';

export class GetFinancialSummaryUseCase {
    constructor() {
        this.transactionRepo = new TransactionRepository();
        this.expenseRepo = new ExpenseRepository();
    }

    async getMonthlySummary(year, month) {
        // Calculate total income from verified payments
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

        // Get all verified transactions in this month
        const [incomeRows] = await this.transactionRepo.pool.query(
            `SELECT SUM(total_amount) as total 
       FROM transactions 
       WHERE status = 'verified' 
       AND DATE(created_at) BETWEEN ? AND ?`,
            [startDate, endDate]
        );

        const totalIncome = parseFloat(incomeRows[0]?.total || 0);

        // Get total expenses
        const totalExpense = await this.expenseRepo.getTotalByMonth(year, month);

        // Get expense details
        const expenses = await this.expenseRepo.findAll(startDate, endDate);

        return {
            year,
            month,
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            expenses
        };
    }
}
