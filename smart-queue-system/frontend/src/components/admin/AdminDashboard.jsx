import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orgAPI } from '../../services/api';
import api from '../../services/api';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const navigate = useNavigate();

  useEffect(() => { 
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch { toast.error('Failed to load users'); }
  };

  const updateUser = async (id, data) => {
    try {
      await api.put(`/admin/users/${id}`, data);
      toast.success('User updated!');
      setEditingUser(null);
      loadUsers();
    } catch { toast.error('Failed to update user'); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted!');
      loadUsers();
    } catch { toast.error('Failed to delete user'); }
  };

  const tabs = [
    { id: 'users', label: '👥 Manage Users' },
  ];

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.brand}>🛡️ Admin Panel</span>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Dashboard</button>
      </nav>

      <div style={styles.content}>
        <div style={styles.tabBar}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ ...styles.tab, background: activeTab === t.id ? '#667eea' : 'white',
                color: activeTab === t.id ? 'white' : '#333' }}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <div>
            <h2 style={styles.sectionTitle}>User Management</h2>
            <div style={styles.userList}>
              {users.map(user => (
                <UserCard key={user.id} user={user}
                  onEdit={setEditingUser}
                  onDelete={deleteUser}
                  onUpdate={updateUser}
                  isEditing={editingUser?.id === user.id}
                  editData={editingUser}
                  setEditData={setEditingUser} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UserCard({ user, onEdit, onDelete, onUpdate, isEditing, editData, setEditData }) {
  const getRoleBadge = (role) => {
    const badges = {
      ADMIN: { bg: '#ff4757', text: '👑 Admin' },
      STAFF: { bg: '#667eea', text: '👔 Staff' },
      USER: { bg: '#2ecc71', text: '👤 User' }
    };
    return badges[role] || badges.USER;
  };

  if (isEditing) {
    return (
      <div style={userCardStyles.card}>
        <div style={userCardStyles.form}>
          <input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })}
            style={styles.input} placeholder="Name" />
          
          <select value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })}
            style={styles.input}>
            <option value="USER">👤 User</option>
            <option value="STAFF">👔 Staff</option>
            <option value="ADMIN">👑 Admin</option>
          </select>
          
          <label style={styles.checkLabel}>
            <input type="checkbox" checked={editData.emailVerified}
              onChange={e => setEditData({ ...editData, emailVerified: e.target.checked })} />
            Email Verified
          </label>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onUpdate(user.id, editData)} style={userCardStyles.saveBtn}>Save</button>
            <button onClick={() => setEditData(null)} style={userCardStyles.cancelBtn}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  const badge = getRoleBadge(user.role);
  
  return (
    <div style={userCardStyles.card}>
      <div style={userCardStyles.header}>
        <div>
          <h4 style={userCardStyles.name}>{user.name}</h4>
          <div style={userCardStyles.email}>{user.email}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ ...userCardStyles.badge, background: badge.bg }}>{badge.text}</span>
            {user.emailVerified && <span style={userCardStyles.verified}>✓ Verified</span>}
            {!user.emailVerified && <span style={userCardStyles.unverified}>✗ Not Verified</span>}
          </div>
        </div>
        <div style={userCardStyles.actions}>
          <button onClick={() => onEdit(user)} style={userCardStyles.editBtn}>✏️ Edit</button>
          <button onClick={() => onDelete(user.id)} style={userCardStyles.deleteBtn}>🗑️ Delete</button>
        </div>
      </div>
      <div style={userCardStyles.details}>
        <div>📅 Joined: {new Date(user.createdAt).toLocaleDateString()}</div>
        <div>🔐 Provider: {user.provider}</div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f7fa' },
  nav: { background: '#1a1a2e', color: 'white', padding: '16px 32px', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: 20, fontWeight: 700 },
  backBtn: { background: 'none', border: '2px solid white', color: 'white',
    borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 },
  content: { maxWidth: 1200, margin: '0 auto', padding: '30px 20px' },
  tabBar: { display: 'flex', gap: 10, marginBottom: 30 },
  tab: { padding: '12px 24px', border: '2px solid #e8e8e8', borderRadius: 10, cursor: 'pointer',
    fontWeight: 600, fontSize: 15, transition: 'all 0.15s' },
  sectionTitle: { fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 20 },
  userList: { display: 'flex', flexDirection: 'column', gap: 16 },
  orgGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  orgCard: { background: 'white', borderRadius: 16, padding: 24, cursor: 'pointer',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': { transform: 'translateY(-4px)', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } },
  orgIcon: { fontSize: 48, marginBottom: 12 },
  orgName: { margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  orgType: { background: '#f0f0ff', color: '#667eea', padding: '4px 12px', borderRadius: 6,
    fontSize: 12, fontWeight: 600, display: 'inline-block', marginBottom: 12 },
  orgHours: { fontSize: 13, color: '#666', marginBottom: 16 },
  viewBtn: { color: '#667eea', fontWeight: 600, fontSize: 14 },
  createBtn: { background: '#2ecc71', color: 'white', border: 'none', borderRadius: 10,
    padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', 
    boxShadow: '0 4px 12px rgba(46,204,113,0.3)' },
  input: { padding: '10px 14px', border: '2px solid #e8e8e8', borderRadius: 8, fontSize: 14, outline: 'none' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, fontSize: 14 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', borderRadius: 20, padding: 32, width: '90%', maxWidth: 500,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#1a1a2e' },
  modalSubtitle: { margin: '0 0 24px', color: '#666', fontSize: 14 },
  formGroup: { marginBottom: 20 },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 },
  modalInput: { width: '100%', padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: 10,
    fontSize: 15, outline: 'none', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: 12, marginTop: 24 },
  cancelModalBtn: { flex: 1, background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 10,
    padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  submitBtn: { flex: 1, background: '#2ecc71', color: 'white', border: 'none', borderRadius: 10,
    padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
};

const userCardStyles = {
  card: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  name: { margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  email: { fontSize: 14, color: '#666', marginBottom: 4 },
  badge: { color: 'white', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 },
  verified: { background: '#d4edda', color: '#155724', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 },
  unverified: { background: '#f8d7da', color: '#721c24', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 },
  actions: { display: 'flex', gap: 8 },
  editBtn: { background: '#667eea', color: 'white', border: 'none', borderRadius: 6,
    padding: '6px 12px', fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  deleteBtn: { background: '#ff4757', color: 'white', border: 'none', borderRadius: 6,
    padding: '6px 12px', fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  details: { fontSize: 13, color: '#666', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  saveBtn: { flex: 1, background: '#2ecc71', color: 'white', border: 'none', borderRadius: 6,
    padding: '10px', cursor: 'pointer', fontWeight: 600 },
  cancelBtn: { flex: 1, background: '#aaa', color: 'white', border: 'none', borderRadius: 6,
    padding: '10px', cursor: 'pointer', fontWeight: 600 },
};
