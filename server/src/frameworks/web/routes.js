import express from 'express';
import { AuthController } from '../../adapters/controllers/AuthController.js';
import { PaymentController } from '../../adapters/controllers/PaymentController.js';
import { DashboardController } from '../../adapters/controllers/DashboardController.js';
import { ExpenseController } from '../../adapters/controllers/ExpenseController.js';
import { AdminController } from '../../adapters/controllers/AdminController.js';
import { authMiddleware, adminOnly } from './middleware.js';

const router = express.Router();

// Initialize controllers
const authController = new AuthController();
const paymentController = new PaymentController();
const dashboardController = new DashboardController();
const expenseController = new ExpenseController();
const adminController = new AdminController();

// Public routes
router.post('/auth/login', (req, res) => authController.login(req, res));
router.post('/auth/register', (req, res) => authController.register(req, res));

// Public dashboard routes (no auth required for read-only access)
router.get('/dashboard/property/search', (req, res) => dashboardController.searchProperty(req, res));
router.get('/dashboard/overview/:block/:number', (req, res) => dashboardController.getOverview(req, res));
router.get('/dashboard/detail/:block/:number', (req, res) => dashboardController.getDetailHistory(req, res));
router.get('/dashboard/financial', (req, res) => dashboardController.getFinancialSummary(req, res));

// Protected routes (require authentication)
router.use(authMiddleware);

// User profile
router.get('/auth/profile', (req, res) => authController.getProfile(req, res));

// Payment routes (warga)
router.post('/payments', (req, res) => paymentController.submitPayment(req, res));
router.get('/payments/my', (req, res) => paymentController.getUserPayments(req, res));

// Admin-only routes
router.use(adminOnly);

// Payment verification
router.get('/admin/payments/pending', (req, res) => paymentController.getPendingPayments(req, res));
router.put('/admin/payments/:id/verify', (req, res) => paymentController.verifyPayment(req, res));

// Expense management
router.post('/admin/expenses', (req, res) => expenseController.addExpense(req, res));
router.put('/admin/expenses/:id', (req, res) => expenseController.updateExpense(req, res));
router.delete('/admin/expenses/:id', (req, res) => expenseController.deleteExpense(req, res));
router.get('/admin/expenses', (req, res) => expenseController.getExpenses(req, res));

// Expense recipient management
router.post('/admin/recipients', (req, res) => expenseController.addRecipient(req, res));
router.put('/admin/recipients/:id', (req, res) => expenseController.updateRecipient(req, res));
router.delete('/admin/recipients/:id', (req, res) => expenseController.deleteRecipient(req, res));
router.get('/admin/recipients', (req, res) => expenseController.getRecipients(req, res));

// Tariff management
router.post('/admin/tariffs', (req, res) => adminController.addTariff(req, res));
router.put('/admin/tariffs/:id', (req, res) => adminController.updateTariff(req, res));
router.delete('/admin/tariffs/:id', (req, res) => adminController.deleteTariff(req, res));
router.get('/admin/tariffs', (req, res) => adminController.getTariffs(req, res));

// Property management
router.get('/admin/properties', (req, res) => adminController.getAllProperties(req, res));
router.put('/admin/properties/:id/owner', (req, res) => adminController.updatePropertyOwner(req, res));
router.put('/admin/properties/:id/type', (req, res) => adminController.updatePropertyType(req, res));

// User management
router.put('/admin/users/:userId/profile', (req, res) => adminController.updateUserProfile(req, res));
router.get('/admin/users/:userId/audit', (req, res) => adminController.getUserAuditHistory(req, res));

export default router;
