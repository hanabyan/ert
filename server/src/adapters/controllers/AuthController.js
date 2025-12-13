import { UserRepository } from '../repositories/UserRepository.js';
import jwt from 'jsonwebtoken';

export class AuthController {
    constructor() {
        this.userRepo = new UserRepository();
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
}
