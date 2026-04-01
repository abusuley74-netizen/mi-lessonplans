import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Calendar, Trash2, Eye, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MyHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSyllabus, setFilterSyllabus] = useState('all');
  const [selectedLesson, setSelectedLesson] = useState(null);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/lessons`, {
        withCredentials: true
      });
      setLessons(response.data.lessons || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson plan?')) return;

    try {
      await axios.delete(`${API_URL}/api/lessons/${lessonId}`, {
        withCredentials: true
      });
      setLessons(lessons.filter(l => l.lesson_id !== lessonId));
      if (selectedLesson?.lesson_id === lessonId) {
        setSelectedLesson(null);
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
    }
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lesson.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSyllabus = filterSyllabus === 'all' || lesson.syllabus === filterSyllabus;
    return matchesSearch && matchesSyllabus;
  });

  const isSubscribed = user?.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#1A2E16] mb-2">
            MyHub
          </h1>
          <p className="text-[#4A5B46] text-lg">
            View and manage all your saved lesson plans
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#E4DFD5] rounded-xl p-4">
            <p className="text-2xl font-bold text-[#1A2E16]">{lessons.length}</p>
            <p className="text-sm text-[#7A8A76]">Total Lessons</p>
          </div>
          <div className="bg-white border border-[#E4DFD5] rounded-xl p-4">
            <p className="text-2xl font-bold text-[#1A2E16]">
              {lessons.filter(l => l.syllabus === 'Zanzibar').length}
            </p>
            <p className="text-sm text-[#7A8A76]">Zanzibar</p>
          </div>
          <div className="bg-white border border-[#E4DFD5] rounded-xl p-4">
            <p className="text-2xl font-bold text-[#1A2E16]">
              {lessons.filter(l => l.syllabus === 'Tanzania Mainland').length}
            </p>
            <p className="text-sm text-[#7A8A76]">Tanzania Mainland</p>
          </div>
          <div className="bg-white border border-[#E4DFD5] rounded-xl p-4">
            <p className="text-2xl font-bold text-[#1A2E16]">
              {isSubscribed ? 'Unlimited' : `${3 - lessons.length} left`}
            </p>
            <p className="text-sm text-[#7A8A76]">{isSubscribed ? 'Pro Plan' : 'Free Plan'}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A8A76]" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#E4DFD5] rounded-lg pl-10 pr-4 py-2.5 text-[#1A2E16] focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27]"
              data-testid="search-lessons"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#7A8A76]" />
            <select
              value={filterSyllabus}
              onChange={(e) => setFilterSyllabus(e.target.value)}
              className="bg-white border border-[#E4DFD5] rounded-lg px-4 py-2.5 text-[#1A2E16] focus:border-[#2D5A27]"
              data-testid="filter-syllabus"
            >
              <option value="all">All Syllabi</option>
              <option value="Zanzibar">Zanzibar</option>
              <option value="Tanzania Mainland">Tanzania Mainland</option>
            </select>
          </div>
        </div>

        {/* Lessons Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#2D5A27] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="bg-white border border-[#E4DFD5] rounded-xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-[#8E9E82] mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold text-[#1A2E16] mb-2">
              {lessons.length === 0 ? 'No lesson plans yet' : 'No matching lessons'}
            </h3>
            <p className="text-[#7A8A76] mb-6">
              {lessons.length === 0 
                ? 'Create your first lesson plan to get started!' 
                : 'Try adjusting your search or filters'}
            </p>
            {lessons.length === 0 && (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-[#D95D39] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#BD4D2D] transition-colors"
                data-testid="create-first-lesson"
              >
                Create Lesson Plan
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLessons.map((lesson, index) => (
              <div
                key={lesson.lesson_id}
                className="bg-white border border-[#E4DFD5] rounded-xl p-5 card-hover animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                data-testid={`lesson-card-${lesson.lesson_id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="bg-[#EAE5DA] text-[#4A5B46] text-xs px-2.5 py-1 rounded-full font-medium">
                    {lesson.syllabus}
                  </span>
                  <button
                    onClick={() => handleDelete(lesson.lesson_id)}
                    className="text-[#7A8A76] hover:text-[#D95D39] transition-colors"
                    data-testid={`delete-lesson-${lesson.lesson_id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-heading font-semibold text-[#1A2E16] mb-2 line-clamp-2">
                  {lesson.topic}
                </h3>

                <div className="flex items-center gap-4 text-sm text-[#7A8A76] mb-4">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {lesson.subject}
                  </span>
                  <span>{lesson.grade}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E4DFD5]">
                  <span className="flex items-center gap-1 text-xs text-[#7A8A76]">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(lesson.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setSelectedLesson(lesson)}
                    className="flex items-center gap-1 text-sm text-[#2D5A27] font-medium hover:text-[#21441C] transition-colors"
                    data-testid={`view-lesson-${lesson.lesson_id}`}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lesson Detail Modal */}
        {selectedLesson && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b border-[#E4DFD5] p-4 flex items-center justify-between">
                <h2 className="font-heading text-xl font-semibold text-[#1A2E16]">
                  {selectedLesson.topic}
                </h2>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="text-[#7A8A76] hover:text-[#1A2E16] text-2xl"
                  data-testid="close-lesson-modal"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                {/* Import and use LessonPreview here or inline the content */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#F2EFE8] rounded-lg">
                    <div>
                      <span className="text-xs text-[#7A8A76] uppercase">Syllabus</span>
                      <p className="font-medium text-[#1A2E16]">{selectedLesson.syllabus}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[#7A8A76] uppercase">Subject</span>
                      <p className="font-medium text-[#1A2E16]">{selectedLesson.subject}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[#7A8A76] uppercase">Grade</span>
                      <p className="font-medium text-[#1A2E16]">{selectedLesson.grade}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[#7A8A76] uppercase">Date</span>
                      <p className="font-medium text-[#1A2E16]">
                        {new Date(selectedLesson.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <pre className="bg-[#1A2E16] text-[#F2EFE8] p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(selectedLesson.content, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyHub;
