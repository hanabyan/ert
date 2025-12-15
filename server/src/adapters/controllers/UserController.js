import { UserRepository } from '../repositories/UserRepository.js';

export class UserController {
    constructor() {
        this.userRepo = new UserRepository();
    }

    async getAllUsers(req, res) {
        try {
            const users = await this.userRepo.findAll();
            // Don't send passwords to frontend
            const sanitizedUsers = users.map(user => ({
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                phone: user.phone,
                email: user.email,
                role: user.role
            }));
            res.json(sanitizedUsers);
        } catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async createUser(req, res) {
        try {
            const { username, password, full_name, phone, email, role } = req.body;

            // Validate required fields
            if (!username || !password || !full_name) {
                return res.status(400).json({ error: 'Username, password, and full_name are required' });
            }

            // Check if username already exists
            const existingUser = await this.userRepo.findByUsername(username);
            if (existingUser) {
                return res.status(400).json({ error: 'Username already exists' });
            }

            const userId = await this.userRepo.create(
                username,
                password,
                full_name,
                phone || null,
                email || null,
                role || 'warga'
            );

            res.status(201).json({ id: userId, message: 'User created successfully' });
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Check if user exists
            const user = await this.userRepo.findById(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // If username is being changed, check if it's already taken
            if (updates.username && updates.username !== user.username) {
                const existingUser = await this.userRepo.findByUsername(updates.username);
                if (existingUser) {
                    return res.status(400).json({ error: 'Username already exists' });
                }
            }

            await this.userRepo.updateUser(id, updates);
            res.json({ message: 'User updated successfully' });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deleteUser(req, res) {
        try {
            const { id } = req.params;

            // Check if user exists
            const user = await this.userRepo.findById(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Prevent deleting yourself
            if (req.user && req.user.userId === parseInt(id)) {
                return res.status(400).json({ error: 'Cannot delete your own account' });
            }

            await this.userRepo.delete(id);
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
