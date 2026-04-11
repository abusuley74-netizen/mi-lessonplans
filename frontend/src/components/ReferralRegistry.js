import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, DollarSign, Clock, Settings, ChevronDown, ChevronUp, Loader2, Check, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ReferralRegistry = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payoutSchedule, setPayoutSchedule] = useState('monthly');
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [expandedReferrer, setExpandedReferrer] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payingReferrer, setPayingReferrer] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_session_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/admin/teacher-referrals`, { headers: getAuthHeaders() });
      setData(res.data);
      setPayoutSchedule(res.data.payout_schedule || 'monthly');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const savePayoutSchedule = async () => {
    setSavingSchedule(true);
    try {
      await axios.put(`${API_URL}/api/admin/referral-settings/payout-schedule`, { schedule: payoutSchedule }, { headers: getAuthHeaders() });
      setError(null);
    } catch (err) {
      setError('Failed to save schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  const recordPayout = async (referrerId) => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) return;
    try {
      setPayingReferrer(referrerId);
      await axios.post(`${API_URL}/api/admin/referral-payouts`, {
        referrer_id: referrerId,
        amount: amount,
      }, { headers: getAuthHeaders() });
      setPayoutAmount('');
      setPayingReferrer(null);
      loadData();
    } catch (err) {
      setError('Failed to record payout');
      setPayingReferrer(null);
    }
  };

  const fmt = (n) => `TZS ${(n || 0).toLocaleString()}`;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  const referrers = data?.referrers || [];
  const totalCommission = referrers.reduce((s, r) => s + r.total_commission, 0);
  const totalPaid = referrers.reduce((s, r) => s + r.total_paid, 0);
  const totalPending = referrers.reduce((s, r) => s + r.pending, 0);

  return (
    <div className="p-6 space-y-6" data-testid="admin-referral-registry">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Referral Management</h2>
        <p className="text-gray-500">View referrers, referees, earnings, and manage payouts</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 font-bold">&times;</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" data-testid="admin-referral-stats">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><Users className="w-4 h-4" /> Total Referrers</div>
          <p className="text-2xl font-bold text-gray-800">{referrers.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><Users className="w-4 h-4" /> Total Referees</div>
          <p className="text-2xl font-bold text-gray-800">{referrers.reduce((s, r) => s + r.referee_count, 0)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><DollarSign className="w-4 h-4" /> Total Commission</div>
          <p className="text-2xl font-bold text-green-700">{fmt(totalCommission)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><Clock className="w-4 h-4" /> Pending Payouts</div>
          <p className="text-2xl font-bold text-amber-700">{fmt(totalPending)}</p>
        </div>
      </div>

      {/* Payout Settings */}
      <div className="bg-white border rounded-lg p-5" data-testid="payout-settings">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Payout Schedule</h3>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={payoutSchedule}
            onChange={(e) => setPayoutSchedule(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm"
            data-testid="payout-schedule-select"
          >
            <option value="biweekly">Every 2 Weeks</option>
            <option value="monthly">Monthly</option>
          </select>
          <button
            onClick={savePayoutSchedule}
            disabled={savingSchedule}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            data-testid="save-schedule-btn"
          >
            {savingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      {/* Referrers List */}
      <div className="bg-white border rounded-lg" data-testid="referrers-list">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-800">Referrers & Their Referees</h3>
        </div>
        {referrers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No referrals yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {referrers.map((referrer, idx) => (
              <div key={referrer.referrer?.user_id || referrer.referrer?.admin_id || idx}>
                {/* Referrer Row */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 text-left"
                  onClick={() => setExpandedReferrer(expandedReferrer === idx ? null : idx)}
                  data-testid={`referrer-row-${idx}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                      {(referrer.referrer?.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{referrer.referrer?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{referrer.referrer?.email} · Code: {referrer.referrer?.referral_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-gray-500">Referees</p>
                      <p className="font-semibold">{referrer.referee_count}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Commission</p>
                      <p className="font-semibold text-green-700">{fmt(referrer.total_commission)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Paid</p>
                      <p className="font-semibold">{fmt(referrer.total_paid)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Pending</p>
                      <p className="font-semibold text-amber-600">{fmt(referrer.pending)}</p>
                    </div>
                    {expandedReferrer === idx ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded Referees */}
                {expandedReferrer === idx && (
                  <div className="bg-gray-50 px-5 pb-4">
                    <table className="w-full text-sm" data-testid={`referee-table-${idx}`}>
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="py-2 font-medium">Referee</th>
                          <th className="py-2 font-medium">Plan</th>
                          <th className="py-2 font-medium">30% Commission</th>
                          <th className="py-2 font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrer.referees.map((referee, ri) => {
                          const planPrices = { basic: 9999, premium: 19999, master: 29999, enterprise: 29999 };
                          const commission = Math.round((planPrices[referee.subscription_plan] || 0) * 0.3);
                          return (
                            <tr key={ri} className="border-b border-gray-200">
                              <td className="py-2">
                                <p className="font-medium text-gray-700">{referee.name}</p>
                                <p className="text-xs text-gray-400">{referee.email}</p>
                              </td>
                              <td className="py-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  referee.subscription_plan === 'master' || referee.subscription_plan === 'enterprise' ? 'bg-amber-100 text-amber-800' :
                                  referee.subscription_plan === 'premium' ? 'bg-purple-100 text-purple-700' :
                                  referee.subscription_plan === 'basic' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {referee.subscription_plan === 'enterprise' ? 'Master' : (referee.subscription_plan?.charAt(0).toUpperCase() + referee.subscription_plan?.slice(1))}
                                </span>
                              </td>
                              <td className="py-2 font-medium text-green-700">{fmt(commission)}/cycle</td>
                              <td className="py-2 text-gray-500">{referee.created_at ? new Date(referee.created_at).toLocaleDateString() : '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {/* Payout Action */}
                    {referrer.pending > 0 && (
                      <div className="mt-3 flex items-center gap-3 bg-white rounded-lg p-3 border">
                        <span className="text-sm text-gray-600">Record payout:</span>
                        <input
                          type="number"
                          placeholder="Amount (TZS)"
                          value={expandedReferrer === idx ? payoutAmount : ''}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          className="border rounded-lg px-3 py-1.5 text-sm w-40"
                          data-testid={`payout-amount-${idx}`}
                        />
                        <button
                          onClick={() => recordPayout(referrer.referrer?.user_id)}
                          disabled={payingReferrer === referrer.referrer?.user_id}
                          className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                          data-testid={`record-payout-btn-${idx}`}
                        >
                          {payingReferrer === referrer.referrer?.user_id ? 'Saving...' : 'Record Payout'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralRegistry;
