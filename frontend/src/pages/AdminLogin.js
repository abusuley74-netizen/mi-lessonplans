import React, { useState } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { adminLogin } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await adminLogin(email, password);

    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#2D5A27] rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-center font-heading text-3xl font-bold text-[#1A2E16]">
          Admin Login
        </h2>
        <p className="mt-2 text-center text-[#7A8A76]">
          Sign in to access the admin dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-[#E4DFD5] rounded-xl py-8 px-6 sm:px-10 shadow-sm">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1A2E16] mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[#E4DFD5] rounded-lg text-[#1A2E16] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/30 focus:border-[#2D5A27] transition-colors"
                placeholder="admin@milessonplan.com"
                data-testid="admin-email-input"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1A2E16] mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[#E4DFD5] rounded-lg text-[#1A2E16] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/30 focus:border-[#2D5A27] transition-colors"
                placeholder="Enter your password"
                data-testid="admin-password-input"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm" data-testid="admin-login-error">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#2D5A27] text-white rounded-lg font-medium hover:bg-[#21441C] transition-colors disabled:opacity-50"
              data-testid="admin-login-submit"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <Link
          to="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-[#7A8A76] hover:text-[#2D5A27] transition-colors"
          data-testid="back-to-teacher-login"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teacher Login
        </Link>
      </div>
    </div>
  );
};

export default AdminLogin;
