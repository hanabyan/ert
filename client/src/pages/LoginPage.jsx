import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout, Card, Form, Input, Button, Alert, Typography, Flex, Divider, Space } from 'antd';
import { LoginOutlined, HomeOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import WhatsAppButton from '../components/WhatsAppButton';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (values) => {
        setLoading(true);
        setError('');

        try {
            const data = await login(values.username, values.password);
            
            // Redirect based on role
            if (data.user.role === 'admin') {
                navigate('/admin/verify');
            } else {
                navigate('/warga/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Flex justify="center" align="center" style={{ minHeight: '100vh' }}>
            <Content className="login-page" style={{ padding: '50px', maxWidth: 400, margin: '0 auto' }}>
                <Card>
                    <Title level={2} style={{ textAlign: 'center' }}>
                        <LoginOutlined /> Login
                    </Title>
                    
                    <Form form={form} onFinish={handleSubmit} layout="vertical">
                        <Form.Item
                            label="Username"
                            name="username"
                            rules={[{ required: true, message: 'Masukkan username!' }]}
                        >
                            <Input size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[{ required: true, message: 'Masukkan password!' }]}
                        >
                            <Input.Password size="large" />
                        </Form.Item>

                        {error && <Alert title={error} type="error" showIcon style={{ marginBottom: 16 }} />}

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} size="large" block>
                                Login
                            </Button>
                        </Form.Item>
                    </Form>

                    <Divider />

                    {/* Link ke Halaman Utama */}
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                        <Link to="/" style={{ fontSize: '14px' }}>
                            <Space>
                                <HomeOutlined />
                                <span>Kembali ke Halaman Utama</span>
                            </Space>
                        </Link>
                    </div>

                    {/* Informasi Kontak Admin */}
                    <Alert
                        title="Butuh Bantuan?"
                        description={
                            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                                <Text type="secondary" style={{ fontSize: '13px' }}>
                                    Jika mengalami kendala login, silakan hubungi admin:
                                </Text>
                                <WhatsAppButton
                                    phoneNumber={import.meta.env.VITE_ADMIN_CONTACT_PHONE || "6281234567890"}
                                    message="Halo Admin, saya mengalami kendala saat login ke sistem RT/RW. Mohon bantuannya."
                                    buttonText="Hubungi Admin via WhatsApp"
                                    size="small"
                                    block
                                />
                            </Space>
                        }
                        type="info"
                        showIcon
                        style={{ 
                            marginTop: 8,
                            backgroundColor: '#f0f5ff',
                            border: '1px solid #adc6ff'
                        }}
                    />
                </Card>
            </Content>
        </Flex>
    );
}
