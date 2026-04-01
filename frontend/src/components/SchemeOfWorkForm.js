import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import './SchemeOfWork.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

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
      await axios.post(`${API_URL}/api/schemes`, {
        syllabus,
        school: formData.school,
        teacher: formData.teacher,
        subject: formData.subject,
        year: formData.year,
        term: formData.term,
        class: formData.class,
        competencies: getNonEmptyRows()
      }, { withCredentials: true });
      setSavedMsg('Saved to My Files!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const buildPrintHTML = () => {
    const nonEmpty = getNonEmptyRows();
    const cols = columns;

    let headerHTML = `
      <h1 style="text-align:center;font-size:20pt;margin-bottom:5px;font-family:'Times New Roman',serif;">SCHEME OF WORK</h1>
      <h2 style="text-align:center;font-size:14pt;margin-bottom:15px;color:#555;font-family:'Times New Roman',serif;">${syllabus.toUpperCase()}</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-family:'Times New Roman',serif;">
        <tr><td style="padding:4px 8px;font-weight:bold;width:150px;">Name of School:</td><td style="padding:4px 8px;border-bottom:1px solid #999;">${formData.school}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Teacher's Name:</td><td style="padding:4px 8px;border-bottom:1px solid #999;">${formData.teacher}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Subject:</td><td style="padding:4px 8px;border-bottom:1px solid #999;">${formData.subject}</td></tr>
        <tr>
          <td style="padding:4px 8px;font-weight:bold;">Year:</td><td style="padding:4px 8px;border-bottom:1px solid #999;">${formData.year}
          &nbsp;&nbsp;&nbsp;&nbsp;<strong>Term:</strong> ${formData.term}
          &nbsp;&nbsp;&nbsp;&nbsp;<strong>Class:</strong> ${formData.class}</td>
        </tr>
      </table>
    `;

    let tableHTML = `<table style="width:100%;border-collapse:collapse;font-size:9pt;font-family:'Times New Roman',serif;">
      <thead><tr>${cols.map(c => `<th style="border:1px solid #000;padding:6px 4px;background:#3498db;color:white;text-align:center;font-size:8pt;">${c.label}</th>`).join('')}</tr></thead>
      <tbody>`;
    
    nonEmpty.forEach(row => {
      tableHTML += '<tr>';
      cols.forEach(c => {
        const val = (row[c.key] || '').replace(/\n/g, '<br/>');
        tableHTML += `<td style="border:1px solid #000;padding:5px 4px;vertical-align:top;">${val}</td>`;
      });
      tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';

    return headerHTML + tableHTML;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    printWindow.document.write(`<html><head><title>Scheme of Work - ${formData.subject}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { padding:20px; font-family:'Times New Roman',serif; }
        @media print { body { padding:10px; } @page { size:landscape; margin:10mm; } }
      </style></head><body>${buildPrintHTML()}</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); };
  };

  const exportToDocx = () => {
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8">
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 11pt; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; font-size: 9pt; }
          th { background-color: #3498db; color: white; text-align: center; }
          h1 { text-align: center; font-size: 18pt; }
          h2 { text-align: center; font-size: 13pt; color: #555; }
        </style>
      </head><body>${buildPrintHTML()}</body></html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Scheme_of_Work_${formData.subject || 'untitled'}_${syllabus}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
