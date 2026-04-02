import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminProfileManager = () => {
  const { admin, hasPermission } = useAdmin();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'admin',
    tasks: []
  });

  const availableTasks = [
    'dashboard',
    'referral_registry',
    'refer_and_earn',
    'user_management',
    'content_management',
    'analytics',
    'advanced_reports',
    'subscription_management',
    'template_management',
    'communication',
    'promo_banner',
    'admin_profiles'
  ];

  useEffect(() => {
    if (hasPermission('admin_profiles')) {
      fetchAdmins();
    }
  }, [hasPermission]);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/admins`, {
        withCredentials: true
      });
      setAdmins(response.data.admins);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/admin/admins`, formData, {
        withCredentials: true
      });
      setShowCreateForm(false);
      setFormData({ email: '', name: '', role: 'admin', tasks: [] });
      fetchAdmins();
    } catch (error) {
      console.error('Failed to create admin:', error);
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/admin/admins/${editingAdmin.admin_id}`, formData, {
        withCredentials: true
      });
      setEditingAdmin(null);
      setFormData({ email: '', name: '', role: 'admin', tasks: [] });
      fetchAdmins();
    } catch (error) {
      console.error('Failed to update admin:', error);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;

    try {
      await axios.delete(`${API_URL}/api/admin/admins/${adminId}`, {
        withCredentials: true
      });
      fetchAdmins();
    } catch (error) {
      console.error('Failed to delete admin:', error);
    }
  };

  const startEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      email: admin.email,
      name: admin.name,
      role: admin.role,
      tasks: admin.tasks || []
    });
  };

  const handleTaskToggle = (task) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.includes(task)
        ? prev.tasks.filter(t => t !== task)
        : [...prev.tasks, task]
    }));
  };

  if (!hasPermission('admin_profiles')) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500">
          You don't have permission to manage admin profiles.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Admin Profile Management</h2>
        {admin.role === 'super_admin' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Create New Admin
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading admins...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.admin_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {admin.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {admin.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      admin.role === 'super_admin'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {admin.tasks?.length || 0} tasks
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      admin.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {admin.role === 'super_admin' ? (
                      <span className="text-gray-400">No actions available</span>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(admin)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.admin_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingAdmin) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAdmin ? 'Edit Admin' : 'Create New Admin'}
              </h3>

              <form onSubmit={editingAdmin ? handleUpdateAdmin : handleCreateAdmin}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                    disabled={!!editingAdmin}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    {admin.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tasks/Permissions</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {availableTasks.map((task) => (
                      <label key={task} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.tasks.includes(task)}
                          onChange={() => handleTaskToggle(task)}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{task.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingAdmin(null);
                      setFormData({ email: '', name: '', role: 'admin', tasks: [] });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    {editingAdmin ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfileManager;