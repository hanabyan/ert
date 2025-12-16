import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Button, Space, Typography } from 'antd';
import { 
    HomeOutlined, ShoppingCartOutlined, BarChartOutlined, 
    UserOutlined, LogoutOutlined, LoginOutlined 
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Header } = Layout;
const { Title } = Typography;

export default function PublicLayout({ children }) {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <Layout>
            <Header style={{ background: '#001529', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 50px' }}>
                <Link to="/">
                    <Title level={3} style={{ color: '#fff', margin: 0 }}>
                        <HomeOutlined /> Iuran Warga
                    </Title>
                </Link>
                <Space>
                    {isAuthenticated ? (
                        <>
                            <Link to="/payment">
                                <Button type="primary" icon={<ShoppingCartOutlined />}>
                                    Bayar Iuran
                                </Button>
                            </Link>
                            <Link to="/financial">
                                <Button icon={<BarChartOutlined />}>
                                    Transparansi Keuangan
                                </Button>
                            </Link>
                            <Link to="/profile">
                                <Button icon={<UserOutlined />}>
                                    Profil
                                </Button>
                            </Link>
                            <Button 
                                danger 
                                icon={<LogoutOutlined />}
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                        </>
                    ) : (
                        <Link to="/login">
                            <Button type="primary" icon={<LoginOutlined />}>
                                Login
                            </Button>
                        </Link>
                    )}
                </Space>
            </Header>
            {children}
        </Layout>
    );
}
