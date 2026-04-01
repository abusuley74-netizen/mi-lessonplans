import React, { useState, useEffect } from 'react';
import referralService from '../lib/referralService';
import './ReferralRegistry.css';

const ReferralRegistry = ({ currentUser }) => {
  const [allReferrals, setAllReferrals] = useState([]);
  const [adminSummaries, setAdminSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterAdmin, setFilterAdmin] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadAllReferrals();
  }, []);

  const loadAllReferrals = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from a super admin endpoint
      // For now, we'll simulate loading all admin referrals
      const adminIds = await getAllAdminIds(); // This would need to be implemented

      const allReferralsData = [];
      const summaries = [];

      // This is a placeholder - in production, you'd have a super admin endpoint
      // that aggregates all referrals across all admins
      setAllReferrals(allReferralsData);
      setAdminSummaries(summaries);

    } catch (err) {
      setError('Failed to load referral registry');
      console.error('Error loading referral registry:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAllAdminIds = async () => {
    // This would fetch all admin IDs from the system
    // For now, return empty array
    return [];
  };

  const filteredReferrals = allReferrals.filter(referral => {
    const matchesAdmin = !filterAdmin || referral.admin_id === filterAdmin;
    const matchesStatus = !filterStatus || referral.status === filterStatus;
    return matchesAdmin && matchesStatus;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-TZ');
  };

  const getTotalMetrics = () => {
    const totalTeachers = allReferrals.length;
    const totalCommission = allReferrals.reduce((sum, r) => sum + (r.total_commission || 0), 0);
    const activeTeachers = allReferrals.filter(r => r.status === 'active').length;
    const inactiveTeachers = totalTeachers - activeTeachers;

    return {
      totalTeachers,
      totalCommission,
      activeTeachers,
      inactiveTeachers
    };
  };

  const totalMetrics = getTotalMetrics();

  if (loading) {
    return <div className="referral-registry-loading">Loading referral registry...</div>;
  }

  return (
    <div className="referral-registry-container">
      <div className="referral-registry-header">
        <h2>Referral Registry</h2>
        <p>Complete overview of all referrals across all admins</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Global Metrics */}
      <div className="global-metrics">
        <div className="metric-card">
          <h3>Total Teachers</h3>
          <span className="metric-value">{totalMetrics.totalTeachers}</span>
        </div>
        <div className="metric-card">
          <h3>Total Commission</h3>
          <span className="metric-value">{formatCurrency(totalMetrics.totalCommission)}</span>
        </div>
        <div className="metric-card">
          <h3>Active Teachers</h3>
          <span className="metric-value">{totalMetrics.activeTeachers}</span>
        </div>
        <div className="metric-card">
          <h3>Inactive Teachers</h3>
          <span className="metric-value">{totalMetrics.inactiveTeachers}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Filter by Admin:</label>
          <select
            value={filterAdmin}
            onChange={(e) => setFilterAdmin(e.target.value)}
          >
            <option value="">All Admins</option>
            {adminSummaries.map(admin => (
              <option key={admin.admin_id} value={admin.admin_id}>
                {admin.admin_name} ({admin.total_referrals} referrals)
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Admin Summaries */}
      <div className="admin-summaries">
        <h3>Admin Performance</h3>
        <div className="summaries-grid">
          {adminSummaries.map(admin => (
            <div key={admin.admin_id} className="admin-summary-card">
              <h4>{admin.admin_name}</h4>
              <div className="admin-stats">
                <div className="stat">
                  <span className="stat-label">Referrals:</span>
                  <span className="stat-value">{admin.total_referrals}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Commission:</span>
                  <span className="stat-value">{formatCurrency(admin.total_commission)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Active:</span>
                  <span className="stat-value">{admin.active_referrals}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Referrals Table */}
      <div className="referrals-table-container">
        <h3>All Referrals ({filteredReferrals.length})</h3>
        <table className="referrals-table">
          <thead>
            <tr>
              <th>Teacher</th>
              <th>Email</th>
              <th>Admin</th>
              <th>Plan</th>
              <th>Active Months</th>
              <th>Commission</th>
              <th>Status</th>
              <th>Date Joined</th>
            </tr>
          </thead>
          <tbody>
            {filteredReferrals.map((referral) => (
              <tr key={referral.referral_id}>
                <td>{referral.teacher_name}</td>
                <td>{referral.teacher_email}</td>
                <td>{referral.admin_name}</td>
                <td className={`plan-${referral.subscription_plan}`}>
                  {referral.subscription_plan.toUpperCase()}
                </td>
                <td>{referral.active_months || 0}</td>
                <td>{formatCurrency(referral.total_commission || 0)}</td>
                <td>
                  <span className={`status-${referral.status || 'active'}`}>
                    {referral.status || 'active'}
                  </span>
                </td>
                <td>{formatDate(referral.date_joined)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReferralRegistry;