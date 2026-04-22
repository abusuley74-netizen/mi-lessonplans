import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { authFetch } from '../services/api';
import { Sparkles, Save, Printer, FileDown, Plus, ChevronLeft, ChevronRight, Loader2, Brain, Lightbulb, Shield, History, Zap } from 'lucide-react';
import { toast } from 'sonner';
import './SchemeOfWork.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const fetchAndDownload = async (url, filename) => {
  try {
    const response = await authFetch(url);
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const reader = new FileReader();
    reader.onload = () => {
      const a = document.createElement('a');
      a.href = reader.result;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    reader.readAsDataURL(blob);
  } catch (err) {
    toast.error('Download failed');
  }
};

const ZANZIBAR_COLUMNS = [
  { key: 'main', label: 'Main Competence', type: 'textarea' },
  { key: 'specific', label: 'Specific Competences', type: 'textarea' },
  { key: 'activities', label: 'Learning Activities', type: 'textarea' },
  { key: 'specificActivities', label: 'Specific Activities', type: 'textarea' },
  { key: 'month', label: 'Month', type: 'input' },
  { key: 'week', label: 'Week', type: 'input' },
  { key: 'periods', label: 'Number of Periods', type: 'input' },
  { key: 'methods', label: 'Teaching and Learning Methods', type: 'textarea' },
  { key: 'resources', label: 'Teaching and Learning Resources', type: 'textarea' },
  { key: 'assessment', label: 'Assessment Tools', type: 'textarea' },
  { key: 'references', label: 'References', type: 'textarea' },
  { key: 'remarks', label: 'Remarks', type: 'textarea' },
];

const MAINLAND_COLUMNS = [
  { key: 'main', label: 'Main Competence (Umahiri Mkuu)', type: 'textarea' },
  { key: 'specific', label: 'Specific Competence (Umahiri Mahususi)', type: 'textarea' },
  { key: 'activities', label: 'Main Activity (Shughuli Kuu)', type: 'textarea' },
  { key: 'specificActivities', label: 'Specific Activity (Shughuli Mahususi)', type: 'textarea' },
  { key: 'month', label: 'Month', type: 'input' },
  { key: 'week', label: 'Week', type: 'input' },
  { key: 'periods', label: 'Number of Periods', type: 'input' },
  { key: 'methods', label: 'Teaching & Learning Methods', type: 'textarea' },
  { key: 'resources', label: 'Teaching & Learning Resources', type: 'textarea' },
  { key: 'assessment', label: 'Assessment Tools', type: 'textarea' },
  { key: 'references', label: 'References', type: 'textarea' },
  { key: 'remarks', label: 'Remarks', type: 'textarea' },
];

const makeEmptyRow = () => ({
  main: '', specific: '', activities: '', specificActivities: '',
  month: '', week: '', periods: '', methods: '',
  resources: '', assessment: '', references: '', remarks: ''
});

