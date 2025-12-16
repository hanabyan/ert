import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Select, DatePicker, Space, Typography, Tag, Alert, Descriptions, Row, Col, Statistic } from 'antd';
import { AppstoreOutlined, PlusOutlined, StopOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { componentService, propertyService } from '../services/api';
import { useMessage } from '../contexts/MessageContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function ComponentSubscription() {
    const { message } = useMessage();
    const [components, setComponents] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [availableComponents, setAvailableComponents] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [subscribeModalVisible, setSubscribeModalVisible] = useState(false);
    const [unsubscribeModalVisible, setUnsubscribeModalVisible] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authCheckDone, setAuthCheckDone] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (authCheckDone && isAuthenticated) {
            loadProperties();
            loadAvailableComponents();
        }
    }, [authCheckDone, isAuthenticated]);

    useEffect(() => {
        if (selectedProperty && isAuthenticated) {
            loadSubscriptions();
        }
    }, [selectedProperty, isAuthenticated]);

    const checkAuth = () => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
        setAuthCheckDone(true);
    };

    const loadProperties = async () => {
        try {
            const data = await propertyService.getMyProperties();
            // Handle both array response and object with properties array
            const propertiesArray = Array.isArray(data) ? data : (data?.properties || []);
            setProperties(propertiesArray);
            if (propertiesArray.length > 0) {
                setSelectedProperty(propertiesArray[0].id);
            }
        } catch (error) {
            console.error('Error loading properties:', error);
            message.error('Gagal memuat properti');
            setProperties([]); // Set empty array on error
        }
    };

    const loadAvailableComponents = async () => {
        try {
            const data = await componentService.getAvailableComponents();
            setAvailableComponents(data);
        } catch (error) {
            console.error('Error loading components:', error);
            // Endpoint ini memerlukan autentikasi, jadi error 403 normal untuk guest
            // message.error('Gagal memuat komponen');
            setAvailableComponents([]);
        }
    };

    const loadSubscriptions = async () => {
        if (!selectedProperty || !isAuthenticated) return;
        
        setLoading(true);
        try {
            const data = await componentService.getMySubscriptions(selectedProperty);
            setSubscriptions(data);
        } catch (error) {
            console.error('Error loading subscriptions:', error);
            if (error.response?.status === 403) {
                // User not authenticated
                setIsAuthenticated(false);
            } else {
                message.error('Gagal memuat langganan');
            }
            setSubscriptions([]);
        } finally {
            setLoading(false);
        }
    };

    const showSubscribeModal = (component) => {
        setSelectedComponent(component);
        setStartDate(dayjs());
        setEndDate(null);
        setSubscribeModalVisible(true);
    };

    const handleSubscribe = async () => {
        if (!startDate) {
            message.warning('Tanggal mulai wajib diisi');
            return;
        }

        try {
            await componentService.subscribe({
                propertyId: selectedProperty,
                componentId: selectedComponent.id,
                startDate: startDate.format('YYYY-MM-DD'),
                endDate: endDate ? endDate.format('YYYY-MM-DD') : null,
            });

            message.success('Permintaan langganan berhasil diajukan. Menunggu approval admin.');
            setSubscribeModalVisible(false);
            loadSubscriptions();
        } catch (error) {
            message.error(error.response?.data?.error || 'Gagal mengajukan langganan');
        }
    };

    const showUnsubscribeModal = (subscription) => {
        setSelectedSubscription(subscription);
        setEndDate(dayjs());
        setUnsubscribeModalVisible(true);
    };

    const handleUnsubscribe = async () => {
        if (!endDate) {
            message.warning('Tanggal berhenti wajib diisi');
            return;
        }

        try {
            await componentService.unsubscribe(selectedSubscription.id, endDate.format('YYYY-MM-DD'));
            message.success('Permintaan berhenti langganan berhasil diajukan. Menunggu approval admin.');
            setUnsubscribeModalVisible(false);
            loadSubscriptions();
        } catch (error) {
            message.error(error.response?.data?.error || 'Gagal mengajukan berhenti langganan');
        }
    };

    const getStatusTag = (status) => {
        const statusConfig = {
            pending: { color: 'gold', icon: <ClockCircleOutlined />, text: 'Menunggu Approval' },
            active: { color: 'green', icon: <CheckCircleOutlined />, text: 'Aktif' },
            rejected: { color: 'red', icon: <CloseCircleOutlined />, text: 'Ditolak' },
            inactive: { color: 'gray', icon: <StopOutlined />, text: 'Tidak Aktif' },
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <Tag color={config.color} icon={config.icon}>
                {config.text}
            </Tag>
        );
    };

    const isComponentSubscribed = (componentId) => {
        return subscriptions.some(
            sub => sub.componentId === componentId && 
            (sub.status === 'active' || sub.status === 'pending')
        );
    };

    const subscriptionColumns = [
        {
            title: 'Komponen',
            dataIndex: 'component_name',
            key: 'component_name',
        },
        {
            title: 'Mulai',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (date) => dayjs(date).format('DD MMM YYYY'),
        },
        {
            title: 'Selesai',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (date) => date ? dayjs(date).format('DD MMM YYYY') : 'Selamanya',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => getStatusTag(status),
        },
        {
            title: 'Tanggal Request',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => dayjs(date).format('DD MMM YYYY'),
        },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                record.status === 'active' && !record.endDate ? (
                    <Button
                        danger
                        size="small"
                        icon={<StopOutlined />}
                        onClick={() => showUnsubscribeModal(record)}
                    >
                        Berhenti
                    </Button>
                ) : null
            ),
        },
    ];

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    const pendingSubscriptions = subscriptions.filter(s => s.status === 'pending');
    const selectedPropertyData = Array.isArray(properties) ? properties.find(p => p.id === selectedProperty) : null;

    return (
        <div>
            <Card>
                <Title level={3}>
                    <AppstoreOutlined /> Langganan Komponen Layanan
                </Title>
                <Text type="secondary">
                    Kelola langganan komponen layanan untuk properti Anda
                </Text>

                {!isAuthenticated && authCheckDone && (
                    <Alert
                        title="Login Diperlukan"
                        description="Anda perlu login untuk melihat dan mengelola langganan komponen. Silakan login terlebih dahulu."
                        type="warning"
                        showIcon
                        style={{ marginTop: 16, marginBottom: 16 }}
                    />
                )}

                {isAuthenticated && authCheckDone && properties.length === 0 && (
                    <Alert
                        title="Tidak Ada Properti"
                        description="Anda belum terhubung dengan properti manapun. Silakan hubungi admin untuk menghubungkan akun Anda dengan properti."
                        type="info"
                        showIcon
                        style={{ marginTop: 16, marginBottom: 16 }}
                    />
                )}

                <div style={{ marginTop: 24, marginBottom: 24 }}>
                    <Text strong>Pilih Properti:</Text>
                    <Select
                        style={{ width: 300, marginLeft: 16 }}
                        value={selectedProperty}
                        onChange={setSelectedProperty}
                    >
                        {properties.map(prop => (
                            <Option key={prop.id} value={prop.id}>
                                {prop.block}{prop.number} - {prop.type}
                            </Option>
                        ))}
                    </Select>
                </div>

                {selectedProperty && (
                    <>
                        {/* Summary Statistics */}
                        <Row gutter={16} style={{ marginBottom: 24 }}>
                            <Col span={8}>
                                <Card>
                                    <Statistic
                                        title="Komponen Aktif"
                                        value={activeSubscriptions.length}
                                        prefix={<CheckCircleOutlined />}
                                        styles={{ value: { color: '#3f8600' } }}
                                    />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card>
                                    <Statistic
                                        title="Menunggu Approval"
                                        value={pendingSubscriptions.length}
                                        prefix={<ClockCircleOutlined />}
                                        styles={{ value: { color: '#faad14' } }}
                                    />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card>
                                    <Statistic
                                        title="Komponen Tersedia"
                                        value={availableComponents.length}
                                        prefix={<AppstoreOutlined />}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        {/* Pending Requests Alert */}
                        {pendingSubscriptions.length > 0 && (
                            <Alert
                                title={`Anda memiliki ${pendingSubscriptions.length} permintaan yang menunggu approval admin`}
                                type="warning"
                                showIcon
                                style={{ marginBottom: 24 }}
                            />
                        )}

                        {/* Available Components */}
                        <Card title="Komponen Tersedia" style={{ marginBottom: 24 }}>
                            <Row gutter={[16, 16]}>
                                {availableComponents.map(component => {
                                    const subscribed = isComponentSubscribed(component.id);
                                    return (
                                        <Col span={8} key={component.id}>
                                            <Card
                                                hoverable={!subscribed}
                                                style={{
                                                    borderColor: subscribed ? '#52c41a' : undefined,
                                                }}
                                            >
                                                <Space orientation="vertical" style={{ width: '100%' }}>
                                                    <Text strong>{component.name}</Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {component.description}
                                                    </Text>
                                                    {subscribed ? (
                                                        <Tag color="green">Sudah Berlangganan</Tag>
                                                    ) : (
                                                        <Button
                                                            type="primary"
                                                            icon={<PlusOutlined />}
                                                            onClick={() => showSubscribeModal(component)}
                                                            block
                                                        >
                                                            Langganan
                                                        </Button>
                                                    )}
                                                </Space>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </Card>

                        {/* My Subscriptions */}
                        <Card title="Riwayat Langganan Saya">
                            <Table
                                columns={subscriptionColumns}
                                dataSource={subscriptions}
                                rowKey="id"
                                loading={loading}
                                pagination={{ pageSize: 10 }}
                                locale={{
                                    emptyText: 'Belum ada langganan'
                                }}
                            />
                        </Card>
                    </>
                )}
            </Card>

            {/* Subscribe Modal */}
            <Modal
                title={<><PlusOutlined /> Langganan Komponen</>}
                open={subscribeModalVisible}
                onOk={handleSubscribe}
                onCancel={() => setSubscribeModalVisible(false)}
                okText="Ajukan Langganan"
                cancelText="Batal"
            >
                {selectedComponent && (
                    <>
                        <Descriptions bordered column={1} style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Komponen">
                                <Text strong>{selectedComponent.name}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Deskripsi">
                                {selectedComponent.description}
                            </Descriptions.Item>
                            <Descriptions.Item label="Properti">
                                {selectedPropertyData?.block}{selectedPropertyData?.number}
                            </Descriptions.Item>
                        </Descriptions>

                        <Space orientation="vertical" style={{ width: '100%' }}>
                            <div>
                                <Text strong>Mulai Langganan: <Text type="danger">*</Text></Text>
                                <DatePicker
                                    style={{ width: '100%', marginTop: 8 }}
                                    value={startDate}
                                    onChange={setStartDate}
                                    format="DD MMM YYYY"
                                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                                />
                            </div>

                            <div>
                                <Text strong>Selesai Langganan (Opsional):</Text>
                                <DatePicker
                                    style={{ width: '100%', marginTop: 8 }}
                                    value={endDate}
                                    onChange={setEndDate}
                                    format="DD MMM YYYY"
                                    placeholder="Kosongkan jika tidak ada batas waktu"
                                    disabledDate={(current) => current && current <= (startDate || dayjs())}
                                />
                            </div>
                        </Space>

                        <Alert
                            title="Permintaan langganan akan diproses oleh admin"
                            description="Setelah disetujui, komponen akan aktif dan biaya akan ditambahkan ke iuran bulanan Anda."
                            type="info"
                            showIcon
                            style={{ marginTop: 16 }}
                        />
                    </>
                )}
            </Modal>

            {/* Unsubscribe Modal */}
            <Modal
                title={<><StopOutlined /> Berhenti Langganan</>}
                open={unsubscribeModalVisible}
                onOk={handleUnsubscribe}
                onCancel={() => setUnsubscribeModalVisible(false)}
                okText="Ajukan Berhenti"
                cancelText="Batal"
                okButtonProps={{ danger: true }}
            >
                {selectedSubscription && (
                    <>
                        <Alert
                            title="Perhatian"
                            description="Anda akan mengajukan berhenti langganan komponen ini."
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />

                        <Descriptions bordered column={1} style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Komponen">
                                {selectedSubscription.component_name}
                            </Descriptions.Item>
                            <Descriptions.Item label="Mulai Langganan">
                                {dayjs(selectedSubscription.startDate).format('DD MMMM YYYY')}
                            </Descriptions.Item>
                        </Descriptions>

                        <div>
                            <Text strong>Tanggal Berhenti: <Text type="danger">*</Text></Text>
                            <DatePicker
                                style={{ width: '100%', marginTop: 8 }}
                                value={endDate}
                                onChange={setEndDate}
                                format="DD MMM YYYY"
                                disabledDate={(current) => {
                                    const startDate = dayjs(selectedSubscription.startDate);
                                    return current && current <= startDate;
                                }}
                            />
                        </div>

                        <Alert
                            title="Permintaan akan diproses oleh admin"
                            description="Setelah disetujui, langganan akan berhenti pada tanggal yang ditentukan dan biaya tidak akan ditagihkan lagi."
                            type="info"
                            showIcon
                            style={{ marginTop: 16 }}
                        />
                    </>
                )}
            </Modal>
        </div>
    );
}
