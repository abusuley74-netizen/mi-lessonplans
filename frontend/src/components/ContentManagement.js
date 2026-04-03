import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, BookOpen, Mic, Calendar, Link2, Layout, Loader2, Trash2, Search, ChevronLeft, ChevronRight, AlertCircle, Users, Eye } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ContentManagement = () => {
  const [contentStats, setContentStats] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);
  const pageSize = 20;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_session_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => { loadData(); }, [page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, lessonsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/analytics/content`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/api/admin/content/lessons?skip=${page * pageSize}&limit=${pageSize}`, { headers: getAuthHeaders() }),
      ]);
      setContentStats(statsRes.data.content_stats);
      setActiveUsers(statsRes.data.most_active_users || []);
      setLessons(lessonsRes.data.lessons || []);
      setTotalLessons(lessonsRes.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lessonId) => {
    if (!window.confirm('Delete this lesson plan? This cannot be undone.')) return;
    try {
      setDeleting(lessonId);
      await axios.delete(`${API_URL}/api/admin/content/lessons/${lessonId}`, { headers: getAuthHeaders() });
      setLessons(prev => prev.filter(l => l.lesson_id !== lessonId));
      setTotalLessons(prev => prev - 1);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const filteredLessons = lessons.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (l.title?.toLowerCase().includes(q) || l.subject?.toLowerCase().includes(q) || l.topic?.toLowerCase().includes(q));
  });

  const statCards = contentStats ? [
    { label: 'Lesson Plans', count: contentStats.lessons, icon: FileText, color: 'bg-blue-50 text-blue-600' },
    { label: 'Notes', count: contentStats.notes, icon: BookOpen, color: 'bg-green-50 text-green-600' },
    { label: 'Schemes of Work', count: contentStats.schemes, icon: Calendar, color: 'bg-purple-50 text-purple-600' },
    { label: 'Templates', count: contentStats.templates, icon: Layout, color: 'bg-amber-50 text-amber-600' },
    { label: 'Dictations', count: contentStats.dictations, icon: Mic, color: 'bg-rose-50 text-rose-600' },
    { label: 'Shared Links', count: contentStats.shared_links, icon: Link2, color: 'bg-teal-50 text-teal-600' },
  ] : [];

  if (loading && !contentStats) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="p-6 space-y-6" data-testid="content-management">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Content Management</h2>
        <p className="text-gray-500">Overview and management of all platform content</p>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="content-stats">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border rounded-lg p-4 text-center">
              <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{s.count}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Most Active Users */}
      {activeUsers.length > 0 && (
        <div className="bg-white border rounded-lg" data-testid="active-users">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Most Active Content Creators</h3>
          </div>
          <div className="divide-y">
            {activeUsers.map((u, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-blue-600">{u.lesson_count} lessons</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lessons Table */}
      <div className="bg-white border rounded-lg" data-testid="lessons-table">
        <div className="px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold text-gray-800">All Lesson Plans ({totalLessons})</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, subject, topic..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64"
              data-testid="lesson-search"
            />
          </div>
        </div>

        {filteredLessons.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500 border-b">
                    <th className="px-5 py-3 font-medium">Title</th>
                    <th className="px-5 py-3 font-medium">Subject</th>
                    <th className="px-5 py-3 font-medium">Grade</th>
                    <th className="px-5 py-3 font-medium">Syllabus</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                    <th className="px-5 py-3 font-medium w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLessons.map((lesson, i) => (
                    <React.Fragment key={i}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800 truncate max-w-[200px]">{lesson.title || lesson.topic || 'Untitled'}</p>
                        </td>
                        <td className="px-5 py-3 capitalize text-gray-600">{lesson.subject || '-'}</td>
                        <td className="px-5 py-3 text-gray-600">{lesson.grade || lesson.form_data?.class_name || '-'}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            lesson.syllabus === 'Zanzibar' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
                          }`}>{lesson.syllabus || '-'}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{lesson.created_at ? new Date(lesson.created_at).toLocaleDateString() : '-'}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedLesson(expandedLesson === lesson.lesson_id ? null : lesson.lesson_id)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                              title="Preview"
                              data-testid={`preview-lesson-${i}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(lesson.lesson_id)}
                              disabled={deleting === lesson.lesson_id}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded disabled:opacity-50"
                              title="Delete"
                              data-testid={`delete-lesson-${i}`}
                            >
                              {deleting === lesson.lesson_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedLesson === lesson.lesson_id && (
                        <tr>
                          <td colSpan={6} className="px-5 py-4 bg-gray-50">
                            <div className="text-sm text-gray-700 max-h-48 overflow-y-auto whitespace-pre-wrap">
                              {lesson.content ? (typeof lesson.content === 'string' ? lesson.content.substring(0, 1000) : JSON.stringify(lesson.content, null, 2).substring(0, 1000)) : 'No content available'}
                              {(lesson.content?.length > 1000 || JSON.stringify(lesson.content)?.length > 1000) && '...'}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t">
              <p className="text-sm text-gray-500">
                Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalLessons)} of {totalLessons}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 border rounded-lg disabled:opacity-30 hover:bg-gray-50"
                  data-testid="prev-page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page + 1) * pageSize >= totalLessons}
                  className="p-2 border rounded-lg disabled:opacity-30 hover:bg-gray-50"
                  data-testid="next-page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{search ? 'No lessons match your search' : 'No lesson plans yet'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentManagement;
