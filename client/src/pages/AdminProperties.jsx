import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Tag, Drawer, List, Avatar, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { adminService } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

export default function AdminProperties() {
    const [properties, setProperties] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProperty, setEditingProperty] = useState(null);
    const [form] = Form.useForm();

    // Property Users Management
    const [usersDrawerVisible, setUsersDrawerVisible] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [propertyUsers, setPropertyUsers] = useState([]);
    const [loadingPropertyUsers, setLoadingPropertyUsers] = useState(false);
    const [userModalVisible, setUserModalVisible] = useState(false);
    const [editingPropertyUser, setEditingPropertyUser] = useState(null);
    const [userForm] = Form.useForm();

    useEffect(() => {
        fetchProperties();
        fetchUsers();
    }, []);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const data = await adminService.getProperties();
            setProperties(data);
        } catch (error) {
            message.error('Gagal memuat data properti');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await adminService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleAdd = () => {
        setEditingProperty(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (property) => {
        setEditingProperty(property);
        form.setFieldsValue({
            block: property.block,
            number: property.number,
            type: property.type,
            ownerId: property.ownerId,
            bastDate: property.bastDate ? dayjs(property.bastDate) : null,
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await adminService.deleteProperty(id);
            message.success('Properti berhasil dihapus');
            fetchProperties();
        } catch (error) {
            message.error('Gagal menghapus properti. Properti mungkin masih memiliki transaksi.');
        }
    };

    const handleSubmit = async (values) => {
        try {
            const propertyData = {
                type: values.type,
                ownerId: values.ownerId || null,
                bastDate: values.bastDate ? values.bastDate.format('YYYY-MM-DD') : null,
            };

            if (editingProperty) {
                // Update property
                await adminService.updateProperty(editingProperty.id, propertyData);
                message.success('Properti berhasil diperbarui');
            } else {
                // Add new property
                await adminService.addProperty({
                    block: values.block,
                    number: values.number,
                    ...propertyData,
                });
                message.success('Properti berhasil ditambahkan');
            }

            setModalVisible(false);
            fetchProperties();
        } catch (error) {
            message.error(error.response?.data?.error || 'Gagal menyimpan properti');
        }
    };

    // Property Users Management Functions
    const handleManageUsers = async (property) => {
        setSelectedProperty(property);
        setUsersDrawerVisible(true);
        await fetchPropertyUsers(property.id);
    };

    const fetchPropertyUsers = async (propertyId) => {
        setLoadingPropertyUsers(true);
        try {
            const data = await adminService.getPropertyUsers(propertyId);
            setPropertyUsers(data);
        } catch (error) {
            message.error('Gagal memuat data penghuni');
        } finally {
            setLoadingPropertyUsers(false);
        }
    };

    const handleAddUser = () => {
        setEditingPropertyUser(null);
        userForm.resetFields();
        setUserModalVisible(true);
    };

    const handleEditUser = (propertyUser) => {
        setEditingPropertyUser(propertyUser);
        userForm.setFieldsValue({
            userId: propertyUser.user_id,
            relationType: propertyUser.relation_type,
        });
        setUserModalVisible(true);
    };

    const handleDeleteUser = async (id) => {
        try {
            await adminService.deletePropertyUser(id);
            message.success('Penghuni berhasil dihapus');
            await fetchPropertyUsers(selectedProperty.id);
        } catch (error) {
            message.error('Gagal menghapus penghuni');
        }
    };

    const handleUserSubmit = async (values) => {
        try {
            if (editingPropertyUser) {
                await adminService.updatePropertyUser(editingPropertyUser.id, values.relationType);
                message.success('Tipe relasi berhasil diperbarui');
            } else {
                await adminService.addPropertyUser(selectedProperty.id, values.userId, values.relationType);
                message.success('Penghuni berhasil ditambahkan');
            }
            setUserModalVisible(false);
            userForm.resetFields();
            await fetchPropertyUsers(selectedProperty.id);
        } catch (error) {
            message.error(error.response?.data?.error || 'Gagal menyimpan penghuni');
        }
    };

    const getRelationTypeColor = (type) => {
        switch (type) {
            case 'pemilik': return 'gold';
            case 'keluarga': return 'blue';
            case 'sewa': return 'green';
            default: return 'default';
        }
    };

    const getRelationTypeText = (type) => {
        switch (type) {
            case 'pemilik': return 'Pemilik';
            case 'keluarga': return 'Keluarga';
            case 'sewa': return 'Sewa';
            default: return type;
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 60,
        },
        {
            title: 'Blok',
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
            title: 'Alamat',
            key: 'address',
            render: (_, record) => (
                <span>
                    <HomeOutlined /> Blok {record.block} No. {record.number}
                </span>
            ),
        },
        {
            title: 'Tipe',
            dataIndex: 'type',
            key: 'type',
            render: (type) => (
                <Tag color={type === 'rumah' ? 'blue' : 'green'}>
                    {type === 'rumah' ? 'Rumah' : 'Tanah'}
                </Tag>
            ),
            filters: [
                { text: 'Rumah', value: 'rumah' },
                { text: 'Tanah', value: 'tanah' },
            ],
            onFilter: (value, record) => record.type === value,
        },
        {
            title: 'Pemilik Utama',
            dataIndex: 'ownerId',
            key: 'ownerId',
            render: (ownerId) => {
                if (!ownerId) return <Tag>Belum ada pemilik</Tag>;
                const owner = users.find(u => u.id === ownerId);
                return owner ? (
                    <Space>
                        <UserOutlined />
                        {owner.full_name}
                    </Space>
                ) : <Tag color="orange">ID: {ownerId}</Tag>;
            },
        },
        {
            title: 'Tanggal BAST',
            dataIndex: 'bastDate',
            key: 'bastDate',
            render: (bastDate) => bastDate ? dayjs(bastDate).format('DD/MM/YYYY') : <Tag>Belum diset</Tag>,
        },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<TeamOutlined />}
                        onClick={() => handleManageUsers(record)}
                        type="default"
                    >
                        Penghuni
                    </Button>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Hapus properti ini?"
                        description="Properti yang memiliki transaksi tidak dapat dihapus"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Ya"
                        cancelText="Tidak"
                    >
                        <Button danger icon={<DeleteOutlined />}>
                            Hapus
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Card
                title="Kelola Properti"
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        Tambah Properti
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    dataSource={properties}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} properti`,
                    }}
                />

                {/* Property Form Modal */}
                <Modal
                    title={editingProperty ? 'Edit Properti' : 'Tambah Properti'}
                    open={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    onOk={() => form.submit()}
                    okText="Simpan"
                    cancelText="Batal"
                >
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Form.Item
                            name="block"
                            label="Blok"
                            rules={[{ required: true, message: 'Pilih blok!' }]}
                        >
                            <Select 
                                placeholder="Pilih blok" 
                                disabled={!!editingProperty}
                            >
                                <Option value="A">Blok A</Option>
                                <Option value="B">Blok B</Option>
                                <Option value="C">Blok C</Option>
                                <Option value="D">Blok D</Option>
                                <Option value="E">Blok E</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="number"
                            label="Nomor"
                            rules={[{ required: true, message: 'Masukkan nomor!' }]}
                        >
                            <Input 
                                type="number" 
                                placeholder="Nomor rumah/tanah"
                                disabled={!!editingProperty}
                            />
                        </Form.Item>

                        <Form.Item
                            name="type"
                            label="Tipe Properti"
                            rules={[{ required: true, message: 'Pilih tipe!' }]}
                        >
                            <Select placeholder="Pilih tipe">
                                <Option value="rumah">Rumah</Option>
                                <Option value="tanah">Tanah</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="ownerId"
                            label="Pemilik Utama (Opsional)"
                            help="Pemilik utama untuk keperluan legacy. Gunakan menu 'Penghuni' untuk mengelola semua penghuni."
                        >
                            <Select
                                placeholder="Pilih pemilik"
                                allowClear
                                showSearch
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {users.map(user => (
                                    <Option key={user.id} value={user.id}>
                                        {user.full_name} ({user.username})
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="bastDate"
                            label="Tanggal BAST (Opsional)"
                            help="Tanggal Berita Acara Serah Terima - sejak kapan properti mulai wajib bayar iuran"
                        >
                            <DatePicker 
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                placeholder="Pilih tanggal BAST"
                            />
                        </Form.Item>
                    </Form>

                    {editingProperty && (
                        <div style={{ marginTop: 16, padding: 12, background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 4 }}>
                            <strong>Catatan:</strong> Blok dan nomor tidak dapat diubah setelah properti dibuat.
                        </div>
                    )}
                </Modal>
            </Card>

            {/* Property Users Drawer */}
            <Drawer
                title={
                    <Space>
                        <TeamOutlined />
                        <span>
                            Penghuni Properti {selectedProperty?.block}-{selectedProperty?.number}
                        </span>
                    </Space>
                }
                placement="right"
                width={600}
                onClose={() => setUsersDrawerVisible(false)}
                open={usersDrawerVisible}
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
                        Tambah Penghuni
                    </Button>
                }
            >
                <List
                    loading={loadingPropertyUsers}
                    dataSource={propertyUsers}
                    locale={{ emptyText: 'Belum ada penghuni' }}
                    renderItem={(item) => (
                        <List.Item
                            actions={[
                                <Button
                                    type="link"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEditUser(item)}
                                >
                                    Edit
                                </Button>,
                                <Popconfirm
                                    title="Hapus penghuni ini?"
                                    onConfirm={() => handleDeleteUser(item.id)}
                                    okText="Ya"
                                    cancelText="Tidak"
                                >
                                    <Button type="link" danger icon={<DeleteOutlined />}>
                                        Hapus
                                    </Button>
                                </Popconfirm>,
                            ]}
                        >
                            <List.Item.Meta
                                avatar={<Avatar icon={<UserOutlined />} />}
                                title={
                                    <Space>
                                        <strong>{item.full_name}</strong>
                                        <Tag color={getRelationTypeColor(item.relation_type)}>
                                            {getRelationTypeText(item.relation_type)}
                                        </Tag>
                                    </Space>
                                }
                                description={
                                    <div>
                                        <div>Username: {item.username}</div>
                                        {item.phone && <div>HP: {item.phone}</div>}
                                        {item.email && <div>Email: {item.email}</div>}
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />

                {/* Add/Edit User Modal */}
                <Modal
                    title={editingPropertyUser ? 'Edit Penghuni' : 'Tambah Penghuni'}
                    open={userModalVisible}
                    onCancel={() => {
                        setUserModalVisible(false);
                        userForm.resetFields();
                    }}
                    onOk={() => userForm.submit()}
                    okText="Simpan"
                    cancelText="Batal"
                >
                    <Form
                        form={userForm}
                        layout="vertical"
                        onFinish={handleUserSubmit}
                    >
                        <Form.Item
                            name="userId"
                            label="Pilih User"
                            rules={[{ required: true, message: 'Pilih user!' }]}
                        >
                            <Select
                                placeholder="Pilih user"
                                disabled={!!editingPropertyUser}
                                showSearch
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {users.map(user => (
                                    <Option key={user.id} value={user.id}>
                                        {user.full_name} ({user.username})
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="relationType"
                            label="Tipe Relasi"
                            rules={[{ required: true, message: 'Pilih tipe relasi!' }]}
                        >
                            <Select placeholder="Pilih tipe relasi">
                                <Option value="pemilik">Pemilik</Option>
                                <Option value="keluarga">Keluarga</Option>
                                <Option value="sewa">Sewa</Option>
                            </Select>
                        </Form.Item>
                    </Form>

                    {editingPropertyUser && (
                        <div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 4 }}>
                            <strong>Info:</strong> User tidak dapat diubah. Hapus dan tambahkan kembali jika perlu mengganti user.
                        </div>
                    )}
                </Modal>
            </Drawer>
        </>
    );
}
