import { PropertyRepository } from '../adapters/repositories/PropertyRepository.js';
import { TransactionRepository } from '../adapters/repositories/TransactionRepository.js';
import { TariffRepository } from '../adapters/repositories/TariffRepository.js';

export class GetWargaDashboardUseCase {
    constructor() {
        this.propertyRepo = new PropertyRepository();
        this.transactionRepo = new TransactionRepository();
        this.tariffRepo = new TariffRepository();
    }

    /**
   * Get 6-month overview for a property
   */
    async getOverview(block, number, startMonth, startYear) {
        const property = await this.propertyRepo.findByBlockAndNumber(block, number);
        if (!property) {
            throw new Error('Property not found');
        }

        // Calculate 6-month range
        const months = [];
        let currentMonth = startMonth;
        let currentYear = startYear;

        for (let i = 0; i < 6; i++) {
            months.push({ month: currentMonth, year: currentYear });
            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
        }

        // Get payment data for this range
        const endMonth = months[5].month;
        const endYear = months[5].year;
        
        const paidMonths = await this.transactionRepo.getPaymentItemsGroupedByMonth(
            property.id,
            startMonth,
            startYear,
            endMonth,
            endYear
        );

        // Build result with validation
        const result = [];
        let totalDebt = 0;

        for (const { month, year } of months) {
            const paid = paidMonths.find(p => p.month === month && p.year === year);
            const tariff = await this.tariffRepo.findActiveForDate(
                `${year}-${String(month).padStart(2, '0')}-01`,
                property.type
            );

            const expectedAmount = tariff ? tariff.amount : 0;
            const paidAmount = paid ? parseFloat(paid.total_paid) : 0;
            const status = paidAmount >= expectedAmount ? 'paid' : 'unpaid';
            
            if (status === 'unpaid') {
                totalDebt += (expectedAmount - paidAmount);
            }

            result.push({
                month,
                year,
                expectedAmount,
                paidAmount,
                status,
                isPartial: paidAmount > 0 && paidAmount < expectedAmount
            });
        }

        return {
            property: {
                id: property.id,
                block: property.block,
                number: property.number,
                type: property.type
            },
            months: result,
            totalDebt
        };
    }

    /**
   * Get detailed payment history with filters
   */
    async getDetailHistory(block, number, year = null, status = 'all') {
        const property = await this.propertyRepo.findByBlockAndNumber(block, number);
        if (!property) {
            throw new Error('Property not found');
        }

        const currentYear = year || new Date().getFullYear();
        const payments = await this.transactionRepo.getPaymentItemsByProperty(property.id, currentYear);

        // Filter by status if needed
        let filtered = payments;
        if (status === 'paid') {
            filtered = payments.filter(p => p.status === 'verified');
        } else if (status === 'unpaid') {
            // For unpaid, we need to check all months and find gaps
            // This is complex, simplified here
            filtered = payments.filter(p => p.status === 'pending' || p.status === 'rejected');
        }

        // Add tariff validation
        const result = [];
        for (const payment of filtered) {
            const tariff = await this.tariffRepo.findActiveForDate(
                `${payment.year}-${String(payment.month).padStart(2, '0')}-01`,
                property.type
            );

            result.push({
                ...payment,
                expectedAmount: tariff ? tariff.amount : 0,
                isValid: tariff && parseFloat(payment.amount) >= tariff.amount
            });
        }

        return result;
    }
}
