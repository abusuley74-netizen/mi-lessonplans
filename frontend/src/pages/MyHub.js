import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { 
  Upload, FileText, Layout, Mic, FolderOpen, Calendar, 
  BarChart3, CreditCard, User, ChevronRight, Plus,
  PanelLeftClose, PanelLeftOpen, Link2, Lock, Gift, Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import MyFiles from '../components/MyFiles';
import CreateNotes from '../components/CreateNotes';
import Dictation from '../components/Dictation';
import MyActivities from '../components/MyActivities';
import PaymentSettings from '../components/PaymentSettings';
import ProfileSettings from '../components/ProfileSettings';
import UploadMaterials from '../components/UploadMaterials';
import SchemeOfWorkForm from '../components/SchemeOfWorkForm';
import Templates from '../components/Templates';
import MySharedLinks from '../components/MySharedLinks';
import TeacherReferAndEarn from '../components/TeacherReferAndEarn';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PLAN_BADGES = {
  basic: { label: 'Starter', color: 'bg-blue-100 text-blue-700' },
  premium: { label: 'Pro', color: 'bg-purple-100 text-purple-700' },
  master: { label: 'Elite', color: 'bg-amber-100 text-amber-800' },
};

const MyHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('my-files');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accessData, setAccessData] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState('');

  useEffect(() => {
    fetchAccess();
  }, []);

  const fetchAccess = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/user/feature-access`, { withCredentials: true });
      setAccessData(res.data);
    } catch {
      // default to free
      setAccessData({ plan: 'free', features: ['my-files', 'profile-settings', 'payment-settings', 'my-activities'], lesson_usage: { used: 0, limit: 10, days_remaining: 30 } });
    }
  };

  const allowedFeatures = new Set(accessData?.features || []);
  const userPlan = accessData?.plan || 'free';

  const menuItems = [
    { id: 'upload-materials', label: 'Upload Materials', icon: Upload },
    { id: 'create-notes', label: 'Create Notes', icon: FileText },
    { id: 'templates', label: 'Templates', icon: Layout },
    { id: 'dictation', label: 'Dictation', icon: Mic },
    { id: 'my-files', label: 'My Files', icon: FolderOpen },
    { id: 'shared-links', label: 'Shared Links', icon: Link2 },
    { id: 'scheme-of-work', label: 'Scheme of Work', icon: Calendar },
    { id: 'refer-and-earn', label: 'Refer & Earn', icon: Gift },
    { id: 'my-activities', label: 'My Activities', icon: BarChart3 },
    { id: 'payment-settings', label: 'Payment Settings', icon: CreditCard },
    { id: 'profile-settings', label: 'Profile Settings', icon: User },
  ];

  const handleMenuClick = (item) => {
    if (allowedFeatures.has(item.id)) {
      setActiveSection(item.id);
    } else {
      setBlockedFeature(item.label);
      setShowUpgradeModal(true);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'upload-materials': return <UploadMaterials />;
      case 'create-notes': return <CreateNotes />;
      case 'dictation': return <Dictation />;
      case 'my-files': return <MyFiles />;
      case 'shared-links': return <MySharedLinks />;
      case 'my-activities': return <MyActivities />;
      case 'payment-settings': return <PaymentSettings />;
      case 'profile-settings': return <ProfileSettings />;
      case 'scheme-of-work': return <SchemeOfWorkForm />;
      case 'templates': return <Templates />;
      case 'refer-and-earn': return <TeacherReferAndEarn currentUser={user} />;
      default: return <MyFiles />;
    }
  };

  const badge = PLAN_BADGES[userPlan];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Header />

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} min-h-[calc(100vh-64px)] bg-white border-r border-[#E4DFD5] p-2 transition-all duration-300 flex flex-col`}>
          <div className="flex items-center justify-between mb-4 px-2">
            {sidebarOpen && (
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-xl font-bold text-[#1A2E16]">MyHub</h2>
                  {badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`} data-testid="plan-badge">
                      {badge.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#7A8A76]">
                  {userPlan === 'free' ? 'Free Tier' : `${userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} Plan`}
                </p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-[#F2EFE8] text-[#4A5B46] transition-colors"
              data-testid="sidebar-toggle"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
          </div>

          {/* Lesson Usage Counter */}
          {sidebarOpen && accessData?.lesson_usage && (
            <div className="mx-2 mb-3 p-3 bg-[#F2EFE8] rounded-lg" data-testid="lesson-counter">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[#4A5B46]">Lessons This Period</span>
                <span className="text-xs text-[#7A8A76]">{accessData.lesson_usage.days_remaining}d left</span>
              </div>
              {accessData.lesson_usage.limit ? (
                <>
                  <div className="w-full bg-[#E4DFD5] rounded-full h-2 mb-1">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        accessData.lesson_usage.used >= accessData.lesson_usage.limit ? 'bg-red-500' :
                        accessData.lesson_usage.used >= accessData.lesson_usage.limit * 0.8 ? 'bg-amber-500' : 'bg-[#2D5A27]'
                      }`}
                      style={{ width: `${Math.min(100, (accessData.lesson_usage.used / accessData.lesson_usage.limit) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#7A8A76]">
                    <span className="font-semibold text-[#1A2E16]">{accessData.lesson_usage.used}</span> / {accessData.lesson_usage.limit} used
                  </p>
                </>
              ) : (
                <p className="text-xs text-[#2D5A27] font-semibold flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Unlimited lessons
                </p>
              )}
            </div>
          )}

          <nav className="space-y-1 flex-1">
            {menuItems.map((item) => {
              const isAllowed = allowedFeatures.has(item.id);
              const isActive = activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item)}
                  className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center px-0'} py-2.5 rounded-lg text-left transition-all ${
                    isActive ? 'bg-[#2D5A27] text-white' :
                    isAllowed ? 'text-[#4A5B46] hover:bg-[#F2EFE8]' :
                    'text-[#B0B0B0] hover:bg-[#F9F7F3]'
                  }`}
                  data-testid={`menu-${item.id}`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
                  </div>
                  {sidebarOpen && !isAllowed && (
                    <Lock className="w-3.5 h-3.5 text-[#C0C0C0]" />
                  )}
                  {sidebarOpen && isAllowed && isActive && (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Action */}
          <div className="mt-4 pt-4 border-t border-[#E4DFD5]">
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full flex items-center justify-center gap-2 bg-[#D95D39] text-white ${sidebarOpen ? 'px-4 py-3' : 'p-3'} rounded-lg font-medium hover:bg-[#BD4D2D] transition-colors`}
              data-testid="create-lesson-btn"
              title={!sidebarOpen ? 'Create Lesson Plan' : undefined}
            >
              <Plus className="w-5 h-5" />
              {sidebarOpen && 'Create Lesson Plan'}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowUpgradeModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()} data-testid="upgrade-modal">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#D95D39]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#D95D39]" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-[#1A2E16] mb-2">
                Upgrade Required
              </h3>
              <p className="text-[#7A8A76] mb-6">
                <strong>{blockedFeature}</strong> is not available on your current {userPlan === 'free' ? 'Free' : userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} plan. Upgrade to unlock this feature.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-3 border border-[#E4DFD5] rounded-xl text-[#4A5B46] font-medium hover:bg-[#F2EFE8] transition-colors"
                  data-testid="upgrade-modal-cancel"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => { setShowUpgradeModal(false); setActiveSection('payment-settings'); }}
                  className="flex-1 py-3 bg-[#D95D39] text-white rounded-xl font-medium hover:bg-[#BD4D2D] transition-colors"
                  data-testid="upgrade-modal-go"
                >
                  View Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyHub;
