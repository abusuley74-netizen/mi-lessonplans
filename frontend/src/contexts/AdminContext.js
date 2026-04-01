import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AdminContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navigation, setNavigation] = useState([]);

  const checkAdminAuth = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/auth/me`, {
        withCredentials: true
      });
      setAdmin(response.data);

      // Get navigation menu
      const navResponse = await axios.get(`${API_URL}/api/admin/dashboard/navigation`, {
        withCredentials: true
      });
      setNavigation(navResponse.data.navigation);
    } catch (error) {
      setAdmin(null);
      setNavigation([]);
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

      setAdmin(response.data.admin);
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
        withCredentials: true
      });
    } catch (error) {
      console.error('Admin logout error:', error);
    }
    setAdmin(null);
    setNavigation([]);
  };

  const hasPermission = (permission) => {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;

    // Check if admin has the required task/permission
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
    checkAdminAuth
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