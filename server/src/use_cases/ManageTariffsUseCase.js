import { TariffRepository } from '../adapters/repositories/TariffRepository.js';

export class ManageTariffsUseCase {
    constructor() {
        this.tariffRepo = new TariffRepository();
    }

    async addTariff(amount, validFrom, validTo = null, propertyType = 'all') {
        // Validate dates
        const fromDate = new Date(validFrom);
        const toDate = validTo ? new Date(validTo) : null;

        if (toDate && toDate <= fromDate) {
            throw new Error('valid_to must be after valid_from');
        }

        return await this.tariffRepo.create(amount, validFrom, validTo, propertyType);
    }

    async updateTariff(id, amount, validFrom, validTo, propertyType) {
        const tariff = await this.tariffRepo.findById(id);
        if (!tariff) {
            throw new Error('Tariff not found');
        }

        await this.tariffRepo.update(id, amount, validFrom, validTo, propertyType);
        return true;
    }

    async deleteTariff(id) {
        await this.tariffRepo.delete(id);
        return true;
    }

    async getAllTariffs() {
        return await this.tariffRepo.findAll();
    }

    async getActiveTariff(date = null, propertyType = 'all') {
        const checkDate = date || new Date().toISOString().split('T')[0];
        return await this.tariffRepo.findActiveForDate(checkDate, propertyType);
    }
}
