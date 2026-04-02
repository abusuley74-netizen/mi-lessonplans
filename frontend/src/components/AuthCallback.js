import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        navigate('/login');
        return;
      }

      const sessionId = sessionIdMatch[1];
      // Retrieve referral code stored during login page visit
      const referralCode = sessionStorage.getItem('referral_code') || '';

      try {
        const response = await axios.post(
          `${API_URL}/api/auth/session`,
          { session_id: sessionId, referral_code: referralCode },
          { withCredentials: true }
        );

        if (response.data.user) {
          setUser(response.data.user);
          sessionStorage.removeItem('referral_code');
          // Clear the hash and redirect to dashboard
          window.history.replaceState(null, '', '/dashboard');
          navigate('/dashboard', { state: { user: response.data.user }, replace: true });
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      }
    };

    processAuth();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#2D5A27] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#4A5B46] font-medium">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
