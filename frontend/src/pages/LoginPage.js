import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import { LogIn, Shield, Gift } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');

  useEffect(() => {
    // Store referral code in sessionStorage so AuthCallback can pick it up
    if (refCode) {
      sessionStorage.setItem('referral_code', refCode);
    }
  }, [refCode]);

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
              AI-Powered Lesson Planning for Tanzanian Teachers
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

            <button
              onClick={login}
              data-testid="google-login-btn"
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#E4DFD5] text-[#1A2E16] font-medium py-3.5 px-6 rounded-xl hover:bg-[#F2EFE8] hover:border-[#2D5A27] transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

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
