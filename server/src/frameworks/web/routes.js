import express from 'express';
import multer from 'multer';
import path from 'path';
import { AuthController } from '../../adapters/controllers/AuthController.js';
import { PaymentController } from '../../adapters/controllers/PaymentController.js';
import { DashboardController } from '../../adapters/controllers/DashboardController.js';
import { ExpenseController } from '../../adapters/controllers/ExpenseController.js';
import { AdminController } from '../../adapters/controllers/AdminController.js';
import { UserController } from '../../adapters/controllers/UserController.js';
import { ComponentSubscriptionController } from '../../adapters/controllers/ComponentSubscriptionController.js';
import { authMiddleware, adminOnly } from './middleware.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Initialize controllers
const authController = new AuthController();
const paymentController = new PaymentController();
const dashboardController = new DashboardController();
const expenseController = new ExpenseController();
const adminController = new AdminController();
const userController = new UserController();
const componentController = new ComponentSubscriptionController();

// Public routes
router.post('/auth/login', (req, res) => authController.login(req, res));
router.post('/auth/register', (req, res) => authController.register(req, res));

// Public dashboard routes (no auth required for read-only access)
router.get('/dashboard/properties/all', (req, res) => dashboardController.getAllPropertiesWithStatus(req, res));
router.get('/dashboard/property/search', (req, res) => dashboardController.searchProperty(req, res));
router.get('/dashboard/overview/:block/:number', (req, res) => dashboardController.getOverview(req, res));
router.get('/dashboard/detail/:block/:number', (req, res) => dashboardController.getDetailHistory(req, res));
router.get('/dashboard/financial', (req, res) => dashboardController.getFinancialSummary(req, res));

// Public component route (for browsing available components)
router.get('/components/available', (req, res) => componentController.getAvailableComponents(req, res));

// Protected routes (require authentication)
router.use(authMiddleware);

// User profile
router.get('/auth/profile', (req, res) => authController.getProfile(req, res));
router.put('/auth/profile', (req, res) => authController.updateProfile(req, res));
router.post('/auth/change-password', (req, res) => authController.changePassword(req, res));
router.get('/auth/activity', (req, res) => authController.getActivity(req, res));

// Payment routes (warga)
router.post('/payments', (req, res) => paymentController.submitPayment(req, res));
router.get('/payments/my', (req, res) => paymentController.getUserPayments(req, res));

// User properties
router.get('/properties/my', (req, res) => userController.getMyProperties(req, res));

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

// Property-User relationship management
router.get('/admin/properties/:propertyId/users', (req, res) => adminController.getPropertyUsers(req, res));
router.post('/admin/properties/:propertyId/users', (req, res) => adminController.addPropertyUser(req, res));
router.put('/admin/property-users/:id', (req, res) => adminController.updatePropertyUser(req, res));
router.delete('/admin/property-users/:id', (req, res) => adminController.deletePropertyUser(req, res));

// User management
router.get('/admin/users', (req, res) => userController.getAllUsers(req, res));
router.post('/admin/users', (req, res) => userController.createUser(req, res));
router.put('/admin/users/:id', (req, res) => userController.updateUser(req, res));
router.delete('/admin/users/:id', (req, res) => userController.deleteUser(req, res));
router.put('/admin/users/:userId/profile', (req, res) => adminController.updateUserProfile(req, res));
router.get('/admin/users/:userId/audit', (req, res) => adminController.getUserAuditHistory(req, res));

// Admin create payment for user
router.post('/admin/payments/create', upload.single('proofImage'), (req, res) => adminController.createPaymentForUser(req, res));

// Component Subscription routes (Warga) - Requires authentication
router.post('/components/subscribe', (req, res) => componentController.requestSubscription(req, res));
router.post('/components/unsubscribe/:subscriptionId', (req, res) => componentController.requestUnsubscription(req, res));
router.get('/components/subscriptions/:propertyId', (req, res) => componentController.getMySubscriptions(req, res));

// Component Subscription routes (Admin)
router.get('/admin/component-requests/pending', adminOnly, (req, res) => componentController.getPendingRequests(req, res));
router.post('/admin/component-requests/:id/approve', adminOnly, (req, res) => componentController.approveRequest(req, res));
router.post('/admin/component-requests/:id/reject', adminOnly, (req, res) => componentController.rejectRequest(req, res));

// Component Management routes (Admin)
router.get('/admin/components', adminOnly, (req, res) => componentController.getAllComponents(req, res));
router.get('/admin/components/:id', adminOnly, (req, res) => componentController.getComponentWithRates(req, res));
router.post('/admin/components', adminOnly, (req, res) => componentController.addComponent(req, res));
router.put('/admin/components/:id', adminOnly, (req, res) => componentController.updateComponent(req, res));
router.post('/admin/component-rates', adminOnly, (req, res) => componentController.addComponentRate(req, res));
    router.put('/admin/component-rates/:id', adminOnly, (req, res) => componentController.updateComponentRate(req, res));

    // Bulk Subscription Management (Admin)
    router.post('/admin/component-subscriptions/bulk', adminOnly, (req, res) => componentController.bulkSubscribe(req, res));
    router.get('/admin/component-subscriptions/active', adminOnly, (req, res) => componentController.getAllActiveSubscriptions(req, res));

export default router;
