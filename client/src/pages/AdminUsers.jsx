import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Popconfirm, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { adminService } from '../services/api';
import { useMessage } from '../contexts/MessageContext';

const { Option } = Select;

export default function AdminUsers() {
    const { message } = useMessage();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await adminService.getUsers();
            setUsers(data);
        } catch (error) {
            message.error('Gagal memuat data pengguna');
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingUser(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        form.setFieldsValue({
            username: user.username,
            full_name: user.full_name,
            phone: user.phone,
            email: user.email,
            role: user.role,
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await adminService.deleteUser(id);
            message.success('Pengguna berhasil dihapus');
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.error || 'Gagal menghapus pengguna');
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingUser) {
                await adminService.updateUser(editingUser.id, values);
                message.success('Pengguna berhasil diperbarui');
            } else {
                await adminService.addUser(values);
                message.success('Pengguna berhasil ditambahkan');
            }
            setModalVisible(false);
            form.resetFields();
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.error || 'Gagal menyimpan pengguna');
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
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            render: (text) => (
                <Space>
                    <UserOutlined />
                    <strong>{text}</strong>
                </Space>
            ),
        },
        {
            title: 'Nama Lengkap',
            dataIndex: 'full_name',
            key: 'full_name',
        },
        {
            title: 'No. HP',
            dataIndex: 'phone',
            key: 'phone',
            render: (phone) => phone || <Tag>Belum diisi</Tag>,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (email) => email || <Tag>Belum diisi</Tag>,
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            width: 100,
            render: (role) => (
                <Tag color={role === 'admin' ? 'red' : 'blue'}>
                    {role.toUpperCase()}
                </Tag>
            ),
            filters: [
                { text: 'Admin', value: 'admin' },
                { text: 'Warga', value: 'warga' },
            ],
            onFilter: (value, record) => record.role === value,
        },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Hapus pengguna ini?"
                        description="Tindakan ini tidak dapat dibatalkan."
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
        <Card
            title="Kelola Pengguna"
            extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                    Tambah Pengguna
                </Button>
            }
        >
            <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 20,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} pengguna`,
                }}
            />

            <Modal
                title={editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                okText="Simpan"
                cancelText="Batal"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="username"
                        label="Username"
                        rules={[
                            { required: true, message: 'Username wajib diisi!' },
                            { min: 3, message: 'Username minimal 3 karakter!' },
                        ]}
                    >
                        <Input 
                            placeholder="Masukkan username" 
                            disabled={!!editingUser} 
                        />
                    </Form.Item>

                    <Form.Item
                        name="full_name"
                        label="Nama Lengkap"
                        rules={[{ required: true, message: 'Nama lengkap wajib diisi!' }]}
                    >
                        <Input placeholder="Masukkan nama lengkap" />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label="No. HP (Opsional)"
                    >
                        <Input placeholder="Contoh: 081234567890" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email (Opsional)"
                        rules={[
                            { type: 'email', message: 'Format email tidak valid!' }
                        ]}
                    >
                        <Input placeholder="Contoh: user@example.com" />
                    </Form.Item>

                    {!editingUser && (
                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[
                                { required: true, message: 'Password wajib diisi!' },
                                { min: 6, message: 'Password minimal 6 karakter!' },
                            ]}
                        >
                            <Input.Password placeholder="Masukkan password" />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true, message: 'Pilih role!' }]}
                    >
                        <Select placeholder="Pilih role">
                            <Option value="warga">Warga</Option>
                            <Option value="admin">Admin</Option>
                        </Select>
                    </Form.Item>
                </Form>

                {editingUser && (
                    <div style={{ marginTop: 16, padding: 12, background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 4 }}>
                        <strong>Catatan:</strong> Username tidak dapat diubah setelah pengguna dibuat.
                    </div>
                )}
            </Modal>
        </Card>
    );
}
