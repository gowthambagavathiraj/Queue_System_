import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email, 2=OTP, 3=reset password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Email not found');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return toast.error('Please enter 6-digit OTP');
    }
    setStep(3);
    toast.success('OTP verified! Set your new password');
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      await authAPI.resetPassword(otp, newPassword);
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>🔐</div>
          <h1 style={styles.title}>
            {step === 1 ? 'Forgot Password' : step === 2 ? 'Verify OTP' : 'Reset Password'}
          </h1>
          <p style={styles.subtitle}>
            {step === 1 ? 'Enter your email to receive OTP' : 
             step === 2 ? 'Enter the 6-digit code sent to your email' :
             'Create a new password'}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOtp} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your registered email" style={styles.input} required />
            </div>
            <button type="submit" disabled={loading} style={styles.primaryBtn}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Enter OTP</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code" maxLength={6} style={styles.input} required />
            </div>
            <button type="submit" style={styles.primaryBtn}>
              Verify OTP
            </button>
            <button type="button" onClick={() => setStep(1)} style={styles.backBtn}>
              ← Back to Email
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleReset} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>New Password</label>
              <div style={styles.passWrap}>
                <input type={showPass ? 'text' : 'password'} value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password" style={{ ...styles.input, paddingRight: 50 }} required />
                <button type="button" onClick={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  {showPass ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.passWrap}>
                <input type={showConfirmPass ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password" style={{ ...styles.input, paddingRight: 50 }} required />
                <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} style={styles.eyeBtn}>
                  {showConfirmPass ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={styles.primaryBtn}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p style={styles.switchText}>
          Remember your password? <Link to="/login" style={styles.link}>Sign In</Link>
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
  subtitle: { color: '#666', margin: '4px 0 0', fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 600, color: '#333' },
  input: { padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: 10, fontSize: 15, outline: 'none' },
  passWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 },
  primaryBtn: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white',
    border: 'none', borderRadius: 10, padding: '14px', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  backBtn: { background: 'none', border: '2px solid #e8e8e8', borderRadius: 10, padding: '12px',
    fontSize: 15, cursor: 'pointer', color: '#666' },
  switchText: { textAlign: 'center', color: '#666', fontSize: 14, marginTop: 16 },
  link: { color: '#667eea', fontWeight: 600, textDecoration: 'none' },
};
