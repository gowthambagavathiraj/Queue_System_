import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.navBrand}>🎫 Smart Queue</div>
        <div style={styles.navRight}>
          <span style={styles.greeting}>Hello, {user?.name} 👋</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Welcome to Smart Queue</h1>
          <p style={styles.heroSubtitle}>
            Your intelligent queue management system for seamless service booking
          </p>
          <div style={styles.heroStats}>
            <div style={styles.statItem}>
              <div style={styles.statIcon}>🏥</div>
              <div style={styles.statLabel}>Hospitals</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statIcon}>🏦</div>
              <div style={styles.statLabel}>Banks</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statIcon}>🏢</div>
              <div style={styles.statLabel}>Gov Offices</div>
            </div>
          </div>
          
          {/* Next Button */}
          <button 
            onClick={() => navigate('/dashboard')} 
            style={styles.nextBtn}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
            }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Quick Info */}
      <div style={styles.content}>
        <div style={styles.infoSection}>
          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>⏰</div>
            <div>
              <h4 style={styles.infoTitle}>Real-Time Updates</h4>
              <p style={styles.infoText}>Get instant notifications about your queue status</p>
            </div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>📧</div>
            <div>
              <h4 style={styles.infoTitle}>Email Reminders</h4>
              <p style={styles.infoText}>Receive reminders 20 minutes before your appointment</p>
            </div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>📱</div>
            <div>
              <h4 style={styles.infoTitle}>Easy Management</h4>
              <p style={styles.infoText}>Edit or cancel your tokens anytime from My Tokens</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          Queue System © 2024 | Making queues smarter, one token at a time
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f7fa' },
  nav: { background: 'white', boxShadow: '0 2px 20px rgba(0,0,0,0.08)', padding: '16px 32px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 },
  navBrand: { fontSize: 22, fontWeight: 700, color: '#667eea' },
  navRight: { display: 'flex', alignItems: 'center', gap: 16 },
  greeting: { color: '#333', fontWeight: 500, fontSize: 15 },
  logoutBtn: { background: '#ff4757', color: 'white', border: 'none', borderRadius: 8,
    padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  hero: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white',
    padding: '80px 20px 60px', textAlign: 'center' },
  heroContent: { maxWidth: 800, margin: '0 auto' },
  heroTitle: { fontSize: 48, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 },
  heroSubtitle: { fontSize: 20, opacity: 0.95, margin: '0 0 40px', lineHeight: 1.6 },
  heroStats: { display: 'flex', justifyContent: 'center', gap: 60, marginBottom: 40 },
  statItem: { textAlign: 'center' },
  statIcon: { fontSize: 48, marginBottom: 8 },
  statLabel: { fontSize: 16, fontWeight: 600, opacity: 0.95 },
  nextBtn: { background: 'white', color: '#667eea', border: 'none', borderRadius: 50,
    padding: '16px 48px', fontSize: 18, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transition: 'transform 0.2s, box-shadow 0.2s',
    marginTop: 20 },
  content: { maxWidth: 1200, margin: '0 auto', padding: '60px 20px' },
  infoSection: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 },
  infoCard: { background: 'white', borderRadius: 16, padding: 24, display: 'flex', gap: 20,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  infoIcon: { fontSize: 40, flexShrink: 0 },
  infoTitle: { margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  infoText: { margin: 0, fontSize: 14, color: '#666', lineHeight: 1.6 },
  footer: { background: '#1a1a2e', color: 'white', padding: '32px 20px', textAlign: 'center', marginTop: 60 },
  footerText: { margin: 0, fontSize: 14, opacity: 0.8 },
};
