import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Switch, Space, Typography, Tabs, DatePicker, InputNumber, Select, Tag, Popconfirm } from 'antd';
import { AppstoreOutlined, PlusOutlined, EditOutlined, DollarOutlined, DeleteOutlined } from '@ant-design/icons';
import { componentService } from '../services/api';
import { useMessage } from '../contexts/MessageContext';
import TableActionDropdown from '../components/TableActionDropdown';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function AdminComponents() {
    const { message } = useMessage();
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [componentModalVisible, setComponentModalVisible] = useState(false);
    const [rateModalVisible, setRateModalVisible] = useState(false);
    const [editRateModalVisible, setEditRateModalVisible] = useState(false);
    const [editingComponent, setEditingComponent] = useState(null);
    const [editingRate, setEditingRate] = useState(null);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [componentRates, setComponentRates] = useState([]);
    const [form] = Form.useForm();
    const [rateForm] = Form.useForm();
    const [editRateForm] = Form.useForm();

    useEffect(() => {
        loadComponents();
    }, []);

    const loadComponents = async () => {
        setLoading(true);
        try {
            const data = await componentService.getComponents();
            setComponents(data);
        } catch (error) {
            message.error('Gagal memuat komponen');
        } finally {
            setLoading(false);
        }
    };

    const showAddComponentModal = () => {
        setEditingComponent(null);
        form.resetFields();
        setComponentModalVisible(true);
    };

    const showEditComponentModal = (component) => {
        setEditingComponent(component);
        form.setFieldsValue({
            name: component.name,
            description: component.description,
            isActive: component.isActive,
        });
        setComponentModalVisible(true);
    };

    const handleSaveComponent = async () => {
        try {
            const values = await form.validateFields();
            
            if (editingComponent) {
                await componentService.updateComponent(editingComponent.id, values);
                message.success('Komponen berhasil diperbarui');
            } else {
                await componentService.addComponent(values);
                message.success('Komponen berhasil ditambahkan');
            }
            
            setComponentModalVisible(false);
            loadComponents();
        } catch (error) {
            if (error.errorFields) return;
            message.error(error.response?.data?.error || 'Gagal menyimpan komponen');
        }
    };

    const showRatesModal = async (component) => {
        setSelectedComponent(component);
        try {
            const data = await componentService.getComponentWithRates(component.id);
            setComponentRates(data.rates || []);
            setRateModalVisible(true);
        } catch (error) {
            message.error('Gagal memuat tarif komponen');
        }
    };

    const showAddRateModal = () => {
        rateForm.resetFields();
        rateForm.setFieldsValue({
            componentId: selectedComponent.id,
        });
    };

    const handleSaveRate = async () => {
        try {
            const values = await rateForm.validateFields();
            
            await componentService.addComponentRate({
                ...values,
                validFrom: values.validFrom.format('YYYY-MM-DD'),
                validTo: values.validTo ? values.validTo.format('YYYY-MM-DD') : null,
            });
            
            message.success('Tarif berhasil ditambahkan');
            rateForm.resetFields();
            
            // Reload rates
            const data = await componentService.getComponentWithRates(selectedComponent.id);
            setComponentRates(data.rates || []);
        } catch (error) {
            if (error.errorFields) return;
            message.error(error.response?.data?.error || 'Gagal menyimpan tarif');
        }
    };

    const showEditRateModal = (rate) => {
        setEditingRate(rate);
        editRateForm.setFieldsValue({
            amount: rate.amount,
            propertyType: rate.propertyType,
            validFrom: dayjs(rate.validFrom),
            validTo: rate.validTo ? dayjs(rate.validTo) : null,
        });
        setEditRateModalVisible(true);
    };

    const handleUpdateRate = async () => {
        try {
            const values = await editRateForm.validateFields();
            
            await componentService.updateComponentRate(editingRate.id, {
                ...values,
                validFrom: values.validFrom.format('YYYY-MM-DD'),
                validTo: values.validTo ? values.validTo.format('YYYY-MM-DD') : null,
            });
            
            message.success('Tarif berhasil diperbarui');
            setEditRateModalVisible(false);
            
            // Reload rates
            const data = await componentService.getComponentWithRates(selectedComponent.id);
            setComponentRates(data.rates || []);
        } catch (error) {
            if (error.errorFields) return;
            message.error(error.response?.data?.error || 'Gagal memperbarui tarif');
        }
    };

    const handleDeleteRate = async (rateId) => {
        try {
            await componentService.deleteComponentRate(rateId);
            message.success('Tarif berhasil dihapus');
            
            // Reload rates
            const data = await componentService.getComponentWithRates(selectedComponent.id);
            setComponentRates(data.rates || []);
        } catch (error) {
            message.error(error.response?.data?.error || 'Gagal menghapus tarif');
        }
    };

    const componentColumns = [
        {
            title: 'Nama Komponen',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Deskripsi',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'AKTIF' : 'NON-AKTIF'}
                </Tag>
            ),
        },
        {
            title: 'Aksi',
            key: 'action',
            width: 80,
            render: (_, record) => (
                <TableActionDropdown
                    items={[
                        {
                            key: 'rates',
                            label: 'Kelola Tarif',
                            icon: <DollarOutlined />,
                            onClick: () => showRatesModal(record),
                        },
                        {
                            key: 'edit',
                            label: 'Edit',
                            icon: <EditOutlined />,
                            onClick: () => showEditComponentModal(record),
                        },
                    ]}
                />
            ),
        },
    ];

    const rateColumns = [
        {
            title: 'Jumlah',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => `Rp ${parseFloat(amount).toLocaleString('id-ID')}`,
        },
        {
            title: 'Tipe Properti',
            dataIndex: 'propertyType',
            key: 'propertyType',
            render: (type) => (
                <Tag color={type === 'rumah' ? 'blue' : type === 'tanah' ? 'green' : 'purple'}>
                    {type === 'rumah' ? 'Rumah' : type === 'tanah' ? 'Tanah' : 'Semua'}
                </Tag>
            ),
        },
        {
            title: 'Berlaku Dari',
            dataIndex: 'validFrom',
            key: 'validFrom',
            render: (date) => dayjs(date).format('DD MMM YYYY'),
        },
        {
            title: 'Berlaku Sampai',
            dataIndex: 'validTo',
            key: 'validTo',
            render: (date) => date ? dayjs(date).format('DD MMM YYYY') : 'Selamanya',
        },
        {
            title: 'Aksi',
            key: 'action',
            width: 80,
            render: (_, record) => (
                <TableActionDropdown
                    items={[
                        {
                            key: 'edit',
                            label: 'Edit',
                            icon: <EditOutlined />,
                            onClick: () => showEditRateModal(record),
                        },
                        {
                            key: 'delete',
                            label: 'Hapus',
                            icon: <DeleteOutlined />,
                            danger: true,
                            onClick: () => {
                                Modal.confirm({
                                    title: 'Hapus Tarif',
                                    content: 'Yakin ingin menghapus tarif ini?',
                                    okText: 'Ya',
                                    cancelText: 'Tidak',
                                    okType: 'danger',
                                    onOk: () => handleDeleteRate(record.id),
                                });
                            },
                        },
                    ]}
                />
            ),
        },
    ];

    return (
        <div>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <Title level={3}>
                            <AppstoreOutlined /> Kelola Tarif Opsi Layanan
                        </Title>
                        <Text type="secondary">
                            Kelola komponen layanan dan tarifnya
                        </Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={showAddComponentModal}
                    >
                        Tambah Komponen
                    </Button>
                </div>

                <Table
                    columns={componentColumns}
                    dataSource={components}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            {/* Component Modal */}
            <Modal
                title={editingComponent ? 'Edit Komponen' : 'Tambah Komponen'}
                open={componentModalVisible}
                onOk={handleSaveComponent}
                onCancel={() => setComponentModalVisible(false)}
                okText="Simpan"
                cancelText="Batal"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Nama Komponen"
                        name="name"
                        rules={[{ required: true, message: 'Nama komponen wajib diisi' }]}
                    >
                        <Input placeholder="Contoh: Pengelolaan Sampah" />
                    </Form.Item>

                    <Form.Item
                        label="Deskripsi"
                        name="description"
                    >
                        <TextArea rows={3} placeholder="Deskripsi komponen" />
                    </Form.Item>

                    <Form.Item
                        label="Status Aktif"
                        name="isActive"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <Switch checkedChildren="Aktif" unCheckedChildren="Non-Aktif" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Rates Modal */}
            <Modal
                title={<><DollarOutlined /> Kelola Tarif: {selectedComponent?.name}</>}
                open={rateModalVisible}
                onCancel={() => setRateModalVisible(false)}
                footer={null}
                width={900}
            >
                <Tabs
                    items={[
                        {
                            key: '1',
                            label: 'Daftar Tarif',
                            children: (
                                <Table
                                    columns={rateColumns}
                                    dataSource={componentRates}
                                    rowKey="id"
                                    pagination={false}
                                    size="small"
                                />
                            ),
                        },
                        {
                            key: '2',
                            label: 'Tambah Tarif',
                            children: (
                                <Form form={rateForm} layout="vertical" onFinish={handleSaveRate}>
                                    <Form.Item name="componentId" hidden>
                                        <Input />
                                    </Form.Item>

                                    <Form.Item
                                        label="Jumlah (Rp)"
                                        name="amount"
                                        rules={[{ required: true, message: 'Jumlah wajib diisi' }]}
                                    >
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            min={0}
                                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Tipe Properti"
                                        name="propertyType"
                                        rules={[{ required: true, message: 'Tipe properti wajib dipilih' }]}
                                        initialValue="all"
                                    >
                                        <Select>
                                            <Option value="all">Semua</Option>
                                            <Option value="rumah">Rumah</Option>
                                            <Option value="tanah">Tanah</Option>
                                        </Select>
                                    </Form.Item>

                                    <Form.Item
                                        label="Berlaku Dari"
                                        name="validFrom"
                                        rules={[{ required: true, message: 'Tanggal mulai wajib diisi' }]}
                                    >
                                        <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
                                    </Form.Item>

                                    <Form.Item
                                        label="Berlaku Sampai"
                                        name="validTo"
                                    >
                                        <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" block>
                                            Simpan Tarif
                                        </Button>
                                    </Form.Item>
                                </Form>
                            ),
                        },
                    ]}
                />
            </Modal>

            {/* Edit Rate Modal */}
            <Modal
                title={<><EditOutlined /> Edit Tarif</>}
                open={editRateModalVisible}
                onOk={handleUpdateRate}
                onCancel={() => setEditRateModalVisible(false)}
                okText="Simpan"
                cancelText="Batal"
            >
                <Form form={editRateForm} layout="vertical">
                    <Form.Item
                        label="Jumlah (Rp)"
                        name="amount"
                        rules={[{ required: true, message: 'Jumlah wajib diisi' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Tipe Properti"
                        name="propertyType"
                        rules={[{ required: true, message: 'Tipe properti wajib dipilih' }]}
                    >
                        <Select>
                            <Option value="all">Semua</Option>
                            <Option value="rumah">Rumah</Option>
                            <Option value="tanah">Tanah</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Berlaku Dari"
                        name="validFrom"
                        rules={[{ required: true, message: 'Tanggal mulai wajib diisi' }]}
                    >
                        <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
                    </Form.Item>

                    <Form.Item
                        label="Berlaku Sampai"
                        name="validTo"
                    >
                        <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
