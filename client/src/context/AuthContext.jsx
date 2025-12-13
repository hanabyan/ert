import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const data = await authService.login(username, password);
        setUser(data.user);
        return data;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const register = async (userData) => {
        return await authService.register(userData);
    };

    const value = {
        user,
        login,
        logout,
        register,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin'
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
