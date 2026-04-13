import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import WelcomePage from './components/welcome/WelcomePage';
import Dashboard from './components/dashboard/Dashboard';
import QueuePage from './components/queue/QueuePage';
import MyTokens from './components/queue/MyTokens';
import EditProfile from './components/profile/EditProfile';
import AdminDashboard from './components/admin/AdminDashboard';
import OrganizationDetails from './components/admin/OrganizationDetails';
import StaffDailyReport from './components/staff/StaffDailyReport';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 24 }}>⏳ Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/queue/:orgId" element={<ProtectedRoute><QueuePage /></ProtectedRoute>} />
            <Route path="/my-tokens" element={<ProtectedRoute><MyTokens /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/organization/:orgId" element={<ProtectedRoute roles={['ADMIN']}><OrganizationDetails /></ProtectedRoute>} />
            <Route path="/staff/daily-report" element={<ProtectedRoute roles={['STAFF', 'ADMIN']}><StaffDailyReport /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/welcome" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
