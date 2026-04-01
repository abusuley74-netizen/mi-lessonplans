import React, { useState, useEffect } from 'react';
import referralService from '../lib/referralService';
import './AdminReferAndEarn.css';

const AdminReferAndEarn = ({ currentUser }) => {
  const [referrals, setReferrals] = useState([]);
  const [metrics, setMetrics] = useState({
    totalTeachers: 0,
    totalCommission: 0,
    activeTeachers: 0,
    inactiveTeachers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReferral, setNewReferral] = useState({
    teacher_id: '',
    teacher_name: '',
    teacher_email: '',
    subscription_plan: 'free',
    monthly_price: 0
  });

  useEffect(() => {
    loadReferrals();
  }, [currentUser]);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const result = await referralService.getAdminReferrals(currentUser.user_id);
      setReferrals(result.referrals || []);
      setMetrics(result.metrics || metrics);
    } catch (err) {
      setError('Failed to load referrals');
      console.error('Error loading referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReferral = async (e) => {
    e.preventDefault();
    try {
      const referralData = {
        ...newReferral,
        admin_id: currentUser.user_id,
        admin_name: currentUser.name
      };

      await referralService.createReferral(referralData);
      setNewReferral({
        teacher_id: '',
        teacher_name: '',
        teacher_email: '',
        subscription_plan: 'free',
        monthly_price: 0
      });
      setShowAddForm(false);
      loadReferrals();
    } catch (err) {
      setError('Failed to add referral');
      console.error('Error adding referral:', err);
    }
  };

  const handleUpdateReferral = async (referralId, updateData) => {
    try {
      await referralService.updateReferral(referralId, updateData);
      loadReferrals();
    } catch (err) {
      setError('Failed to update referral');
      console.error('Error updating referral:', err);
    }
  };

  const handleDeleteReferral = async (referralId) => {
    if (window.confirm('Are you sure you want to delete this referral?')) {
      try {
        await referralService.deleteReferral(referralId);
        loadReferrals();
      } catch (err) {
        setError('Failed to delete referral');
        console.error('Error deleting referral:', err);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  if (loading) {
    return <div className="admin-referrals-loading">Loading referrals...</div>;
  }

  return (
    <div className="admin-referrals-container">
      <div className="admin-referrals-header">
        <h2>Referral Management</h2>
        <button
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add Referral'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Metrics Dashboard */}
      <div className="metrics-dashboard">
        <div className="metric-card">
          <h3>Total Teachers</h3>
          <span className="metric-value">{metrics.totalTeachers}</span>
        </div>
        <div className="metric-card">
          <h3>Total Commission</h3>
          <span className="metric-value">{formatCurrency(metrics.totalCommission)}</span>
        </div>
        <div className="metric-card">
          <h3>Active Teachers</h3>
          <span className="metric-value">{metrics.activeTeachers}</span>
        </div>
        <div className="metric-card">
          <h3>Inactive Teachers</h3>
          <span className="metric-value">{metrics.inactiveTeachers}</span>
        </div>
      </div>

      {/* Add Referral Form */}
      {showAddForm && (
        <form className="add-referral-form" onSubmit={handleAddReferral}>
          <h3>Add New Referral</h3>
          <div className="form-group">
            <label>Teacher ID:</label>
            <input
              type="text"
              value={newReferral.teacher_id}
              onChange={(e) => setNewReferral({...newReferral, teacher_id: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Teacher Name:</label>
            <input
              type="text"
              value={newReferral.teacher_name}
              onChange={(e) => setNewReferral({...newReferral, teacher_name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Teacher Email:</label>
            <input
              type="email"
              value={newReferral.teacher_email}
              onChange={(e) => setNewReferral({...newReferral, teacher_email: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Subscription Plan:</label>
            <select
              value={newReferral.subscription_plan}
              onChange={(e) => {
                const plan = e.target.value;
                const prices = { free: 0, basic: 9999, premium: 19999, enterprise: 29999 };
                setNewReferral({
                  ...newReferral,
                  subscription_plan: plan,
                  monthly_price: prices[plan] || 0
                });
              }}
            >
              <option value="free">Free</option>
              <option value="basic">Basic (TZS 9,999)</option>
              <option value="premium">Premium (TZS 19,999)</option>
              <option value="enterprise">Enterprise (TZS 29,999)</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Add Referral</button>
            <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Referrals Table */}
      <div className="referrals-table-container">
        <table className="referrals-table">
          <thead>
            <tr>
              <th>Teacher</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Active Months</th>
              <th>Commission</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((referral) => (
              <tr key={referral.referral_id}>
                <td>{referral.teacher_name}</td>
                <td>{referral.teacher_email}</td>
                <td className={`plan-${referral.subscription_plan}`}>
                  {referral.subscription_plan.toUpperCase()}
                </td>
                <td>
                  <input
                    type="number"
                    value={referral.active_months || 0}
                    onChange={(e) => handleUpdateReferral(referral.referral_id, {
                      active_months: parseInt(e.target.value) || 0
                    })}
                    min="0"
                  />
                </td>
                <td>{formatCurrency(referral.total_commission || 0)}</td>
                <td>
                  <select
                    value={referral.status || 'active'}
                    onChange={(e) => handleUpdateReferral(referral.referral_id, {
                      status: e.target.value
                    })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td>
                  <button
                    className="btn-danger"
                    onClick={() => handleDeleteReferral(referral.referral_id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReferAndEarn;