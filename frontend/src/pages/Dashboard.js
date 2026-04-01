import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import ZanzibarLessonForm from '../components/ZanzibarLessonForm';
import TanzaniaMainlandLessonForm from '../components/TanzaniaMainlandLessonForm';
import SubscriptionModal from '../components/SubscriptionModal';

const Dashboard = () => {
  const { user } = useAuth();
  const [syllabus, setSyllabus] = useState('Zanzibar');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState(null);

  const handleLessonGenerated = (lesson) => {
    setGeneratedLesson(lesson);
  };

  const handleSyllabusChange = (newSyllabus) => {
    setSyllabus(newSyllabus);
    setGeneratedLesson(null);
  };

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

        {/* Subscription Status */}
        {user && (
          <div className="subscription-status-bar mb-6">
            <div className="usage-info">
              <span className="plan-name">
                {user.subscription_plan === 'basic' ? 'Basic Plan' : user.subscription_plan === 'premium' ? 'Premium Plan' : 'Free Tier'}
              </span>
              {user.subscription_plan === 'free' && (
                <span className="lesson-count">20 lessons/month</span>
              )}
              {user.subscription_plan === 'basic' && (
                <span className="lesson-count">50 lessons/month</span>
              )}
            </div>
            {user.subscription_plan === 'free' && (
              <button 
                className="subscription-upgrade-btn"
                onClick={() => setShowSubscriptionModal(true)}
              >
                Upgrade subscription
              </button>
            )}
          </div>
        )}

        {/* Syllabus Selector - shown at top for easy switching */}
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
