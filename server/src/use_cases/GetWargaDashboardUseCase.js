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

    /**
     * Get all properties with their payment status for a 6-month period
     */
    async getAllPropertiesWithStatus(startMonth, startYear) {
        const properties = await this.propertyRepo.findAll();
        
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

        const result = [];

        for (const property of properties) {
            const monthlyStatus = [];
            let totalDebt = 0;
            let paidMonths = 0;

            // Calculate total debt from BAST date to current period
            let totalDebtFromBast = 0;
            let totalMonthsFromBast = 0;

            if (property.bastDate) {
                const bastDate = new Date(property.bastDate);
                const bastMonth = bastDate.getMonth() + 1; // 1-12
                const bastYear = bastDate.getFullYear();
                
                // Calculate from month after BAST to current period end
                const endMonth = months[5].month;
                const endYear = months[5].year;
                
                let calcMonth = bastMonth;
                let calcYear = bastYear;
                
                // Start from the month after BAST
                calcMonth++;
                if (calcMonth > 12) {
                    calcMonth = 1;
                    calcYear++;
                }
                
                while (calcYear < endYear || (calcYear === endYear && calcMonth <= endMonth)) {
                    totalMonthsFromBast++;
                    
                    // Get tariff for this month
                    const tariff = await this.tariffRepo.findActiveForDate(
                        `${calcYear}-${String(calcMonth).padStart(2, '0')}-01`,
                        property.type
                    );
                    
                    // Get payments for this month
                    const payments = await this.transactionRepo.getPaymentItemsGroupedByMonth(
                        property.id,
                        calcMonth,
                        calcYear,
                        calcMonth,
                        calcYear
                    );
                    
                    const expectedAmount = tariff ? tariff.amount : 0;
                    const paidAmount = payments.length > 0 ? parseFloat(payments[0].total_paid) : 0;
                    
                    if (paidAmount < expectedAmount) {
                        totalDebtFromBast += (expectedAmount - paidAmount);
                    }
                    
                    calcMonth++;
                    if (calcMonth > 12) {
                        calcMonth = 1;
                        calcYear++;
                    }
                }
            }

            for (const { month, year } of months) {
                // Get tariff for this month
                const tariff = await this.tariffRepo.findActiveForDate(
                    `${year}-${String(month).padStart(2, '0')}-01`,
                    property.type
                );

                // Get verified payments for this month
                const payments = await this.transactionRepo.getPaymentItemsGroupedByMonth(
                    property.id,
                    month,
                    year,
                    month,
                    year
                );

                // Get pending payments for this month
                const pendingPayments = await this.transactionRepo.getPendingPaymentItemsGroupedByMonth(
                    property.id,
                    month,
                    year,
                    month,
                    year
                );

                const expectedAmount = tariff ? tariff.amount : 0;
                const paidAmount = payments.length > 0 ? parseFloat(payments[0].total_paid) : 0;
                const pendingAmount = pendingPayments.length > 0 ? parseFloat(pendingPayments[0].total_paid) : 0;
                
                const isPaid = paidAmount >= expectedAmount;
                const isPending = !isPaid && pendingAmount > 0;

                let status = 'belum_lunas';
                if (isPaid) {
                    status = 'lunas';
                    paidMonths++;
                } else if (isPending) {
                    status = 'menunggu_verifikasi';
                } else {
                    totalDebt += (expectedAmount - paidAmount);
                }

                monthlyStatus.push({
                    month,
                    year,
                    status,
                    expectedAmount,
                    paidAmount,
                    pendingAmount,
                    debt: isPaid ? 0 : (expectedAmount - paidAmount)
                });
            }

            // Overall status: lunas if all 6 months are paid
            const overallStatus = paidMonths === 6 ? 'lunas' : 'belum_lunas';

            result.push({
                id: property.id,
                block: property.block,
                number: property.number,
                type: property.type,
                address: `Blok ${property.block} No. ${property.number}`,
                bastDate: property.bastDate,
                status: overallStatus,
                statusText: overallStatus === 'lunas' ? 'Lunas' : 'Belum Lunas',
                monthlyStatus,
                totalDebt, // Debt for 6-month period
                totalDebtFromBast, // Total debt since BAST
                totalMonthsFromBast, // Total months since BAST
                paidMonths,
                totalMonths: 6
            });
        }

        // Sort by block and number
        result.sort((a, b) => {
            if (a.block !== b.block) return a.block.localeCompare(b.block);
            return a.number - b.number;
        });

        return {
            properties: result,
            period: {
                startMonth: months[0].month,
                startYear: months[0].year,
                endMonth: months[5].month,
                endYear: months[5].year,
                months
            }
        };
    }
}
