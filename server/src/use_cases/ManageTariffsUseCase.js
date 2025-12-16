import { TariffRepository } from '../adapters/repositories/TariffRepository.js';

export class ManageTariffsUseCase {
    constructor() {
        this.tariffRepo = new TariffRepository();
    }

    async addTariff(amount, validFrom, validTo = null, propertyType = 'all', tariffType = 'rutin', description = null) {
        // Validate dates
        const fromDate = new Date(validFrom);
        const toDate = validTo ? new Date(validTo) : null;

        if (toDate && toDate <= fromDate) {
            throw new Error('valid_to must be after valid_from');
        }

        // Validate tariff type
        if (!['rutin', 'insidentil'].includes(tariffType)) {
            throw new Error('tariff_type must be either rutin or insidentil');
        }

        // Description is recommended for insidentil tariffs
        if (tariffType === 'insidentil' && !description) {
            throw new Error('Description is required for insidentil tariffs');
        }

        return await this.tariffRepo.create(amount, validFrom, validTo, propertyType, tariffType, description);
    }

    async updateTariff(id, amount, validFrom, validTo, propertyType, tariffType, description) {
        const tariff = await this.tariffRepo.findById(id);
        if (!tariff) {
            throw new Error('Tariff not found');
        }

        // Validate tariff type
        if (tariffType && !['rutin', 'insidentil'].includes(tariffType)) {
            throw new Error('tariff_type must be either rutin or insidentil');
        }

        // Description is recommended for insidentil tariffs
        if (tariffType === 'insidentil' && !description) {
            throw new Error('Description is required for insidentil tariffs');
        }

        await this.tariffRepo.update(id, amount, validFrom, validTo, propertyType, tariffType, description);
        return true;
    }

    async deleteTariff(id) {
        await this.tariffRepo.delete(id);
        return true;
    }

    async getAllTariffs() {
        return await this.tariffRepo.findAll();
    }

    async getActiveTariff(date = null, propertyType = 'all', tariffType = 'rutin') {
        const checkDate = date || new Date().toISOString().split('T')[0];
        return await this.tariffRepo.findActiveForDate(checkDate, propertyType, tariffType);
    }
}
