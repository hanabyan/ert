import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, DatePicker, Select, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminService } from '../services/api';
import { useMessage } from '../contexts/MessageContext';
import TableActionDropdown from '../components/TableActionDropdown';
import dayjs from 'dayjs';

export default function AdminExpenses() {
    const { message } = useMessage();
    const [expenses, setExpenses] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchExpenses();
        fetchRecipients();
    }, []);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const data = await adminService.getExpenses();
            setExpenses(data);
        } catch (error) {
            message.error('Gagal memuat data pengeluaran');
        } finally {
            setLoading(false);
        }
    };

    const fetchRecipients = async () => {
        try {
            const data = await adminService.getRecipients();
            setRecipients(data);
        } catch (error) {
            message.error('Gagal memuat data penerima');
        }
    };

    const handleAdd = () => {
        setEditingExpense(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        form.setFieldsValue({
            ...expense,
            date: dayjs(expense.date),
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await adminService.deleteExpense(id);
            message.success('Pengeluaran berhasil dihapus');
            fetchExpenses();
        } catch (error) {
            message.error('Gagal menghapus pengeluaran');
        }
    };

    const handleSubmit = async (values) => {
        try {
            const data = {
                ...values,
                date: values.date.format('YYYY-MM-DD'),
            };

            if (editingExpense) {
                await adminService.updateExpense(editingExpense.id, data);
                message.success('Pengeluaran berhasil diperbarui');
            } else {
                await adminService.addExpense(data);
                message.success('Pengeluaran berhasil ditambahkan');
            }

            setModalVisible(false);
            fetchExpenses();
        } catch (error) {
            message.error('Gagal menyimpan pengeluaran');
        }
    };

    const columns = [
        {
            title: 'Tanggal',
            dataIndex: 'date',
            key: 'date',
            render: (date) => new Date(date).toLocaleDateString('id-ID'),
        },
        {
            title: 'Deskripsi',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Jumlah',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => `Rp ${amount.toLocaleString('id-ID')}`,
        },
        {
            title: 'Penerima',
            dataIndex: 'recipientId',
            key: 'recipientId',
            render: (id) => recipients.find(r => r.id === id)?.name || '-',
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
                                    title: 'Hapus pengeluaran ini?',
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
            title="Kelola Pengeluaran"
            extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                    Tambah Pengeluaran
                </Button>
            }
        >
            <Table
                columns={columns}
                dataSource={expenses}
                rowKey="id"
                loading={loading}
                    scroll={{ x: 'max-content', y: 'calc(100vh - 350px)' }}
            />

            <Modal
                title={editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={() => form.submit()}
                okText="Simpan"
                cancelText="Batal"
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="description"
                        label="Deskripsi"
                        rules={[{ required: true, message: 'Masukkan deskripsi!' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="amount"
                        label="Jumlah"
                        rules={[{ required: true, message: 'Masukkan jumlah!' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/Rp\s?|(,*)/g, '')}
                        />
                    </Form.Item>

                    <Form.Item
                        name="date"
                        label="Tanggal"
                        rules={[{ required: true, message: 'Pilih tanggal!' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="recipientId" label="Penerima">
                        <Select placeholder="Pilih penerima (opsional)" allowClear>
                            {recipients.map(r => (
                                <Select.Option key={r.id} value={r.id}>
                                    {r.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
}
