import React, { useState, useEffect } from 'react';
import { Card, Form, Select, DatePicker, InputNumber, Button, Table, Tag, Space, Upload, Typography, Row, Col, Divider, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, UploadOutlined, DollarOutlined } from '@ant-design/icons';
import { useMessage } from '../contexts/MessageContext';
import { adminService } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;

export default function AdminAddPayment() {
    const { message } = useMessage();
    const [form] = Form.useForm();
    const [properties, setProperties] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [propertyUsers, setPropertyUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [paymentItems, setPaymentItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [propsData, usersData] = await Promise.all([
                adminService.getProperties(),
                adminService.getUsers()
            ]);
            setProperties(propsData);
            setUsers(usersData.filter(u => u.role === 'warga'));
        } catch (error) {
            message.error('Gagal memuat data');
        }
    };

    const handlePropertyChange = async (propertyId) => {
        setSelectedProperty(propertyId);
        setSelectedUser(null);
        setPropertyUsers([]);
        form.setFieldsValue({ user: null });

        if (propertyId) {
            try {
                // Get users related to this property
                const relatedUsers = await adminService.getPropertyUsers(propertyId);
                
                // Get property details to find owner
                const property = properties.find(p => p.id === propertyId);
                
                // Combine property users and owner
                const userIds = new Set();
                
                // Add property-user relationships
                relatedUsers.forEach(rel => userIds.add(rel.userId));
                
                // Add owner if exists
                if (property.ownerId) {
                    userIds.add(property.ownerId);
                }
                
                // Filter users
                const filteredUsers = users.filter(u => userIds.has(u.id));
                setPropertyUsers(filteredUsers);

                if (filteredUsers.length === 0) {
                    message.warning('Tidak ada user yang terkait dengan properti ini');
                }
            } catch (error) {
                console.error('Error fetching property users:', error);
                message.error('Gagal memuat user properti');
            }
        }
    };

    const handleAddPaymentItem = () => {
        const values = form.getFieldsValue(['month', 'year', 'amount']);
        
        if (!selectedProperty) {
            message.warning('Pilih properti terlebih dahulu');
            return;
        }

        if (!values.month || !values.year || !values.amount) {
            message.warning('Lengkapi bulan, tahun, dan jumlah');
            return;
        }

        const property = properties.find(p => p.id === selectedProperty);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        
        const newItem = {
            key: Date.now(),
            propertyId: selectedProperty,
            propertyName: `${property.block}${property.number}`,
            month: values.month,
            year: values.year,
            monthName: monthNames[values.month - 1],
            amount: values.amount
        };

        setPaymentItems([...paymentItems, newItem]);
        form.setFieldsValue({ month: null, year: null, amount: null });
        message.success('Item pembayaran ditambahkan');
    };

    const handleRemoveItem = (key) => {
        setPaymentItems(paymentItems.filter(item => item.key !== key));
    };

    const handleSubmit = async () => {
        if (!selectedUser) {
            message.error('Pilih user terlebih dahulu');
            return;
        }

        if (paymentItems.length === 0) {
            message.error('Tambahkan minimal 1 item pembayaran');
            return;
        }

        setLoading(true);
        try {
            const totalAmount = paymentItems.reduce((sum, item) => sum + item.amount, 0);
            
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('userId', selectedUser);
            formData.append('totalAmount', totalAmount);
            formData.append('items', JSON.stringify(paymentItems.map(item => ({
                propertyId: item.propertyId,
                month: item.month,
                year: item.year,
                amount: item.amount
            }))));
            formData.append('adminCreated', 'true'); // Flag untuk pembayaran yang dibuat admin

            if (fileList.length > 0) {
                formData.append('proofImage', fileList[0].originFileObj);
            }

            await adminService.createPaymentForUser(formData);
            
            message.success('Pembayaran berhasil ditambahkan dan langsung terverifikasi');
            
            // Reset form
            form.resetFields();
            setSelectedUser(null);
            setSelectedProperty(null);
            setPropertyUsers([]);
            setPaymentItems([]);
            setFileList([]);
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal menambahkan pembayaran');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Properti',
            dataIndex: 'propertyName',
            key: 'propertyName',
        },
        {
            title: 'Periode',
            key: 'period',
            render: (_, record) => `${record.monthName} ${record.year}`,
        },
        {
            title: 'Jumlah',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => `Rp ${amount.toLocaleString('id-ID')}`,
        },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Button 
                    danger 
                    size="small" 
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveItem(record.key)}
                >
                    Hapus
                </Button>
            ),
        },
    ];

    const totalAmount = paymentItems.reduce((sum, item) => sum + item.amount, 0);

    const uploadProps = {
        beforeUpload: (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('Hanya file gambar yang diperbolehkan!');
                return false;
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('Ukuran gambar maksimal 5MB!');
                return false;
            }
            return false; // Prevent auto upload
        },
        fileList,
        onChange: ({ fileList: newFileList }) => {
            setFileList(newFileList.slice(-1)); // Only keep last file
        },
    };

    const selectedPropertyData = properties.find(p => p.id === selectedProperty);

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <Title level={3}>
                    <DollarOutlined /> Tambah Pembayaran (Admin)
                </Title>
                <Text type="secondary">
                    Untuk membantu warga yang tidak bisa menggunakan aplikasi
                </Text>

                <Divider />

                <Form form={form} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Pilih Properti"
                                name="property"
                                rules={[{ required: true, message: 'Pilih properti' }]}
                            >
                                <Select
                                    placeholder="Pilih properti terlebih dahulu"
                                    showSearch
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    onChange={handlePropertyChange}
                                >
                                    {properties.map(prop => (
                                        <Option key={prop.id} value={prop.id} label={`${prop.block}${prop.number} - ${prop.type}`}>
                                            {prop.block}{prop.number} - {prop.type}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Pilih User (Pemilik/Penghuni)"
                                name="user"
                                rules={[{ required: true, message: 'Pilih user' }]}
                            >
                                <Select
                                    placeholder={selectedProperty ? "Pilih user dari properti ini" : "Pilih properti dulu"}
                                    showSearch
                                    disabled={!selectedProperty || propertyUsers.length === 0}
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    onChange={setSelectedUser}
                                >
                                    {propertyUsers.map(user => (
                                        <Option key={user.id} value={user.id} label={`${user.full_name} (${user.username}) - ${user.phone}`}>
                                            {user.full_name} ({user.username}) - {user.phone}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            {selectedProperty && propertyUsers.length === 0 && (
                                <Alert 
                                    title="Tidak ada user terkait" 
                                    description="Properti ini belum memiliki pemilik/penghuni. Tambahkan di menu Kelola Properti terlebih dahulu."
                                    type="warning" 
                                    showIcon 
                                    style={{ marginTop: -16 }}
                                />
                            )}
                        </Col>
                    </Row>

                    {selectedProperty && selectedPropertyData && (
                        <>
                            <Divider titlePlacement="left">Informasi Properti</Divider>
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Text strong>Blok & Nomor:</Text>
                                    <div>{selectedPropertyData.block}{selectedPropertyData.number}</div>
                                </Col>
                                <Col span={8}>
                                    <Text strong>Tipe:</Text>
                                    <div><Tag color={selectedPropertyData.type === 'rumah' ? 'blue' : 'green'}>
                                        {selectedPropertyData.type === 'rumah' ? 'Rumah' : 'Tanah'}
                                    </Tag></div>
                                </Col>
                                <Col span={8}>
                                    <Text strong>Penghuni Terkait:</Text>
                                    <div>{propertyUsers.length} orang</div>
                                </Col>
                            </Row>
                        </>
                    )}

                    <Divider titlePlacement="left">Item Pembayaran</Divider>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Bulan" name="month">
                                <Select placeholder="Bulan" disabled={!selectedProperty}>
                                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                                        <Option key={m} value={m}>
                                            {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][m-1]}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Tahun" name="year">
                                <InputNumber 
                                    placeholder="2025" 
                                    min={2018} 
                                    max={2030}
                                    disabled={!selectedProperty}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Jumlah (Rp)" name="amount">
                                <InputNumber 
                                    placeholder="150000" 
                                    min={0}
                                    disabled={!selectedProperty}
                                    style={{ width: '100%' }}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Button 
                        type="dashed" 
                        icon={<PlusOutlined />}
                        onClick={handleAddPaymentItem}
                        disabled={!selectedProperty}
                        block
                    >
                        Tambah Item untuk {selectedPropertyData ? `${selectedPropertyData.block}${selectedPropertyData.number}` : 'Properti'}
                    </Button>
                </Form>

                {paymentItems.length > 0 && (
                    <>
                        <Divider />
                        <Table 
                            columns={columns} 
                            dataSource={paymentItems}
                            pagination={false}
                            size="small"
                            summary={() => (
                                <Table.Summary fixed>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={2}>
                                            <strong>Total</strong>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={2}>
                                            <strong style={{ color: '#1890ff' }}>
                                                Rp {totalAmount.toLocaleString('id-ID')}
                                            </strong>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={3} />
                                    </Table.Summary.Row>
                                </Table.Summary>
                            )}
                        />

                        <Divider />

                        <Form.Item label="Bukti Pembayaran (Opsional)">
                            <Upload {...uploadProps} listType="picture">
                                <Button icon={<UploadOutlined />}>Upload Bukti</Button>
                            </Upload>
                            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                Opsional - Upload foto bukti transfer jika ada
                            </Text>
                        </Form.Item>

                        <Button 
                            type="primary" 
                            size="large"
                            icon={<SaveOutlined />}
                            onClick={handleSubmit}
                            loading={loading}
                            block
                        >
                            Simpan Pembayaran (Langsung Terverifikasi)
                        </Button>
                    </>
                )}
            </Card>
        </div>
    );
}
