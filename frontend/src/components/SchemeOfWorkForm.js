import React, { useState } from 'react';
import './SchemeOfWork.css';

const ZANZIBAR_COLUMNS = [
  { key: 'main', label: 'Main Competence', className: 'col-main', type: 'textarea' },
  { key: 'specific', label: 'Specific Competences', className: 'col-specific', type: 'textarea' },
  { key: 'activities', label: 'Learning Activities', className: 'col-activities', type: 'textarea' },
  { key: 'specificActivities', label: 'Specific Activities', className: 'col-specific-act', type: 'textarea' },
  { key: 'month', label: 'Month', className: 'col-month', type: 'input' },
  { key: 'week', label: 'Week', className: 'col-week', type: 'input' },
  { key: 'periods', label: 'Number of Periods', className: 'col-periods', type: 'input' },
  { key: 'methods', label: 'Teaching and Learning Methods', className: 'col-methods', type: 'textarea' },
  { key: 'resources', label: 'Teaching and Learning Resources', className: 'col-resources', type: 'textarea' },
  { key: 'assessment', label: 'Assessment Tools', className: 'col-assessment', type: 'textarea' },
  { key: 'references', label: 'References', className: 'col-references', type: 'textarea' },
  { key: 'remarks', label: 'Remarks', className: 'col-remarks', type: 'textarea' },
];

const MAINLAND_COLUMNS = [
  { key: 'main', label: 'Main Competence (Umahiri Mkuu)', className: 'col-main', type: 'textarea' },
  { key: 'specific', label: 'Specific Competence (Umahiri Mahususi)', className: 'col-specific', type: 'textarea' },
  { key: 'activities', label: 'Main Activity (Shughuli Kuu)', className: 'col-activities', type: 'textarea' },
  { key: 'specificActivities', label: 'Specific Activity (Shughuli Mahususi)', className: 'col-specific-act', type: 'textarea' },
  { key: 'month', label: 'Month', className: 'col-month', type: 'input' },
  { key: 'week', label: 'Week', className: 'col-week', type: 'input' },
  { key: 'periods', label: 'Number of Periods', className: 'col-periods', type: 'input' },
  { key: 'methods', label: 'Teaching & Learning Methods', className: 'col-methods', type: 'textarea' },
  { key: 'resources', label: 'Teaching & Learning Resources', className: 'col-resources', type: 'textarea' },
  { key: 'assessment', label: 'Assessment Tools', className: 'col-assessment', type: 'textarea' },
  { key: 'references', label: 'References', className: 'col-references', type: 'textarea' },
  { key: 'remarks', label: 'Remarks', className: 'col-remarks', type: 'textarea' },
];

const makeEmptyRow = () => ({
  main: '', specific: '', activities: '', specificActivities: '',
  month: '', week: '', periods: '', methods: '',
  resources: '', assessment: '', references: '', remarks: ''
});

const SchemeOfWorkForm = () => {
  const [syllabus, setSyllabus] = useState('Zanzibar');
  const [formData, setFormData] = useState({
    school: '',
    teacher: '',
    subject: '',
    year: new Date().getFullYear(),
    term: '',
    class: '',
    competencies: Array(50).fill(null).map(() => makeEmptyRow())
  });

  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 15;
  const totalPages = Math.ceil(formData.competencies.length / rowsPerPage);

  const columns = syllabus === 'Zanzibar' ? ZANZIBAR_COLUMNS : MAINLAND_COLUMNS;

  const handleInputChange = (e, index, field) => {
    const { value } = e.target;
    if (index !== undefined) {
      const actualIndex = currentPage * rowsPerPage + index;
      const updatedCompetencies = [...formData.competencies];
      updatedCompetencies[actualIndex] = { ...updatedCompetencies[actualIndex], [field]: value };
      setFormData({ ...formData, competencies: updatedCompetencies });
    } else {
      setFormData({ ...formData, [e.target.name]: value });
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) setCurrentPage(newPage);
  };

  const addRow = () => {
    setFormData({ ...formData, competencies: [...formData.competencies, makeEmptyRow()] });
  };

  const exportToDocx = () => { alert('Export functionality would be implemented here'); };
  const saveTemplate = () => { alert('Save template functionality would be implemented here'); };

  const currentCompetencies = formData.competencies.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  );

  return (
    <div className="scheme-of-work-container" data-testid="scheme-of-work">
      {/* Syllabus Toggle */}
      <div className="scheme-toggle" data-testid="scheme-syllabus-toggle">
        <button
          className={`toggle-btn ${syllabus === 'Zanzibar' ? 'active' : ''}`}
          onClick={() => setSyllabus('Zanzibar')}
          data-testid="scheme-toggle-zanzibar"
        >
          Zanzibar
        </button>
        <button
          className={`toggle-btn ${syllabus === 'Tanzania Mainland' ? 'active' : ''}`}
          onClick={() => setSyllabus('Tanzania Mainland')}
          data-testid="scheme-toggle-mainland"
        >
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

      <div className="table-container">
        <table className="scheme-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className={col.className}>{col.label}</th>
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
                        onChange={(e) => handleInputChange(e, index, col.key)}
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
          <button onClick={saveTemplate} className="save-btn" data-testid="scheme-save-template">Save Template</button>
          <button onClick={exportToDocx} className="export-btn" data-testid="scheme-export-docx">Export as DOCX</button>
        </div>
      </div>
    </div>
  );
};

export default SchemeOfWorkForm;
