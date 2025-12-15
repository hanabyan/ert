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
            title: 'Tipe',
            dataIndex: 'type',
            key: 'type',
            width: 80,
            fixed: 'left',
            render: (type) => (
                <Tag color={type === 'rumah' ? 'blue' : 'green'} style={{ fontSize: 11 }}>
                    {type === 'rumah' ? 'Rumah' : 'Tanah'}
                </Tag>
            ),
            filters: [
                { text: 'Rumah', value: 'rumah' },
                { text: 'Tanah', value: 'tanah' },
            ],
            onFilter: (value, record) => record.type === value,
        },
        // Dynamic month columns
        ...period.months.map((monthData, index) => ({
            title: `${getMonthName(monthData.month)} ${monthData.year}`,
            key: `month-${index}`,
            width: 100,
            align: 'center',
            render: (_, record) => {
                const status = record.monthlyStatus[index];
                return (
                    <div style={{
                        padding: '4px',
                        borderRadius: '4px',
                        backgroundColor: status.status === 'lunas' ? '#f6ffed' : '#fff2f0',
                        border: `1px solid ${status.status === 'lunas' ? '#b7eb8f' : '#ffccc7'}`
                    }}>
                        <Tag 
                            color={status.status === 'lunas' ? 'success' : 'error'}
                            style={{ margin: 0, fontSize: 10 }}
                        >
                            {status.status === 'lunas' ? '✓' : '✗'}
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
            dataIndex: 'totalDebt',
            key: 'debt',
            width: 120,
            render: (debt) => (
                <Text type={debt > 0 ? 'danger' : 'success'} strong>
                    Rp {debt.toLocaleString('id-ID')}
                </Text>
            ),
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
    const unpaidCount = properties.filter(p => p.paidMonths === 0).length;
    const totalDebt = properties.reduce((sum, p) => sum + p.totalDebt, 0);

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
                                iconPosition="end"
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
                                valueStyle={{ color: '#3f8600' }}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card size="small">
                            <Statistic
                                title="Sebagian Lunas"
                                value={partiallyPaidCount}
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card size="small">
                            <Statistic
                                title="Total Tunggakan"
                                value={totalDebt}
                                prefix="Rp"
                                valueStyle={{ color: '#cf1322' }}
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
