import { UserRepository } from '../adapters/repositories/UserRepository.js';

export class ChangePasswordUseCase {
    constructor() {
        this.userRepo = new UserRepository();
    }

    async execute(userId, currentPassword, newPassword) {
        // Validasi input
        if (!currentPassword || !newPassword) {
            throw new Error('Password lama dan password baru harus diisi');
        }

        if (newPassword.length < 6) {
            throw new Error('Password baru minimal 6 karakter');
        }

        if (currentPassword === newPassword) {
            throw new Error('Password baru tidak boleh sama dengan password lama');
        }

        // Get user
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error('User tidak ditemukan');
        }

        // Verify current password
        const isPasswordValid = await this.userRepo.verifyPassword(user, currentPassword);
        if (!isPasswordValid) {
            throw new Error('Password lama tidak sesuai');
        }

        // Update password
        await this.userRepo.updatePassword(userId, newPassword);

        return { success: true, message: 'Password berhasil diubah' };
    }
}
