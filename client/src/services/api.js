import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth Service
export const authService = {
    login: async (username, password) => {
        const { data } = await api.post('/auth/login', { username, password });
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },

    register: async (userData) => {
        const { data } = await api.post('/auth/register', userData);
        return data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    getProfile: async () => {
        const { data } = await api.get('/auth/profile');
        return data;
    }
};

// Dashboard Service (Public)
export const dashboardService = {
    searchProperty: async (block, number) => {
        const { data } = await api.get('/dashboard/property/search', {
            params: { block, number }
        });
        return data;
    },

    getOverview: async (block, number, startMonth, startYear) => {
        const { data } = await api.get(`/dashboard/overview/${block}/${number}`, {
            params: { startMonth, startYear }
        });
        return data;
    },

    getDetailHistory: async (block, number, year, status = 'all') => {
        const { data } = await api.get(`/dashboard/detail/${block}/${number}`, {
            params: { year, status }
        });
        return data;
    },

    getFinancialSummary: async (year, month) => {
        const { data } = await api.get('/dashboard/financial', {
            params: { year, month }
        });
        return data;
    }
};

// Payment Service
export const paymentService = {
    submitPayment: async (paymentItems, proofImage) => {
        const { data } = await api.post('/payments', { paymentItems, proofImage });
        return data;
    },

    getMyPayments: async () => {
        const { data } = await api.get('/payments/my');
        return data;
    }
};

// Admin Services
export const adminService = {
    // Payments
    getPendingPayments: async () => {
        const { data } = await api.get('/admin/payments/pending');
        return data;
    },

    verifyPayment: async (id, status) => {
        const { data } = await api.put(`/admin/payments/${id}/verify`, { status });
        return data;
    },

    // Expenses
    getExpenses: async (startDate, endDate) => {
        const { data } = await api.get('/admin/expenses', {
            params: { startDate, endDate }
        });
        return data;
    },

    addExpense: async (expense) => {
        const { data } = await api.post('/admin/expenses', expense);
        return data;
    },

    updateExpense: async (id, expense) => {
        const { data } = await api.put(`/admin/expenses/${id}`, expense);
        return data;
    },

    deleteExpense: async (id) => {
        const { data } = await api.delete(`/admin/expenses/${id}`);
        return data;
    },

    // Recipients
    getRecipients: async () => {
        const { data } = await api.get('/admin/recipients');
        return data;
    },

    addRecipient: async (recipient) => {
        const { data } = await api.post('/admin/recipients', recipient);
        return data;
    },

    updateRecipient: async (id, recipient) => {
        const { data } = await api.put(`/admin/recipients/${id}`, recipient);
        return data;
    },

    deleteRecipient: async (id) => {
        const { data } = await api.delete(`/admin/recipients/${id}`);
        return data;
    },

    // Tariffs
    getTariffs: async () => {
        const { data } = await api.get('/admin/tariffs');
        return data;
    },

    addTariff: async (tariff) => {
        const { data } = await api.post('/admin/tariffs', tariff);
        return data;
    },

    updateTariff: async (id, tariff) => {
        const { data } = await api.put(`/admin/tariffs/${id}`, tariff);
        return data;
    },

    deleteTariff: async (id) => {
        const { data } = await api.delete(`/admin/tariffs/${id}`);
        return data;
    },

    // Properties
    getProperties: async () => {
        const { data } = await api.get('/admin/properties');
        return data;
    },

    updatePropertyOwner: async (id, ownerId) => {
        const { data } = await api.put(`/admin/properties/${id}/owner`, { ownerId });
        return data;
    },

    updatePropertyType: async (id, type) => {
        const { data } = await api.put(`/admin/properties/${id}/type`, { type });
        return data;
    }
};

export default api;
