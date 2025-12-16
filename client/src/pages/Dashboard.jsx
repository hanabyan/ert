import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout, Card, Input, Table, Tag, Button, Row, Col, Statistic, Space, Typography, Tabs } from 'antd';
import { 
    HomeOutlined, SearchOutlined, CheckCircleOutlined, FileTextOutlined,
    LeftOutlined, RightOutlined 
} from '@ant-design/icons';
import { dashboardService } from '../services/api';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;

// Landing Page Component - Shows 6-month payment grid
export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [currentPeriod, setCurrentPeriod] = useState({ month: null, year: null });
    const [activeTab, setActiveTab] = useState('rutin');

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

    // Create columns for REGULAR tariffs table
    const regularColumns = [
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

    // Create columns for INCIDENTAL tariffs table
    // TODO: This will be populated with dynamic incidental tariff columns from backend
    const incidentalColumns = [
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
        // Dynamic incidental tariff columns will be added here
        // Example: Sumbangan 17 Agustus, Renovasi Pos Satpam, etc.
        {
            title: 'Sumbangan 17 Agustus',
            key: 'incidental-1',
            width: 150,
            align: 'center',
            render: () => (
                <div style={{
                    padding: '8px 4px',
                    borderRadius: '4px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #d9d9d9'
                }}>
                    <div style={{ fontSize: 11, color: '#999' }}>
                        Belum ada data
                    </div>
                </div>
            ),
        },
        {
            title: 'Total',
            key: 'total',
            width: 120,
            render: () => (
                <Tag>Rp 0</Tag>
            ),
        },
    ];

    // Calculate summary stats
    const totalProperties = properties.length;
    const fullyPaidCount = properties.filter(p => p.status === 'lunas').length;
    const partiallyPaidCount = properties.filter(p => p.status === 'belum_lunas' && p.paidMonths > 0).length;
    const totalDebt = properties.reduce((sum, p) => sum + (p.totalDebtFromBast || 0), 0);

    const tabItems = [
        {
            key: 'rutin',
            label: (
                <span>
                    <HomeOutlined /> Iuran Rutin
                </span>
            ),
            children: (
                <>
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
                        placeholder="Cari berdasarkan blok atau nomor ..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ marginBottom: 16 }}
                        size="large"
                    />

                    {/* Period Navigation */}
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                            Status pembayaran 6 bulan: {getMonthName(period.startMonth)} {period.startYear} - {getMonthName(period.endMonth)} {period.endYear}
                        </Text>
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

                    {/* Properties Table with 6-month grid */}
                    <Table
                        columns={regularColumns}
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
                </>
            ),
        },
        {
            key: 'insidentil',
            label: (
                <span>
                    <FileTextOutlined /> Iuran Insidentil
                </span>
            ),
            children: (
                <>
                    {/* Search Bar */}
                    <Input
                        placeholder="Cari berdasarkan blok atau nomor ..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ marginBottom: 16 }}
                        size="large"
                    />

                    <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 4, border: '1px solid #91d5ff' }}>
                        <Text type="secondary">
                            <strong>Info:</strong> Halaman ini menampilkan iuran insidentil/non-rutin seperti sumbangan, renovasi, dll.
                            Data akan ditampilkan setelah admin menambahkan tarif insidentil.
                        </Text>
                    </div>

                    {/* Incidental Tariffs Table */}
                    <Table
                        columns={incidentalColumns}
                        dataSource={filteredProperties}
                        rowKey="id"
                        loading={loading}
                        scroll={{ x: 800 }}
                        pagination={{
                            pageSize: 20,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} properti`,
                        }}
                        size="small"
                    />
                </>
            ),
        },
    ];

    return (
        <Content style={{ padding: '50px', maxWidth: 1600, margin: '0 auto' }}>
            <Card>
                <div style={{ marginBottom: 24 }}>
                    <Title level={2} style={{ textAlign: 'center', marginBottom: 10 }}>
                        <HomeOutlined /> Daftar Iuran Pemeliharaan Lingkungan
                    </Title>
                </div>

                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    size="large"
                />
            </Card>
        </Content>
    );
}