const SchemeOfWorkForm = () => {
  const [syllabus, setSyllabus] = useState('Zanzibar');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [fillingRows, setFillingRows] = useState(new Set());
  const [savedMsg, setSavedMsg] = useState('');
  const [savedSchemeId, setSavedSchemeId] = useState(null);
  const [numRows] = useState(25);
  const [topics, setTopics] = useState('');
  const [formData, setFormData] = useState({
    school: '', teacher: '', subject: '',
    year: new Date().getFullYear(), term: '', class: '',
    competencies: Array(25).fill(null).map(() => makeEmptyRow())
  });
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 15;
  const totalPages = Math.ceil(formData.competencies.length / rowsPerPage);
  const printRef = useRef(null);
  
  // Curriculum Intelligence System State
  const [showCurriculumIntelligence, setShowCurriculumIntelligence] = useState(false);
  const [generatingFullYear, setGeneratingFullYear] = useState(false);
  const [userGuidance, setUserGuidance] = useState('');
  const [negativeConstraints, setNegativeConstraints] = useState('');
  const [totalWeeks, setTotalWeeks] = useState(36);
  const [weeksPerPage, setWeeksPerPage] = useState(15);
  const [checkMemory, setCheckMemory] = useState(true);
  const [memorySuggestions, setMemorySuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const columns = syllabus === 'Zanzibar' ? ZANZIBAR_COLUMNS : MAINLAND_COLUMNS;

  const handleInputChange = (e, index, field) => {
    const { value } = e.target;
    if (index !== undefined) {
      const actualIndex = currentPage * rowsPerPage + index;
      const updated = [...formData.competencies];
      updated[actualIndex] = { ...updated[actualIndex], [field]: value };
      setFormData({ ...formData, competencies: updated });
    } else {
      setFormData({ ...formData, [e.target.name]: value });
    }
  };

  const autoResize = useCallback((el) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.max(80, el.scrollHeight) + 'px';
    }
  }, []);

  const handleTextareaChange = (e, index, field) => {
    handleInputChange(e, index, field);
    autoResize(e.target);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.scheme-table textarea').forEach(autoResize);
    }, 50);
    return () => clearTimeout(timer);
  }, [currentPage, autoResize, formData.competencies]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) setCurrentPage(newPage);
  };

  const addRow = () => {
    setFormData({ ...formData, competencies: [...formData.competencies, makeEmptyRow()] });
    const newTotal = Math.ceil((formData.competencies.length + 1) / rowsPerPage);
    setCurrentPage(newTotal - 1);
  };

  const getNonEmptyRows = () => {
    return formData.competencies.filter(row =>
      Object.values(row).some(v => v.trim && v.trim() !== '')
    );
  };

  // AI Auto-fill
  const handleAIGenerate = async () => {
    if (!formData.subject.trim()) {
      toast.error('Please enter a Subject first');
      return;
    }
    if (!formData.class.trim()) {
      toast.error('Please enter a Class first');
      return;
    }

    setGenerating(true);
    setSavedSchemeId(null);
    setCurrentPage(0);

    // Show all rows as filling
    const rowIndices = new Set(Array.from({ length: numRows }, (_, i) => i));
    setFillingRows(rowIndices);

    try {
      const res = await axios.post(`${API_URL}/api/schemes/generate`, {
        syllabus,
        subject: formData.subject,
        class: formData.class,
        term: formData.term || 'Term 1',
        num_rows: numRows,
        topics: topics
      });

      let aiRows = res.data.competencies || [];
      
      // If async generation, poll for completion
      if (res.data.status === 'generating' && res.data.task_id) {
        const taskId = res.data.task_id;
        let attempts = 0;
        const maxAttempts = 50; // 50 * 3s = 150s max
        
        while (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 3000));
          attempts++;
          try {
            const statusRes = await axios.get(`${API_URL}/api/schemes/generate/${taskId}/status`);
            if (statusRes.data.status === 'complete') {
              aiRows = statusRes.data.competencies || [];
              break;
            } else if (statusRes.data.status === 'failed') {
              toast.error(statusRes.data.error || 'AI generation failed. Please try again.');
              return;
            }
          } catch (pollErr) {
            // Continue polling
          }
        }
        if (attempts >= maxAttempts) {
          toast.error('Generation is taking too long. Please try again.');
          return;
        }
      }

      // Animate row-by-row fill
      const newCompetencies = [...formData.competencies];
      for (let i = 0; i < aiRows.length; i++) {
        newCompetencies[i] = { ...makeEmptyRow(), ...aiRows[i] };
      }

      // Staggered reveal
      for (let i = 0; i < aiRows.length; i++) {
        await new Promise(r => setTimeout(r, 150));
        setFillingRows(prev => {
          const next = new Set(prev);
          next.delete(i);
          return next;
        });
        setFormData(prev => {
          const updated = [...prev.competencies];
          updated[i] = { ...makeEmptyRow(), ...aiRows[i] };
          return { ...prev, competencies: updated };
        });
      }

      toast.success(`Generated ${aiRows.length} rows for ${formData.subject}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'AI generation failed. Please try again.');
    } finally {
      setGenerating(false);
      setFillingRows(new Set());
    }
  };

  const saveToMyFiles = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      const res = await axios.post(`${API_URL}/api/schemes`, {
        syllabus,
        school: formData.school, teacher: formData.teacher,
        subject: formData.subject, year: formData.year,
        term: formData.term, class: formData.class,
        competencies: getNonEmptyRows()
      });
      setSavedSchemeId(res.data.scheme_id);
      setSavedMsg('Saved to My Files!');
      toast.success('Scheme saved to My Files');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (savedSchemeId) {
      authFetch(`${API_URL}/api/schemes/${savedSchemeId}/view`)
        .then(r => r.text())
        .then(html => {
          const printW = window.open('', '_blank');
          if (printW) { printW.document.open(); printW.document.write(html); printW.document.close(); printW.onload = () => printW.print(); }
        });
    } else {
      saveAndThen('print');
    }
  };

  const exportToDocx = () => {
    if (savedSchemeId) {
      fetchAndDownload(
        `${API_URL}/api/schemes/${savedSchemeId}/export`,
        `Scheme_of_Work_${formData.subject || 'untitled'}_${syllabus}.pdf`
      );
    } else {
      saveAndThen('export');
    }
  };

  const saveAndThen = async (action) => {
    setSaving(true);
    try {
      const res = await axios.post(`${API_URL}/api/schemes`, {
        syllabus, school: formData.school, teacher: formData.teacher,
        subject: formData.subject, year: formData.year,
        term: formData.term, class: formData.class,
        competencies: getNonEmptyRows()
      });
      const newId = res.data.scheme_id;
      setSavedSchemeId(newId);
      toast.success('Saved!');

      if (action === 'print') {
        authFetch(`${API_URL}/api/schemes/${newId}/view`)
          .then(r => r.text())
          .then(html => {
            const printW = window.open('', '_blank');
            if (printW) { printW.document.open(); printW.document.write(html); printW.document.close(); printW.onload = () => printW.print(); }
          });
      } else if (action === 'export') {
        fetchAndDownload(
          `${API_URL}/api/schemes/${newId}/export`,
          `Scheme_of_Work_${formData.subject || 'untitled'}_${syllabus}.pdf`
        );
      }
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Curriculum Intelligence Functions
  const handleFullYearGenerate = async () => {
    if (!formData.subject.trim()) {
      toast.error('Please enter a Subject first');
      return;
    }
    if (!formData.class.trim()) {
      toast.error('Please enter a Class first');
      return;
    }

    setGeneratingFullYear(true);
    setSavedSchemeId(null);
    setCurrentPage(0);

    try {
      const res = await axios.post(`${API_URL}/api/schemes/generate-full-year`, {
        syllabus,
        subject: formData.subject,
        class: formData.class,
        term: formData.term || 'Full Year',
        total_weeks: totalWeeks,
        weeks_per_page: weeksPerPage,
        user_guidance: userGuidance,
        negative_constraints: negativeConstraints,
        check_memory: checkMemory
      });

      const result = res.data;
      
      if (result.memory_source === 'memory') {
        toast.success(`Loaded from memory! Used ${result.usage_count} times`);
      } else {
        toast.success(`Generated fresh full-year scheme with ${result.total_weeks} weeks`);
      }

      // Process paginated data
      const allCompetencies = [];
      if (result.pages && Array.isArray(result.pages)) {
        result.pages.forEach(page => {
          if (page.competencies && Array.isArray(page.competencies)) {
            allCompetencies.push(...page.competencies);
          }
        });
      }

      // Update form with all competencies
      if (allCompetencies.length > 0) {
        const newCompetencies = [...allCompetencies];
        // Fill remaining slots with empty rows if needed
        while (newCompetencies.length < totalWeeks) {
          newCompetencies.push(makeEmptyRow());
        }
        setFormData(prev => ({
          ...prev,
          competencies: newCompetencies
        }));
      }

    } catch (err) {
      toast.error(err.response?.data?.detail || 'Full-year generation failed. Please try again.');
    } finally {
      setGeneratingFullYear(false);
    }
  };

  const fetchMemorySuggestions = async () => {
    if (!formData.subject.trim() || !formData.class.trim()) {
      toast.error('Please enter Subject and Class first');
      return;
    }

    setLoadingSuggestions(true);
    try {
      const res = await axios.post(`${API_URL}/api/schemes/memory-suggestions`, {
        syllabus,
        subject: formData.subject,
        class: formData.class
      });

      setMemorySuggestions(res.data.suggestions || []);
      if (res.data.suggestions?.length > 0) {
        toast.success(`Found ${res.data.suggestions.length} suggestions from other teachers`);
      } else {
        toast.info('No suggestions found. Be the first to generate for this subject!');
      }
    } catch (err) {
      toast.error('Failed to load suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const applySuggestion = (suggestion) => {
    if (suggestion.preview) {
      setUserGuidance(prev => prev ? `${prev}\n${suggestion.preview}` : suggestion.preview);
      toast.success('Suggestion added to guidance');
    }
  };

  const currentCompetencies = formData.competencies.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  );

  return (
    <div className="scheme-of-work-container" data-testid="scheme-of-work">
      {/* Syllabus Toggle */}
      <div className="scheme-toggle" data-testid="scheme-syllabus-toggle">
        <button className={`toggle-btn ${syllabus === 'Zanzibar' ? 'active' : ''}`}
          onClick={() => setSyllabus('Zanzibar')} data-testid="scheme-toggle-zanzibar">
          Zanzibar
        </button>
        <button className={`toggle-btn ${syllabus === 'Tanzania Mainland' ? 'active' : ''}`}
          onClick={() => setSyllabus('Tanzania Mainland')} data-testid="scheme-toggle-mainland">
          Tanzania Mainland
        </button>
      </div>

      <div className="scheme-header">
        <h1>SCHEME OF WORK — {syllabus.toUpperCase()}</h1>
        <div className="header-info">
          <div className="info-row">
            <span className="info-label">Name of School:</span>
            <input type="text" name="school" value={formData.school} onChange={handleInputChange}
              className="info-input" placeholder="................................................................" data-testid="scheme-school-input" />
          </div>
          <div className="info-row">
            <span className="info-label">Teacher's Name:</span>
            <input type="text" name="teacher" value={formData.teacher} onChange={handleInputChange}
              className="info-input" placeholder="................................................................" data-testid="scheme-teacher-input" />
          </div>
          <div className="info-row">
            <span className="info-label">Subject:</span>
            <input type="text" name="subject" value={formData.subject} onChange={handleInputChange}
              className="info-input-wide" placeholder="............................................................................................................" data-testid="scheme-subject-input" />
          </div>
          <div className="info-row">
            <span className="info-label">Year:</span>
            <input type="text" name="year" value={formData.year} onChange={handleInputChange}
              className="info-input-small" placeholder=".........................." data-testid="scheme-year-input" />
            <span className="info-label">Term:</span>
            <input type="text" name="term" value={formData.term} onChange={handleInputChange}
              className="info-input-small" placeholder="..........................." data-testid="scheme-term-input" />
            <span className="info-label">Class:</span>
            <input type="text" name="class" value={formData.class} onChange={handleInputChange}
              className="info-input-small" placeholder="......................." data-testid="scheme-class-input" />
          </div>
        </div>
      </div>

      {/* Topics / Syllabus Guide Textarea */}
      <div className="topics-guide-section" data-testid="scheme-topics-section">
        <div className="topics-guide-header">
          <Lightbulb className="w-4 h-4" />
          <label htmlFor="topics-guide">Topics / Syllabus Guide</label>
          <span className="topics-hint">Paste your syllabus topics here to guide the AI generation</span>
        </div>
        <textarea
          id="topics-guide"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          placeholder="Enter topics/syllabus content to guide AI generation. Example:&#10;1. Numbers and Operations&#10;2. Algebra and Equations&#10;3. Geometry - Shapes and Areas&#10;4. Statistics and Probability&#10;..."
          className="topics-textarea"
          rows={4}
          data-testid="scheme-topics-textarea"
        />
      </div>

      {/* AI Generate Bar */}
      <div className="ai-generate-bar" data-testid="scheme-ai-bar">
        <div className="ai-bar-left">
          <Sparkles className="ai-icon" />
          <span className="ai-label">AI Auto-Fill (25 rows)</span>
        </div>
        <button
          onClick={handleAIGenerate}
          disabled={generating || !formData.subject.trim() || !formData.class.trim()}
          className="ai-generate-btn"
          data-testid="scheme-ai-generate-btn"
        >
          {generating ? (
            <>
              <Loader2 className="spin-icon" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="btn-sparkle" />
              <span>Generate with AI</span>
            </>
          )}
        </button>
        
        {/* Curriculum Intelligence Toggle */}
        <button
          onClick={() => setShowCurriculumIntelligence(!showCurriculumIntelligence)}
          className="curriculum-intelligence-toggle"
          data-testid="curriculum-intelligence-toggle"
        >
          <Brain className="w-4 h-4" />
          <span>Curriculum Intelligence</span>
          {showCurriculumIntelligence ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Generating overlay progress */}
      {generating && (
        <div className="ai-progress-bar" data-testid="scheme-ai-progress">
          <div className="ai-progress-text">
            <Loader2 className="spin-icon-sm" />
            Generating {numRows} rows for <strong>{formData.subject}</strong> ({syllabus}, {formData.class})...
          </div>
          <div className="ai-progress-track">
            <div
              className="ai-progress-fill"
              style={{ width: `${((numRows - fillingRows.size) / numRows) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Curriculum Intelligence Panel */}
      {showCurriculumIntelligence && (
        <div className="curriculum-intelligence-panel" data-testid="curriculum-intelligence-panel">
          <div className="curriculum-panel-header">
            <Brain className="w-5 h-5" />
            <h3>Curriculum Intelligence System</h3>
            <span className="curriculum-panel-subtitle">Full-year generation with memory & suggestions</span>
          </div>

          <div className="curriculum-panel-grid">
            {/* Left Column: Guidance & Constraints */}
            <div className="curriculum-column">
              <div className="curriculum-section">
                <div className="section-header">
                  <Lightbulb className="w-4 h-4" />
                  <h4>User Guidance</h4>
                </div>
                <textarea
                  value={userGuidance}
                  onChange={(e) => setUserGuidance(e.target.value)}
                  placeholder="Add specific guidance for the AI (e.g., 'Focus on practical activities', 'Include local examples', 'Emphasize critical thinking')"
                  className="guidance-textarea"
                  rows={4}
                />
              </div>

              <div className="curriculum-section">
                <div className="section-header">
                  <Shield className="w-4 h-4" />
                  <h4>Negative Constraints</h4>
                </div>
                <textarea
                  value={negativeConstraints}
                  onChange={(e) => setNegativeConstraints(e.target.value)}
                  placeholder="What to avoid (e.g., 'No rote memorization', 'Avoid outdated examples', 'Don't include religious content')"
                  className="constraints-textarea"
                  rows={3}
                />
              </div>
            </div>

            {/* Middle Column: Settings & Memory */}
            <div className="curriculum-column">
              <div className="curriculum-section">
                <div className="section-header">
                  <Zap className="w-4 h-4" />
                  <h4>Generation Settings</h4>
                </div>
                <div className="settings-grid">
                  <div className="setting-item">
                    <label>Total Weeks:</label>
                    <select value={totalWeeks} onChange={(e) => setTotalWeeks(parseInt(e.target.value))}>
                      {[30, 32, 34, 36, 38, 40, 42].map(w => (
                        <option key={w} value={w}>{w} weeks</option>
                      ))}
                    </select>
                  </div>
                  <div className="setting-item">
                    <label>Weeks per Page:</label>
                    <select value={weeksPerPage} onChange={(e) => setWeeksPerPage(parseInt(e.target.value))}>
                      {[10, 12, 15, 18, 20].map(w => (
                        <option key={w} value={w}>{w} weeks</option>
                      ))}
                    </select>
                  </div>
                  <div className="setting-item checkbox-item">
                    <input
                      type="checkbox"
                      id="checkMemory"
                      checked={checkMemory}
                      onChange={(e) => setCheckMemory(e.target.checked)}
                    />
                    <label htmlFor="checkMemory">Check memory first (faster, reuses successful prompts)</label>
                  </div>
                </div>
              </div>

              <div className="curriculum-section">
                <div className="section-header">
                  <History className="w-4 h-4" />
                  <h4>Memory Suggestions</h4>
                  <button
                    onClick={fetchMemorySuggestions}
                    disabled={loadingSuggestions || !formData.subject.trim() || !formData.class.trim()}
                    className="suggestions-btn"
                  >
                    {loadingSuggestions ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load Suggestions'}
                  </button>
                </div>
                
                {memorySuggestions.length > 0 ? (
                  <div className="suggestions-list">
                    {memorySuggestions.map((suggestion, idx) => (
                      <div key={idx} className="suggestion-item">
                        <div className="suggestion-preview">{suggestion.preview}</div>
                        <div className="suggestion-meta">
                          <span className="suggestion-usage">Used {suggestion.usage_count} times</span>
                          <button
                            onClick={() => applySuggestion(suggestion)}
                            className="apply-suggestion-btn"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-suggestions">
                    {loadingSuggestions ? (
                      <div className="loading-suggestions">Loading suggestions...</div>
                    ) : (
                      <div className="empty-suggestions">
                        No suggestions yet. Generate a scheme to contribute to the knowledge base!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Generate Button */}
            <div className="curriculum-column">
              <div className="curriculum-section generate-section">
                <div className="section-header">
                  <Sparkles className="w-5 h-5" />
                  <h4>Full-Year Generation</h4>
                </div>
                <div className="generate-info">
                  <p>Generate a complete academic year scheme with:</p>
                  <ul>
                    <li>Progressive learning across {totalWeeks} weeks</li>
                    <li>Pagination for better performance</li>
                    <li>Memory system for reuse</li>
                    <li>Custom guidance & constraints</li>
                  </ul>
                </div>
                <button
                  onClick={handleFullYearGenerate}
                  disabled={generatingFullYear || !formData.subject.trim() || !formData.class.trim()}
                  className="full-year-generate-btn"
                  data-testid="full-year-generate-btn"
                >
                  {generatingFullYear ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Full Year...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Generate Full Year Scheme</span>
                    </>
                  )}
                </button>
                <div className="generate-note">
                  {checkMemory ? (
                    <span className="memory-note">Will check memory first for similar prompts</span>
                  ) : (
                    <span className="fresh-note">Will always generate fresh content</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="table-container" ref={printRef}>
        <table className="scheme-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className={`col-${col.key === 'specificActivities' ? 'specific-act' : col.key}`}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentCompetencies.map((row, index) => {
              const globalIndex = currentPage * rowsPerPage + index;
              const isFilling = fillingRows.has(globalIndex);

              return (
                <tr key={index} className={isFilling ? 'row-filling' : row.main ? 'row-filled' : ''}>
                  {columns.map(col => (
                    <td key={col.key} className={isFilling ? 'cell-filling' : ''}>
                      {isFilling ? (
                        <div className="cell-spinner">
                          <div className="spinner-dot" />
                        </div>
                      ) : col.type === 'textarea' ? (
                        <textarea
                          value={row[col.key]}
                          onChange={(e) => handleTextareaChange(e, index, col.key)}
                          onFocus={(e) => autoResize(e.target)}
                          className="table-input"
                          placeholder={col.label}
                        />
                      ) : (
                        <input
                          type="text"
                          value={row[col.key]}
                          onChange={(e) => handleInputChange(e, index, col.key)}
                          className="table-input"
                          placeholder={col.label.split(' ')[0]}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="controls">
        <div className="pagination">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} data-testid="scheme-prev-page">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span>Page {currentPage + 1} of {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages - 1} data-testid="scheme-next-page">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="actions">
          <button onClick={addRow} className="add-row-btn" data-testid="scheme-add-row">
            <Plus className="w-4 h-4" /> Add Row
          </button>
          <button onClick={saveToMyFiles} className="save-btn" disabled={saving} data-testid="scheme-save-template">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : savedMsg || 'Save to My Files'}
          </button>
          <button onClick={handlePrint} className="print-btn" data-testid="scheme-print">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={exportToDocx} className="export-btn" data-testid="scheme-export-docx">
            <FileDown className="w-4 h-4" /> Export DOCX
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchemeOfWorkForm;
