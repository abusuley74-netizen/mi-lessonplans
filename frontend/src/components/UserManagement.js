import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const UserManagement = () => {
  const { hasPermission } = useAdmin();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModal, setActionModal] = useState(null);

  const limit = 50;

  useEffect(() => {
    if (hasPermission('user_management')) {
      fetchUsers();
    }
  }, [hasPermission, search, status, skip]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
        search,
        status
      });

      const response = await axios.get(`${API_URL}/api/admin/users?${params}`, {
        withCredentials: true
      });

      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action, reason = '') => {
    try {
      await axios.put(`${API_URL}/api/admin/users/${userId}`, {
        action,
        reason
      }, {
        withCredentials: true
      });

      fetchUsers();
      setActionModal(null);
    } catch (error) {
      console.error('Failed to perform user action:', error);
    }
  };

  const getUserDetails = async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/users/${userId}/details`, {
        withCredentials: true
      });
      setSelectedUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  if (!hasPermission('user_management')) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500">
          You don't have permission to manage users.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">User Management</h2>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : (
        <>
          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.subscription_plan === 'premium'
                          ? 'bg-green-100 text-green-800'
                          : user.subscription_plan === 'basic'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.subscription_plan || 'free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_deleted
                          ? 'bg-gray-800 text-gray-100'
                          : user.is_blocked
                          ? 'bg-red-100 text-red-800'
                          : user.subscription_status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.is_deleted ? 'Deleted' : user.is_blocked ? 'Blocked' : user.subscription_status || 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => getUserDetails(user.user_id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {!user.is_blocked ? (
                          <button
                            onClick={() => setActionModal({ user, action: 'block' })}
                            className="text-red-600 hover:text-red-900"
                          >
                            Block
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserAction(user.user_id, 'unblock')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Unblock
                          </button>
                        )}
                        <button
                          onClick={() => setActionModal({ user, action: 'suspend' })}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Suspend
                        </button>
                        <button
                          onClick={() => setActionModal({ user, action: 'delete' })}
                          className="text-red-600 hover:text-red-900 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing {skip + 1} to {Math.min(skip + limit, total)} of {total} users
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setSkip(Math.max(0, skip - limit))}
                disabled={skip === 0}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setSkip(skip + limit)}
                disabled={skip + limit >= total}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <img
                    src={selectedUser.user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.user.name)}&background=random`}
                    alt={selectedUser.user.name}
                    className="w-20 h-20 rounded-full mx-auto mb-4"
                  />
                  <h4 className="text-center font-medium">{selectedUser.user.name}</h4>
                  <p className="text-center text-gray-500">{selectedUser.user.email}</p>
                </div>

                <div className="space-y-2">
                  <p><strong>Plan:</strong> {selectedUser.user.subscription_plan || 'Free'}</p>
                  <p><strong>Status:</strong> {selectedUser.user.subscription_status || 'Free'}</p>
                  <p><strong>Joined:</strong> {new Date(selectedUser.user.created_at).toLocaleDateString()}</p>
                  <p><strong>Lessons Created:</strong> {selectedUser.stats.lesson_count}</p>
                  <p><strong>Referrals:</strong> {selectedUser.stats.referral_count}</p>
                  <p><strong>Shared Links:</strong> {selectedUser.stats.shared_links_count}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {actionModal.action === 'block' ? 'Block User' :
                 actionModal.action === 'suspend' ? 'Suspend User' :
                 actionModal.action === 'delete' ? 'Delete User' : 'User Action'}
              </h3>

              <p className="mb-4">
                Are you sure you want to {actionModal.action} <strong>{actionModal.user.name}</strong>?
                {actionModal.action === 'delete' && (
                  <span className="block mt-2 text-red-600 font-semibold">
                    Warning: This action cannot be undone. The user will be permanently deleted from the system.
                  </span>
                )}
              </p>

              <textarea
                placeholder="Reason (optional)"
                className="w-full p-2 border border-gray-300 rounded-md mb-4"
                rows="3"
                onChange={(e) => setActionModal({...actionModal, reason: e.target.value})}
              />

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUserAction(actionModal.user.user_id, actionModal.action, actionModal.reason)}
                  className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md ${
                    actionModal.action === 'delete' 
                      ? 'bg-red-700 hover:bg-red-800' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionModal.action === 'block' ? 'Block' : 
                   actionModal.action === 'suspend' ? 'Suspend' :
                   actionModal.action === 'delete' ? 'Delete' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;