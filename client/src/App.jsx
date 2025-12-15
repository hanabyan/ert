import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout, Card, Form, Select, Input, Button, Table, Tag, Alert, Space, Typography, Statistic, Row, Col, Menu } from 'antd';
import {
    SearchOutlined, HomeOutlined, DollarOutlined, LogoutOutlined, LoginOutlined,
    FileTextOutlined, SettingOutlined, WalletOutlined, ShoppingCartOutlined,
    CheckCircleOutlined, BarChartOutlined, DollarCircleOutlined, TeamOutlined, UserOutlined,
    LeftOutlined, RightOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { dashboardService } from './services/api';

// Import pages
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

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// Landing Page Component - Shows 6-month payment grid
function LandingPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [currentPeriod, setCurrentPeriod] = useState({ month: null, year: null });

    useEffect(() => {
        fetchAllProperties();
    }, [currentPeriod.month, currentPeriod.year]);

    const fetchAllProperties = async () => {
        setLoading(true);
        try {
            const result = await dashboardService.getAllPropertiesWithStatus(
                currentPeriod.month,
                currentPeriod.year
            );
            setData(result);
        } catch (err) {
            console.error('Failed to load properties:', err);
        } finally {
            setLoading(false);
        }
    };

    const navigatePeriod = (direction) => {
        if (!data) return;
        
        const { startMonth, startYear } = data.period;
        let newMonth = startMonth;
        let newYear = startYear;

        if (direction === 'prev') {
            // Go back 6 months
            newMonth -= 6;
            if (newMonth <= 0) {
                newMonth += 12;
                newYear--;
            }
        } else if (direction === 'next') {
            // Go forward 6 months
            newMonth += 6;
            if (newMonth > 12) {
                newMonth -= 12;
                newYear++;
            }
        }

        setCurrentPeriod({ month: newMonth, year: newYear });
    };

    if (!data) {
        return <Content style={{ padding: '50px', textAlign: 'center' }}>Loading...</Content>;
    }

    const { properties, period } = data;

    // Filter properties based on search
    const filteredProperties = properties.filter(prop => {
        const searchLower = searchText.toLowerCase();
        return (
            prop.block.toLowerCase().includes(searchLower) ||
            prop.number.toString().includes(searchLower) ||
            prop.address.toLowerCase().includes(searchLower)
        );
    });

    // Month name helper
    const getMonthName = (month) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return months[month - 1];
    };

    // Create columns for the table
    const columns = [
        {
            title: 'Blok',
            dataIndex: 'block',
            key: 'block',
            width: 70,
            fixed: 'left',
            sorter: (a, b) => a.block.localeCompare(b.block),
        },
        {
            title: 'No',
            dataIndex: 'number',
            key: 'number',
            width: 60,
            fixed: 'left',
            sorter: (a, b) => a.number - b.number,
        },
        {
            title: 'Tgl BAST',
            dataIndex: 'bastDate',
            key: 'bastDate',
            width: 110,
            fixed: 'left',
            render: (bastDate) => bastDate ? dayjs(bastDate).format('DD/MM/YYYY') : <Tag>-</Tag>,
        },
        // Dynamic month columns
        ...period.months.map((monthData, index) => ({
            title: `${getMonthName(monthData.month)} ${monthData.year}`,
            key: `month-${index}`,
            width: 120,
            align: 'center',
            render: (_, record) => {
                const status = record.monthlyStatus[index];
                const isLunas = status.status === 'lunas';
                const isPending = status.status === 'menunggu_verifikasi';
                
                // Check if this month is before BAST date
                if (record.bastDate) {
                    const bastDate = new Date(record.bastDate);
                    const monthDate = new Date(monthData.year, monthData.month - 1, 1);
                    
                    // If month is before or same as BAST month, show N/A
                    if (monthDate <= bastDate) {
                        return (
                            <div style={{
                                padding: '8px 4px',
                                borderRadius: '4px',
                                backgroundColor: '#f5f5f5',
                                border: '1px solid #d9d9d9'
                            }}>
                                <div style={{ 
                                    fontSize: 12, 
                                    color: '#999',
                                    fontWeight: 'normal'
                                }}>
                                    -
                                </div>
                            </div>
                        );
                    }
                }
                
                // Determine background and border color
                let bgColor, borderColor, badgeColor, badgeText;
                if (isLunas) {
                    bgColor = '#f6ffed';
                    borderColor = '#b7eb8f';
                    badgeColor = 'success';
                    badgeText = 'Lunas';
                } else if (isPending) {
                    bgColor = '#fffbe6';
                    borderColor = '#ffe58f';
                    badgeColor = 'warning';
                    badgeText = 'Menunggu Verifikasi';
                } else {
                    bgColor = '#fff2f0';
                    borderColor = '#ffccc7';
                    badgeColor = 'error';
                    badgeText = 'Belum Lunas';
                }
                
                return (
                    <div style={{
                        padding: '8px 4px',
                        borderRadius: '4px',
                        backgroundColor: bgColor,
                        border: `1px solid ${borderColor}`
                    }}>
                        <div style={{ 
                            fontSize: 11, 
                            fontWeight: 'bold',
                            marginBottom: 4,
                            color: '#333'
                        }}>
                            Rp {status.expectedAmount.toLocaleString('id-ID')}
                        </div>
                        <Tag 
                            color={badgeColor}
                            style={{ margin: 0, fontSize: 10 }}
                        >
                            {badgeText}
                        </Tag>
                    </div>
                );
            },
        })),
        {
            title: 'Status',
            key: 'overall',
            width: 100,
            render: (_, record) => (
                <Tag color={record.status === 'lunas' ? 'success' : 'error'}>
                    {record.paidMonths}/{record.totalMonths}
                </Tag>
            ),
            filters: [
                { text: 'Lunas Semua', value: 'lunas' },
                { text: 'Ada Tunggakan', value: 'belum_lunas' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Tunggakan',
            dataIndex: 'totalDebtFromBast',
            key: 'totalDebtFromBast',
            width: 150,
            render: (debt, record) => {
                if (!record.bastDate) {
                    return <Tag>Belum BAST</Tag>;
                }
                return (
                    <div>
                        <div style={{ fontWeight: 'bold', color: debt > 0 ? '#cf1322' : '#3f8600' }}>
                            Rp {debt.toLocaleString('id-ID')}
                        </div>
                        {record.totalMonthsFromBast > 0 && (
                            <div style={{ fontSize: 11, color: '#888' }}>
                                {record.totalMonthsFromBast} bulan
                            </div>
                        )}
                    </div>
                );
            },
            sorter: (a, b) => (a.totalDebtFromBast || 0) - (b.totalDebtFromBast || 0),
        },
        {
            title: 'Aksi',
            key: 'action',
            width: 100,
            fixed: 'right',
            render: (_, record) => (
                <Link to={`/history/${record.block}/${record.number}`}>
                    <Button type="link" size="small" icon={<FileTextOutlined />}>
                        Detail
                    </Button>
                </Link>
            ),
        },
    ];

    // Calculate summary stats
    const totalProperties = properties.length;
    const fullyPaidCount = properties.filter(p => p.status === 'lunas').length;
    const partiallyPaidCount = properties.filter(p => p.status === 'belum_lunas' && p.paidMonths > 0).length;
    const totalDebt = properties.reduce((sum, p) => sum + (p.totalDebtFromBast || 0), 0);

    return (
        <Content style={{ padding: '50px', maxWidth: 1600, margin: '0 auto' }}>
            <Card>
                <div style={{ marginBottom: 24 }}>
                    <Title level={2} style={{ textAlign: 'center', marginBottom: 10 }}>
                        <HomeOutlined /> Daftar Properti Warga
                    </Title>
                    <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 20 }}>
                        Status pembayaran 6 bulan: {getMonthName(period.startMonth)} {period.startYear} - {getMonthName(period.endMonth)} {period.endYear}
                    </Text>

                    {/* Period Navigation */}
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <Space size="large">
                            <Button 
                                icon={<LeftOutlined />} 
                                onClick={() => navigatePeriod('prev')}
                            >
                                6 Bulan Sebelumnya
                            </Button>
                            <Button 
                                onClick={() => setCurrentPeriod({ month: null, year: null })}
                            >
                                Periode Saat Ini
                            </Button>
                            <Button 
                                onClick={() => navigatePeriod('next')}
                                icon={<RightOutlined />}
                                iconPlacement="end"
                            >
                                6 Bulan Berikutnya
                            </Button>
                        </Space>
                    </div>
                </div>

                {/* Summary Statistics */}
                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={6}>
                        <Card size="small">
                            <Statistic
                                title="Total Properti"
                                value={totalProperties}
                                prefix={<HomeOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card size="small">
                            <Statistic
                                title="Lunas Semua (6 Bulan)"
                                value={fullyPaidCount}
                                styles={{ value: { color: '#3f8600' } }}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card size="small">
                            <Statistic
                                title="Sebagian Lunas"
                                value={partiallyPaidCount}
                                styles={{ value: { color: '#faad14' } }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card size="small">
                            <Statistic
                                title="Total Tunggakan"
                                value={totalDebt}
                                prefix="Rp"
                                styles={{ value: { color: '#cf1322' } }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Search Bar */}
                <Input
                    placeholder="Cari berdasarkan blok, nomor, atau alamat..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ marginBottom: 16 }}
                    size="large"
                />

                {/* Properties Table with 6-month grid */}
                <Table
                    columns={columns}
                    dataSource={filteredProperties}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1200 }}
                    pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} properti`,
                    }}
                    size="small"
                />
            </Card>
        </Content>
    );
}

// Login Page
function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (values) => {
        setLoading(true);
        setError('');

        try {
            const data = await login(values.username, values.password);
            
            // Redirect based on role
            if (data.user.role === 'admin') {
                navigate('/admin/verify');
            } else {
                navigate('/warga/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Content style={{ padding: '50px', maxWidth: 400, margin: '0 auto' }}>
            <Card>
                <Title level={2} style={{ textAlign: 'center' }}>
                    <LoginOutlined /> Login
                </Title>
                
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[{ required: true, message: 'Masukkan username!' }]}
                    >
                        <Input size="large" />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[{ required: true, message: 'Masukkan password!' }]}
                    >
                        <Input.Password size="large" />
                    </Form.Item>

                    {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} size="large" block>
                            Login
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </Content>
    );
}

// Admin Dashboard Layout
function AdminDashboard() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const handleLogout = () => {
        logout();
        navigate('/');
    };
    
    // Determine selected menu key based on current path
    const getSelectedKey = () => {
        if (location.pathname.includes('/verify')) return '1';
        if (location.pathname.includes('/expenses')) return '2';
        if (location.pathname.includes('/financial')) return '3';
        if (location.pathname.includes('/add-payment')) return '4';
        if (location.pathname.includes('/tariffs')) return 'settings-1';
        if (location.pathname.includes('/recipients')) return 'settings-2';
        if (location.pathname.includes('/properties')) return 'settings-3';
        if (location.pathname.includes('/users')) return 'settings-4';
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
            icon: <FileTextOutlined />,
            label: <Link to="/admin/expenses">Kelola Pengeluaran</Link>,
        },
        {
            key: '3',
            icon: <BarChartOutlined />,
            label: <Link to="/admin/financial">Laporan Keuangan</Link>,
        },
        {
            key: '4',
            icon: <DollarOutlined />,
            label: <Link to="/admin/add-payment">Tambah Pembayaran</Link>,
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Pengaturan',
            children: [
                {
                    key: 'settings-1',
                    icon: <DollarCircleOutlined />,
                    label: <Link to="/admin/tariffs">Kelola Tarif</Link>,
                },
                {
                    key: 'settings-2',
                    icon: <TeamOutlined />,
                    label: <Link to="/admin/recipients">Kelola Penerima</Link>,
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
            <Sider theme="light" width={250}>
                <div style={{ padding: '16px', textAlign: 'center' }}>
                    <Title level={4}>Admin Panel</Title>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    items={menuItems}
                />
            </Sider>
            <Layout>
                <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}>Iuran Warga - Admin</Title>
                    <Button icon={<LogoutOutlined />} onClick={handleLogout}>
                        Logout
                    </Button>
                </Header>
                <Content style={{ margin: '24px' }}>
                    <Routes>
                        <Route path="verify" element={<AdminPaymentVerification />} />
                        <Route path="expenses" element={<AdminExpenses />} />
                        <Route path="financial" element={<FinancialSummary />} />
                        <Route path="tariffs" element={<AdminTariffs />} />
                        <Route path="recipients" element={<AdminRecipients />} />
                        <Route path="properties" element={<AdminProperties />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="add-payment" element={<AdminAddPayment />} />
                        <Route path="/" element={<Navigate to="verify" replace />} />
                    </Routes>
                </Content>
            </Layout>
        </Layout>
    );
}

// Public Layout
function PublicLayout({ children }) {
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

// Warga Layout with Sidebar
function WargaLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getSelectedKey = () => {
        if (location.pathname === '/warga/dashboard') return '1';
        if (location.pathname === '/warga/payment') return '2';
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
            label: <Link to="/warga/payment">Bayar Iuran</Link>,
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
                    <Title level={4} style={{ margin: 0 }}>Portal Warga</Title>
                    <Button icon={<LogoutOutlined />} onClick={handleLogout}>
                        Logout
                    </Button>
                </Header>
                <Content style={{ margin: '24px' }}>
                    <Routes>
                        <Route path="dashboard" element={<LandingPage />} />
                        <Route path="payment" element={<BatchPayment />} />
                        <Route path="financial" element={<FinancialSummary />} />
                        <Route path="profile" element={<UserProfile />} />
                        <Route path="/" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                </Content>
            </Layout>
        </Layout>
    );
}

// Main App Router
function AppContent() {
    const { isAuthenticated, isAdmin } = useAuth();

    return (
        <Routes>
            {/* Admin Routes */}
            {isAuthenticated && isAdmin ? (
                <Route path="/admin/*" element={<AdminDashboard />} />
            ) : null}

            {/* Warga Routes (Authenticated) */}
            {isAuthenticated && !isAdmin ? (
                <Route path="/warga/*" element={<WargaLayout />} />
            ) : null}

            {/* Public Routes */}
            <Route path="/" element={
                <PublicLayout>
                    <LandingPage />
                </PublicLayout>
            } />

            <Route path="/history/:block/:number" element={
                <PublicLayout>
                    <WargaDetail />
                </PublicLayout>
            } />
            
            <Route path="/login" element={<LoginPage />} />
            
            {/* Redirect authenticated users */}
            {isAuthenticated && isAdmin && (
                <Route path="*" element={<Navigate to="/admin/verify" replace />} />
            )}
            {isAuthenticated && !isAdmin && (
                <Route path="*" element={<Navigate to="/warga/dashboard" replace />} />
            )}
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
