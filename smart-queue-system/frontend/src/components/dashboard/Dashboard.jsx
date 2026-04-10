import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orgAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ORG_ICONS = { HOSPITAL: '🏥', BANK: '🏦', GOVERNMENT_OFFICE: '🏢' };
const ORG_COLORS = {
  HOSPITAL: 'linear-gradient(135deg, #f093fb, #f5576c)',
  BANK: 'linear-gradient(135deg, #4facfe, #00f2fe)',
  GOVERNMENT_OFFICE: 'linear-gradient(135deg, #43e97b, #38f9d7)'
};

export default function Dashboard() {
  const [organizations, setOrganizations] = useState([]);
  const [availability, setAvailability] = useState({});
  const [orgStats, setOrgStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSector, setNewSector] = useState({
    name: '', openTime: '09:00', closeTime: '17:00', openSunday: false, open24Hours: false, dailyTokenLimit: 100
  });
  const [creating, setCreating] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const res = await orgAPI.getAll();
      setOrganizations(res.data);
      // Check availability and load stats for each org
      res.data.forEach(async (org) => {
        try {
          const avail = await orgAPI.checkAvailability(org.id);
          setAvailability(prev => ({ ...prev, [org.id]: avail.data }));
        } catch {}
        
        // Load stats for admin users
        if (user?.role === 'ADMIN') {
          try {
            const stats = await orgAPI.getOrganizationStats(org.id);
            setOrgStats(prev => ({ ...prev, [org.id]: stats.data }));
          } catch {}
        }
      });
    } catch {
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSector = async () => {
    if (!newSector.name.trim()) {
      toast.error('Please enter sector name');
      return;
    }
    setCreating(true);
    try {
      await orgAPI.createOrganization({
        ...newSector,
        type: selectedType,
        active: true
      });
      toast.success('Sector created successfully!');
      setShowCreateModal(false);
      setNewSector({ name: '', openTime: '09:00', closeTime: '17:00', openSunday: false, open24Hours: false, dailyTokenLimit: 100 });
      loadOrganizations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create sector');
    } finally {
      setCreating(false);
    }
  };

  const handleOrgClick = (org) => {
    // Prevent admin from generating tokens
    if (user?.role === 'ADMIN') {
      toast.error('Admins cannot generate tokens. Please use a regular user account.');
      return;
    }
    // Allow staff and regular users to navigate
    navigate(`/queue/${org.id}`, { state: { org } });
  };

  const groupedOrgs = {
    HOSPITAL: organizations.filter(o => o.type === 'HOSPITAL'),
    BANK: organizations.filter(o => o.type === 'BANK'),
    GOVERNMENT_OFFICE: organizations.filter(o => o.type === 'GOVERNMENT_OFFICE')
  };

  const typeLabels = {
    HOSPITAL: '🏥 Hospitals',
    BANK: '🏦 Banks',
    GOVERNMENT_OFFICE: '🏢 Government Offices'
  };

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.navBrand}>🎫 Queue System</div>
        <div style={styles.navRight}>
          <span style={styles.greeting}>Hello, {user?.name} 👋</span>
          <button onClick={() => navigate('/profile')} style={styles.profileBtn}>👤 Profile</button>
          {user?.role === 'ADMIN' && (
            <button onClick={() => navigate('/admin')} style={styles.staffBtn}>Admin Panel</button>
          )}
          {user?.role === 'USER' && (
            <button onClick={() => navigate('/my-tokens')} style={styles.outlineBtn}>My Tokens</button>
          )}
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>

      <div style={styles.content}>
        <div style={styles.heroSection}>
          <h1 style={styles.heroTitle}>Select an Organization</h1>
          <p style={styles.heroSubtitle}>Choose a service to generate your queue token</p>
        </div>

        {loading ? (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner}>⏳</div>
            <p>Loading organizations...</p>
          </div>
        ) : (
          <>
            {!selectedType ? (
              <div style={styles.typeGrid}>
                {Object.keys(groupedOrgs).map(type => (
                  groupedOrgs[type].length > 0 && (
                    <div key={type} onClick={() => setSelectedType(type)} style={styles.typeCard}>
                      <div style={styles.typeIcon}>
                        {type === 'HOSPITAL' ? '🏥' : type === 'BANK' ? '🏦' : '🏢'}
                      </div>
                      <h2 style={styles.typeName}>{typeLabels[type]}</h2>
                      <p style={styles.typeCount}>{groupedOrgs[type].length} available</p>
                      <div style={styles.arrow}>→</div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <button onClick={() => setSelectedType(null)} style={styles.backButton}>
                    ← Back to Categories
                  </button>
                  {user?.role === 'ADMIN' && (
                    <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>
                      ➕ Create Sector
                    </button>
                  )}
                </div>
                <h2 style={styles.categoryTitle}>{typeLabels[selectedType]}</h2>
                <div style={styles.orgGrid}>
                  {groupedOrgs[selectedType].map(org => {
                    const avail = availability[org.id];
                    const stats = orgStats[org.id];
                    const isAvailable = !avail || avail.available;
                    const hasNoServices = org.services?.length === 0;
                    return (
                      <div key={org.id} style={{ position: 'relative' }}>
                        <div onClick={() => handleOrgClick(org)}
                          style={{ ...styles.orgCard, background: ORG_COLORS[org.type] || '#667eea',
                            cursor: 'pointer', opacity: hasNoServices ? 0.7 : 1 }}>
                          <div style={styles.orgIcon}>{ORG_ICONS[org.type] || '🏢'}</div>
                          <h2 style={styles.orgName}>{org.name}</h2>
                          
                          {/* Warning for no services */}
                          {hasNoServices && user?.role === 'ADMIN' && (
                            <div style={styles.noServiceWarning}>
                              ⚠️ No services - Click Manage to add
                            </div>
                          )}
                          
                          {/* Daily Statistics for Admin */}
                          {user?.role === 'ADMIN' && stats && !hasNoServices && (
                            <div style={styles.statsBar}>
                              <div style={styles.statItem}>
                                <span style={styles.statValue}>{stats.totalTokens}</span>
                                <span style={styles.statLabel}>Today</span>
                              </div>
                              <div style={styles.statItem}>
                                <span style={styles.statValue}>{stats.waitingTokens}</span>
                                <span style={styles.statLabel}>Waiting</span>
                              </div>
                              <div style={styles.statItem}>
                                <span style={styles.statValue}>{stats.remainingTokens}</span>
                                <span style={styles.statLabel}>Remaining</span>
                              </div>
                            </div>
                          )}
                          
                          {!hasNoServices && (
                            <div style={styles.badge}>
                              {isAvailable ? (
                                <span style={{ ...styles.availBadge, background: 'rgba(255,255,255,0.3)' }}>
                                  ✅ Available Now
                                </span>
                              ) : (
                                <span style={{ ...styles.availBadge, background: 'rgba(255,255,255,0.3)' }}>
                                  ⏰ {avail?.message || 'Check availability'}
                                </span>
                              )}
                            </div>
                          )}
                          {org.open24Hours ? (
                            <p style={styles.orgHours}>Open 24 Hours · 7 Days</p>
                          ) : (
                            <p style={styles.orgHours}>
                              {org.openTime} – {org.closeTime} · {org.openSunday ? 'All Days' : 'Mon–Sat'}
                            </p>
                          )}
                          <div style={styles.arrow}>→</div>
                        </div>
                        {user?.role === 'ADMIN' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/organization/${org.id}`); }}
                            style={styles.manageBtn}>
                            ⚙️ Manage
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Create Sector Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Create New Sector</h2>
            <p style={styles.modalSubtitle}>Add a new {typeLabels[selectedType]?.toLowerCase()} sector</p>

            <div style={styles.formGroup}>
              <label style={styles.label}>Sector Name *</label>
              <input type="text" value={newSector.name} 
                onChange={(e) => setNewSector({ ...newSector, name: e.target.value })}
                placeholder={`e.g., ${selectedType === 'HOSPITAL' ? 'Apollo Hospital' : selectedType === 'BANK' ? 'HDFC Bank - Main Branch' : 'District Collectorate'}`}
                style={styles.input} />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <input type="checkbox" checked={newSector.open24Hours}
                    onChange={(e) => setNewSector({ ...newSector, open24Hours: e.target.checked })}
                    style={{ marginRight: 8 }} />
                  Open 24 Hours
                </label>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <input type="checkbox" checked={newSector.openSunday}
                    onChange={(e) => setNewSector({ ...newSector, openSunday: e.target.checked })}
                    disabled={newSector.open24Hours}
                    style={{ marginRight: 8 }} />
                  Open on Sunday
                </label>
              </div>
            </div>

            {!newSector.open24Hours && (
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Opening Time</label>
                  <input type="time" value={newSector.openTime}
                    onChange={(e) => setNewSector({ ...newSector, openTime: e.target.value })}
                    style={styles.input} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Closing Time</label>
                  <input type="time" value={newSector.closeTime}
                    onChange={(e) => setNewSector({ ...newSector, closeTime: e.target.value })}
                    style={styles.input} />
                </div>
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Daily Token Limit</label>
              <input type="number" value={newSector.dailyTokenLimit}
                onChange={(e) => setNewSector({ ...newSector, dailyTokenLimit: parseInt(e.target.value) || 100 })}
                min="1" max="1000" style={styles.input} />
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setShowCreateModal(false)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={handleCreateSector} disabled={creating} style={styles.submitBtn}>
                {creating ? 'Creating...' : 'Create Sector'}
              </button>
            </div>
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
  navBrand: { fontSize: 22, fontWeight: 700, color: '#667eea' },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  greeting: { color: '#333', fontWeight: 500 },
  profileBtn: { background: '#3498db', color: 'white', border: 'none', borderRadius: 8,
    padding: '8px 16px', cursor: 'pointer', fontWeight: 600 },
  staffBtn: { background: '#667eea', color: 'white', border: 'none', borderRadius: 8,
    padding: '8px 16px', cursor: 'pointer', fontWeight: 600 },
  outlineBtn: { background: 'none', border: '2px solid #667eea', color: '#667eea', borderRadius: 8,
    padding: '8px 16px', cursor: 'pointer', fontWeight: 600 },
  logoutBtn: { background: '#ff4757', color: 'white', border: 'none', borderRadius: 8,
    padding: '8px 16px', cursor: 'pointer', fontWeight: 600 },
  content: { maxWidth: 1100, margin: '0 auto', padding: '40px 20px' },
  heroSection: { textAlign: 'center', marginBottom: 40 },
  heroTitle: { fontSize: 36, fontWeight: 800, color: '#1a1a2e', margin: 0 },
  heroSubtitle: { color: '#666', fontSize: 16, marginTop: 8 },
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 40 },
  typeCard: { borderRadius: 20, padding: 40, background: 'linear-gradient(135deg, #667eea, #764ba2)', 
    color: 'white', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)', position: 'relative', textAlign: 'center' },
  typeIcon: { fontSize: 64, marginBottom: 16 },
  typeName: { margin: 0, fontSize: 28, fontWeight: 700 },
  typeCount: { margin: '12px 0 0', opacity: 0.9, fontSize: 16 },
  backButton: { background: 'white', border: '2px solid #667eea', color: '#667eea',
    borderRadius: 10, padding: '10px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 20 },
  createBtn: { background: '#2ecc71', color: 'white', border: 'none', borderRadius: 10,
    padding: '10px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(46,204,113,0.3)' },
  categoryTitle: { fontSize: 32, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 },
  orgGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 },
  orgCard: { borderRadius: 20, padding: 32, color: 'white', transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)', position: 'relative' },
  orgIcon: { fontSize: 52, marginBottom: 12 },
  orgName: { margin: 0, fontSize: 24, fontWeight: 700 },
  noServiceWarning: { background: 'rgba(255,255,255,0.25)', padding: '8px 12px', borderRadius: 8,
    fontSize: 13, fontWeight: 600, marginTop: 12, textAlign: 'center' },
  statsBar: { display: 'flex', gap: 16, marginTop: 16, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.3)',
    borderBottom: '1px solid rgba(255,255,255,0.3)' },
  statItem: { flex: 1, textAlign: 'center' },
  statValue: { display: 'block', fontSize: 20, fontWeight: 800, marginBottom: 4 },
  statLabel: { display: 'block', fontSize: 11, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' },
  badge: { marginTop: 12 },
  availBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: 20,
    fontSize: 13, fontWeight: 600 },
  orgHours: { margin: '12px 0 0', opacity: 0.9, fontSize: 13 },
  arrow: { position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
    fontSize: 24, opacity: 0.8 },
  manageBtn: { position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.95)',
    border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', color: '#667eea', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 10 },
  loadingWrap: { textAlign: 'center', padding: 60 },
  spinner: { fontSize: 48, marginBottom: 12 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', borderRadius: 20, padding: 32, width: '90%', maxWidth: 500,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#1a1a2e' },
  modalSubtitle: { margin: '0 0 24px', color: '#666', fontSize: 14 },
  formGroup: { marginBottom: 20 },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 },
  input: { width: '100%', padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: 10,
    fontSize: 15, outline: 'none', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 10,
    padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  submitBtn: { flex: 1, background: '#2ecc71', color: 'white', border: 'none', borderRadius: 10,
    padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
};
