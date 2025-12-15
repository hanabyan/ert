import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, message, Modal, Image, Descriptions } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { adminService } from '../services/api';

export default function AdminPaymentVerification() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [detailVisible, setDetailVisible] = useState(false);

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const fetchPendingPayments = async () => {
        setLoading(true);
        try {
            const data = await adminService.getPendingPayments();
            setPayments(data);
        } catch (error) {
            message.error('Gagal memuat data pembayaran');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id, status) => {
        try {
            await adminService.verifyPayment(id, status);
            message.success(`Pembayaran ${status === 'verified' ? 'disetujui' : 'ditolak'}`);
            fetchPendingPayments();
        } catch (error) {
            message.error('Gagal memproses pembayaran');
        }
    };

    const showDetail = (payment) => {
        setSelectedPayment(payment);
        setDetailVisible(true);
    };

    const columns = [
        {
            title: 'ID Transaksi',
            dataIndex: 'id',
            key: 'id',
            width: 100,
        },
        {
            title: 'Tanggal',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleDateString('id-ID'),
        },
        {
            title: 'Total',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount) => `Rp ${amount.toLocaleString('id-ID')}`,
        },
        {
            title: 'Jumlah Item',
            dataIndex: 'items',
            key: 'itemCount',
            render: (items) => items?.length || 0,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color="warning">Pending</Tag>
            ),
        },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => showDetail(record)}
                    >
                        Detail
                    </Button>
                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => handleVerify(record.id, 'verified')}
                    >
                        Setujui
                    </Button>
                    <Button
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => handleVerify(record.id, 'rejected')}
                    >
                        Tolak
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <Card title="Verifikasi Pembayaran">
            <Table
                columns={columns}
                dataSource={payments}
                rowKey="id"
                loading={loading}
            />

            <Modal
                title="Detail Pembayaran"
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                footer={null}
                width={700}
            >
                {selectedPayment && (
                    <>
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label="ID Transaksi">{selectedPayment.id}</Descriptions.Item>
                            <Descriptions.Item label="Total">
                                Rp {selectedPayment.totalAmount.toLocaleString('id-ID')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tanggal" span={2}>
                                {new Date(selectedPayment.created_at).toLocaleString('id-ID')}
                            </Descriptions.Item>
                        </Descriptions>

                        <h3 style={{ marginTop: 20 }}>Item Pembayaran:</h3>
                        <Table
                            dataSource={selectedPayment.items}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            columns={[
                                { title: 'Properti ID', dataIndex: 'propertyId', key: 'propertyId' },
                                { title: 'Bulan', dataIndex: 'month', key: 'month' },
                                { title: 'Tahun', dataIndex: 'year', key: 'year' },
                                {
                                    title: 'Jumlah',
                                    dataIndex: 'amount',
                                    key: 'amount',
                                    render: (amount) => `Rp ${amount.toLocaleString('id-ID')}`,
                                },
                            ]}
                        />

                        {selectedPayment.proofImage && (
                            <div style={{ marginTop: 20 }}>
                                <h3>Bukti Pembayaran:</h3>
                                <Image src={selectedPayment.proofImage} alt="Bukti Pembayaran" />
                            </div>
                        )}
                    </>
                )}
            </Modal>
        </Card>
    );
}
