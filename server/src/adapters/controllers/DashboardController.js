import { GetWargaDashboardUseCase } from '../../use_cases/GetWargaDashboardUseCase.js';
import { GetFinancialSummaryUseCase } from '../../use_cases/GetFinancialSummaryUseCase.js';
import { PropertyRepository } from '../repositories/PropertyRepository.js';

export class DashboardController {
    constructor() {
        this.dashboardUseCase = new GetWargaDashboardUseCase();
        this.financialUseCase = new GetFinancialSummaryUseCase();
        this.propertyRepo = new PropertyRepository();
    }

    async getOverview(req, res) {
        try {
            const { block, number } = req.params;
            const { startMonth, startYear } = req.query;

            const month = parseInt(startMonth) || new Date().getMonth() + 1;
            const year = parseInt(startYear) || new Date().getFullYear();

            const overview = await this.dashboardUseCase.getOverview(block, number, month, year);

            res.json(overview);
        } catch (error) {
            console.error('Get overview error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async getDetailHistory(req, res) {
        try {
            const { block, number } = req.params;
            const { year, status } = req.query;

            const history = await this.dashboardUseCase.getDetailHistory(
                block,
                number,
                year ? parseInt(year) : null,
                status || 'all'
            );

            res.json(history);
        } catch (error) {
            console.error('Get detail history error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async getFinancialSummary(req, res) {
        try {
            const { year, month } = req.query;

            const currentDate = new Date();
            const summaryYear = year ? parseInt(year) : currentDate.getFullYear();
            const summaryMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

            const summary = await this.financialUseCase.getMonthlySummary(summaryYear, summaryMonth);

            res.json(summary);
        } catch (error) {
            console.error('Get financial summary error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async searchProperty(req, res) {
        try {
            const { block, number } = req.query;

            if (!block || !number) {
                return res.status(400).json({ error: 'Block and number required' });
            }

            const property = await this.propertyRepo.findByBlockAndNumber(block, parseInt(number));

            if (!property) {
                return res.status(404).json({ error: 'Property not found' });
            }

            res.json(property);
        } catch (error) {
            console.error('Search property error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
