import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { LogIn, Shield, Gift } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const { loginWithGoogle, user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = searchParams.get('ref');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (refCode) {
      sessionStorage.setItem('referral_code', refCode);
    }
  }, [refCode]);

  // If already logged in, go straight to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoggingIn(true);
    const result = await loginWithGoogle(credentialResponse.credential);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      toast.error(result.error || 'Login failed. Please try again.');
    }
    setLoggingIn(false);
  };

  const handleGoogleError = () => {
    toast.error('Google sign-in was cancelled or failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FDFBF7]">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <img src="/logo.jpg" alt="Mi-LessonPlan" className="w-20 h-20 mx-auto mb-4 rounded-xl object-contain" />
            <h1 className="font-heading text-4xl font-bold text-[#1A2E16] mb-3">
              Mi-LessonPlan
            </h1>
            <p className="text-[#4A5B46] text-lg">
              Secure Tanzania Mindset
            </p>
          </div>

          <div className="bg-white border border-[#E4DFD5] rounded-xl p-8 shadow-sm">
            {refCode && (
              <div className="mb-4 p-3 bg-[#D95D39]/10 border border-[#D95D39]/20 rounded-lg flex items-center gap-2" data-testid="referral-banner">
                <Gift className="w-4 h-4 text-[#D95D39]" />
                <p className="text-sm text-[#D95D39] font-medium">You were referred! Sign up to get started.</p>
              </div>
            )}
            <h2 className="font-heading text-2xl font-semibold text-[#1A2E16] mb-2 text-center">
              Welcome Back
            </h2>
            <p className="text-[#7A8A76] text-center mb-8">
              Sign in to create and manage your lesson plans
            </p>

            {loggingIn ? (
              <div className="flex flex-col items-center py-4" data-testid="login-loading">
                <div className="w-10 h-10 border-4 border-[#2D5A27] border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-[#4A5B46] font-medium text-sm">Signing you in...</p>
              </div>
            ) : (
              <div className="flex justify-center" data-testid="google-login-btn">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="350"
                  logo_alignment="left"
                />
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-[#E4DFD5]">
              <div className="flex items-start gap-3 text-sm text-[#7A8A76]">
                <LogIn className="w-5 h-5 mt-0.5 text-[#2D5A27]" />
                <p>
                  By signing in, you agree to our Terms of Service and Privacy Policy. 
                  Your data is secured and never shared.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-[#7A8A76] text-sm mt-6">
            Supporting Tanzania Mainland & Zanzibar Syllabi
          </p>

          <Link
            to="/admin/login"
            data-testid="admin-login-link"
            className="mt-4 flex items-center justify-center gap-2 text-sm text-[#7A8A76] hover:text-[#2D5A27] transition-colors"
          >
            <Shield className="w-4 h-4" />
            Admin Login
          </Link>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/9159001/pexels-photo-9159001.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940)'
          }}
        >
          <div className="absolute inset-0 bg-[#1A2E16]/40"></div>
          <div className="absolute bottom-0 left-0 right-0 p-12">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <p className="text-white text-xl font-medium mb-2">
                "Mi-LessonPlan has transformed how I prepare for my classes. 
                It saves me hours every week!"
              </p>
              <p className="text-white/80">
                — Teacher, Dar es Salaam
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
