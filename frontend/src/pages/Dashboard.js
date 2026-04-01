import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LessonForm from '../components/LessonForm';
import LessonPreview from '../components/LessonPreview';
import SubscriptionModal from '../components/SubscriptionModal';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const { user } = useAuth();
  const [lessonData, setLessonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleGenerateLesson = async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/lessons/generate`,
        formData,
        { withCredentials: true }
      );
      setLessonData(response.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setShowSubscriptionModal(true);
      } else {
        setError(err.response?.data?.detail || 'Failed to generate lesson plan. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#1A2E16] mb-2">
            Lesson Plan Generator
          </h1>
          <p className="text-[#4A5B46] text-lg">
            Create professional lesson plans in seconds with AI assistance
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="animate-fade-in stagger-1">
            <LessonForm onSubmit={handleGenerateLesson} isLoading={isLoading} />
          </div>

          {/* Preview Section */}
          <div className="animate-fade-in stagger-2">
            {isLoading ? (
              <div className="bg-white border border-[#E4DFD5] rounded-xl p-8 h-full flex flex-col items-center justify-center animate-pulse-glow">
                <Loader2 className="w-12 h-12 text-[#2D5A27] animate-spin mb-4" />
                <p className="text-[#4A5B46] font-medium text-lg mb-2">Generating your lesson plan...</p>
                <p className="text-[#7A8A76] text-sm text-center">
                  Our AI is crafting a comprehensive lesson plan tailored to your specifications
                </p>
              </div>
            ) : lessonData ? (
              <LessonPreview lessonData={lessonData} />
            ) : (
              <div className="bg-white border border-[#E4DFD5] rounded-xl p-8 h-full flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-[#F2EFE8] rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-[#2D5A27]" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-[#1A2E16] mb-2">
                  Ready to Create
                </h3>
                <p className="text-[#7A8A76] max-w-sm">
                  Fill out the form on the left and click "Generate" to create your AI-powered lesson plan
                </p>
              </div>
            )}
          </div>
        </div>
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
