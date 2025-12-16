import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Tag, Drawer, Avatar, DatePicker, Flex } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { adminService } from '../services/api';
import { useMessage } from '../contexts/MessageContext';
import TableActionDropdown from '../components/TableActionDropdown';
import dayjs from 'dayjs';

const { Option } = Select;

export default function AdminProperties() {
    const { message } = useMessage();
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
    const [allPropertyUsers, setAllPropertyUsers] = useState([]);

    useEffect(() => {
        fetchProperties();
        fetchUsers();
        fetchAllPropertyUsers();
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

    const fetchAllPropertyUsers = async () => {
        try {
            // Fetch all property-user relationships
            const allProps = await adminService.getProperties();
            const allUsersPromises = allProps.map(prop => 
                adminService.getPropertyUsers(prop.id).catch(() => [])
            );
            const results = await Promise.all(allUsersPromises);
            
            // Create a map of propertyId -> users
            const usersMap = {};
            allProps.forEach((prop, index) => {
                usersMap[prop.id] = results[index] || [];
            });
            setAllPropertyUsers(usersMap);
        } catch (error) {
            console.error('Failed to fetch property users:', error);
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
            bastDate: property.bastDate ? dayjs(property.bastDate) : null,
        });
        setModalVisible(true)
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
            await fetchAllPropertyUsers(); // Refresh all property users
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
            await fetchAllPropertyUsers(); // Refresh all property users
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
            title: 'Penghuni',
            key: 'occupants',
            render: (_, record) => {
                const occupants = allPropertyUsers[record.id] || [];
                if (occupants.length === 0) {
                    return <Tag color="default">Belum ada penghuni</Tag>;
                }
                
                return (
                    <div>
                        <div style={{ marginBottom: 4 }}>
                            <Tag color="blue">{occupants.length} penghuni</Tag>
                        </div>
                        {occupants.slice(0, 2).map((occ, idx) => (
                            <div key={idx} style={{ fontSize: '12px', color: '#666' }}>
                                <Tag color={getRelationTypeColor(occ.relation_type)} size="small">
                                    {getRelationTypeText(occ.relation_type)}
                                </Tag>
                                {occ.full_name}
                            </div>
                        ))}
                        {occupants.length > 2 && (
                            <div style={{ fontSize: '12px', color: '#999' }}>+{occupants.length - 2} lainnya</div>
                        )}
                    </div>
                );
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
            width: 80,
            render: (_, record) => (
                <TableActionDropdown
                    items={[
                        {
                            key: 'occupants',
                            label: 'Penghuni',
                            icon: <TeamOutlined />,
                            onClick: () => handleManageUsers(record),
                        },
                        {
                            key: 'edit',
                            label: 'Edit',
                            icon: <EditOutlined />,
                            onClick: () => handleEdit(record),
                        },
                        {
                            key: 'delete',
                            label: 'Hapus',
                            icon: <DeleteOutlined />,
                            danger: true,
                            onClick: () => {
                                Modal.confirm({
                                    title: 'Hapus properti ini?',
                                    content: 'Properti yang memiliki transaksi tidak dapat dihapus',
                                    okText: 'Ya',
                                    cancelText: 'Tidak',
                                    okType: 'danger',
                                    onOk: () => handleDelete(record.id),
                                });
                            },
                        },
                    ]}
                />
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
                    scroll={{ x: 'max-content', y: 'calc(100vh - 350px)' }}
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
                size="large"
                onClose={() => setUsersDrawerVisible(false)}
                open={usersDrawerVisible}
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
                        Tambah Penghuni
                    </Button>
                }
            >
                <Flex vertical gap="middle">
                    {loadingPropertyUsers ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading...</div>
                    ) : propertyUsers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>Belum ada penghuni</div>
                    ) : (
                        propertyUsers.map((item) => (
                            <Card key={item.id} size="small">
                                <Flex justify="space-between" align="start">
                                    <Flex gap="middle" align="start">
                                        <Avatar icon={<UserOutlined />} />
                                        <div>
                                            <div>
                                                <Space>
                                                    <strong>{item.full_name}</strong>
                                                    <Tag color={getRelationTypeColor(item.relation_type)}>
                                                        {getRelationTypeText(item.relation_type)}
                                                    </Tag>
                                                </Space>
                                            </div>
                                            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                                                <div>Username: {item.username}</div>
                                                {item.phone && <div>HP: {item.phone}</div>}
                                                {item.email && <div>Email: {item.email}</div>}
                                            </div>
                                        </div>
                                    </Flex>
                                    <Space>
                                        <Button
                                            type="link"
                                            icon={<EditOutlined />}
                                            onClick={() => handleEditUser(item)}
                                        >
                                            Edit
                                        </Button>
                                        <Popconfirm
                                            title="Hapus penghuni ini?"
                                            onConfirm={() => handleDeleteUser(item.id)}
                                            okText="Ya"
                                            cancelText="Tidak"
                                        >
                                            <Button type="link" danger icon={<DeleteOutlined />}>
                                                Hapus
                                            </Button>
                                        </Popconfirm>
                                    </Space>
                                </Flex>
                            </Card>
                        ))
                    )}
                </Flex>

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
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {users.map(user => (
                                    <Option key={user.id} value={user.id} label={`${user.full_name} (${user.username})`}>
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
