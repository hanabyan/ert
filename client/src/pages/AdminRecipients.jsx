import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminService } from '../services/api';
import { useMessage } from '../contexts/MessageContext';
import TableActionDropdown from '../components/TableActionDropdown';

const { Option } = Select;

export default function AdminRecipients() {
    const { message } = useMessage();
    const [recipients, setRecipients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingRecipient, setEditingRecipient] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchRecipients();
    }, []);

    const fetchRecipients = async () => {
        setLoading(true);
        try {
            const data = await adminService.getRecipients();
            setRecipients(data);
        } catch (error) {
            message.error('Gagal memuat data penerima');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingRecipient(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (recipient) => {
        setEditingRecipient(recipient);
        form.setFieldsValue(recipient);
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await adminService.deleteRecipient(id);
            message.success('Penerima berhasil dihapus');
            fetchRecipients();
        } catch (error) {
            message.error('Gagal menghapus penerima');
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingRecipient) {
                await adminService.updateRecipient(editingRecipient.id, values);
                message.success('Penerima berhasil diperbarui');
            } else {
                await adminService.addRecipient(values);
                message.success('Penerima berhasil ditambahkan');
            }

            setModalVisible(false);
            fetchRecipients();
        } catch (error) {
            message.error('Gagal menyimpan penerima');
        }
    };

    const columns = [
        {
            title: 'Nama',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'No. Identitas',
            dataIndex: 'identityNumber',
            key: 'identityNumber',
        },
        {
            title: 'Tipe',
            dataIndex: 'type',
            key: 'type',
            render: (type) => {
                const typeConfig = {
                    'utility': { color: 'blue', text: 'Utilitas' },
                    'cash': { color: 'green', text: 'Tunai' },
                    'transfer': { color: 'orange', text: 'Transfer' },
                };
                const config = typeConfig[type] || { color: 'default', text: type };
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: 'Deskripsi',
            dataIndex: 'description',
            key: 'description',
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
                            onClick: () => handleEdit(record),
                        },
                        {
                            key: 'delete',
                            label: 'Hapus',
                            icon: <DeleteOutlined />,
                            danger: true,
                            onClick: () => {
                                Modal.confirm({
                                    title: 'Hapus penerima ini?',
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
        <Card
            title="Kelola Penerima Pengeluaran"
            extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                    Tambah Penerima
                </Button>
            }
        >
            <Table
                columns={columns}
                dataSource={recipients}
                rowKey="id"
                loading={loading}
                scroll={{ x: 'max-content', y: 'calc(100vh - 350px)' }}
                pagination={{
                    pageSize: 20,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} penerima`,
                }}
            />

            <Modal
                title={editingRecipient ? 'Edit Penerima' : 'Tambah Penerima'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={() => form.submit()}
                okText="Simpan"
                cancelText="Batal"
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="name"
                        label="Nama"
                        rules={[{ required: true, message: 'Masukkan nama!' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="identityNumber"
                        label="Nomor Identitas"
                        rules={[{ required: true, message: 'Masukkan nomor identitas!' }]}
                    >
                        <Input placeholder="NIK / No. Rekening / No. Pelanggan" />
                    </Form.Item>

                    <Form.Item
                        name="type"
                        label="Tipe Pembayaran"
                        rules={[{ required: true, message: 'Pilih tipe!' }]}
                    >
                        <Select>
                            <Option value="utility">Utilitas (PLN, PDAM, dll)</Option>
                            <Option value="cash">Tunai</Option>
                            <Option value="transfer">Transfer Bank</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Deskripsi"
                    >
                        <Input.TextArea rows={3} placeholder="Keterangan tambahan" />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
}
