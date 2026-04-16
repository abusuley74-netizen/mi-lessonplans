import React, { useState } from 'react';
import { ChevronDown, BookOpen, GraduationCap, FileText, Calendar, Lightbulb, AlertCircle, Brain, Zap } from 'lucide-react';

const SUBJECTS = [
  'English', 'Kiswahili', 'Mathematics', 'Science', 'Social Studies',
  'History', 'Geography', 'Civics', 'Physics', 'Chemistry', 'Biology',
  'Commerce', 'Bookkeeping', 'Computer Science'
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

const LessonFormEnhanced = ({ onSubmit, isLoading, showIntelligence = true }) => {
  const [formData, setFormData] = useState({
    syllabus: 'Zanzibar',
    subject: '',
    grade: '',
    topic: '',
    date: new Date().toISOString().split('T')[0],
    userGuidance: '',
    negativeConstraints: '',
    checkMemory: true,
    useIntelligence: true
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Reset grade when syllabus changes
      if (field === 'syllabus') {
        updated.grade = '';
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.grade || !formData.topic) {
      return;
    }
    
    // Prepare the request data
    const requestData = {
      syllabus: formData.syllabus,
      subject: formData.subject,
      grade: formData.grade,
      topic: formData.topic,
      form_data: {
        dayDate: formData.date
      }
    };
    
    // Add intelligence features if enabled
    if (showIntelligence && formData.useIntelligence) {
      requestData.user_guidance = formData.userGuidance;
      requestData.negative_constraints = formData.negativeConstraints;
      requestData.check_memory = formData.checkMemory;
    }
    
    onSubmit(requestData);
  };

  const grades = formData.syllabus === 'Zanzibar' ? ZANZIBAR_GRADES : TANZANIA_GRADES;
  const isValid = formData.subject && formData.grade && formData.topic;

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#E4DFD5] rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-semibold text-[#1A2E16]">
          Lesson Details
        </h2>
        {showIntelligence && (
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#2D5A27]" />
            <span className="text-sm font-medium text-[#2D5A27]">AI Intelligence</span>
            <div className="relative">
              <input
                type="checkbox"
                id="useIntelligence"
                checked={formData.useIntelligence}
                onChange={(e) => handleChange('useIntelligence', e.target.checked)}
                className="sr-only"
              />
              <label
                htmlFor="useIntelligence"
                className={`block w-12 h-6 rounded-full cursor-pointer transition-colors ${
                  formData.useIntelligence ? 'bg-[#2D5A27]' : 'bg-[#E4DFD5]'
                }`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full transform transition-transform mt-0.5 ml-0.5 ${
                  formData.useIntelligence ? 'translate-x-6' : ''
                }`}></span>
              </label>
            </div>
          </div>
        )}
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

        {/* Subject - Now editable text input */}
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
          <small className="text-xs text-[#7A8A76] mt-1 block">
            💡 Language detection works automatically: Kiswahili → Swahili, العربية → Arabic, Français → French
          </small>
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

        {/* Advanced Intelligence Options */}
        {showIntelligence && formData.useIntelligence && (
          <>
            <div className="pt-4 border-t border-[#E4DFD5]">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-[#2D5A27] font-medium hover:text-[#1A2E16] transition-colors"
              >
                <Zap className="w-4 h-4" />
                {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
              
              {showAdvanced && (
                <div className="mt-4 space-y-4 animate-fadeIn">
                  {/* Memory Check */}
                  <div className="flex items-center justify-between p-3 bg-[#F8F6F1] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-[#2D5A27]" />
                      <span className="text-sm font-medium text-[#4A5B46]">Check Memory</span>
                      <span className="text-xs text-[#7A8A76]">(Reuse similar lessons)</span>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="checkMemory"
                        checked={formData.checkMemory}
                        onChange={(e) => handleChange('checkMemory', e.target.checked)}
                        className="sr-only"
                      />
                      <label
                        htmlFor="checkMemory"
                        className={`block w-10 h-5 rounded-full cursor-pointer transition-colors ${
                          formData.checkMemory ? 'bg-[#2D5A27]' : 'bg-[#E4DFD5]'
                        }`}
                      >
                        <span className={`block w-3 h-3 bg-white rounded-full transform transition-transform mt-1 ml-1 ${
                          formData.checkMemory ? 'translate-x-5' : ''
                        }`}></span>
                      </label>
                    </div>
                  </div>

                  {/* User Guidance */}
                  <div>
                    <label className="text-sm font-medium text-[#4A5B46] mb-1.5 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Specific Guidance (Optional)
                    </label>
                    <textarea
                      value={formData.userGuidance}
                      onChange={(e) => handleChange('userGuidance', e.target.value)}
                      placeholder="e.g., Focus on practical examples, include group activities, use local context..."
                      className="w-full bg-white border border-[#E4DFD5] text-[#1A2E16] rounded-md p-3 focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27] transition-colors min-h-[80px] resize-y"
                      rows="3"
                    />
                    <small className="text-xs text-[#7A8A76] mt-1 block">
                      💡 Tell the AI exactly what you want in the lesson plan
                    </small>
                  </div>

                  {/* Negative Constraints */}
                  <div>
                    <label className="text-sm font-medium text-[#4A5B46] mb-1.5 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Avoid / Exclude (Optional)
                    </label>
                    <textarea
                      value={formData.negativeConstraints}
                      onChange={(e) => handleChange('negativeConstraints', e.target.value)}
                      placeholder="e.g., Avoid complex terminology, exclude religious references, don't use internet examples..."
                      className="w-full bg-white border border-[#E4DFD5] text-[#1A2E16] rounded-md p-3 focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27] transition-colors min-h-[80px] resize-y"
                      rows="3"
                    />
                    <small className="text-xs text-[#7A8A76] mt-1 block">
                      ⚠️ Specify what the AI should avoid including in the lesson
                    </small>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all mt-4 ${
            isValid && !isLoading
              ? 'bg-[#D95D39] text-white hover:bg-[#BD4D2D] shadow-sm'
              : 'bg-[#E4DFD5] text-[#7A8A76] cursor-not-allowed'
          }`}
          data-testid="generate-btn"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              {formData.useIntelligence ? 'Generating with AI Intelligence...' : 'Generating...'}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {formData.useIntelligence && <Brain className="w-5 h-5" />}
              Generate Lesson Plan
            </span>
          )}
        </button>

        {/* Intelligence Benefits */}
        {showIntelligence && formData.useIntelligence && (
          <div className="mt-4 p-3 bg-[#F8F6F1] rounded-lg border border-[#E4DFD5]">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-[#2D5A27]" />
              <span className="text-sm font-medium text-[#2D5A27]">AI Intelligence Benefits:</span>
            </div>
            <ul className="text-xs text-[#4A5B46] space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-[#2D5A27]">•</span>
                <span><strong>Memory:</strong> Reuses similar lessons to save time and ensure consistency</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2D5A27]">•</span>
                <span><strong>Guidance:</strong> Follows your specific instructions for personalized content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2D5A27]">•</span>
                <span><strong>Constraints:</strong> Avoids unwanted content based on your specifications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2D5A27]">•</span>
                <span><strong>Quality:</strong> Produces more consistent and context-aware lesson plans</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </form>
  );
};

export default LessonFormEnhanced;
