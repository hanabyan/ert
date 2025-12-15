import React, { useState } from 'react';
import { Card, Form, Select, InputNumber, Button, Table, message, Space, Upload } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { paymentService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;

export default function BatchPayment() {
    const { user } = useAuth();
    const [form] = Form.useForm();
    const [cart, setCart] = useState([]);
    const [proofImage, setProofImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAddToCart = (values) => {
        const newItem = {
            ...values,
            key: Date.now(),
        };
        setCart([...cart, newItem]);
        form.resetFields();
        message.success('Item ditambahkan ke keranjang');
    };

    const handleRemoveFromCart = (key) => {
        setCart(cart.filter(item => item.key !== key));
    };

    const handleSubmit = async () => {
        if (cart.length === 0) {
            message.error('Keranjang kosong!');
            return;
        }

        setLoading(true);
        try {
            const paymentItems = cart.map(item => ({
                propertyId: item.propertyId,
                month: item.month,
                year: item.year,
                amount: item.amount,
            }));

            await paymentService.submitPayment(paymentItems, proofImage);
            message.success('Pembayaran berhasil disubmit! Menunggu verifikasi admin.');
            setCart([]);
            setProofImage(null);
        } catch (error) {
            message.error('Gagal submit pembayaran');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Properti ID',
            dataIndex: 'propertyId',
            key: 'propertyId',
        },
        {
            title: 'Bulan',
            dataIndex: 'month',
            key: 'month',
        },
        {
            title: 'Tahun',
            dataIndex: 'year',
            key: 'year',
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
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveFromCart(record.key)}
                >
                    Hapus
                </Button>
            ),
        },
    ];

    const totalAmount = cart.reduce((sum, item) => sum + item.amount, 0);

    const uploadProps = {
        beforeUpload: (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('Hanya file gambar yang diperbolehkan!');
                return false;
            }
            setProofImage(file);
            return false;
        },
        maxCount: 1,
    };

    return (
        <div>
            <Card title="Tambah Item Pembayaran">
                <Form form={form} layout="vertical" onFinish={handleAddToCart}>
                    <Form.Item
                        name="propertyId"
                        label="Properti ID"
                        rules={[{ required: true, message: 'Pilih properti!' }]}
                    >
                        <InputNumber style={{ width: '100%' }} placeholder="ID Properti" />
                    </Form.Item>

                    <Form.Item
                        name="month"
                        label="Bulan"
                        rules={[{ required: true, message: 'Pilih bulan!' }]}
                    >
                        <Select placeholder="Pilih bulan">
                            {Array.from({ length: 12 }, (_, i) => (
                                <Option key={i + 1} value={i + 1}>
                                    {new Date(2000, i).toLocaleString('id-ID', { month: 'long' })}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="year"
                        label="Tahun"
                        rules={[{ required: true, message: 'Masukkan tahun!' }]}
                    >
                        <InputNumber style={{ width: '100%' }} placeholder="Tahun" />
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

                    <Form.Item>
                        <Button type="dashed" htmlType="submit" icon={<PlusOutlined />} block>
                            Tambah ke Keranjang
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            <Card title="Keranjang Pembayaran" style={{ marginTop: 24 }}>
                <Table
                    columns={columns}
                    dataSource={cart}
                    pagination={false}
                    summary={() => (
                        <Table.Summary.Row>
                            <Table.Summary.Cell colSpan={3}>
                                <strong>Total</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell>
                                <strong>Rp {totalAmount.toLocaleString('id-ID')}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell />
                        </Table.Summary.Row>
                    )}
                />

                <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>Upload Bukti Pembayaran</Button>
                    </Upload>

                    <Button
                        type="primary"
                        size="large"
                        block
                        onClick={handleSubmit}
                        loading={loading}
                        disabled={cart.length === 0}
                    >
                        Submit Pembayaran
                    </Button>
                </Space>
            </Card>
        </div>
    );
}
