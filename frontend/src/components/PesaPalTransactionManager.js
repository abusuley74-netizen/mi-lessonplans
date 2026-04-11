import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../contexts/AdminContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PesaPalTransactionManager = () => {
  const { admin, hasPermission } = useAdmin();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ skip: 0, limit: 50, has_more: false });
  const [summary, setSummary] = useState({});
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (admin && hasPermission('subscription_management')) {
      fetchTransactions();
      fetchAnalytics();
    }
  }, [admin, statusFilter, pagination.skip]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit,
        skip: pagination.skip
      });
      if (statusFilter) params.append('status', statusFilter);

      const response = await axios.get(`${API_URL}/api/admin/pesapal/transactions?${params}`, {
        withCredentials: true
      });

      setTransactions(response.data.transactions);
      setSummary(response.data.status_summary);
      setPagination(prev => ({
        ...prev,
        has_more: response.data.pagination.has_more
      }));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/pesapal/analytics`, {
        withCredentials: true
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchTransactionDetails = async (merchantReference) => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/pesapal/transactions/${merchantReference}`, {
        withCredentials: true
      });
      setSelectedTransaction(response.data);
    } catch (error) {
      console.error('Failed to fetch transaction details:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-TZ', {
      timeZone: 'Africa/Dar_es_Salaam'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'VALID': 'bg-green-100 text-green-800',
      'INVALID': 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (!hasPermission('subscription_management')) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">You don't have permission to view payment transactions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">PesaPal Transaction Manager</h1>
        <p className="text-gray-600">Monitor and manage payment transactions</p>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Revenue</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics.plan_revenue.reduce((sum, plan) => sum + plan.total_revenue, 0))}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Success Rate</h3>
            <p className="text-2xl font-bold text-blue-600">{analytics.success_rate}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Transactions</h3>
            <p className="text-2xl font-bold text-purple-600">{analytics.total_transactions}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
            <p className="text-2xl font-bold text-green-600">{analytics.completed_transactions}</p>
          </div>
        </div>
      )}

      {/* Status Summary */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Transaction Status Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(summary).map(([status, data]) => (
            <div key={status} className="text-center">
              <p className="text-sm text-gray-600">{status}</p>
              <p className="text-xl font-bold">{data.count}</p>
              <p className="text-sm text-gray-500">{formatCurrency(data.total_amount)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <button
            onClick={fetchTransactions}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading transactions...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.merchant_reference} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {transaction.merchant_reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {transaction.plan_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => fetchTransactionDetails(transaction.merchant_reference)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {pagination.skip + 1} to {pagination.skip + transactions.length} transactions
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, skip: Math.max(0, prev.skip - prev.limit) }))}
              disabled={pagination.skip === 0}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, skip: prev.skip + prev.limit }))}
              disabled={!pagination.has_more}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Transaction Details</h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Merchant Reference</label>
                    <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedTransaction.transaction.merchant_reference}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tracking ID</label>
                    <p className="text-sm bg-gray-50 p-2 rounded">{selectedTransaction.transaction.pesapal_tracking_id || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User</label>
                    <p className="text-sm bg-gray-50 p-2 rounded">{selectedTransaction.user?.name} ({selectedTransaction.user?.email})</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan</label>
                    <p className="text-sm bg-gray-50 p-2 rounded capitalize">{selectedTransaction.transaction.plan_id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className="text-sm bg-gray-50 p-2 rounded">{formatCurrency(selectedTransaction.transaction.amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedTransaction.transaction.status)}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IPN Traces</label>
                  <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 rounded">
                    {selectedTransaction.transaction.ipn_traces?.length > 0 ? (
                      selectedTransaction.transaction.ipn_traces.map((trace, index) => (
                        <div key={`${trace.timestamp}-${trace.status}-${index}`} className="text-xs text-gray-600 mb-1 p-1 bg-white rounded">
                          <span className="font-medium">{formatDate(trace.timestamp)}</span> - {trace.status} ({trace.ip_address})
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No IPN traces available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PesaPalTransactionManager;