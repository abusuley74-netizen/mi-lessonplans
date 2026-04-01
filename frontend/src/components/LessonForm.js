import React, { useState } from 'react';
import { ChevronDown, BookOpen, GraduationCap, FileText, Calendar } from 'lucide-react';

const SUBJECTS = [
  'English', 'Kiswahili', 'Mathematics', 'Science', 'Social Studies',
  'History', 'Geography', 'Civics', 'Physics', 'Chemistry', 'Biology',
  'Commerce', 'Bookkeeping', 'Computer Science'
];

const ZANZIBAR_GRADES = [
  'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5',
  'Standard 6', 'Standard 7', 'Form 1', 'Form 2'
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
    onSubmit(formData);
  };

  const grades = formData.syllabus === 'Zanzibar' ? ZANZIBAR_GRADES : TANZANIA_GRADES;
  const isValid = formData.subject && formData.grade && formData.topic;

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#E4DFD5] rounded-xl p-6 sm:p-8 shadow-sm">
      <h2 className="font-heading text-xl font-semibold text-[#1A2E16] mb-6">
        Lesson Details
      </h2>

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
        <SelectDropdown
          label="Subject"
          value={formData.subject}
          onChange={(val) => handleChange('subject', val)}
          options={SUBJECTS}
          icon={BookOpen}
          testId="select-subject"
        />

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
  );
};

export default LessonForm;
