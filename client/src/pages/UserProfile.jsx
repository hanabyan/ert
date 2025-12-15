import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Table, Tag, Tabs, Form, Input, Button, message, Modal } from 'antd';
import { UserOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { authService } from '../services/api';
import dayjs from 'dayjs';

export default function UserProfile() {
    const [profile, setProfile] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profileData, activityData] = await Promise.all([
                authService.getProfile(),
                authService.getActivity()
            ]);
            setProfile(profileData);
            setActivity(activityData);
        } catch (error) {
            console.error('Failed to load profile data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditProfile = () => {
        form.setFieldsValue({
            full_name: profile.full_name,
            phone: profile.phone || '',
            email: profile.email || ''
        });
        setEditModalVisible(true);
    };

    const handleSaveProfile = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            await authService.updateProfile(values);
            
            message.success('Profil berhasil diperbarui');
            setEditModalVisible(false);
            fetchData(); // Refresh data
        } catch (error) {
            if (error.errorFields) {
                // Validation error
                return;
            }
            message.error(error.response?.data?.message || 'Gagal memperbarui profil');
        } finally {
            setLoading(false);
        }
    };

    const auditColumns = [
        {
            title: 'Waktu',
            dataIndex: 'created_at',
            key: 'time',
            render: (text) => dayjs(text).format('DD MMM YYYY HH:mm'),
        },
        {
            title: 'Aksi',
            dataIndex: 'action',
            key: 'action',
            render: (action) => <Tag color="blue">{action.toUpperCase()}</Tag>,
        },
        {
            title: 'Target',
            key: 'target',
            render: (_, record) => `${record.target_type} #${record.target_id}`,
        },
        {
            title: 'Perubahan',
            dataIndex: 'changes',
            key: 'changes',
            render: (changes) => {
                try {
                    const data = typeof changes === 'string' ? JSON.parse(changes) : changes;
                    return (
                        <div style={{ maxHeight: 100, overflow: 'auto', fontSize: 12 }}>
                            <pre>{JSON.stringify(data, null, 2)}</pre>
                        </div>
                    );
                } catch (e) {
                    return '-';
                }
            },
        },
    ];

    const items = [
        {
            key: '1',
            label: 'Info Profil',
            children: (
                <>
                    <div style={{ marginBottom: 16, textAlign: 'right' }}>
                        <Button 
                            type="primary" 
                            icon={<EditOutlined />}
                            onClick={handleEditProfile}
                        >
                            Edit Profil
                        </Button>
                    </div>
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Username">{profile?.username}</Descriptions.Item>
                        <Descriptions.Item label="Nama Lengkap">{profile?.full_name || '-'}</Descriptions.Item>
                        <Descriptions.Item label="No. Telepon">{profile?.phone || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Email">{profile?.email || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Role">
                            <Tag color={profile?.role === 'admin' ? 'red' : 'green'}>
                                {profile?.role?.toUpperCase()}
                            </Tag>
                        </Descriptions.Item>
                    </Descriptions>
                </>
            ),
        },
        {
            key: '2',
            label: 'Aktivitas Saya',
            children: (
                <Table
                    columns={auditColumns}
                    dataSource={activity}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                />
            ),
        },
    ];

    if (loading && !profile) {
        return <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>;
    }

    return (
        <>
            <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                <Card
                    title={
                        <span>
                            <UserOutlined /> Profil Pengguna
                        </span>
                    }
                >
                    <Tabs defaultActiveKey="1" items={items} />
                </Card>
            </div>

            <Modal
                title={
                    <span>
                        <EditOutlined /> Edit Profil
                    </span>
                }
                open={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setEditModalVisible(false)}>
                        Batal
                    </Button>,
                    <Button 
                        key="save" 
                        type="primary" 
                        icon={<SaveOutlined />}
                        loading={loading}
                        onClick={handleSaveProfile}
                    >
                        Simpan
                    </Button>,
                ]}
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <Form.Item
                        label="Nama Lengkap"
                        name="full_name"
                        rules={[
                            { required: true, message: 'Nama lengkap wajib diisi' },
                            { min: 3, message: 'Nama minimal 3 karakter' }
                        ]}
                    >
                        <Input placeholder="Masukkan nama lengkap" />
                    </Form.Item>

                    <Form.Item
                        label="No. Telepon"
                        name="phone"
                        rules={[
                            { pattern: /^[0-9]{10,15}$/, message: 'Nomor telepon tidak valid (10-15 digit)' }
                        ]}
                    >
                        <Input placeholder="08123456789" />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { type: 'email', message: 'Format email tidak valid' }
                        ]}
                    >
                        <Input placeholder="email@example.com" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}
