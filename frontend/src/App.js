import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MyHub from './pages/MyHub';
import SubscribePage from './pages/SubscribePage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProfileManager from './components/AdminProfileManager';
import UserManagement from './components/UserManagement';
import SharedView from './components/SharedView';
import InstallPrompt from './components/InstallPrompt';
import BintiChat from './components/BintiChat';
import { Toaster } from './components/ui/sonner';
import './index.css';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // If user data was passed from AuthCallback, skip loading check
  if (location.state?.user) {
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2D5A27] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#4A5B46] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// App Router Component
const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminProvider><AdminLogin /></AdminProvider>} />
      <Route path="/shared/:code" element={<SharedView />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/myhub" 
        element={
          <ProtectedRoute>
            <MyHub />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/subscribe" 
        element={
          <ProtectedRoute>
            <SubscribePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/*" 
        element={
          <AdminProvider>
            <AdminDashboard />
          </AdminProvider>
        } 
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch(() => {});
      });
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
          <BintiChat />
          <InstallPrompt />
          <Toaster position="top-right" richColors closeButton />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
