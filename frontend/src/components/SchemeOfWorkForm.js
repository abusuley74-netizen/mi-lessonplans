import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import './SchemeOfWork.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Fetch file via auth cookie and trigger real download
const fetchAndDownload = async (url, filename) => {
  try {
    const response = await fetch(url, { credentials: 'include' });
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
    console.error('Download error:', err);
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
  const [savedMsg, setSavedMsg] = useState('');
  const [savedSchemeId, setSavedSchemeId] = useState(null);
  const [formData, setFormData] = useState({
    school: '', teacher: '', subject: '',
    year: new Date().getFullYear(), term: '', class: '',
    competencies: Array(15).fill(null).map(() => makeEmptyRow())
  });
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 15;
  const totalPages = Math.ceil(formData.competencies.length / rowsPerPage);
  const printRef = useRef(null);

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

  // Auto-resize textareas
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

  // Auto-resize all textareas on page change
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.scheme-table textarea').forEach(autoResize);
    }, 50);
    return () => clearTimeout(timer);
  }, [currentPage, autoResize]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) setCurrentPage(newPage);
  };

  const addRow = () => {
    setFormData({ ...formData, competencies: [...formData.competencies, makeEmptyRow()] });
    // Jump to last page
    const newTotal = Math.ceil((formData.competencies.length + 1) / rowsPerPage);
    setCurrentPage(newTotal - 1);
  };

  // Get non-empty competencies for saving
  const getNonEmptyRows = () => {
    return formData.competencies.filter(row =>
      Object.values(row).some(v => v.trim && v.trim() !== '')
    );
  };

  const saveToMyFiles = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      const res = await axios.post(`${API_URL}/api/schemes`, {
        syllabus,
        school: formData.school,
        teacher: formData.teacher,
        subject: formData.subject,
        year: formData.year,
        term: formData.term,
        class: formData.class,
        competencies: getNonEmptyRows()
      }, { withCredentials: true });
      setSavedSchemeId(res.data.scheme_id);
      setSavedMsg('Saved to My Files!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (savedSchemeId) {
      // Fetch HTML and open in print window
      fetch(`${API_URL}/api/schemes/${savedSchemeId}/view`, { credentials: 'include' })
        .then(r => r.text())
        .then(html => {
          const printW = window.open('', '_blank');
          if (printW) { printW.document.write(html); printW.document.close(); printW.onload = () => printW.print(); }
        });
    } else {
      saveAndThen('print');
    }
  };

  const exportToDocx = () => {
    if (savedSchemeId) {
      fetchAndDownload(
        `${API_URL}/api/schemes/${savedSchemeId}/export`,
        `Scheme_of_Work_${formData.subject || 'untitled'}_${syllabus}.doc`
      );
    } else {
      saveAndThen('export');
    }
  };

  const saveAndThen = async (action) => {
    setSaving(true);
    setSavedMsg('');
    try {
      const res = await axios.post(`${API_URL}/api/schemes`, {
        syllabus,
        school: formData.school,
        teacher: formData.teacher,
        subject: formData.subject,
        year: formData.year,
        term: formData.term,
        class: formData.class,
        competencies: getNonEmptyRows()
      }, { withCredentials: true });
      const newId = res.data.scheme_id;
      setSavedSchemeId(newId);
      setSavedMsg('Saved!');
      setTimeout(() => setSavedMsg(''), 3000);
      
      if (action === 'print') {
        fetch(`${API_URL}/api/schemes/${newId}/view`, { credentials: 'include' })
          .then(r => r.text())
          .then(html => {
            const printW = window.open('', '_blank');
            if (printW) { printW.document.write(html); printW.document.close(); printW.onload = () => printW.print(); }
          });
      } else if (action === 'export') {
        fetchAndDownload(
          `${API_URL}/api/schemes/${newId}/export`,
          `Scheme_of_Work_${formData.subject || 'untitled'}_${syllabus}.doc`
        );
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
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
            {currentCompetencies.map((row, index) => (
              <tr key={index}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.type === 'textarea' ? (
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
            ))}
          </tbody>
        </table>
      </div>

      <div className="controls">
        <div className="pagination">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} data-testid="scheme-prev-page">Previous</button>
          <span>Page {currentPage + 1} of {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages - 1} data-testid="scheme-next-page">Next</button>
        </div>
        <div className="actions">
          <button onClick={addRow} className="add-row-btn" data-testid="scheme-add-row">+ Add Row</button>
          <button onClick={saveToMyFiles} className="save-btn" disabled={saving} data-testid="scheme-save-template">
            {saving ? 'Saving...' : savedMsg || 'Save to My Files'}
          </button>
          <button onClick={handlePrint} className="print-btn" data-testid="scheme-print">Print</button>
          <button onClick={exportToDocx} className="export-btn" data-testid="scheme-export-docx">Export as DOCX</button>
        </div>
      </div>
    </div>
  );
};

export default SchemeOfWorkForm;
