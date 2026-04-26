import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orgAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ORG_ICONS = { HOSPITAL: '🏥', BANK: '🏦', GOVERNMENT_OFFICE: '🏢' };
const ORG_COLORS = {
  HOSPITAL: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Pink gradient
  BANK: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', // Cyan gradient
  GOVERNMENT_OFFICE: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' // Purple gradient
};

export default function Dashboard() {
  const [organizations, setOrganizations] = useState([]);
  const [availability, setAvailability] = useState({});
  const [orgStats, setOrgStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSector, setNewSector] = useState({
    name: '', location: '', openTime: '09:00', closeTime: '17:00', openSunday: false, open24Hours: false, dailyTokenLimit: 100
  });
  const [creating, setCreating] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrganizations();
  }, []);

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
    if (!newSector.location.trim()) {
      toast.error('Please enter location');
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
      setNewSector({ name: '', location: '', openTime: '09:00', closeTime: '17:00', openSunday: false, open24Hours: false, dailyTokenLimit: 100 });
      loadOrganizations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create sector');
    } finally {
      setCreating(false);
    }
  };

  const handleOrgClick = (org) => {
    // Admin clicks go to management page
    if (user?.role === 'ADMIN') {
      navigate(`/admin/organization/${org.id}`);
      return;
    }
    // Allow staff and regular users to navigate to queue
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
          {user?.role === 'STAFF' && (
            <button onClick={() => navigate('/staff/daily-report')} style={styles.staffBtn}>📊 Daily Report</button>
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
                {Object.keys(groupedOrgs).map((type, index) => {
                  const orgCount = groupedOrgs[type].length;
                  return (
                    <div key={type} onClick={() => setSelectedType(type)} 
                      className="fade-in hover-lift stagger-item"
                      style={styles.typeCard}>
                      <div style={styles.typeIcon}>
                        {type === 'HOSPITAL' ? '🏥' : type === 'BANK' ? '🏦' : '🏢'}
                      </div>
                      <h2 style={styles.typeName}>{typeLabels[type]}</h2>
                      <p style={styles.typeCount}>
                        {orgCount > 0 ? `${orgCount} available` : 'No sectors yet'}
                      </p>
                      <div style={styles.arrow}>→</div>
                    </div>
                  );
                })}
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
                
                {groupedOrgs[selectedType].length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>📭</div>
                    <h3 style={styles.emptyTitle}>No Available Sectors</h3>
                    <p style={styles.emptyText}>
                      {user?.role === 'ADMIN' 
                        ? `There are no ${typeLabels[selectedType]?.toLowerCase()} sectors created yet.`
                        : `No ${typeLabels[selectedType]?.toLowerCase()} sectors are currently available in your area.`
                      }
                    </p>
                    {user?.role === 'ADMIN' && (
                      <button onClick={() => setShowCreateModal(true)} style={styles.createSectorBtn}>
                        ➕ Create First Sector
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={styles.orgGrid}>
                    {groupedOrgs[selectedType].map((org, index) => {
                    const avail = availability[org.id];
                    const stats = orgStats[org.id];
                    const isAvailable = !avail || avail.available;
                    const hasNoServices = org.services?.length === 0;
                    return (
                      <div key={org.id} className="fade-in hover-lift stagger-item" style={{ position: 'relative' }}>
                        <div onClick={() => handleOrgClick(org)}
                          style={{ ...styles.orgCard, background: ORG_COLORS[org.type] || '#667eea',
                            cursor: 'pointer', opacity: hasNoServices ? 0.7 : 1 }}>
                          <div style={styles.orgIcon}>{ORG_ICONS[org.type] || '🏢'}</div>
                          <h2 style={styles.orgName}>{org.name}</h2>
                          {org.location && (
                            <p style={styles.orgLocation}>📍 {org.location}</p>
                          )}
                          
                          {/* Warning for no services */}
                          {hasNoServices && user?.role === 'ADMIN' && (
                            <div style={styles.noServiceWarning}>
                              ⚠️ No services - Click to add services
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
                      </div>
                    );
                  })}
                </div>
                )}
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

            <div style={styles.formGroup}>
              <label style={styles.label}>Location *</label>
              <input type="text" value={newSector.location} 
                onChange={(e) => setNewSector({ ...newSector, location: e.target.value })}
                placeholder="e.g., Karur, Chennai, Coimbatore"
                style={styles.input} />
            </div>

            <div style={styles.formRow}>
              {selectedType === 'HOSPITAL' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <input type="checkbox" checked={newSector.open24Hours}
                      onChange={(e) => setNewSector({ ...newSector, open24Hours: e.target.checked })}
                      style={{ marginRight: 8 }} />
                    Open 24 Hours
                  </label>
                </div>
              )}
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
  page: { minHeight: '100vh', background: '#f8fafc' },
  nav: { background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', padding: '16px 32px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' },
  navBrand: { fontSize: 24, fontWeight: 800, background: 'linear-gradient(135deg, #667eea, #764ba2)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  greeting: { color: '#475569', fontWeight: 600, fontSize: 15 },
  profileBtn: { background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10,
    padding: '10px 20px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px rgba(59,130,246,0.3)' },
  staffBtn: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: 10,
    padding: '10px 20px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px rgba(102,126,234,0.3)' },
  outlineBtn: { background: 'white', border: '2px solid #667eea', color: '#667eea', borderRadius: 10,
    padding: '10px 20px', cursor: 'pointer', fontWeight: 600 },
  logoutBtn: { background: '#ef4444', color: 'white', border: 'none', borderRadius: 10,
    padding: '10px 20px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px rgba(239,68,68,0.3)' },
  content: { maxWidth: 1200, margin: '0 auto', padding: '48px 20px' },
  heroSection: { textAlign: 'center', marginBottom: 48 },
  heroTitle: { fontSize: 42, fontWeight: 800, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' },
  heroSubtitle: { color: '#64748b', fontSize: 18, marginTop: 12, fontWeight: 500 },
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 48 },
  typeCard: { borderRadius: 20, padding: 48, background: 'linear-gradient(135deg, #667eea, #764ba2)', 
    color: 'white', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 8px 24px rgba(102,126,234,0.25)', position: 'relative', textAlign: 'center',
    border: '2px solid rgba(255,255,255,0.2)' },
  typeIcon: { fontSize: 72, marginBottom: 20, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' },
  typeName: { margin: 0, fontSize: 32, fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  typeCount: { margin: '16px 0 0', opacity: 0.95, fontSize: 18, fontWeight: 600 },
  backButton: { background: 'white', border: '2px solid #667eea', color: '#667eea',
    borderRadius: 12, padding: '12px 24px', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginBottom: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  createBtn: { background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 12,
    padding: '12px 24px', fontSize: 16, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' },
  categoryTitle: { fontSize: 36, fontWeight: 800, color: '#1e293b', marginBottom: 32, letterSpacing: '-0.5px' },
  orgGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 },
  orgCard: { borderRadius: 20, padding: 36, color: 'white', transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)', position: 'relative', border: '2px solid rgba(255,255,255,0.2)' },
  orgIcon: { fontSize: 56, marginBottom: 16, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' },
  orgName: { margin: 0, fontSize: 26, fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  orgLocation: { margin: '8px 0 0', fontSize: 15, fontWeight: 600, opacity: 0.95 },
  noServiceWarning: { background: 'rgba(255,255,255,0.25)', padding: '10px 16px', borderRadius: 10,
    fontSize: 14, fontWeight: 600, marginTop: 16, textAlign: 'center', border: '1px solid rgba(255,255,255,0.3)' },
  statsBar: { display: 'flex', gap: 20, marginTop: 20, padding: '16px 0', borderTop: '2px solid rgba(255,255,255,0.3)',
    borderBottom: '2px solid rgba(255,255,255,0.3)' },
  statItem: { flex: 1, textAlign: 'center' },
  statValue: { display: 'block', fontSize: 24, fontWeight: 900, marginBottom: 6, textShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  statLabel: { display: 'block', fontSize: 12, opacity: 0.95, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 },
  badge: { marginTop: 16 },
  availBadge: { display: 'inline-block', padding: '6px 16px', borderRadius: 20,
    fontSize: 14, fontWeight: 700, background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.3)' },
  orgHours: { margin: '16px 0 0', opacity: 0.95, fontSize: 14, fontWeight: 600 },
  arrow: { position: 'absolute', right: 28, top: '50%', transform: 'translateY(-50%)',
    fontSize: 28, opacity: 0.9, fontWeight: 'bold' },
  loadingWrap: { textAlign: 'center', padding: 80 },
  spinner: { fontSize: 56, marginBottom: 16 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 24, padding: 40, width: '90%', maxWidth: 540,
    boxShadow: '0 24px 64px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { margin: '0 0 12px', fontSize: 28, fontWeight: 800, color: '#1e293b' },
  modalSubtitle: { margin: '0 0 32px', color: '#64748b', fontSize: 16 },
  formGroup: { marginBottom: 24 },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  label: { display: 'block', fontSize: 15, fontWeight: 600, color: '#475569', marginBottom: 10 },
  input: { width: '100%', padding: '14px 18px', border: '2px solid #e2e8f0', borderRadius: 12,
    fontSize: 16, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  modalActions: { display: 'flex', gap: 16, marginTop: 32 },
  cancelBtn: { flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 12,
    padding: '14px', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  submitBtn: { flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 12,
    padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' },
  emptyState: { textAlign: 'center', padding: '100px 20px', background: 'white', borderRadius: 24,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '2px dashed #e2e8f0' },
  emptyIcon: { fontSize: 96, marginBottom: 24, opacity: 0.5 },
  emptyTitle: { margin: '0 0 16px', fontSize: 28, fontWeight: 800, color: '#1e293b' },
  emptyText: { margin: '0 0 32px', fontSize: 18, color: '#64748b', lineHeight: 1.6 },
  createSectorBtn: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white',
    border: 'none', borderRadius: 14, padding: '16px 40px', fontSize: 18, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)' },
};
