import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { tokenAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const STATUS_COLORS = {
  WAITING: '#f39c12', SERVING: '#2ecc71', COMPLETED: '#667eea', CANCELLED: '#ff4757'
};

export default function MyTokens() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingToken, setViewingToken] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = () => {
    if (user?.role === 'ADMIN') {
      // Admin sees all tokens
      api.get('/admin/tokens/all')
        .then(r => setTokens(r.data))
        .catch(() => toast.error('Failed to load tokens'))
        .finally(() => setLoading(false));
    } else {
      // Regular users see only their tokens
      tokenAPI.myTokens()
        .then(r => setTokens(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  const handleCancel = async (tokenId) => {
    if (!window.confirm('Are you sure you want to cancel this token?')) return;
    try {
      await tokenAPI.cancelToken(tokenId);
      toast.success('Token cancelled');
      loadTokens();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel token');
    }
  };

  const handleDelete = async (tokenId) => {
    if (!window.confirm('Are you sure you want to permanently delete this token?')) return;
    try {
      if (user?.role === 'ADMIN') {
        await api.delete(`/admin/tokens/${tokenId}`);
      } else {
        await api.delete(`/tokens/delete/${tokenId}`);
      }
      toast.success('Token deleted');
      loadTokens();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete token');
    }
  };

  const formatAppointmentTime = (dateTime) => {
    if (!dateTime) return 'TBD';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Back</button>
        <span style={styles.navTitle}>
          {user?.role === 'ADMIN' ? 'All Tokens (Admin View)' : 'My Tokens'}
        </span>
        <span />
      </nav>
      <div style={styles.content}>
        {loading ? (
          <div style={styles.center}>Loading...</div>
        ) : tokens.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 64 }}>🎫</div>
            <h2>No tokens yet</h2>
            <p>Generate your first token to get started</p>
            <button onClick={() => navigate('/dashboard')} style={styles.primaryBtn}>Go to Dashboard</button>
          </div>
        ) : (
          <div style={styles.tokenList}>
            {tokens.map(token => (
              <div key={token.id} style={styles.tokenCard}>
                <div style={styles.tokenLeft}>
                  <div style={styles.tokenNum}>{token.tokenNumber}</div>
                  <div style={styles.tokenDate}>{new Date(token.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={styles.tokenMiddle}>
                  <div style={styles.serviceName}>{token.service?.name}</div>
                  <div style={styles.orgName}>{token.organization?.name}</div>
                  {token.appointmentTime && (
                    <div style={styles.appointmentTime}>
                      ⏰ {formatAppointmentTime(token.appointmentTime)}
                    </div>
                  )}
                  {user?.role === 'ADMIN' && token.user && (
                    <div style={styles.userInfo}>
                      👤 {token.user.name} ({token.user.email})
                    </div>
                  )}
                  <div style={styles.phoneInfo}>📱 {token.phoneNumber || 'No phone'}</div>
                </div>
                <div style={styles.tokenRight}>
                  <span style={{ ...styles.statusBadge, background: STATUS_COLORS[token.status] }}>
                    {token.status}
                  </span>
                  <div style={styles.actions}>
                    <button onClick={() => setViewingToken(token)} style={styles.viewBtn}>👁️ View</button>
                    {user?.role === 'ADMIN' ? (
                      <button onClick={() => handleDelete(token.id)} style={styles.deleteBtn}>🗑️ Delete</button>
                    ) : (
                      <>
                        {token.status === 'WAITING' && (
                          <button onClick={() => handleCancel(token.id)} style={styles.cancelBtn}>❌ Cancel</button>
                        )}
                        {token.status === 'CANCELLED' && (
                          <button onClick={() => handleDelete(token.id)} style={styles.deleteBtn}>🗑️ Delete</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Token Modal */}
      {viewingToken && (
        <div style={styles.modal} onClick={() => setViewingToken(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Token Details</h2>
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Token Number</span>
                <span style={styles.detailValue}>{viewingToken.tokenNumber}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Organization</span>
                <span style={styles.detailValue}>{viewingToken.organization?.name}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Service</span>
                <span style={styles.detailValue}>{viewingToken.service?.name}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Queue Position</span>
                <span style={styles.detailValue}>#{viewingToken.queuePosition}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Appointment Time</span>
                <span style={styles.detailValue}>{formatAppointmentTime(viewingToken.appointmentTime)}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Phone Number</span>
                <span style={styles.detailValue}>{viewingToken.phoneNumber}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Status</span>
                <span style={{ ...styles.statusBadge, background: STATUS_COLORS[viewingToken.status] }}>
                  {viewingToken.status}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Created At</span>
                <span style={styles.detailValue}>
                  {new Date(viewingToken.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            <button onClick={() => setViewingToken(null)} style={styles.closeBtn}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f7fa' },
  nav: { background: 'white', boxShadow: '0 2px 20px rgba(0,0,0,0.08)', padding: '16px 32px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#667eea', fontWeight: 600 },
  navTitle: { fontSize: 20, fontWeight: 700 },
  content: { maxWidth: 900, margin: '0 auto', padding: '40px 20px' },
  tokenList: { display: 'flex', flexDirection: 'column', gap: 14 },
  tokenCard: { background: 'white', borderRadius: 14, padding: '20px 24px', display: 'flex',
    alignItems: 'center', gap: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  tokenLeft: { minWidth: 90 },
  tokenNum: { fontSize: 22, fontWeight: 800, color: '#667eea' },
  tokenDate: { fontSize: 12, color: '#aaa', marginTop: 4 },
  tokenMiddle: { flex: 1 },
  serviceName: { fontWeight: 700, fontSize: 16, color: '#1a1a2e' },
  orgName: { fontSize: 13, color: '#888', marginTop: 4 },
  appointmentTime: { fontSize: 14, color: '#667eea', marginTop: 6, fontWeight: 600 },
  userInfo: { fontSize: 13, color: '#2ecc71', marginTop: 6, fontWeight: 600 },
  phoneInfo: { fontSize: 13, color: '#666', marginTop: 6 },
  tokenRight: { display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' },
  statusBadge: { color: 'white', padding: '4px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  viewBtn: { background: '#3498db', color: 'white', border: 'none', borderRadius: 6, 
    padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
  editBtn: { background: '#667eea', color: 'white', border: 'none', borderRadius: 6, 
    padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
  cancelBtn: { background: '#ff4757', color: 'white', border: 'none', borderRadius: 6,
    padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
  deleteBtn: { background: '#c0392b', color: 'white', border: 'none', borderRadius: 6,
    padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'white', borderRadius: 16, padding: 32, maxWidth: 500, width: '90%',
    maxHeight: '80vh', overflow: 'auto' },
  modalTitle: { margin: '0 0 24px', fontSize: 24, fontWeight: 700, color: '#1a1a2e' },
  detailsGrid: { display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 },
  detailItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  detailLabel: { fontSize: 14, color: '#888', fontWeight: 500 },
  detailValue: { fontSize: 14, fontWeight: 600, color: '#1a1a2e', textAlign: 'right' },
  closeBtn: { background: '#667eea', color: 'white', border: 'none', borderRadius: 8,
    padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', width: '100%' },
  editForm: { marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' },
  input: { padding: '6px 10px', border: '2px solid #e0e0e0', borderRadius: 6, fontSize: 13, width: 150 },
  saveBtn: { background: '#2ecc71', color: 'white', border: 'none', borderRadius: 6,
    padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
  cancelEditBtn: { background: '#aaa', color: 'white', border: 'none', borderRadius: 6,
    padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
  emptyState: { textAlign: 'center', padding: '60px 20px' },
  center: { textAlign: 'center', padding: 60 },
  primaryBtn: { background: '#667eea', color: 'white', border: 'none', borderRadius: 10,
    padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 16 },
};
