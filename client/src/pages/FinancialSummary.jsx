import React, { useState, useEffect } from 'react';
import { Card, DatePicker, Row, Col, Statistic, Table, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, WalletOutlined } from '@ant-design/icons';
import { dashboardService } from '../services/api';
import dayjs from 'dayjs';

export default function FinancialSummary() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs());

    useEffect(() => {
        fetchSummary(selectedDate.year(), selectedDate.month() + 1);
    }, [selectedDate]);

    const fetchSummary = async (year, month) => {
        setLoading(true);
        try {
            const data = await dashboardService.getFinancialSummary(year, month);
            setSummary(data);
        } catch (error) {
            console.error('Failed to fetch financial summary', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
    };

    const expenseColumns = [
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
    ];

    return (
        <div>
            <Card title="Laporan Keuangan" extra={
                <DatePicker
                    picker="month"
                    value={selectedDate}
                    onChange={handleDateChange}
                    format="MMMM YYYY"
                />
            }>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin size="large" />
                    </div>
                ) : summary ? (
                    <>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Card>
                                    <Statistic
                                        title="Total Pemasukan"
                                        value={summary.totalIncome}
                                        prefix={<ArrowUpOutlined />}
                                        suffix="IDR"
                                        styles={{ value: { color: '#3f8600' } }}
                                    />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card>
                                    <Statistic
                                        title="Total Pengeluaran"
                                        value={summary.totalExpense}
                                        prefix={<ArrowDownOutlined />}
                                        suffix="IDR"
                                        styles={{ value: { color: '#cf1322' } }}
                                    />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card>
                                    <Statistic
                                        title="Saldo"
                                        value={summary.balance}
                                        prefix={<WalletOutlined />}
                                        suffix="IDR"
                                        styles={{ value: { color: summary.balance >= 0 ? '#3f8600' : '#cf1322' } }}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Card title="Detail Pengeluaran" style={{ marginTop: 24 }}>
                            <Table
                                columns={expenseColumns}
                                dataSource={summary.expenses}
                                rowKey="id"
                                pagination={false}
                            />
                        </Card>
                    </>
                ) : null}
            </Card>
        </div>
    );
}
