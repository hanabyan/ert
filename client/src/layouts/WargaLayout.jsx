import React from 'react';
import { Link, useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Button, Typography } from 'antd';
import { 
    HomeOutlined, ShoppingCartOutlined, BarChartOutlined, 
    UserOutlined, LogoutOutlined, AppstoreOutlined, DollarOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import Dashboard from '../pages/Dashboard';
import BatchPayment from '../pages/BatchPayment';
import FinancialSummary from '../pages/FinancialSummary';
import ComponentSubscription from '../pages/ComponentSubscription';
import UserProfile from '../pages/UserProfile';

const { Sider, Header, Content } = Layout;
const { Title } = Typography;

export default function WargaLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getSelectedKey = () => {
        if (location.pathname === '/warga/dashboard') return '1';
        if (location.pathname === '/warga/payment') return '2-1';
        if (location.pathname === '/warga/components') return '2-2';
        if (location.pathname === '/warga/financial') return '3';
        if (location.pathname === '/warga/profile') return '4';
        return '1';
    };

    const menuItems = [
        {
            key: '1',
            icon: <HomeOutlined />,
            label: <Link to="/warga/dashboard">Dashboard</Link>,
        },
        {
            key: '2',
            icon: <ShoppingCartOutlined />,
            label: 'Iuran Saya',
            children: [
                {
                    key: '2-1',
                    icon: <DollarOutlined />,
                    label: <Link to="/warga/payment">Bayar Iuran</Link>,
                },
                {
                    key: '2-2',
                    icon: <AppstoreOutlined />,
                    label: <Link to="/warga/components">Opsi Layanan</Link>,
                },
            ],
        },
        {
            key: '3',
            icon: <BarChartOutlined />,
            label: <Link to="/warga/financial">Transparansi Keuangan</Link>,
        },
        {
            key: '4',
            icon: <UserOutlined />,
            label: <Link to="/warga/profile">Profil Saya</Link>,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider theme="light" width={250} breakpoint="lg" collapsedWidth="0">
                <div style={{ padding: '16px', textAlign: 'center' }}>
                    <Title level={4}><HomeOutlined /> Iuran Warga</Title>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    items={menuItems}
                />
            </Sider>
            <Layout>
                <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={4} style={{ color: '#fff', margin: 0 }}>Portal Warga</Title>
                    <Button icon={<LogoutOutlined />} onClick={handleLogout}>
                        Logout
                    </Button>
                </Header>
                <Content style={{ margin: '24px' }}>
                    <Routes>
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="payment" element={<BatchPayment />} />
                        <Route path="financial" element={<FinancialSummary />} />
                        <Route path="components" element={<ComponentSubscription />} />
                        <Route path="profile" element={<UserProfile />} />
                        <Route path="/" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                </Content>
            </Layout>
        </Layout>
    );
}
