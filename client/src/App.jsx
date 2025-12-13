import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';
import { dashboardService } from './services/api';

// Simple Landing Page Component
function LandingPage() {
    const [block, setBlock] = useState('');
    const [number, setNumber] = useState('');
    const [property, setProperty] = useState(null);
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const prop = await dashboardService.searchProperty(block, number);
            setProperty(prop);
            
            // Get current month overview
            const now = new Date();
            const data = await dashboardService.getOverview(
                block,
                number,
                now.getMonth() + 1,
                now.getFullYear()
            );
            setOverview(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Property not found');
            setProperty(null);
            setOverview(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: '3rem' }}>
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    🏘️ Iuran Warga
                </h1>
                
                <form onSubmit={handleSearch}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="input-label">Blok</label>
                        <select
                            className="input"
                            value={block}
                            onChange={(e) => setBlock(e.target.value)}
                            required
                        >
                            <option value="">Pilih Blok</option>
                            <option value="A">Blok A</option>
                            <option value="B">Blok B</option>
                            <option value="C">Blok C</option>
                            <option value="D">Blok D</option>
                            <option value="E">Blok E</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="input-label">Nomor Rumah</label>
                        <input
                            type="number"
                            className="input"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            placeholder="Masukkan nomor rumah"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Mencari...' : 'Cari Properti'}
                    </button>
                </form>

                {error && (
                    <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
                        {error}
                    </div>
                )}

                {property && overview && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3>Properti {property.block}{property.number}</h3>
                        <p>Tipe: {property.type === 'rumah' ? 'Rumah' : 'Tanah'}</p>
                        
                        <div style={{ marginTop: '1.5rem' }}>
                            <h4>Status Pembayaran (6 Bulan Terakhir)</h4>
                            {overview.totalDebt > 0 && (
                                <div className="alert alert-danger">
                                    Total Tunggakan: Rp {overview.totalDebt.toLocaleString('id-ID')}
                                </div>
                            )}
                            
                            <div className="table-container" style={{ marginTop: '1rem' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Bulan</th>
                                            <th>Tahun</th>
                                            <th>Tarif</th>
                                            <th>Dibayar</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {overview.months.map((m, i) => (
                                            <tr key={i} style={m.status === 'unpaid' ? { background: 'rgba(239, 68, 68, 0.1)' } : {}}>
                                                <td>{m.month}</td>
                                                <td>{m.year}</td>
                                                <td>Rp {m.expectedAmount.toLocaleString('id-ID')}</td>
                                                <td>Rp {m.paidAmount.toLocaleString('id-ID')}</td>
                                                <td>
                                                    <span className={`badge ${m.status === 'paid' ? 'badge-success' : 'badge-danger'}`}>
                                                        {m.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Simple Login Page
function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(username, password);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: '3rem' }}>
            <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <h2 style={{ textAlign: 'center' }}>Login</h2>
                
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="input-label">Username</label>
                        <input
                            type="text"
                            className="input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="input-label">Password</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="alert alert-danger">{error}</div>}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Loading...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Admin Dashboard
function AdminDashboard() {
    const { logout } = useAuth();
    
    return (
        <div className="container" style={{ paddingTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h1>Admin Dashboard</h1>
                <button onClick={logout} className="btn btn-secondary">Logout</button>
            </div>

            <div className="grid grid-2">
                <div className="card">
                    <h3>Verifikasi Pembayaran</h3>
                    <p>Kelola pembayaran yang masuk dari warga</p>
                </div>

                <div className="card">
                    <h3>Kelola Pengeluaran</h3>
                    <p>Tambah dan kelola pengeluaran cluster</p>
                </div>

                <div className="card">
                    <h3>Master Tarif</h3>
                    <p>Atur tarif iuran bulanan</p>
                </div>

                <div className="card">
                    <h3>Laporan Keuangan</h3>
                    <p>Lihat ringkasan pemasukan dan pengeluaran</p>
                </div>
            </div>
        </div>
    );
}

// Main App Router
function AppContent() {
    const { isAuthenticated, isAdmin } = useAuth();
    const [showLogin, setShowLogin] = useState(false);

    if (showLogin && !isAuthenticated) {
        return <LoginPage />;
    }

    if (isAuthenticated && isAdmin) {
        return <AdminDashboard />;
    }

    return (
        <div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                {!isAuthenticated && (
                    <button onClick={() => setShowLogin(true)} className="btn btn-primary">
                        Login Admin
                    </button>
                )}
            </div>
            <LandingPage />
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
