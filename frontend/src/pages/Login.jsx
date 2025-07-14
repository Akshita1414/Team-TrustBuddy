import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Login failed');
        return;
      }
      localStorage.setItem('username', username);
      if (onLogin) onLogin(username);
      window.location.href = '/';
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ maxWidth: 380, width: '100%', background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px #0002', padding: 36, margin: 24 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, textAlign: 'center', color: '#1e293b' }}>Login</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, color: '#334155' }}>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={{ width: '100%', padding: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 16, outline: 'none', background: '#f1f5f9', marginBottom: 2 }}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, color: '#334155' }}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 16, outline: 'none', background: '#f1f5f9', marginBottom: 2 }}
            />
          </div>
          {error && <div style={{ color: '#ef4444', marginBottom: 14, textAlign: 'center', fontWeight: 500 }}>{error}</div>}
          <button type="submit" style={{ width: '100%', padding: 12, background: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: 18, border: 'none', borderRadius: 8, boxShadow: '0 1px 4px #0001', marginTop: 6, marginBottom: 8, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={e => (e.currentTarget.style.background = '#2563eb')}
            onMouseOut={e => (e.currentTarget.style.background = '#3b82f6')}
          >
            Login
          </button>
        </form>
        <div style={{ marginTop: 18, textAlign: 'center', color: '#64748b', fontSize: 15 }}>
          Don't have an account? <a href="/signup" style={{ color: '#3b82f6', fontWeight: 500, textDecoration: 'none' }}>Sign up</a>
        </div>
      </div>
    </div>
  );
};

export default Login; 