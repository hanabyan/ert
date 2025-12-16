import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MessageProvider } from './contexts/MessageContext';
import { Layout, Menu, Button, Typography } from 'antd';
import {
    HomeOutlined, DollarOutlined, LogoutOutlined, SettingOutlined, WalletOutlined,
    CheckCircleOutlined, BarChartOutlined, DollarCircleOutlined, TeamOutlined, UserOutlined,
    AppstoreOutlined
} from '@ant-design/icons';

// Import layouts
import PublicLayout from './layouts/PublicLayout';
import WargaLayout from './layouts/WargaLayout';

// Import pages
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import AdminPaymentVerification from './pages/AdminPaymentVerification';
import AdminExpenses from './pages/AdminExpenses';
import FinancialSummary from './pages/FinancialSummary';
import BatchPayment from './pages/BatchPayment';
import AdminTariffs from './pages/AdminTariffs';
import AdminRecipients from './pages/AdminRecipients';
import AdminProperties from './pages/AdminProperties';
import WargaDetail from './pages/WargaDetail';
import UserProfile from './pages/UserProfile';
import AdminUsers from './pages/AdminUsers';
import AdminAddPayment from './pages/AdminAddPayment';
import AdminComponentApproval from './pages/AdminComponentApproval';
import AdminComponents from './pages/AdminComponents';
import AdminBulkSubscription from './pages/AdminBulkSubscription';

const { Sider, Header, Content } = Layout;
const { Title } = Typography;

// Admin Dashboard Layout
function AdminDashboard() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getSelectedKey = () => {
        if (location.pathname === '/admin/verify') return '1';
        if (location.pathname === '/admin/expenses') return '2';
        if (location.pathname === '/admin/financial') return '3';
        if (location.pathname === '/admin/add-payment') return '4';
        if (location.pathname === '/admin/component-requests') return '5';
        if (location.pathname === '/admin/tariffs') return 'settings-1';
        if (location.pathname === '/admin/components') return 'settings-5';
        if (location.pathname === '/admin/subscriptions') return 'settings-6';
        if (location.pathname === '/admin/recipients') return 'settings-2';
        if (location.pathname === '/admin/properties') return 'settings-3';
        if (location.pathname === '/admin/users') return 'settings-4';
        return '1';
    };

    const menuItems = [
        {
            key: '1',
            icon: <CheckCircleOutlined />,
            label: <Link to="/admin/verify">Verifikasi Pembayaran</Link>,
        },
        {
            key: '2',
            icon: <DollarOutlined />,
            label: <Link to="/admin/expenses">Kelola Pengeluaran</Link>,
        },
        {
            key: '3',
            icon: <BarChartOutlined />,
            label: <Link to="/admin/financial">Laporan Keuangan</Link>,
        },
        {
            key: '4',
            icon: <WalletOutlined />,
            label: <Link to="/admin/add-payment">Tambah Pembayaran</Link>,
        },
        {
            key: '5',
            icon: <CheckCircleOutlined />,
            label: <Link to="/admin/component-requests">Approval Komponen</Link>,
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Pengaturan',
            children: [
                {
                    key: 'settings-1',
                    icon: <DollarCircleOutlined />,
                    label: <Link to="/admin/tariffs">Kelola Tarif Dasar</Link>,
                },
                {
                    key: 'settings-5',
                    icon: <AppstoreOutlined />,
                    label: <Link to="/admin/components">Kelola Tarif Opsi Layanan</Link>,
                },
                {
                    key: 'settings-6',
                    icon: <AppstoreOutlined />,
                    label: <Link to="/admin/subscriptions">Kelola Langganan</Link>,
                },
                {
                    key: 'settings-2',
                    icon: <TeamOutlined />,
                    label: <Link to="/admin/recipients">Kelola Penerima Pengeluaran</Link>,
                },
                {
                    key: 'settings-3',
                    icon: <HomeOutlined />,
                    label: <Link to="/admin/properties">Kelola Properti</Link>,
                },
                {
                    key: 'settings-4',
                    icon: <UserOutlined />,
                    label: <Link to="/admin/users">Kelola Pengguna</Link>,
                },
            ],
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider theme="dark" width={250} breakpoint="lg" collapsedWidth="0">
                <div style={{ padding: '16px', textAlign: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}><HomeOutlined /> Admin Panel</Title>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    items={menuItems}
                />
            </Sider>
            <Layout>
                <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={4} style={{ color: '#fff', margin: 0 }}>Dashboard Admin</Title>
                    <Button icon={<LogoutOutlined />} onClick={handleLogout}>
                        Logout
                    </Button>
                </Header>
                <Content style={{ margin: '24px' }}>
                    <Routes>
                        <Route path="verify" element={<AdminPaymentVerification />} />
                        <Route path="expenses" element={<AdminExpenses />} />
                        <Route path="financial" element={<FinancialSummary />} />
                        <Route path="add-payment" element={<AdminAddPayment />} />
                        <Route path="component-requests" element={<AdminComponentApproval />} />
                        <Route path="tariffs" element={<AdminTariffs />} />
                        <Route path="components" element={<AdminComponents />} />
                        <Route path="subscriptions" element={<AdminBulkSubscription />} />
                        <Route path="recipients" element={<AdminRecipients />} />
                        <Route path="properties" element={<AdminProperties />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="/" element={<Navigate to="verify" replace />} />
                    </Routes>
                </Content>
            </Layout>
        </Layout>
    );
}

// Main App Content with Routing
function AppContent() {
    const { isAuthenticated, user } = useAuth();

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={
                <PublicLayout>
                    <Content style={{ margin: '24px' }}>
                        <Dashboard />
                    </Content>
                </PublicLayout>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/history/:block/:number" element={
                <PublicLayout>
                    <WargaDetail />
                </PublicLayout>
            } />
            <Route path="/payment" element={
                <PublicLayout>
                    <BatchPayment />
                </PublicLayout>
            } />
            <Route path="/financial" element={
                <PublicLayout>
                    <FinancialSummary />
                </PublicLayout>
            } />
            <Route path="/profile" element={
                <PublicLayout>
                    <UserProfile />
                </PublicLayout>
            } />

            {/* Admin Routes */}
            <Route path="/admin/*" element={
                isAuthenticated && user?.role === 'admin' ? (
                    <AdminDashboard />
                ) : (
                    <Navigate to="/login" replace />
                )
            } />

            {/* Warga Routes */}
            <Route path="/warga/*" element={
                isAuthenticated && user?.role === 'warga' ? (
                    <WargaLayout />
                ) : (
                    <Navigate to="/login" replace />
                )
            } />
        </Routes>
    );
}

// Main App Component
function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <MessageProvider>
                    <AppContent />
                </MessageProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
