import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Table, Tag, DatePicker, Select, Button, Descriptions, Alert, Space, Modal, Image } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, FileImageOutlined } from '@ant-design/icons';
import { dashboardService } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

export default function WargaDetail() {
    const { block, number } = useParams();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [year, setYear] = useState(dayjs().year());
    const [statusFilter, setStatusFilter] = useState('all');
    const [propertyInfo, setPropertyInfo] = useState(null);

    useEffect(() => {
        fetchHistory();
        // Fetch generic property info (optional, or extract from first history item if available)
        // For now we rely on the header to show Block/Number from params
    }, [block, number, year, statusFilter]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await dashboardService.getDetailHistory(block, number, year, statusFilter);
            setHistory(data);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Bulan',
            dataIndex: 'month',
            key: 'month',
            render: (month) => dayjs().month(month - 1).format('MMMM'),
            sorter: (a, b) => a.month - b.month,
        },
        {
            title: 'Tanggal Bayar',
            dataIndex: 'created_at',
            key: 'date',
            render: (date) => date ? dayjs(date).format('DD MMM YYYY HH:mm') : '-',
        },
        {
            title: 'Jumlah Pembayaran',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => `Rp ${parseInt(amount).toLocaleString('id-ID')}`,
        },
        {
            title: 'Tarif Seharusnya',
            dataIndex: 'expectedAmount',
            key: 'expectedAmount',
            render: (amount) => amount ? `Rp ${amount.toLocaleString('id-ID')}` : '-',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colorMap = {
                    verified: 'success',
                    pending: 'warning',
                    rejected: 'error',
                };
                return (
                    <Tag color={colorMap[status] || 'default'}>
                        {status === 'verified' ? 'Lunas' : status === 'pending' ? 'Menunggu Verifikasi' : 'Ditolak'}
                    </Tag>
                );
            },
        },
        {
            title: 'Bukti',
            dataIndex: 'proof_image',
            key: 'proof',
            render: (image) => image ? (
                <Image
                    width={40}
                    src={image}
                    preview={{
                        src: image,
                    }}
                    alt="Bukti Transfer"
                />
            ) : '-',
        },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <Link to="/">
                <Button icon={<ArrowLeftOutlined />} style={{ marginBottom: 16 }}>
                    Kembali ke Pencarian
                </Button>
            </Link>

            <Card
                title={`Riwayat Pembayaran - Blok ${block} No. ${number}`}
                extra={
                    <Space>
                        <DatePicker 
                            picker="year" 
                            value={dayjs().year(year)}
                            onChange={(date) => setYear(date ? date.year() : dayjs().year())}
                            allowClear={false}
                        />
                        <Select 
                            value={statusFilter} 
                            onChange={setStatusFilter} 
                            style={{ width: 120 }}
                        >
                            <Option value="all">Semua Status</Option>
                            <Option value="paid">Lunas</Option>
                            <Option value="unpaid">Belum Lunas/Pending</Option>
                        </Select>
                    </Space>
                }
            >
                {/* Statistics Summary for the selected year perhaps? */}
                
                <Table
                    columns={columns}
                    dataSource={history}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 12 }}
                    locale={{ emptyText: 'Belum ada riwayat pembayaran untuk periode ini' }}
                />
            </Card>
        </div>
    );
}
