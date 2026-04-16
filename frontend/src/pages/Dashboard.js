import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import ZanzibarLessonForm from '../components/ZanzibarLessonForm';
import TanzaniaMainlandLessonForm from '../components/TanzaniaMainlandLessonForm';
import SubscriptionModal from '../components/SubscriptionModal';
import axios from 'axios';
import { Crown, Zap } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PLAN_NAMES = { free: 'Free', basic: 'Basic', premium: 'Premium', master: 'Master' };

const Dashboard = () => {
  const { user } = useAuth();
  const [syllabus, setSyllabus] = useState('Zanzibar');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState(null);
  const [accessData, setAccessData] = useState(null);

  const fetchAccess = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/user/feature-access`);
      setAccessData(res.data);
    } catch { /* fallback */ }
  }, []);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  const handleLessonGenerated = (lesson) => {
    setGeneratedLesson(lesson);
    // Refresh the counter
    fetchAccess();
  };

  const handleSyllabusChange = (newSyllabus) => {
    setSyllabus(newSyllabus);
    setGeneratedLesson(null);
  };

  const plan = accessData?.plan || 'free';
  const usage = accessData?.lesson_usage;
  const planName = PLAN_NAMES[plan] || 'Free';
  const isLimited = usage?.limit != null;
  const usagePercent = isLimited && usage?.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0;
  const isNearLimit = isLimited && usage?.used >= (usage?.limit * 0.8);
  const isAtLimit = isLimited && usage?.used >= usage?.limit;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="mb-6">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#1A2E16] mb-2">
            Lesson Plan Generator
          </h1>
          <p className="text-[#4A5B46] text-lg">
            Create professional lesson plans in seconds with AI assistance
          </p>
        </div>

        {/* Plan Status Bar */}
        {usage && (
          <div className={`mb-6 rounded-xl p-4 border ${isAtLimit ? 'bg-red-50 border-red-200' : 'bg-white border-[#E4DFD5]'}`} data-testid="plan-status-bar">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${plan === 'free' ? 'bg-[#F2EFE8]' : 'bg-[#2D5A27]/10'}`}>
                  {isLimited ? <Zap className="w-5 h-5 text-[#D95D39]" /> : <Crown className="w-5 h-5 text-[#2D5A27]" />}
                </div>
                <div>
                  <p className="font-medium text-[#1A2E16]" data-testid="plan-name-display">{planName} Plan</p>
                  {isLimited ? (
                    <p className="text-sm text-[#7A8A76]">
                      <span className={`font-semibold ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-[#1A2E16]'}`}>{usage.used}</span> / {usage.limit} lessons used
                      <span className="mx-2">·</span>
                      {usage.days_remaining}d remaining
                    </p>
                  ) : (
                    <p className="text-sm text-[#2D5A27] font-medium">Unlimited lessons · {usage.days_remaining}d in period</p>
                  )}
                </div>
              </div>
              {isLimited && (
                <div className="flex items-center gap-3">
                  {/* Progress bar */}
                  <div className="w-32 bg-[#E4DFD5] rounded-full h-2.5 hidden sm:block">
                    <div
                      className={`h-2.5 rounded-full transition-all ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-[#2D5A27]'}`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <button 
                    className="text-sm font-medium text-[#D95D39] hover:underline whitespace-nowrap"
                    onClick={() => setShowSubscriptionModal(true)}
                    data-testid="upgrade-plan-btn"
                  >
                    Upgrade Plan
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Syllabus Selector */}
        <div className="template-selector mb-6">
          <label>Select Syllabus Template</label>
          <select 
            value={syllabus} 
            onChange={(e) => handleSyllabusChange(e.target.value)}
            data-testid="syllabus-selector"
          >
            <option value="Zanzibar">Zanzibar Syllabus</option>
            <option value="Tanzania Mainland">Tanzania Mainland Syllabus</option>
          </select>
        </div>

        {/* Render appropriate form based on syllabus selection */}
        {syllabus === 'Zanzibar' ? (
          <ZanzibarLessonForm onLessonGenerated={handleLessonGenerated} />
        ) : (
          <TanzaniaMainlandLessonForm onLessonGenerated={handleLessonGenerated} />
        )}
      </main>

      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)} 
      />
    </div>
  );
};

export default Dashboard;
