import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      login(res.data);
      toast.success('Registration successful!');
      navigate('/welcome');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    try {
      const res = await authAPI.googleLogin(credentialResponse.credential);
      login(res.data);
      toast.success('Welcome!');
      navigate('/welcome');
    } catch {
      toast.error('Google sign-in failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>🎫</div>
          <h1 style={styles.title}>Smart Queue</h1>
          <p style={styles.subtitle}>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <input name="name" type="text" value={form.name} onChange={handleChange}
              placeholder="Enter your full name" style={styles.input} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="Enter your email" style={styles.input} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passWrap}>
              <input name="password" type={showPass ? 'text' : 'password'} value={form.password}
                onChange={handleChange} placeholder="Create a password"
                style={{ ...styles.input, paddingRight: 50 }} required />
              <button type="button" onClick={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                {showPass ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.primaryBtn}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={styles.divider}><span>or</span></div>

        <div style={styles.googleWrap}>
          <GoogleLogin onSuccess={handleGoogle} onError={() => toast.error('Google error')}
            text="signup_with" shape="rectangular" width="100%" />
        </div>

        <p style={styles.switchText}>
          Already have an account? <Link to="/login" style={styles.link}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { background: 'white', borderRadius: 20, padding: 40, width: '100%', maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  header: { textAlign: 'center', marginBottom: 30 },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: '#1a1a2e' },
  subtitle: { color: '#666', margin: '4px 0 0' },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 600, color: '#333' },
  input: { padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: 10, fontSize: 15,
    outline: 'none', transition: 'border 0.2s' },
  passWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 },
  primaryBtn: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white',
    border: 'none', borderRadius: 10, padding: '14px', fontSize: 16, fontWeight: 600,
    cursor: 'pointer', marginTop: 4 },
  divider: { textAlign: 'center', margin: '20px 0', color: '#aaa', fontSize: 13,
    display: 'flex', alignItems: 'center', gap: 10,
    '&::before': { content: '""', flex: 1, height: 1, background: '#eee' } },
  googleWrap: { display: 'flex', justifyContent: 'center', marginBottom: 20 },
  switchText: { textAlign: 'center', color: '#666', fontSize: 14 },
  link: { color: '#667eea', fontWeight: 600, textDecoration: 'none' },
};
