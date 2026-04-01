import React, { useState } from 'react';
import './SchemeOfWork.css';

const SchemeOfWorkForm = () => {
  const [formData, setFormData] = useState({
    school: '',
    teacher: '',
    subject: '',
    year: new Date().getFullYear(),
    term: '',
    class: '',
    competencies: Array(50).fill().map(() => ({ 
      main: '', 
      specific: '', 
      activities: '', 
      specificActivities: '',
      month: '',
      week: '',
      periods: '',
      methods: '',
      resources: '',
      assessment: '',
      references: '',
      remarks: ''
    }))
  });

  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 15;
  const totalPages = Math.ceil(formData.competencies.length / rowsPerPage);

  const handleInputChange = (e, index, field) => {
    const { value } = e.target;
    
    if (index !== undefined) {
      const actualIndex = currentPage * rowsPerPage + index;
      const updatedCompetencies = [...formData.competencies];
      updatedCompetencies[actualIndex][field] = value;
      setFormData({...formData, competencies: updatedCompetencies});
    } else {
      setFormData({...formData, [e.target.name]: value});
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const addRow = () => {
    setFormData({
      ...formData,
      competencies: [
        ...formData.competencies,
        { 
          main: '', 
          specific: '', 
          activities: '', 
          specificActivities: '',
          month: '',
          week: '',
          periods: '',
          methods: '',
          resources: '',
          assessment: '',
          references: '',
          remarks: ''
        }
      ]
    });
  };

  const exportToDocx = () => {
    alert('Export functionality would be implemented here');
  };

  const saveTemplate = () => {
    alert('Save template functionality would be implemented here');
  };

  // Get current page data
  const currentCompetencies = formData.competencies.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  );

  return (
    <div className="scheme-of-work-container" data-testid="scheme-of-work">
      <div className="scheme-header">
        <h1>SCHEME OF WORK</h1>
        
        <div className="header-info">
          <div className="info-row">
            <span className="info-label">Name of School:</span>
            <input
              type="text"
              name="school"
              value={formData.school}
              onChange={handleInputChange}
              className="info-input"
              placeholder="................................................................"
              data-testid="scheme-school-input"
            />
          </div>
          
          <div className="info-row">
            <span className="info-label">Teacher's Name:</span>
            <input
              type="text"
              name="teacher"
              value={formData.teacher}
              onChange={handleInputChange}
              className="info-input"
              placeholder="................................................................"
              data-testid="scheme-teacher-input"
            />
          </div>
          
          <div className="info-row">
            <span className="info-label">Subject:</span>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="info-input-wide"
              placeholder="............................................................................................................"
              data-testid="scheme-subject-input"
            />
          </div>
          
          <div className="info-row">
            <span className="info-label">Year:</span>
            <input
              type="text"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              className="info-input-small"
              placeholder=".........................."
              data-testid="scheme-year-input"
            />
            
            <span className="info-label">Term:</span>
            <input
              type="text"
              name="term"
              value={formData.term}
              onChange={handleInputChange}
              className="info-input-small"
              placeholder="..........................."
              data-testid="scheme-term-input"
            />
            
            <span className="info-label">Class:</span>
            <input
              type="text"
              name="class"
              value={formData.class}
              onChange={handleInputChange}
              className="info-input-small"
              placeholder="......................."
              data-testid="scheme-class-input"
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="scheme-table">
          <thead>
            <tr>
              <th className="col-main">Main Competence</th>
              <th className="col-specific">Specific Competences</th>
              <th className="col-activities">Learning Activities</th>
              <th className="col-specific-act">Specific Activities</th>
              <th className="col-month">Month</th>
              <th className="col-week">Week</th>
              <th className="col-periods">Number of Periods</th>
              <th className="col-methods">Teaching and Learning Methods</th>
              <th className="col-resources">Teaching and Learning Resources</th>
              <th className="col-assessment">Assessment Tools</th>
              <th className="col-references">References</th>
              <th className="col-remarks">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {currentCompetencies.map((row, index) => (
              <tr key={index}>
                <td>
                  <textarea
                    value={row.main}
                    onChange={(e) => handleInputChange(e, index, 'main')}
                    className="table-input"
                    placeholder="Main competence"
                  />
                </td>
                <td>
                  <textarea
                    value={row.specific}
                    onChange={(e) => handleInputChange(e, index, 'specific')}
                    className="table-input"
                    placeholder="Specific competences"
                  />
                </td>
                <td>
                  <textarea
                    value={row.activities}
                    onChange={(e) => handleInputChange(e, index, 'activities')}
                    className="table-input"
                    placeholder="Learning activities"
                  />
                </td>
                <td>
                  <textarea
                    value={row.specificActivities}
                    onChange={(e) => handleInputChange(e, index, 'specificActivities')}
                    className="table-input"
                    placeholder="Specific activities"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.month}
                    onChange={(e) => handleInputChange(e, index, 'month')}
                    className="table-input"
                    placeholder="Month"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.week}
                    onChange={(e) => handleInputChange(e, index, 'week')}
                    className="table-input"
                    placeholder="Week"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.periods}
                    onChange={(e) => handleInputChange(e, index, 'periods')}
                    className="table-input"
                    placeholder="Periods"
                  />
                </td>
                <td>
                  <textarea
                    value={row.methods}
                    onChange={(e) => handleInputChange(e, index, 'methods')}
                    className="table-input"
                    placeholder="Teaching methods"
                  />
                </td>
                <td>
                  <textarea
                    value={row.resources}
                    onChange={(e) => handleInputChange(e, index, 'resources')}
                    className="table-input"
                    placeholder="Resources"
                  />
                </td>
                <td>
                  <textarea
                    value={row.assessment}
                    onChange={(e) => handleInputChange(e, index, 'assessment')}
                    className="table-input"
                    placeholder="Assessment tools"
                  />
                </td>
                <td>
                  <textarea
                    value={row.references}
                    onChange={(e) => handleInputChange(e, index, 'references')}
                    className="table-input"
                    placeholder="References"
                  />
                </td>
                <td>
                  <textarea
                    value={row.remarks}
                    onChange={(e) => handleInputChange(e, index, 'remarks')}
                    className="table-input"
                    placeholder="Remarks"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="controls">
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            data-testid="scheme-prev-page"
          >
            Previous
          </button>
          
          <span>Page {currentPage + 1} of {totalPages}</span>
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            data-testid="scheme-next-page"
          >
            Next
          </button>
        </div>

        <div className="actions">
          <button onClick={addRow} className="add-row-btn" data-testid="scheme-add-row">
            + Add Row
          </button>
          
          <button onClick={saveTemplate} className="save-btn" data-testid="scheme-save-template">
            Save Template
          </button>
          
          <button onClick={exportToDocx} className="export-btn" data-testid="scheme-export-docx">
            Export as DOCX
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchemeOfWorkForm;
