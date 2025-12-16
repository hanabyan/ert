import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Input, Typography, Descriptions } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { componentService } from '../services/api';
import { useMessage } from '../contexts/MessageContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function AdminComponentApproval() {
    const { message } = useMessage();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        loadPendingRequests();
    }, []);

    const loadPendingRequests = async () => {
        setLoading(true);
        try {
            const data = await componentService.getPendingRequests();
            setRequests(data);
        } catch (error) {
            message.error('Gagal memuat permintaan');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId) => {
        try {
            await componentService.approveRequest(requestId);
            message.success('Permintaan berhasil disetujui');
            loadPendingRequests();
        } catch (error) {
            message.error(error.response?.data?.error || 'Gagal menyetujui permintaan');
        }
    };

    const showRejectModal = (request) => {
        setSelectedRequest(request);
        setRejectionReason('');
        setRejectModalVisible(true);
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            message.warning('Alasan penolakan wajib diisi');
            return;
        }

        try {
            await componentService.rejectRequest(selectedRequest.id, rejectionReason);
            message.success('Permintaan berhasil ditolak');
            setRejectModalVisible(false);
            loadPendingRequests();
        } catch (error) {
            message.error(error.response?.data?.error || 'Gagal menolak permintaan');
        }
    };

    const showDetailModal = (request) => {
        setSelectedRequest(request);
        setDetailModalVisible(true);
    };

    const columns = [
        {
            title: 'Properti',
            key: 'property',
            render: (_, record) => `${record.block}${record.number}`,
        },
        {
            title: 'Warga',
            dataIndex: 'requester_name',
            key: 'requester_name',
        },
        {
            title: 'Komponen',
            dataIndex: 'component_name',
            key: 'component_name',
        },
        {
            title: 'Periode',
            key: 'period',
            render: (_, record) => {
                const start = dayjs(record.startDate).format('DD MMM YYYY');
                const end = record.endDate ? dayjs(record.endDate).format('DD MMM YYYY') : 'Selamanya';
                return `${start} - ${end}`;
            },
        },
        {
            title: 'Tanggal Request',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => dayjs(date).format('DD MMM YYYY HH:mm'),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color="gold">
                    {status === 'pending' ? 'MENUNGGU' : status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => showDetailModal(record)}
                    >
                        Detail
                    </Button>
                    <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleApprove(record.id)}
                        size="small"
                    >
                        Setujui
                    </Button>
                    <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => showRejectModal(record)}
                        size="small"
                    >
                        Tolak
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Card>
                <Title level={3}>
                    <CheckCircleOutlined /> Approval Permintaan Komponen
                </Title>
                <Text type="secondary">
                    Setujui atau tolak permintaan langganan komponen dari warga
                </Text>

                <div style={{ marginTop: 24 }}>
                    <Table
                        columns={columns}
                        dataSource={requests}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        locale={{
                            emptyText: 'Tidak ada permintaan pending'
                        }}
                    />
                </div>
            </Card>

            {/* Detail Modal */}
            <Modal
                title={<><EyeOutlined /> Detail Permintaan</>}
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        Tutup
                    </Button>,
                ]}
                width={600}
            >
                {selectedRequest && (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Properti">
                            {selectedRequest.block}{selectedRequest.number}
                        </Descriptions.Item>
                        <Descriptions.Item label="Warga">
                            {selectedRequest.requester_name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Komponen">
                            {selectedRequest.component_name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Mulai">
                            {dayjs(selectedRequest.startDate).format('DD MMMM YYYY')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Selesai">
                            {selectedRequest.endDate 
                                ? dayjs(selectedRequest.endDate).format('DD MMMM YYYY')
                                : 'Tidak ada batas waktu (selamanya)'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tanggal Request">
                            {dayjs(selectedRequest.created_at).format('DD MMMM YYYY HH:mm')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <Tag color="gold">MENUNGGU APPROVAL</Tag>
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            {/* Reject Modal */}
            <Modal
                title={<><CloseCircleOutlined /> Tolak Permintaan</>}
                open={rejectModalVisible}
                onOk={handleReject}
                onCancel={() => setRejectModalVisible(false)}
                okText="Tolak"
                cancelText="Batal"
                okButtonProps={{ danger: true }}
            >
                <p>Anda akan menolak permintaan dari:</p>
                {selectedRequest && (
                    <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                        <Text strong>{selectedRequest.requester_name}</Text>
                        <br />
                        <Text>Properti: {selectedRequest.block}{selectedRequest.number}</Text>
                        <br />
                        <Text>Komponen: {selectedRequest.component_name}</Text>
                    </div>
                )}
                <div style={{ marginTop: 16 }}>
                    <Text strong>Alasan Penolakan: <Text type="danger">*</Text></Text>
                    <TextArea
                        rows={4}
                        placeholder="Masukkan alasan penolakan (wajib diisi)"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        style={{ marginTop: 8 }}
                    />
                </div>
            </Modal>
        </div>
    );
}
