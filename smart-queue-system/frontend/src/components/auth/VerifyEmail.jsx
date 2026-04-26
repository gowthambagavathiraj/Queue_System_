import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmail() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email || '';
  const name = location.state?.name || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    try {
      const res = await authAPI.verifyEmail({ email, otp });
      login(res.data);
      toast.success('Email verified successfully!');
      navigate('/welcome');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authAPI.resendVerification({ email });
      toast.success('OTP resent to your email');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    navigate('/register');
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>📧</div>
          <h1 style={styles.title}>Verify Your Email</h1>
          <p style={styles.subtitle}>
            Hi {name}! We've sent a 6-digit OTP to<br />
            <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              style={styles.otpInput}
              maxLength={6}
              required
            />
            <p style={styles.hint}>OTP expires in 10 minutes</p>
          </div>

          <button type="submit" disabled={loading || otp.length !== 6} style={styles.primaryBtn}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div style={styles.resendSection}>
          <p style={styles.resendText}>Didn't receive the OTP?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={styles.resendBtn}
          >
            {resending ? 'Resending...' : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    background: 'white',
    borderRadius: 20,
    padding: 40,
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  subtitle: {
    color: '#666',
    margin: '12px 0 0',
    lineHeight: 1.6,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
  },
  otpInput: {
    padding: '16px',
    border: '2px solid #e8e8e8',
    borderRadius: 10,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 600,
    outline: 'none',
    transition: 'border 0.2s',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    margin: 0,
    textAlign: 'center',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    padding: '14px',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
    transition: 'opacity 0.2s',
  },
  resendSection: {
    textAlign: 'center',
    marginTop: 24,
  },
  resendText: {
    color: '#666',
    fontSize: 14,
    margin: '0 0 8px',
  },
  resendBtn: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};
