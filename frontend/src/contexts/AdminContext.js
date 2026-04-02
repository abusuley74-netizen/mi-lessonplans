import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AdminContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Helper to get auth headers
const getAdminHeaders = () => {
  const token = localStorage.getItem('admin_session_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navigation, setNavigation] = useState([]);

  // Set up axios interceptor to add admin token to all requests
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('admin_session_token');
      if (token && config.url?.includes('/api/admin/')) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  const checkAdminAuth = useCallback(async () => {
    const token = localStorage.getItem('admin_session_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/api/admin/auth/me`, {
        headers: getAdminHeaders(),
        withCredentials: true
      });
      setAdmin(response.data);

      const navResponse = await axios.get(`${API_URL}/api/admin/dashboard/navigation`, {
        headers: getAdminHeaders(),
        withCredentials: true
      });
      setNavigation(navResponse.data.navigation);
    } catch (error) {
      setAdmin(null);
      setNavigation([]);
      localStorage.removeItem('admin_session_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  const adminLogin = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/admin/auth/login`, {
        email,
        password
      }, {
        withCredentials: true
      });

      const { admin: adminData, session_token } = response.data;
      if (session_token) {
        localStorage.setItem('admin_session_token', session_token);
      }
      setAdmin(adminData);

      // Fetch navigation with explicit token header
      try {
        const navResponse = await axios.get(`${API_URL}/api/admin/dashboard/navigation`, {
          headers: { Authorization: `Bearer ${session_token}` },
          withCredentials: true
        });
        setNavigation(navResponse.data.navigation);
      } catch (navErr) {
        console.error('Navigation fetch failed:', navErr);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  };

  const adminLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/admin/auth/logout`, {}, {
        headers: getAdminHeaders(),
        withCredentials: true
      });
    } catch (error) {
      console.error('Admin logout error:', error);
    }
    setAdmin(null);
    setNavigation([]);
    localStorage.removeItem('admin_session_token');
  };

  const hasPermission = (permission) => {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;

    const permissionMap = {
      'user_management': ['user_management'],
      'content_management': ['content_management'],
      'subscription_management': ['subscription_management'],
      'template_management': ['template_management'],
      'analytics': ['analytics', 'advanced_reports'],
      'referral_registry': ['referral_registry'],
      'refer_and_earn': ['refer_and_earn'],
      'admin_profiles': ['admin_profiles'],
      'communication': ['communication'],
      'promo_banner': ['promo_banner']
    };

    const requiredTasks = permissionMap[permission] || [];
    return requiredTasks.some(task => admin.tasks?.includes(task));
  };

  const value = {
    admin,
    loading,
    navigation,
    adminLogin,
    adminLogout,
    hasPermission,
    checkAdminAuth,
    getAdminHeaders
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
