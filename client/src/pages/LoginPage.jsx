import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Form, Input, Button, Alert, Typography, Flex } from 'antd';
import { LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Content } = Layout;
const { Title } = Typography;

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
                </Card>
            </Content>
        </Flex>
    );
}
