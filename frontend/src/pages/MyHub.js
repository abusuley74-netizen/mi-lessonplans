import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { 
  Upload, FileText, Layout, Mic, FolderOpen, Calendar, 
  BarChart3, CreditCard, User, ChevronRight, Plus,
  BookOpen, Trash2, Eye, Download, Search, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MyFiles from '../components/MyFiles';
import CreateNotes from '../components/CreateNotes';
import Dictation from '../components/Dictation';
import MyActivities from '../components/MyActivities';
import PaymentSettings from '../components/PaymentSettings';
import ProfileSettings from '../components/ProfileSettings';
import UploadMaterials from '../components/UploadMaterials';
import SchemeOfWorkForm from '../components/SchemeOfWorkForm';
import Templates from '../components/Templates';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MyHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('my-files');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'upload-materials', label: 'Upload Materials', icon: Upload, emoji: '📤' },
    { id: 'create-notes', label: 'Create Notes', icon: FileText, emoji: '📝' },
    { id: 'templates', label: 'Templates', icon: Layout, emoji: '📋' },
    { id: 'dictation', label: 'Dictation', icon: Mic, emoji: '📝' },
    { id: 'my-files', label: 'My Files', icon: FolderOpen, emoji: '📁' },
    { id: 'scheme-of-work', label: 'Scheme of Work', icon: Calendar, emoji: '📅' },
    { id: 'my-activities', label: 'My Activities', icon: BarChart3, emoji: '📊' },
    { id: 'payment-settings', label: 'Payment Settings', icon: CreditCard, emoji: '💰' },
    { id: 'profile-settings', label: 'Profile Settings', icon: User, emoji: '👤' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'upload-materials':
        return <UploadMaterials />;
      case 'create-notes':
        return <CreateNotes />;
      case 'dictation':
        return <Dictation />;
      case 'my-files':
        return <MyFiles />;
      case 'my-activities':
        return <MyActivities />;
      case 'payment-settings':
        return <PaymentSettings />;
      case 'profile-settings':
        return <ProfileSettings />;
      case 'scheme-of-work':
        return <SchemeOfWorkForm />;
      case 'templates':
        return <Templates />;
      default:
        return <MyFiles />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Header />

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} min-h-[calc(100vh-64px)] bg-white border-r border-[#E4DFD5] p-2 transition-all duration-300 flex flex-col`}>
          {/* Toggle + Header */}
          <div className="flex items-center justify-between mb-4 px-2">
            {sidebarOpen && (
              <div>
                <h2 className="font-heading text-xl font-bold text-[#1A2E16] mb-0.5">MyHub</h2>
                <p className="text-xs text-[#7A8A76]">Manage your content</p>
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

          <nav className="space-y-1 flex-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => !item.disabled && setActiveSection(item.id)}
                disabled={item.disabled}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center px-0'} py-2.5 rounded-lg text-left transition-all ${
                  activeSection === item.id
                    ? 'bg-[#2D5A27] text-white'
                    : item.disabled
                    ? 'text-[#A0A0A0] cursor-not-allowed'
                    : 'text-[#4A5B46] hover:bg-[#F2EFE8]'
                }`}
                data-testid={`menu-${item.id}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.emoji}</span>
                  {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
                </div>
                {sidebarOpen && item.badge && (
                  <span className="text-xs bg-[#E5A93D] text-[#1A2E16] px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {sidebarOpen && !item.disabled && !item.badge && activeSection === item.id && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ))}
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
    </div>
  );
};

export default MyHub;
