import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function OrganizationDetails() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [stats, setStats] = useState(null);
  const [services, setServices] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({ name: '', description: '', avgServiceTimeMinutes: 15 });
  const [editingService, setEditingService] = useState(null);

  // Service suggestions based on organization type
  const serviceSuggestions = {
    HOSPITAL: [
      { name: 'Doctor Consultation', description: 'General physician consultation', time: 15 },
      { name: 'Lab Test', description: 'Blood, urine and diagnostic tests', time: 20 },
      { name: 'Pharmacy', description: 'Medicine dispensing', time: 5 },
      { name: 'X-Ray', description: 'X-ray imaging service', time: 15 },
      { name: 'Vaccination', description: 'Immunization service', time: 10 },
      { name: 'Emergency', description: 'Emergency medical service', time: 30 }
    ],
    BANK: [
      { name: 'Cash Deposit/Withdrawal', description: 'Deposit or withdraw money', time: 10 },
      { name: 'Loan Enquiry', description: 'Home, personal and vehicle loans', time: 20 },
      { name: 'Account Opening', description: 'Open new savings or current account', time: 25 },
      { name: 'Cheque Book Request', description: 'Request new cheque book', time: 5 },
      { name: 'Fixed Deposit', description: 'Open fixed deposit account', time: 15 },
      { name: 'Credit Card', description: 'Credit card application', time: 20 },
      { name: 'Locker Service', description: 'Safe deposit locker', time: 10 }
    ],
    GOVERNMENT_OFFICE: [
      { name: 'Document Submission', description: 'Submit official documents', time: 15 },
      { name: 'Certificate Verification', description: 'Verify certificates', time: 10 },
      { name: 'Application Processing', description: 'Process pending applications', time: 20 },
      { name: 'License Renewal', description: 'Renew licenses', time: 15 },
      { name: 'Passport Service', description: 'Passport application/renewal', time: 30 },
      { name: 'Birth Certificate', description: 'Birth certificate issuance', time: 15 },
      { name: 'Ration Card', description: 'Ration card services', time: 20 }
    ]
  };

  const handleServiceSuggestionClick = (suggestion) => {
    setNewService({
      name: suggestion.name,
      description: suggestion.description,
      avgServiceTimeMinutes: suggestion.time
    });
  };

  useEffect(() => {
    loadOrgDetails();
  }, [orgId]);

  const loadOrgDetails = async () => {
    try {
      const [orgRes, statsRes, servicesRes] = await Promise.all([
        api.get(`/organizations/${orgId}`),
        api.get(`/admin/organizations/${orgId}/stats`),
        api.get(`/organizations/${orgId}/services`)
      ]);
      setOrg(orgRes.data);
      setStats(statsRes.data);
      setServices(servicesRes.data);
      setEditData(orgRes.data);
    } catch {
      toast.error('Failed to load organization details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/admin/organizations/${orgId}`, editData);
      toast.success('Organization updated!');
      setEditing(false);
      loadOrgDetails();
    } catch {
      toast.error('Failed to update organization');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${org?.name}"?\n\nThis will:\n- Deactivate the sector\n- Hide it from users\n- Preserve all historical data\n\nThis action can be reversed by reactivating the sector.`)) {
      return;
    }
    try {
      await api.put(`/admin/organizations/${orgId}`, { ...org, active: false });
      toast.success('Sector deleted successfully!');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to delete sector');
    }
  };

  const addService = async () => {
    if (!newService.name) return toast.error('Service name is required');
    try {
      await api.post(`/admin/organizations/${orgId}/services`, newService);
      toast.success('Service added!');
      setNewService({ name: '', description: '', avgServiceTimeMinutes: 15 });
      loadOrgDetails();
    } catch {
      toast.error('Failed to add service');
    }
  };

  const updateService = async (serviceId, data) => {
    try {
      await api.put(`/admin/services/${serviceId}`, data);
      toast.success('Service updated!');
      setEditingService(null);
      loadOrgDetails();
    } catch {
      toast.error('Failed to update service');
    }
  };

  const deleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.delete(`/admin/services/${serviceId}`);
      toast.success('Service deleted!');
      loadOrgDetails();
    } catch {
      toast.error('Failed to delete service');
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Back to Dashboard</button>
        <span style={styles.navTitle}>{org?.name}</span>
        <span />
      </nav>

      <div style={styles.content}>
        {/* Warning if no services */}
        {services.length === 0 && (
          <div style={styles.warningBanner}>
            <div style={styles.warningIcon}>⚠️</div>
            <div style={styles.warningContent}>
              <h3 style={styles.warningTitle}>No Services Available</h3>
              <p style={styles.warningText}>
                This sector has no services. Users cannot generate tokens until you add at least one service.
                You can delete this sector if it's no longer needed.
              </p>
            </div>
          </div>
        )}

        {/* Token Statistics */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📊 Daily Token Statistics</h2>
          <div style={styles.statsGrid}>
            <div style={{ ...styles.statCard, borderLeft: '4px solid #667eea' }}>
              <div style={styles.statNum}>{stats?.totalTokens || 0}</div>
              <div style={styles.statLabel}>Total Today</div>
            </div>
            <div style={{ ...styles.statCard, borderLeft: '4px solid #2ecc71' }}>
              <div style={styles.statNum}>{stats?.usedTokens || 0}</div>
              <div style={styles.statLabel}>Used</div>
            </div>
            <div style={{ ...styles.statCard, borderLeft: '4px solid #f39c12' }}>
              <div style={styles.statNum}>{stats?.remainingTokens || 0}</div>
              <div style={styles.statLabel}>Remaining</div>
            </div>
            <div style={{ ...styles.statCard, borderLeft: '4px solid #3498db' }}>
              <div style={styles.statNum}>{stats?.waitingTokens || 0}</div>
              <div style={styles.statLabel}>Waiting</div>
            </div>
          </div>
          <div style={styles.limitInfo}>
            Daily Token Limit: <strong>{org?.dailyTokenLimit}</strong> tokens
          </div>
        </div>

        {/* Organization Management */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>🏢 Organization Settings</h2>
            {!editing && (
              <div style={styles.actions}>
                <button onClick={() => setEditing(true)} style={styles.editBtn}>✏️ Edit</button>
                <button onClick={handleDelete} style={styles.deleteBtn}>🗑️ Delete Sector</button>
              </div>
            )}
          </div>

          {editing ? (
            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Organization Name</label>
                <input value={editData.name} 
                  onChange={e => setEditData({ ...editData, name: e.target.value })}
                  style={styles.input} />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Type</label>
                <input value={editData.type} disabled
                  style={{ ...styles.input, background: '#f5f5f5', cursor: 'not-allowed', color: '#999' }} />
                <p style={{ fontSize: 12, color: '#999', margin: '4px 0 0' }}>
                  Organization type cannot be changed after creation
                </p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Daily Token Limit</label>
                <input type="number" value={editData.dailyTokenLimit}
                  onChange={e => setEditData({ ...editData, dailyTokenLimit: parseInt(e.target.value) })}
                  style={styles.input} min="1" />
              </div>

              <label style={styles.checkLabel}>
                <input type="checkbox" checked={editData.open24Hours}
                  onChange={e => setEditData({ ...editData, open24Hours: e.target.checked })} />
                Open 24 Hours
              </label>

              {!editData.open24Hours && (
                <>
                  <div style={styles.timeRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Open Time</label>
                      <input type="time" value={editData.openTime}
                        onChange={e => setEditData({ ...editData, openTime: e.target.value })}
                        style={styles.input} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Close Time</label>
                      <input type="time" value={editData.closeTime}
                        onChange={e => setEditData({ ...editData, closeTime: e.target.value })}
                        style={styles.input} />
                    </div>
                  </div>
                  <label style={styles.checkLabel}>
                    <input type="checkbox" checked={editData.openSunday}
                      onChange={e => setEditData({ ...editData, openSunday: e.target.checked })} />
                    Open on Sunday
                  </label>
                </>
              )}

              <div style={styles.buttonRow}>
                <button onClick={handleUpdate} style={styles.saveBtn}>Save Changes</button>
                <button onClick={() => { setEditing(false); setEditData(org); }} style={styles.cancelBtn}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.detailsView}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Type:</span>
                <span style={styles.detailValue}>{org?.type}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Daily Token Limit:</span>
                <span style={styles.detailValue}>{org?.dailyTokenLimit} tokens</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Operating Hours:</span>
                <span style={styles.detailValue}>
                  {org?.open24Hours ? 'Open 24/7' : 
                   `${org?.openTime} - ${org?.closeTime} ${org?.openSunday ? '(All Days)' : '(Mon-Sat)'}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Services Management */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🔧 Services</h2>
          
          {/* Add New Service */}
          <div style={styles.addServiceForm}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Add New Service</h3>
            
            {/* Service Suggestions */}
            {org?.type && serviceSuggestions[org.type] && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ ...styles.label, marginBottom: 8 }}>Quick Select (Click to use):</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {serviceSuggestions[org.type].map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleServiceSuggestionClick(suggestion)}
                      style={styles.suggestionBtn}
                    >
                      {suggestion.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={styles.label}>Service Name</label>
                <input value={newService.name}
                  onChange={e => setNewService({ ...newService, name: e.target.value })}
                  placeholder="e.g., Doctor Consultation"
                  style={styles.input} 
                  list="service-suggestions" />
              </div>
              <div>
                <label style={styles.label}>Description</label>
                <input value={newService.description}
                  onChange={e => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Brief description"
                  style={styles.input} />
              </div>
              <div>
                <label style={styles.label}>Avg Time (min)</label>
                <input type="number" value={newService.avgServiceTimeMinutes}
                  onChange={e => setNewService({ ...newService, avgServiceTimeMinutes: parseInt(e.target.value) })}
                  style={styles.input} min="1" />
              </div>
              <button onClick={addService} style={styles.addServiceBtn}>+ Add</button>
            </div>
          </div>

          {/* Services List */}
          <div style={styles.servicesList}>
            {services.length === 0 ? (
              <div style={styles.emptyServicesState}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>No Services Available</h3>
                <p style={{ margin: '0 0 16px', color: '#666' }}>
                  This organization doesn't have any services yet. Add services using the form above to allow users to generate tokens.
                </p>
                <div style={{ background: '#fff3cd', padding: 12, borderRadius: 8, fontSize: 14, color: '#856404' }}>
                  💡 Tip: Add at least one service to make this organization functional for users.
                </div>
              </div>
            ) : (
              services.map(service => (
                <ServiceCard key={service.id} service={service}
                  onEdit={setEditingService}
                  onDelete={deleteService}
                  onUpdate={updateService}
                  isEditing={editingService?.id === service.id}
                  editData={editingService}
                  setEditData={setEditingService} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service, onEdit, onDelete, onUpdate, isEditing, editData, setEditData }) {
  if (isEditing) {
    return (
      <div style={serviceCardStyles.card}>
        <div style={serviceCardStyles.form}>
          <input value={editData.name}
            onChange={e => setEditData({ ...editData, name: e.target.value })}
            placeholder="Service Name"
            style={serviceCardStyles.input} />
          <input value={editData.description}
            onChange={e => setEditData({ ...editData, description: e.target.value })}
            placeholder="Description"
            style={serviceCardStyles.input} />
          <input type="number" value={editData.avgServiceTimeMinutes}
            onChange={e => setEditData({ ...editData, avgServiceTimeMinutes: parseInt(e.target.value) })}
            placeholder="Avg Time"
            style={serviceCardStyles.input} min="1" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onUpdate(service.id, editData)} style={serviceCardStyles.saveBtn}>Save</button>
            <button onClick={() => setEditData(null)} style={serviceCardStyles.cancelBtn}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={serviceCardStyles.card}>
      <div style={serviceCardStyles.header}>
        <div>
          <h4 style={serviceCardStyles.name}>{service.name}</h4>
          <p style={serviceCardStyles.desc}>{service.description}</p>
          <span style={serviceCardStyles.time}>⏱ ~{service.avgServiceTimeMinutes} min avg</span>
        </div>
        <div style={serviceCardStyles.actions}>
          <button onClick={() => onEdit(service)} style={serviceCardStyles.editBtn}>✏️</button>
          <button onClick={() => onDelete(service.id)} style={serviceCardStyles.deleteBtn}>🗑️</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f7fa' },
  nav: { background: 'white', boxShadow: '0 2px 20px rgba(0,0,0,0.08)', padding: '16px 32px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', 
    color: '#667eea', fontWeight: 600 },
  navTitle: { fontSize: 20, fontWeight: 700, color: '#1a1a2e' },
  content: { maxWidth: 1000, margin: '0 auto', padding: '40px 20px' },
  loading: { textAlign: 'center', padding: 60, fontSize: 18 },
  warningBanner: { background: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)', color: 'white', 
    borderRadius: 16, padding: 24, marginBottom: 24, display: 'flex', gap: 20, alignItems: 'center',
    boxShadow: '0 4px 20px rgba(255,107,107,0.3)' },
  warningIcon: { fontSize: 48, flexShrink: 0 },
  warningContent: { flex: 1 },
  warningTitle: { margin: '0 0 8px', fontSize: 20, fontWeight: 700 },
  warningText: { margin: 0, fontSize: 15, opacity: 0.95, lineHeight: 1.5 },
  section: { background: 'white', borderRadius: 16, padding: 32, marginBottom: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 24 },
  sectionTitle: { fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
    gap: 16, marginBottom: 20 },
  statCard: { background: '#f8f9fa', borderRadius: 12, padding: 20, textAlign: 'center' },
  statNum: { fontSize: 36, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 },
  statLabel: { fontSize: 14, color: '#666', fontWeight: 500 },
  limitInfo: { fontSize: 15, color: '#666', textAlign: 'center', marginTop: 16 },
  actions: { display: 'flex', gap: 12 },
  editBtn: { background: '#667eea', color: 'white', border: 'none', borderRadius: 8,
    padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 600 },
  deleteBtn: { background: '#ff4757', color: 'white', border: 'none', borderRadius: 8,
    padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 600 },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 14, fontWeight: 600, color: '#333' },
  input: { padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: 8, 
    fontSize: 15, outline: 'none' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 500 },
  timeRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  buttonRow: { display: 'flex', gap: 12, marginTop: 8 },
  saveBtn: { flex: 1, background: '#2ecc71', color: 'white', border: 'none', borderRadius: 8,
    padding: '14px', fontSize: 16, cursor: 'pointer', fontWeight: 700 },
  cancelBtn: { flex: 1, background: '#aaa', color: 'white', border: 'none', borderRadius: 8,
    padding: '14px', fontSize: 16, cursor: 'pointer', fontWeight: 700 },
  detailsView: { display: 'flex', flexDirection: 'column', gap: 16 },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 0',
    borderBottom: '1px solid #f0f0f0' },
  detailLabel: { fontSize: 15, color: '#666', fontWeight: 500 },
  detailValue: { fontSize: 15, color: '#1a1a2e', fontWeight: 600 },
  addServiceForm: { background: '#f8f9fa', borderRadius: 12, padding: 20, marginBottom: 20 },
  addServiceBtn: { background: '#667eea', color: 'white', border: 'none', borderRadius: 8,
    padding: '12px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 600, height: 'fit-content' },
  suggestionBtn: { background: '#f0f0ff', color: '#667eea', border: '2px solid #667eea', borderRadius: 8,
    padding: '6px 12px', fontSize: 13, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' },
  servicesList: { display: 'flex', flexDirection: 'column', gap: 12 },
  emptyState: { textAlign: 'center', padding: 40, color: '#999', fontSize: 15 },
  emptyServicesState: { textAlign: 'center', padding: 60, background: '#f8f9fa', borderRadius: 12 },
};

const serviceCardStyles = {
  card: { background: 'white', border: '2px solid #e8e8e8', borderRadius: 12, padding: 16 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#1a1a2e' },
  desc: { margin: '0 0 8px', fontSize: 14, color: '#666' },
  time: { fontSize: 13, color: '#667eea', fontWeight: 600 },
  actions: { display: 'flex', gap: 8 },
  editBtn: { background: '#667eea', color: 'white', border: 'none', borderRadius: 6,
    padding: '8px 12px', fontSize: 14, cursor: 'pointer' },
  deleteBtn: { background: '#ff4757', color: 'white', border: 'none', borderRadius: 6,
    padding: '8px 12px', fontSize: 14, cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: '10px 14px', border: '2px solid #e8e8e8', borderRadius: 8, fontSize: 14, outline: 'none' },
  saveBtn: { flex: 1, background: '#2ecc71', color: 'white', border: 'none', borderRadius: 6,
    padding: '10px', cursor: 'pointer', fontWeight: 600 },
  cancelBtn: { flex: 1, background: '#aaa', color: 'white', border: 'none', borderRadius: 6,
    padding: '10px', cursor: 'pointer', fontWeight: 600 },
};
