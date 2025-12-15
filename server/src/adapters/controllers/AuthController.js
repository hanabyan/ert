import { UserRepository } from '../repositories/UserRepository.js';
import { AuditRepository } from '../repositories/AuditRepository.js';
import jwt from 'jsonwebtoken';

export class AuthController {
    constructor() {
        this.userRepo = new UserRepository();
        this.auditRepo = new AuditRepository();
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password required' });
            }

            const user = await this.userRepo.findByUsername(username);
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const isValid = await this.userRepo.verifyPassword(user, password);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                token,
                user: user.toJSON()
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async register(req, res) {
        try {
            const { username, password, fullName, phone, email } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password required' });
            }

            // Check if username exists
            const existing = await this.userRepo.findByUsername(username);
            if (existing) {
                return res.status(400).json({ error: 'Username already exists' });
            }

            const userId = await this.userRepo.create(username, password, fullName, phone, email, 'warga');

            res.status(201).json({ id: userId, message: 'User created successfully' });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getProfile(req, res) {
        try {
            const user = await this.userRepo.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(user.toJSON());
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getActivity(req, res) {
        try {
            const logs = await this.auditRepo.findByUser(req.user.userId);
            res.json(logs);
        } catch (error) {
            console.error('Get activity error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateProfile(req, res) {
        try {
            const { full_name, phone, email } = req.body;
            const userId = req.user.userId;

            // Validation
            if (!full_name || full_name.trim().length < 3) {
                return res.status(400).json({ error: 'Nama lengkap minimal 3 karakter' });
            }

            if (phone && !/^[0-9]{10,15}$/.test(phone)) {
                return res.status(400).json({ error: 'Nomor telepon tidak valid (10-15 digit)' });
            }

            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ error: 'Format email tidak valid' });
            }

            // Update profile
            await this.userRepo.updateProfile(userId, {
                full_name: full_name.trim(),
                phone: phone || null,
                email: email || null
            });

            // Get updated user
            const updatedUser = await this.userRepo.findById(userId);

            res.json({
                message: 'Profil berhasil diperbarui',
                user: updatedUser.toJSON()
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
