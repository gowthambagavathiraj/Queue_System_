import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function EditProfile() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await userAPI.getProfile();
      setName(res.data.name || '');
      setPhoneNumber(res.data.phoneNumber || '');
      setAddress(res.data.address || '');
    } catch {
      toast.error('Failed to load profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return toast.error('Name cannot be empty');
    }

    if (phoneNumber && phoneNumber.trim().length < 10) {
      return toast.error('Phone number must be at least 10 digits');
    }

    setLoading(true);
    try {
      const res = await userAPI.updateProfile({ 
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim()
      });
      
      // Update user context - merge with existing user data
      if (res.data.user) {
        const updatedUser = {
          ...user,
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
          phoneNumber: res.data.user.phoneNumber,
          address: res.data.user.address
        };
        updateUser(updatedUser);
      }
      
      toast.success('Profile updated successfully');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Back</button>
        <span style={styles.navTitle}>Edit Profile</span>
        <span />
      </nav>

      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <h2 style={styles.userName}>{user?.name}</h2>
              <p style={styles.userEmail}>{user?.email}</p>
              <span style={styles.roleBadge}>{user?.role}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Personal Information</h3>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email (Cannot be changed)</label>
                <input
                  type="email"
                  value={user?.email}
                  style={{ ...styles.input, background: '#f5f5f5', cursor: 'not-allowed' }}
                  disabled
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  style={styles.input}
                />
                <p style={styles.hint}>Optional - Used for SMS notifications</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your address (optional)"
                  style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
                  rows={3}
                />
                <p style={styles.hint}>Optional</p>
              </div>
            </div>

            <div style={styles.actions}>
              <button type="button" onClick={() => navigate('/dashboard')} style={styles.cancelBtn}>
                Cancel
              </button>
              <button type="submit" disabled={loading} style={styles.saveBtn}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f7fa' },
  nav: { background: 'white', boxShadow: '0 2px 20px rgba(0,0,0,0.08)', padding: '16px 32px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#667eea', fontWeight: 600 },
  navTitle: { fontSize: 20, fontWeight: 700, color: '#1a1a2e' },
  content: { maxWidth: 600, margin: '0 auto', padding: '40px 20px' },
  card: { background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  header: { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid #f0f0f0' },
  avatar: { width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700 },
  userName: { margin: 0, fontSize: 24, fontWeight: 700, color: '#1a1a2e' },
  userEmail: { margin: '4px 0', fontSize: 14, color: '#888' },
  roleBadge: { display: 'inline-block', background: '#667eea', color: 'white', padding: '4px 12px',
    borderRadius: 12, fontSize: 12, fontWeight: 600, marginTop: 8 },
  form: { display: 'flex', flexDirection: 'column', gap: 24 },
  section: { display: 'flex', flexDirection: 'column', gap: 16 },
  sectionTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 600, color: '#333' },
  input: { padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: 10, fontSize: 15, outline: 'none',
    transition: 'border-color 0.2s' },
  hint: { fontSize: 12, color: '#888', marginTop: 4, marginBottom: 0 },
  actions: { display: 'flex', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, background: 'white', border: '2px solid #e8e8e8', color: '#666',
    borderRadius: 10, padding: '14px 24px', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  saveBtn: { flex: 1, background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white',
    border: 'none', borderRadius: 10, padding: '14px 24px', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
};
