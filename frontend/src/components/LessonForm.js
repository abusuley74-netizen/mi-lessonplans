import React, { useState } from 'react';
import { ChevronDown, BookOpen, GraduationCap, FileText, Calendar, Sparkles, MessageCircle, X } from 'lucide-react';
import axios from 'axios';

const SUBJECTS = [
  'English', 'Kiswahili', 'Mathematics', 'Science', 'Social Studies',
  'History', 'Geography', 'Civics', 'Physics', 'Chemistry', 'Biology',
  'Commerce', 'Bookkeeping', 'Computer Science', 'Arabic', 'French'
];

const ZANZIBAR_GRADES = [
  'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5',
  'Standard 6', 'Standard 7', 'Form 1', 'Form 2', 'Form 3', 'Form 4',
  'Form 5', 'Form 6'
];

const TANZANIA_GRADES = [
  'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5',
  'Standard 6', 'Standard 7', 'Form 1', 'Form 2', 'Form 3', 'Form 4',
  'Form 5', 'Form 6'
];

const SelectDropdown = ({ label, value, onChange, options, icon: Icon, testId }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="text-sm font-medium text-[#4A5B46] mb-1.5 block">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border border-[#E4DFD5] text-[#1A2E16] rounded-md p-3 hover:border-[#2D5A27] focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27] transition-colors"
        data-testid={testId}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-[#7A8A76]" />}
          <span>{value || `Select ${label}`}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#7A8A76] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-[#E4DFD5] rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 hover:bg-[#F2EFE8] transition-colors ${
                value === option ? 'bg-[#F2EFE8] text-[#2D5A27] font-medium' : 'text-[#1A2E16]'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const LessonForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    syllabus: 'Zanzibar',
    subject: '',
    grade: '',
    topic: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Binti Hamdani Chat State
  const [showBintiChat, setShowBintiChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'binti', text: 'Hujambo! I am Binti Hamdani, your AI lesson planning assistant. Tell me what kind of lesson plan you need, and I will help you create something amazing! 📚✨' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Guidance textareas (populated by Binti)
  const [userGuidance, setUserGuidance] = useState('');
  const [negativeConstraints, setNegativeConstraints] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [memoryHit, setMemoryHit] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'syllabus') {
        updated.grade = '';
      }
      return updated;
    });
  };

  // Binti Hamdani Chat Handler
  const handleBintiChat = async () => {
    if (!chatInput.trim()) return;
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', text: chatInput }]);
    const userQuestion = chatInput;
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      // Call AI with Binti Hamdani persona
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/binti-chat`, {
        message: userQuestion,
        context: {
          syllabus: formData.syllabus,
          subject: formData.subject,
          grade: formData.grade,
          topic: formData.topic
        }
      });
      
      const bintiResponse = response.data.message;
      setChatMessages(prev => [...prev, { role: 'binti', text: bintiResponse }]);
      
      // Auto-extract guidance from Binti's response if she suggests things
      if (bintiResponse.includes('focus on') || bintiResponse.includes('avoid')) {
        // Optional: auto-populate guidance fields
      }
      
    } catch (error) {
      setChatMessages(prev => [...prev, { 
        role: 'binti', 
        text: 'Samahani, I am having trouble connecting. Please try again or generate the lesson plan directly.' 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.grade || !formData.topic) {
      return;
    }
    
    onSubmit({
      ...formData,
      user_guidance: userGuidance,
      negative_constraints: negativeConstraints
    });
  };

  const grades = formData.syllabus === 'Zanzibar' ? ZANZIBAR_GRADES : TANZANIA_GRADES;
  const isValid = formData.subject && formData.grade && formData.topic;

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white border border-[#E4DFD5] rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-heading text-xl font-semibold text-[#1A2E16]">
            Lesson Details
          </h2>
          
          {/* Binti Hamdani Chat Button */}
          <button
            type="button"
            onClick={() => setShowBintiChat(!showBintiChat)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2D5A27] text-white rounded-lg hover:bg-[#1E3A1A] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat with Binti Hamdani</span>
          </button>
        </div>

        <div className="space-y-5">
          {/* Syllabus Selection */}
          <div>
            <label className="text-sm font-medium text-[#4A5B46] mb-3 block">
              Syllabus Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['Zanzibar', 'Tanzania Mainland'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange('syllabus', type)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.syllabus === type
                      ? 'border-[#2D5A27] bg-[#2D5A27]/5'
                      : 'border-[#E4DFD5] hover:border-[#8E9E82]'
                  }`}
                  data-testid={`syllabus-${type.toLowerCase().replace(' ', '-')}`}
                >
                  <span className={`font-medium ${
                    formData.syllabus === type ? 'text-[#2D5A27]' : 'text-[#4A5B46]'
                  }`}>
                    {type}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-sm font-medium text-[#4A5B46] mb-1.5 block">
              Subject (Type any subject)
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A8A76]" />
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                placeholder="e.g., Kiswahili, Mathematics, اللغة العربية, Français"
                className="w-full bg-white border border-[#E4DFD5] text-[#1A2E16] rounded-md p-3 pl-10 focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27] transition-colors"
                data-testid="input-subject"
              />
            </div>
          </div>

          {/* Grade */}
          <SelectDropdown
            label="Grade / Class"
            value={formData.grade}
            onChange={(val) => handleChange('grade', val)}
            options={grades}
            icon={GraduationCap}
            testId="select-grade"
          />

          {/* Topic */}
          <div>
            <label className="text-sm font-medium text-[#4A5B46] mb-1.5 block">
              Topic / Lesson Title
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A8A76]" />
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => handleChange('topic', e.target.value)}
                placeholder="e.g., Introduction to Fractions"
                className="w-full bg-white border border-[#E4DFD5] text-[#1A2E16] rounded-md p-3 pl-10 focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27] transition-colors"
                data-testid="input-topic"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium text-[#4A5B46] mb-1.5 block">
              Lesson Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A8A76]" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full bg-white border border-[#E4DFD5] text-[#1A2E16] rounded-md p-3 pl-10 focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27] transition-colors"
                data-testid="input-date"
              />
            </div>
          </div>

          {/* Advanced Guidance Section (Populated by Binti or manually) */}
          <div className="mt-6 pt-4 border-t border-[#E4DFD5]">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-[#4A5B46] hover:text-[#2D5A27] transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              <span>Advanced AI Guidance (Optional)</span>
            </button>
            
            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#4A5B46] mb-1.5 block">
                    What should the AI focus on?
                  </label>
                  <textarea
                    value={userGuidance}
                    onChange={(e) => setUserGuidance(e.target.value)}
                    placeholder="Example: Include a hands-on activity with local examples. Focus on critical thinking. Use group work."
                    rows={3}
                    className="w-full bg-white border border-[#E4DFD5] rounded-md p-3 text-sm focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27]"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-[#4A5B46] mb-1.5 block">
                    What should the AI AVOID?
                  </label>
                  <textarea
                    value={negativeConstraints}
                    onChange={(e) => setNegativeConstraints(e.target.value)}
                    placeholder="Example: No rote memorization. Avoid worksheets. No lecture-only format."
                    rows={2}
                    className="w-full bg-white border border-[#E4DFD5] rounded-md p-3 text-sm focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Memory Indicator */}
          {memoryHit && (
            <div className={`mt-4 p-3 rounded-lg text-sm flex items-center justify-between ${
              memoryHit.source === 'memory' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
              <div className="flex items-center gap-2">
                {memoryHit.source === 'memory' ? '⚡' : '💾'}
                <span>
                  {memoryHit.source === 'memory' 
                    ? `Loaded from memory (used ${memoryHit.usage_count} times before)`
                    : `Saved to memory for next time`}
                </span>
              </div>
              <button onClick={() => setMemoryHit(null)} className="text-xs opacity-70 hover:opacity-100">×</button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
              isValid && !isLoading
                ? 'bg-[#D95D39] text-white hover:bg-[#BD4D2D] shadow-sm'
                : 'bg-[#E4DFD5] text-[#7A8A76] cursor-not-allowed'
            }`}
            data-testid="generate-btn"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Generating...
              </span>
            ) : (
              'Generate Lesson Plan'
            )}
          </button>
        </div>
      </form>

      {/* Binti Hamdani Chat Modal */}
      {showBintiChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 shadow-2xl">
            {/* Chat Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#E4DFD5] bg-[#2D5A27] text-white rounded-t-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-semibold">Binti Hamdani</h3>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">AI Assistant</span>
              </div>
              <button onClick={() => setShowBintiChat(false)} className="hover:bg-white/20 rounded p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-3 bg-[#F8F9FA]">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-[#2D5A27] text-white rounded-br-none'
                        : 'bg-white border border-[#E4DFD5] text-[#1A2E16] rounded-bl-none'
                    }`}
                  >
                    {msg.role === 'binti' && (
                      <div className="font-semibold text-xs mb-1 text-[#2D5A27]">Binti Hamdani</div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#E4DFD5] p-3 rounded-lg rounded-bl-none">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#2D5A27] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-[#2D5A27] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-[#2D5A27] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat Input */}
            <div className="p-4 border-t border-[#E4DFD5]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBintiChat()}
                  placeholder="Ask Binti Hamdani anything about your lesson plan..."
                  className="flex-1 bg-white border border-[#E4DFD5] rounded-lg p-3 text-sm focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27]"
                />
                <button
                  onClick={handleBintiChat}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="px-4 py-2 bg-[#2D5A27] text-white rounded-lg hover:bg-[#1E3A1A] disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
              </div>
              <p className="text-xs text-[#7A8A76] mt-2">
                💡 Ask me: "Focus on group activities" or "Avoid too much writing" or "Make it suitable for Form 6 Arabic"
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LessonForm;
