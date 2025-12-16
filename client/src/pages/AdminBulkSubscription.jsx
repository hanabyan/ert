import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Select, Space, Tag, DatePicker, Alert, Flex, Typography } from 'antd';
import { CheckCircleOutlined, StopOutlined, AppstoreOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { componentService, adminService } from '../services/api';
import { useMessage } from '../contexts/MessageContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function AdminBulkSubscription() {
    const { message } = useMessage();
    const [properties, setProperties] = useState([]);
    const [components, setComponents] = useState([]);
    const [activeSubscriptions, setActiveSubscriptions] = useState([]);
    const [selectedComponentId, setSelectedComponentId] = useState(null);
    const [selectedPropertyIds, setSelectedPropertyIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [filterBlock, setFilterBlock] = useState('all');
    const [startDate, setStartDate] = useState(dayjs());
    const [endDate, setEndDate] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [propsData, compsData, subsData] = await Promise.all([
                adminService.getProperties(),
                componentService.getComponents(),
                componentService.getAllActiveSubscriptions()
            ]);
            setProperties(propsData);
            setComponents(compsData);
            setActiveSubscriptions(subsData);
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAction = async (action) => {
        if (!selectedComponentId) {
            message.warning('Pilih komponen terlebih dahulu');
            return;
        }
        if (selectedPropertyIds.length === 0) {
            message.warning('Pilih minimal satu properti');
            return;
        }

        setProcessing(true);
        try {
            const result = await componentService.bulkSubscribe(
                selectedPropertyIds,
                parseInt(selectedComponentId),
                action,
                startDate ? startDate.format('YYYY-MM-DD') : null,
                endDate ? endDate.format('YYYY-MM-DD') : null
            );

            message.success(
                `Berhasil ${action === 'assign' ? 'menambahkan' : 'menghapus'} langganan. Diproses: ${result.processed}`
            );
            
            // Refresh subscriptions
            const subsData = await componentService.getAllActiveSubscriptions();
            setActiveSubscriptions(subsData);
            setSelectedPropertyIds([]);
        } catch (error) {
            message.error(error.response?.data?.error || 'Operasi gagal');
        } finally {
            setProcessing(false);
        }
    };

    const hasSubscription = (propertyId, componentId) => {
        if (!componentId) return false;
        return activeSubscriptions.some(
            sub => sub.property_id === propertyId && sub.component_id === parseInt(componentId)
        );
    };

    const filteredProperties = filterBlock === 'all' 
        ? properties 
        : properties.filter(p => p.block === filterBlock);

    const rowSelection = {
        selectedRowKeys: selectedPropertyIds,
        onChange: (selectedRowKeys) => {
            setSelectedPropertyIds(selectedRowKeys);
        },
        getCheckboxProps: (record) => ({
            name: record.id,
        }),
    };

    const columns = [
        {
            title: 'Block',
            dataIndex: 'block',
            key: 'block',
            width: 80,
            sorter: (a, b) => a.block.localeCompare(b.block),
        },
        {
            title: 'Nomor',
            dataIndex: 'number',
            key: 'number',
            width: 80,
            sorter: (a, b) => a.number - b.number,
        },
        {
            title: 'Tipe',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (type) => (
                <Tag color={type === 'rumah' ? 'blue' : 'green'}>
                    {type?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Pemilik',
            dataIndex: 'owner_name',
            key: 'owner_name',
            render: (name) => name || '-',
        },
        {
            title: 'Status Langganan',
            key: 'subscription',
            width: 150,
            align: 'center',
            render: (_, record) => {
                if (!selectedComponentId) {
                    return <Text type="secondary">-</Text>;
                }
                const isSubscribed = hasSubscription(record.id, selectedComponentId);
                return isSubscribed ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                        Aktif
                    </Tag>
                ) : (
                    <Tag icon={<CloseCircleOutlined />} color="default">
                        Tidak Aktif
                    </Tag>
                );
            },
        },
    ];

    const selectedComponent = components.find(c => c.id === parseInt(selectedComponentId));

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <div style={{ marginBottom: 24 }}>
                    <Title level={3}>
                        <AppstoreOutlined /> Kelola Langganan Komponen
                    </Title>
                    <Text type="secondary">
                        Kelola langganan komponen untuk properti secara massal
                    </Text>
                </div>

                {/* Control Panel */}
                <Card 
                    type="inner" 
                    title="Panel Kontrol"
                    style={{ marginBottom: 24 }}
                >
                    <Space orientation="vertical" style={{ width: '100%' }} size="large">
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                    Komponen Target
                                </Text>
                                <Select
                                    placeholder="Pilih Komponen"
                                    style={{ width: '100%' }}
                                    value={selectedComponentId}
                                    onChange={setSelectedComponentId}
                                    size="large"
                                >
                                    {components.map(c => (
                                        <Option key={c.id} value={c.id}>
                                            {c.name}
                                        </Option>
                                    ))}
                                </Select>
                            </div>

                            <div style={{ flex: 1, minWidth: 200 }}>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                    Filter Blok
                                </Text>
                                <Select
                                    placeholder="Pilih Blok"
                                    style={{ width: '100%' }}
                                    value={filterBlock}
                                    onChange={setFilterBlock}
                                    size="large"
                                >
                                    <Option value="all">Semua Blok</Option>
                                    <Option value="A">Blok A</Option>
                                    <Option value="B">Blok B</Option>
                                    <Option value="C">Blok C</Option>
                                    <Option value="D">Blok D</Option>
                                    <Option value="E">Blok E</Option>
                                </Select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                    Tanggal Mulai <Text type="danger">*</Text>
                                </Text>
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="DD MMM YYYY"
                                    value={startDate}
                                    onChange={setStartDate}
                                    size="large"
                                    placeholder="Pilih tanggal mulai"
                                />
                            </div>

                            <div style={{ flex: 1, minWidth: 200 }}>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                    Tanggal Berakhir <Text type="secondary">(Opsional)</Text>
                                </Text>
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="DD MMM YYYY"
                                    value={endDate}
                                    onChange={setEndDate}
                                    size="large"
                                    placeholder="Kosongkan untuk selamanya"
                                    disabledDate={(current) => {
                                        return startDate && current && current < startDate;
                                    }}
                                />
                            </div>
                        </div>

                        {selectedComponent && (
                            <Alert
                                title={`Komponen Terpilih: ${selectedComponent.name}`}
                                description={selectedComponent.description}
                                type="info"
                                showIcon
                            />
                        )}

                        <Space>
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleBulkAction('assign')}
                                disabled={processing || !selectedComponentId}
                                loading={processing}
                            >
                                Tambahkan ke Properti Terpilih
                            </Button>
                            <Button
                                danger
                                icon={<CloseCircleOutlined />}
                                onClick={() => handleBulkAction('remove')}
                                disabled={processing || !selectedComponentId}
                                loading={processing}
                            >
                                Hapus dari Properti Terpilih
                            </Button>
                            <Text type="secondary">
                                {selectedPropertyIds.length} properti terpilih
                            </Text>
                        </Space>
                    </Space>
                </Card>

                {/* Property Table */}
                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={filteredProperties}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} properti`,
                    }}
                    scroll={{ x: 800 }}
                />
            </Card>
        </div>
    );
}
