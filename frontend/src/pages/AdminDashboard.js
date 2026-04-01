import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AdminRoutes from '../components/AdminRoutes';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = () => {
  const { admin, navigation, adminLogout, hasPermission } = useAdmin();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
      return;
    }

    fetchDashboardData();
  }, [admin, navigate]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/dashboard`, {
        withCredentials: true
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  if (!admin) {
    return <div>Loading...</div>;
  }

  // Check if we're on the main dashboard route
  const isMainDashboard = location.pathname === '/admin/dashboard' || location.pathname === '/admin/';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">MiLesson Plan Admin</h1>
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
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {isMainDashboard ? (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>

                {loading ? (
                  <div className="text-center py-8">Loading dashboard data...</div>
                ) : dashboardData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Overview Cards */}
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">👥</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-blue-600">Total Users</p>
                          <p className="text-2xl font-bold text-blue-900">{dashboardData.overview.total_users}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-6 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-green-600">Active Users</p>
                          <p className="text-2xl font-bold text-green-900">{dashboardData.overview.active_users}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 p-6 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">🚫</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-red-600">Blocked Users</p>
                          <p className="text-2xl font-bold text-red-900">{dashboardData.overview.blocked_users}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-6 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">💰</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-yellow-600">Total Revenue</p>
                          <p className="text-2xl font-bold text-yellow-900">TZS {dashboardData.overview.total_revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Failed to load dashboard data
                  </div>
                )}

                {/* Subscription Distribution */}
                {dashboardData && (
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(dashboardData.subscriptions).map(([plan, count]) => (
                        <div key={plan} className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{count}</div>
                          <div className="text-sm text-gray-500 capitalize">{plan}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <AdminRoutes />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;