import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function StaffDailyReport() {
  const [reportType, setReportType] = useState('DAILY'); // DAILY, WEEKLY, MONTHLY
  const [reportData, setReportData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeekStart, setSelectedWeekStart] = useState(
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );
  const [loading, setLoading] = useState(false);
  const [expandedOrg, setExpandedOrg] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadReport();
  }, [reportType, selectedDate, selectedWeekStart, selectedMonth]);

  const loadReport = async () => {
    setLoading(true);
    setReportData(null);
    try {
      let endpoint = '';
      let params = '';
      
      if (reportType === 'DAILY') {
        endpoint = '/tokens/staff/daily-report';
        params = `?date=${selectedDate}`;
      } else if (reportType === 'WEEKLY') {
        endpoint = '/tokens/staff/weekly-report';
        params = `?startDate=${selectedWeekStart}`;
      } else if (reportType === 'MONTHLY') {
        endpoint = '/tokens/staff/monthly-report';
        params = `?month=${selectedMonth}`;
      }
      
      const res = await api.get(endpoint + params);
      setReportData(res.data);
    } catch (err) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444',
      WAITING: '#f59e0b',
      SERVING: '#3b82f6'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      COMPLETED: '✅',
      CANCELLED: '❌',
      WAITING: '⏳',
      SERVING: '🔔'
    };
    return icons[status] || '•';
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.organizations) return;

    let csv = 'Organization,Location,Token Number,Customer Name,Email,Phone,Service,Status,Appointment Time,Token Date,Completed At\n';
    
    reportData.organizations.forEach(org => {
      org.tokens.forEach(token => {
        csv += `"${org.organizationName}","${org.location || 'N/A'}","${token.tokenNumber}","${token.customerName}","${token.customerEmail}","${token.phoneNumber || 'N/A'}","${token.serviceName}","${token.status}","${formatTime(token.appointmentTime)}","${token.tokenDate}","${formatTime(token.completedAt)}"\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType.toLowerCase()}-report-${reportType === 'DAILY' ? selectedDate : reportType === 'WEEKLY' ? selectedWeekStart : selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getReportTitle = () => {
    if (reportType === 'DAILY') {
      return `Daily Report - ${formatDate(selectedDate)}`;
    } else if (reportType === 'WEEKLY') {
      return `Weekly Report - ${formatDate(reportData?.startDate)} to ${formatDate(reportData?.endDate)}`;
    } else {
      return `Monthly Report - ${reportData?.month} ${reportData?.year}`;
    }
  };

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Back</button>
        <span style={styles.navTitle}>📊 Staff Reports</span>
        <span />
      </nav>

      <div style={styles.content}>
        {/* Report Type Tabs */}
        <div style={styles.tabsContainer} className="fade-in">
          <button
            onClick={() => setReportType('DAILY')}
            className="scale-in"
            style={{
              ...styles.tab,
              ...(reportType === 'DAILY' && styles.tabActive)
            }}>
            📅 Daily Report
          </button>
          <button
            onClick={() => setReportType('WEEKLY')}
            className="scale-in"
            style={{
              ...styles.tab,
              ...(reportType === 'WEEKLY' && styles.tabActive)
            }}>
            📆 Weekly Report
          </button>
          <button
            onClick={() => setReportType('MONTHLY')}
            className="scale-in"
            style={{
              ...styles.tab,
              ...(reportType === 'MONTHLY' && styles.tabActive)
            }}>
            📊 Monthly Report
          </button>
        </div>

        {/* Date/Period Selector */}
        <div style={styles.selectorContainer} className="slide-in-left">
          {reportType === 'DAILY' && (
            <div style={styles.selectorGroup}>
              <label style={styles.selectorLabel}>Select Date:</label>
              <input 
                type="date" 
                value={selectedDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={styles.dateInput}
              />
            </div>
          )}
          
          {reportType === 'WEEKLY' && (
            <div style={styles.selectorGroup}>
              <label style={styles.selectorLabel}>Week Starting From:</label>
              <input 
                type="date" 
                value={selectedWeekStart}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedWeekStart(e.target.value)}
                style={styles.dateInput}
              />
              <span style={styles.helperText}>
                (Shows 7 days from selected date)
              </span>
            </div>
          )}
          
          {reportType === 'MONTHLY' && (
            <div style={styles.selectorGroup}>
              <label style={styles.selectorLabel}>Select Month:</label>
              <input 
                type="month" 
                value={selectedMonth}
                max={new Date().toISOString().slice(0, 7)}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={styles.dateInput}
              />
            </div>
          )}

          <button onClick={exportToCSV} style={styles.exportBtn} disabled={!reportData || loading}>
            📥 Export CSV
          </button>
        </div>

        {/* Report Content */}
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner}>⏳</div>
            <p>Loading report...</p>
          </div>
        ) : !reportData || reportData.organizations.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <h3>No Data Available</h3>
            <p>No tokens were generated for the selected period</p>
          </div>
        ) : (
          <>
            <div style={styles.reportHeader}>
              <h2 style={styles.reportTitle}>{getReportTitle()}</h2>
            </div>

            <div style={styles.summaryCards} className="fade-in">
              <div style={styles.summaryCard} className="hover-lift">
                <div style={styles.summaryIcon}>🏢</div>
                <div>
                  <div style={styles.summaryValue}>{reportData.totalOrganizations}</div>
                  <div style={styles.summaryLabel}>Organizations</div>
                </div>
              </div>
              <div style={styles.summaryCard} className="hover-lift">
                <div style={styles.summaryIcon}>🎫</div>
                <div>
                  <div style={styles.summaryValue}>
                    {reportData.organizations.reduce((sum, org) => sum + org.totalTokens, 0)}
                  </div>
                  <div style={styles.summaryLabel}>Total Tokens</div>
                </div>
              </div>
              <div style={styles.summaryCard} className="hover-lift">
                <div style={styles.summaryIcon}>✅</div>
                <div>
                  <div style={styles.summaryValue}>
                    {reportData.organizations.reduce((sum, org) => sum + org.attended, 0)}
                  </div>
                  <div style={styles.summaryLabel}>Attended</div>
                </div>
              </div>
              <div style={styles.summaryCard} className="hover-lift">
                <div style={styles.summaryIcon}>❌</div>
                <div>
                  <div style={styles.summaryValue}>
                    {reportData.organizations.reduce((sum, org) => sum + org.absent, 0)}
                  </div>
                  <div style={styles.summaryLabel}>Absent</div>
                </div>
              </div>
            </div>

            <div style={styles.organizationsList}>
              {reportData.organizations.map((org, idx) => (
                <div key={idx} style={styles.orgCard} className="slide-in-left stagger-item">
                  <div 
                    style={styles.orgHeader}
                    onClick={() => setExpandedOrg(expandedOrg === idx ? null : idx)}
                  >
                    <div style={styles.orgInfo}>
                      <div style={styles.orgIcon}>
                        {org.organizationType === 'HOSPITAL' ? '🏥' : 
                         org.organizationType === 'BANK' ? '🏦' : '🏢'}
                      </div>
                      <div>
                        <h3 style={styles.orgName}>{org.organizationName}</h3>
                        <p style={styles.orgLocation}>📍 {org.location || 'Location not specified'}</p>
                      </div>
                    </div>
                    <div style={styles.orgStats}>
                      <div style={styles.statBadge}>
                        <span style={styles.statNumber}>{org.totalTokens}</span>
                        <span style={styles.statText}>Total</span>
                      </div>
                      <div style={{ ...styles.statBadge, background: '#d1fae5' }}>
                        <span style={{ ...styles.statNumber, color: '#10b981' }}>{org.attended}</span>
                        <span style={styles.statText}>Attended</span>
                      </div>
                      <div style={{ ...styles.statBadge, background: '#fee2e2' }}>
                        <span style={{ ...styles.statNumber, color: '#ef4444' }}>{org.absent}</span>
                        <span style={styles.statText}>Absent</span>
                      </div>
                      <div style={styles.expandIcon}>
                        {expandedOrg === idx ? '▼' : '▶'}
                      </div>
                    </div>
                  </div>

                  {expandedOrg === idx && (
                    <div style={styles.tokensTable}>
                      <table style={styles.table}>
                        <thead>
                          <tr style={styles.tableHeader}>
                            <th style={styles.th}>Token</th>
                            <th style={styles.th}>Customer</th>
                            <th style={styles.th}>Phone</th>
                            <th style={styles.th}>Service</th>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Appointment</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Completed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {org.tokens.map((token, tokenIdx) => (
                            <tr key={tokenIdx} style={styles.tableRow}>
                              <td style={styles.td}>
                                <span style={styles.tokenNumber}>{token.tokenNumber}</span>
                              </td>
                              <td style={styles.td}>
                                <div style={styles.customerInfo}>
                                  <div style={styles.customerName}>{token.customerName}</div>
                                  <div style={styles.customerEmail}>{token.customerEmail}</div>
                                </div>
                              </td>
                              <td style={styles.td}>{token.phoneNumber || 'N/A'}</td>
                              <td style={styles.td}>{token.serviceName}</td>
                              <td style={styles.td}>{new Date(token.tokenDate).toLocaleDateString()}</td>
                              <td style={styles.td}>{formatTime(token.appointmentTime)}</td>
                              <td style={styles.td}>
                                <span style={{
                                  ...styles.statusBadge,
                                  background: getStatusColor(token.status),
                                }}>
                                  {getStatusIcon(token.status)} {token.status}
                                </span>
                              </td>
                              <td style={styles.td}>{formatTime(token.completedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
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
  content: { maxWidth: 1400, margin: '0 auto', padding: '40px 20px' },
  tabsContainer: { display: 'flex', gap: 12, marginBottom: 32, background: 'white',
    padding: 8, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  tab: { flex: 1, padding: '16px 24px', border: 'none', background: 'transparent',
    borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer', color: '#64748b',
    transition: 'all 0.2s' },
  tabActive: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white',
    boxShadow: '0 4px 12px rgba(102,126,234,0.3)' },
  selectorContainer: { display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 32,
    background: 'white', padding: 24, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  selectorGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8 },
  selectorLabel: { fontSize: 14, fontWeight: 600, color: '#475569' },
  dateInput: { padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10,
    fontSize: 15, fontWeight: 600, outline: 'none', cursor: 'pointer' },
  helperText: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
  exportBtn: { background: '#10b981', color: 'white', border: 'none', borderRadius: 10,
    padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(16,185,129,0.3)', alignSelf: 'flex-end' },
  reportHeader: { marginBottom: 24 },
  reportTitle: { margin: 0, fontSize: 28, fontWeight: 800, color: '#1a1a2e' },
  loadingState: { textAlign: 'center', padding: 80 },
  spinner: { fontSize: 48, marginBottom: 16 },
  emptyState: { textAlign: 'center', padding: 80, background: 'white', borderRadius: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  summaryCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 20, marginBottom: 32 },
  summaryCard: { background: 'white', borderRadius: 16, padding: 24, display: 'flex',
    alignItems: 'center', gap: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  summaryIcon: { fontSize: 40 },
  summaryValue: { fontSize: 32, fontWeight: 800, color: '#1a1a2e' },
  summaryLabel: { fontSize: 14, color: '#64748b', fontWeight: 600, marginTop: 4 },
  organizationsList: { display: 'flex', flexDirection: 'column', gap: 20 },
  orgCard: { background: 'white', borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  orgHeader: { padding: 24, display: 'flex', justifyContent: 'space-between', 
    alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' },
  orgInfo: { display: 'flex', alignItems: 'center', gap: 16 },
  orgIcon: { fontSize: 40 },
  orgName: { margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a2e' },
  orgLocation: { margin: '4px 0 0', fontSize: 14, color: '#64748b' },
  orgStats: { display: 'flex', gap: 12, alignItems: 'center' },
  statBadge: { background: '#f1f5f9', padding: '8px 16px', borderRadius: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 70 },
  statNumber: { fontSize: 20, fontWeight: 800, color: '#1a1a2e' },
  statText: { fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase',
    marginTop: 2 },
  expandIcon: { fontSize: 20, color: '#64748b', marginLeft: 8 },
  tokensTable: { padding: '0 24px 24px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700,
    color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '16px', fontSize: 14, color: '#1e293b' },
  tokenNumber: { background: '#667eea', color: 'white', padding: '4px 12px',
    borderRadius: 6, fontSize: 13, fontWeight: 700 },
  customerInfo: { display: 'flex', flexDirection: 'column', gap: 4 },
  customerName: { fontWeight: 600, color: '#1a1a2e' },
  customerEmail: { fontSize: 12, color: '#64748b' },
  statusBadge: { color: 'white', padding: '4px 12px', borderRadius: 6,
    fontSize: 12, fontWeight: 700, display: 'inline-block' },
};
