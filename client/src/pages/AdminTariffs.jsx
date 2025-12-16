import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, InputNumber, DatePicker, Select, Space, Popconfirm, Input, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminService } from '../services/api';
import { useMessage } from '../contexts/MessageContext';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export default function AdminTariffs() {
    const { message } = useMessage();
    const [tariffs, setTariffs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTariff, setEditingTariff] = useState(null);
    const [form] = Form.useForm();
    const [tariffType, setTariffType] = useState('rutin');

    useEffect(() => {
        fetchTariffs();
    }, []);

    const fetchTariffs = async () => {
        setLoading(true);
        try {
            const data = await adminService.getTariffs();
            setTariffs(data);
        } catch (error) {
            message.error('Gagal memuat data tarif');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingTariff(null);
        form.resetFields();
        setTariffType('rutin');
        setModalVisible(true);
    };

    const handleEdit = (tariff) => {
        setEditingTariff(tariff);
        setTariffType(tariff.tariffType || 'rutin');
        form.setFieldsValue({
            ...tariff,
            validFrom: dayjs(tariff.validFrom),
            validTo: tariff.validTo ? dayjs(tariff.validTo) : null,
            tariffType: tariff.tariffType || 'rutin',
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await adminService.deleteTariff(id);
            message.success('Tarif berhasil dihapus');
            fetchTariffs();
        } catch (error) {
            message.error('Gagal menghapus tarif');
        }
    };

    const handleSubmit = async (values) => {
        try {
            const data = {
                amount: values.amount,
                validFrom: values.validFrom.format('YYYY-MM-DD'),
                validTo: values.validTo ? values.validTo.format('YYYY-MM-DD') : null,
                propertyType: values.propertyType,
                tariffType: values.tariffType || 'rutin',
                description: values.description || null,
            };

            if (editingTariff) {
                await adminService.updateTariff(editingTariff.id, data);
                message.success('Tarif berhasil diperbarui');
            } else {
                await adminService.addTariff(data);
                message.success('Tarif berhasil ditambahkan');
            }

            setModalVisible(false);
            fetchTariffs();
        } catch (error) {
            message.error(error.response?.data?.error || 'Gagal menyimpan tarif');
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
            title: 'Jumlah',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => `Rp ${amount.toLocaleString('id-ID')}`,
        },
        {
            title: 'Tipe',
            dataIndex: 'tariffType',
            key: 'tariffType',
            render: (type) => (
                <Tag color={type === 'rutin' ? 'blue' : 'orange'}>
                    {type === 'rutin' ? 'RUTIN' : 'INSIDENTIL'}
                </Tag>
            ),
        },
        {
            title: 'Deskripsi',
            dataIndex: 'description',
            key: 'description',
            render: (desc) => desc || '-',
        },
        {
            title: 'Berlaku Dari',
            dataIndex: 'validFrom',
            key: 'validFrom',
            render: (date) => new Date(date).toLocaleDateString('id-ID'),
        },
        {
            title: 'Berlaku Sampai',
            dataIndex: 'validTo',
            key: 'validTo',
            render: (date) => date ? new Date(date).toLocaleDateString('id-ID') : 'Tidak terbatas',
        },
        {
            title: 'Tipe Properti',
            dataIndex: 'propertyType',
            key: 'propertyType',
            render: (type) => {
                const typeMap = {
                    'all': 'Semua',
                    'rumah': 'Rumah',
                    'tanah': 'Tanah'
                };
                return typeMap[type] || type;
            },
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
                        title="Hapus tarif ini?"
                        description="Tarif yang sudah digunakan tidak dapat dihapus"
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
            title="Kelola Tarif Dasar"
            extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                    Tambah Tarif
                </Button>
            }
        >
            <Table
                columns={columns}
                dataSource={tariffs}
                rowKey="id"
                loading={loading}
            />

            <Modal
                title={editingTariff ? 'Edit Tarif' : 'Tambah Tarif'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={() => form.submit()}
                okText="Simpan"
                cancelText="Batal"
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="tariffType"
                        label="Tipe Tarif"
                        rules={[{ required: true, message: 'Pilih tipe tarif!' }]}
                        initialValue="rutin"
                    >
                        <Select onChange={(value) => setTariffType(value)}>
                            <Option value="rutin">Rutin (Iuran Bulanan)</Option>
                            <Option value="insidentil">Insidentil (Sementara)</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Deskripsi"
                        rules={[
                            { 
                                required: tariffType === 'insidentil', 
                                message: 'Deskripsi wajib untuk tarif insidentil!' 
                            }
                        ]}
                        help={tariffType === 'insidentil' ? 'Wajib diisi untuk tarif insidentil' : 'Opsional - untuk keterangan tambahan'}
                    >
                        <TextArea 
                            rows={3} 
                            placeholder={
                                tariffType === 'insidentil' 
                                    ? "Contoh: Sumbangan 17 Agustus, Renovasi Pos Satpam, dll"
                                    : "Contoh: Iuran kebersihan bulanan, Iuran keamanan, dll (opsional)"
                            }
                        />
                    </Form.Item>


                    <Form.Item
                        name="amount"
                        label="Jumlah Tarif"
                        rules={[{ required: true, message: 'Masukkan jumlah tarif!' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/Rp\s?|(,*)/g, '')}
                            min={0}
                        />
                    </Form.Item>

                    <Form.Item
                        name="validFrom"
                        label="Berlaku Dari"
                        rules={[{ required: true, message: 'Pilih tanggal mulai berlaku!' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="validTo"
                        label="Berlaku Sampai (Opsional)"
                        help={tariffType === 'insidentil' ? 'Disarankan diisi untuk tarif insidentil' : 'Kosongkan jika tidak ada batas waktu'}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="propertyType"
                        label="Tipe Properti"
                        rules={[{ required: true, message: 'Pilih tipe properti!' }]}
                        initialValue="all"
                    >
                        <Select>
                            <Option value="all">Semua Tipe</Option>
                            <Option value="rumah">Rumah</Option>
                            <Option value="tanah">Tanah</Option>
                        </Select>
                    </Form.Item>
                </Form>

                <div style={{ marginTop: 16, padding: 12, background: '#f0f2f5', borderRadius: 4 }}>
                    <strong>Catatan:</strong>
                    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        <li><strong>Rutin:</strong> Iuran bulanan reguler (kebersihan, keamanan, dll)</li>
                        <li><strong>Insidentil:</strong> Iuran sementara (sumbangan, renovasi, dll) - wajib ada deskripsi</li>
                        <li>Tarif baru akan berlaku untuk pembayaran sesuai periode yang ditentukan</li>
                        <li>Pastikan tidak ada tumpang tindih periode untuk tipe properti yang sama</li>
                    </ul>
                </div>
            </Modal>
        </Card>
    );
}
