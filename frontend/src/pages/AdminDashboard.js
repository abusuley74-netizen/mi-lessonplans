import React, { useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AdminRoutes from '../components/AdminRoutes';
import { BarChart3, Handshake, Banknote, Users, BookOpen, CreditCard, LayoutTemplate, MessageSquare, Target } from 'lucide-react';

const iconMap = {
  chart: BarChart3, handshake: Handshake, money: Banknote, users: Users,
  book: BookOpen, card: CreditCard, template: LayoutTemplate, message: MessageSquare, target: Target,
};

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = () => {
  const { admin, navigation, adminLogout, hasPermission, getAdminHeaders } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
    }
  }, [admin, navigate]);

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  if (!admin) {
    return <div>Loading...</div>;
  }

  // Check if we're on the main dashboard route

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center gap-2">
                <img src="/logo.jpg" alt="miLessonPlan" className="w-8 h-8 rounded-md object-contain" />
                <h1 className="text-xl font-bold text-gray-900">miLessonPlan Admin</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {admin.name} ({admin.role})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow rounded-lg p-4 mr-6">
            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    location.pathname === item.path
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {(() => { const Icon = iconMap[item.icon]; return Icon ? <Icon className="w-4 h-4 mr-3" /> : <span className="mr-3">{item.icon}</span>; })()}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <AdminRoutes />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;