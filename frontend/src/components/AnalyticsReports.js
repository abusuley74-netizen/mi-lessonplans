import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, Users, DollarSign, TrendingUp, BookOpen, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AnalyticsReports = () => {
  const [dashboard, setDashboard] = useState(null);
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [contentStats, setContentStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_session_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, overviewRes, revenueRes, contentRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/dashboard`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/api/admin/analytics/overview`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/api/admin/analytics/revenue`, { headers: getAuthHeaders() }).catch(() => ({ data: { revenue_breakdown: [] } })),
        axios.get(`${API_URL}/api/admin/analytics/content`, { headers: getAuthHeaders() }),
      ]);
      setDashboard(dashRes.data);
      setOverview(overviewRes.data);
      setRevenue(revenueRes.data);
      setContentStats(contentRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => `TZS ${(n || 0).toLocaleString()}`;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  const dash = dashboard?.overview || {};
  const subs = dashboard?.subscriptions || {};
  const recent = dashboard?.recent_activity || {};
  const totalRevenue = dash.total_revenue || 0;
  const totalUsers = dash.total_users || 0;
  const revenueBreakdown = revenue?.revenue_breakdown || [];
  const subDist = overview?.subscription_distribution || [];
  const popularSubjects = overview?.popular_subjects || [];
  const userGrowth = overview?.user_growth || [];
  const lessonTrends = overview?.lesson_trends || [];
  const cs = contentStats?.content_stats || {};
  const activeUsers = contentStats?.most_active_users || [];

  return (
    <div className="p-6 space-y-6" data-testid="analytics-reports">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Analytics & Reports</h2>
        <p className="text-gray-500">Platform performance, revenue, and user insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpi-cards">
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
            {recent.new_users_7d > 0 && <span className="flex items-center text-xs text-green-600 font-medium"><ArrowUpRight className="w-3 h-3" />+{recent.new_users_7d} this week</span>}
          </div>
          <p className="text-3xl font-bold text-gray-800" data-testid="kpi-users">{totalUsers}</p>
          <p className="text-sm text-gray-500">Total Users</p>
        </div>
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-600" /></div>
          </div>
          <p className="text-3xl font-bold text-gray-800" data-testid="kpi-revenue">{fmt(totalRevenue)}</p>
          <p className="text-sm text-gray-500">Total Revenue</p>
        </div>
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center"><BookOpen className="w-5 h-5 text-purple-600" /></div>
            {recent.lessons_created_7d > 0 && <span className="flex items-center text-xs text-green-600 font-medium"><ArrowUpRight className="w-3 h-3" />+{recent.lessons_created_7d} this week</span>}
          </div>
          <p className="text-3xl font-bold text-gray-800" data-testid="kpi-lessons">{cs.lessons || 0}</p>
          <p className="text-sm text-gray-500">Total Lessons</p>
        </div>
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
          </div>
          <p className="text-3xl font-bold text-gray-800" data-testid="kpi-active">{dash.active_users || 0}</p>
          <p className="text-sm text-gray-500">Active Users</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Subscription Distribution */}
        <div className="bg-white border rounded-lg" data-testid="sub-distribution">
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-800">Subscription Distribution</h3>
          </div>
          <div className="p-5 space-y-3">
            {(() => {
              const planNames = { free: 'Free', basic: 'Basic', premium: 'Premium', master: 'Master', null: 'Unset' };
              const planColors = { free: 'bg-gray-400', basic: 'bg-blue-500', premium: 'bg-purple-500', master: 'bg-amber-500', null: 'bg-gray-300' };
              const total = subDist.reduce((s, d) => s + d.count, 0) || 1;
              return subDist.map((d, i) => {
                const pct = Math.round((d.count / total) * 100);
                const key = d._id || 'null';
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{planNames[key] || key}</span>
                      <span className="text-sm text-gray-500">{d.count} users ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${planColors[key] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white border rounded-lg" data-testid="revenue-breakdown">
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-800">Revenue by Plan</h3>
          </div>
          {revenueBreakdown.length > 0 ? (
            <div className="p-5 space-y-4">
              {revenueBreakdown.map((r, i) => {
                const planNames = { basic: 'Basic', premium: 'Premium', master: 'Master', enterprise: 'Master' };
                const planColors = { basic: 'text-blue-600', premium: 'text-purple-600', master: 'text-amber-600', enterprise: 'text-amber-600' };
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className={`font-semibold ${planColors[r._id] || 'text-gray-700'}`}>{planNames[r._id] || r._id}</p>
                      <p className="text-xs text-gray-400">{r.count} subscriber{r.count !== 1 ? 's' : ''}</p>
                    </div>
                    <p className="text-lg font-bold text-gray-800">{fmt(r.revenue)}</p>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200">
                <p className="font-semibold text-gray-700">Total Monthly Revenue</p>
                <p className="text-xl font-bold text-green-700">{fmt(revenueBreakdown.reduce((s, r) => s + (r.revenue || 0), 0))}</p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <DollarSign className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No revenue data yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Popular Subjects */}
        <div className="bg-white border rounded-lg" data-testid="popular-subjects">
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-800">Popular Subjects</h3>
          </div>
          {popularSubjects.length > 0 ? (
            <div className="p-5">
              <div className="space-y-2">
                {popularSubjects.map((s, i) => {
                  const maxCount = popularSubjects[0]?.count || 1;
                  const pct = Math.round((s.count / maxCount) * 100);
                  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-indigo-500', 'bg-orange-500'];
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">{s._id || 'Unknown'}</span>
                        <span className="text-sm text-gray-500">{s.count} lesson{s.count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${colors[i % colors.length]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">No subject data yet</div>
          )}
        </div>

        {/* Content Summary */}
        <div className="bg-white border rounded-lg" data-testid="content-summary">
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-800">Content Summary</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Lesson Plans', count: cs.lessons || 0, color: 'text-blue-600' },
                { label: 'Notes', count: cs.notes || 0, color: 'text-green-600' },
                { label: 'Schemes', count: cs.schemes || 0, color: 'text-purple-600' },
                { label: 'Templates', count: cs.templates || 0, color: 'text-amber-600' },
                { label: 'Dictations', count: cs.dictations || 0, color: 'text-rose-600' },
                { label: 'Shared Links', count: cs.shared_links || 0, color: 'text-teal-600' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className={`text-lg font-bold ${item.color}`}>{item.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Total Content Items</span>
                <span className="text-xl font-bold text-gray-800">
                  {Object.values(cs).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Growth Timeline */}
      {userGrowth.length > 0 && (
        <div className="bg-white border rounded-lg" data-testid="user-growth">
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-800">User Signups (Last 30 Days)</h3>
          </div>
          <div className="p-5">
            <div className="flex items-end gap-1 h-32">
              {userGrowth.map((d, i) => {
                const maxCount = Math.max(...userGrowth.map(x => x.count));
                const height = maxCount > 0 ? Math.max(8, (d.count / maxCount) * 100) : 8;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${d._id}: ${d.count} users`}>
                    <span className="text-[10px] text-gray-500">{d.count}</span>
                    <div className="w-full bg-blue-500 rounded-t" style={{ height: `${height}%` }} />
                    <span className="text-[9px] text-gray-400 truncate w-full text-center">{d._id?.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top Users */}
      {activeUsers.length > 0 && (
        <div className="bg-white border rounded-lg" data-testid="top-users">
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-800">Top Content Creators</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 border-b">
                  <th className="px-5 py-3 font-medium">Rank</th>
                  <th className="px-5 py-3 font-medium">Teacher</th>
                  <th className="px-5 py-3 font-medium">Lessons Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activeUsers.map((u, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <span className={`w-7 h-7 inline-flex items-center justify-center rounded-full text-xs font-bold ${
                        i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                      }`}>{i + 1}</span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold text-blue-600">{u.lesson_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsReports;
