import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, TrendingUp, FileText, Mic, BookOpen, Calendar, Clock, CreditCard } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MyActivities = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    totalLessons: 0,
    totalNotes: 0,
    totalDictations: 0,
    thisWeekLessons: 0,
    thisMonthLessons: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const [lessonsRes, notesRes, dictationsRes] = await Promise.all([
        axios.get(`${API_URL}/api/lessons`, { withCredentials: true }),
        axios.get(`${API_URL}/api/notes`, { withCredentials: true }),
        axios.get(`${API_URL}/api/dictations`, { withCredentials: true })
      ]);

      const lessons = lessonsRes.data.lessons || [];
      const notes = notesRes.data.notes || [];
      const dictations = dictationsRes.data.dictations || [];

      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

      const thisWeekLessons = lessons.filter(l => new Date(l.created_at) > weekAgo).length;
      const thisMonthLessons = lessons.filter(l => new Date(l.created_at) > monthAgo).length;

      setStats({
        totalLessons: lessons.length,
        totalNotes: notes.length,
        totalDictations: dictations.length,
        thisWeekLessons,
        thisMonthLessons
      });

      // Combine all activities
      const allActivities = [
        ...lessons.map(l => ({ ...l, type: 'lesson', icon: BookOpen, color: 'blue' })),
        ...notes.map(n => ({ ...n, type: 'note', icon: FileText, color: 'green' })),
        ...dictations.map(d => ({ ...d, type: 'dictation', icon: Mic, color: 'purple' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setActivities(allActivities.slice(0, 20)); // Last 20 activities
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-[#1A2E16] mb-1">My Activities</h2>
        <p className="text-[#7A8A76]">Track your activity and usage analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <BookOpen className="w-8 h-8 text-blue-500" />
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Total</span>
          </div>
          <p className="text-3xl font-bold text-[#1A2E16]">{stats.totalLessons}</p>
          <p className="text-sm text-[#7A8A76]">Lesson Plans</p>
        </div>

        <div className="bg-white border border-[#E4DFD5] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <FileText className="w-8 h-8 text-green-500" />
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Total</span>
          </div>
          <p className="text-3xl font-bold text-[#1A2E16]">{stats.totalNotes}</p>
          <p className="text-sm text-[#7A8A76]">Notes</p>
        </div>

        <div className="bg-white border border-[#E4DFD5] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Mic className="w-8 h-8 text-purple-500" />
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Total</span>
          </div>
          <p className="text-3xl font-bold text-[#1A2E16]">{stats.totalDictations}</p>
          <p className="text-sm text-[#7A8A76]">Dictations</p>
        </div>

        <div className="bg-white border border-[#E4DFD5] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-8 h-8 text-orange-500" />
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">This Week</span>
          </div>
          <p className="text-3xl font-bold text-[#1A2E16]">{stats.thisWeekLessons}</p>
          <p className="text-sm text-[#7A8A76]">Lessons Created</p>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="bg-gradient-to-r from-[#2D5A27] to-[#3d7a35] text-white rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-xl font-bold mb-2">
              {user?.subscription_status === 'active' ? 'Pro Plan' : 'Free Plan'}
            </h3>
            <p className="text-white/80">
              {user?.subscription_status === 'active'
                ? 'Unlimited access to all features'
                : '3 lesson plans per month'}
            </p>
          </div>
          <div className="text-right">
            <CreditCard className="w-12 h-12 opacity-50" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-[#E4DFD5] rounded-xl">
        <div className="p-4 border-b border-[#E4DFD5]">
          <h3 className="font-heading font-semibold text-[#1A2E16]">Recent Activity</h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#2D5A27] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-[#8E9E82] mx-auto mb-4" />
            <p className="text-[#7A8A76]">No activities yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4DFD5]">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              const colors = {
                blue: 'bg-blue-100 text-blue-600',
                green: 'bg-green-100 text-green-600',
                purple: 'bg-purple-100 text-purple-600'
              };
              
              return (
                <div key={index} className="p-4 flex items-center gap-4 hover:bg-[#FDFBF7]">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[activity.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#1A2E16]">
                      {activity.topic || activity.title || activity.name || 'Untitled'}
                    </p>
                    <p className="text-sm text-[#7A8A76]">
                      {activity.type === 'lesson' && `${activity.syllabus} • ${activity.subject} • ${activity.grade}`}
                      {activity.type === 'note' && 'Note'}
                      {activity.type === 'dictation' && `Dictation • ${activity.language}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#7A8A76]">{formatDate(activity.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyActivities;
