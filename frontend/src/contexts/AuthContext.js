import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      setUser(null);
      // If token is invalid/expired, clear it
      if (error.response?.status === 401) {
        localStorage.removeItem('session_token');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const loginWithGoogle = async (credential) => {
    const referralCode = sessionStorage.getItem('referral_code') || '';
    try {
      const response = await api.post('/api/auth/google', { 
        credential, 
        referral_code: referralCode 
      });
      if (response.data.user) {
        // Store session token for cross-origin auth
        if (response.data.session_token) {
          localStorage.setItem('session_token', response.data.session_token);
        }
        setUser(response.data.user);
        sessionStorage.removeItem('referral_code');
        return { success: true, user: response.data.user };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Google auth error:', error);
      return { success: false, error: error.response?.data?.detail || 'Authentication failed' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('session_token');
    setUser(null);
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
