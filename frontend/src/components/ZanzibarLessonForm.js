import React, { useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import './LessonForm.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Subject is now editable text field - user can type any subject
// Language detection will work based on subject name

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

const ZanzibarLessonForm = ({ onLessonGenerated }) => {
  const [formData, setFormData] = useState({
    syllabus: 'Zanzibar',
    subject: 'english',
    grade: 'Standard 1',
    topic: '',
    dayDate: '',
    session: '',
    class: '',
    periods: '',
    time: '',
    enrolledGirls: '',
    enrolledBoys: '',
    presentGirls: '',
    presentBoys: '',
    generalOutcome: '',
    mainTopic: '',
    subTopic: '',
    specificOutcome: '',
    learningResources: '',
    references: '',
    introTime: '',
    teachingIntro: '',
    learningIntro: '',
    assessmentIntro: '',
    newTime: '',
    teachingNew: '',
    learningNew: '',
    assessmentNew: '',
    teacherEvaluation: '',
    pupilWork: '',
    remarks: ''
  });

  const [previewData, setPreviewData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingFields, setLoadingFields] = useState({});
  const [error, setError] = useState(null);

  // Calculate totals
  const totalEnrolled = (+formData.enrolledGirls || 0) + (+formData.enrolledBoys || 0);
  const totalPresent = (+formData.presentGirls || 0) + (+formData.presentBoys || 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Reset grade when syllabus changes
      if (name === 'syllabus') {
        updated.grade = value === 'Zanzibar' ? 'Standard 1' : 'Standard 1';
      }
      return updated;
    });
  };

  // Check if content fields are empty (AI should generate)
  const shouldUseAI = () => {
    const contentFields = [
      'generalOutcome', 'mainTopic', 'subTopic', 'specificOutcome',
      'learningResources', 'references', 'introTime', 'teachingIntro',
      'learningIntro', 'assessmentIntro', 'newTime', 'teachingNew',
      'learningNew', 'assessmentNew', 'teacherEvaluation', 'pupilWork', 'remarks'
    ];
    return contentFields.every(field => !formData[field]?.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.topic.trim()) {
      setError('Please enter a topic for your lesson plan.');
      return;
    }

    if (shouldUseAI()) {
      // AI Generation Mode - set loading states for all content fields
      setIsGenerating(true);
      setLoadingFields({
        generalOutcome: true,
        mainTopic: true,
        subTopic: true,
        specificOutcome: true,
        learningResources: true,
        references: true,
        introTime: true,
        teachingIntro: true,
        learningIntro: true,
        assessmentIntro: true,
        newTime: true,
        teachingNew: true,
        learningNew: true,
        assessmentNew: true,
        teacherEvaluation: true,
        pupilWork: true,
        remarks: true
      });

      try {
        const response = await axios.post(
          `${API_URL}/api/lessons/generate`,
          {
            syllabus: formData.syllabus,
            subject: formData.subject,
            grade: formData.grade,
            topic: formData.topic,
            form_data: formData
          },
          {  }
        );

        const aiContent = response.data.content;
        
        // Map AI response to form fields
        const updatedFormData = {
          ...formData,
          generalOutcome: aiContent.generalOutcome || '',
          mainTopic: aiContent.mainTopic || formData.topic,
          subTopic: aiContent.subTopic || '',
          specificOutcome: aiContent.specificOutcome || '',
          learningResources: aiContent.learningResources || '',
          references: aiContent.references || '',
          introTime: aiContent.introductionActivities?.time || '10 minutes',
          teachingIntro: aiContent.introductionActivities?.teachingActivities || '',
          learningIntro: aiContent.introductionActivities?.learningActivities || '',
          assessmentIntro: aiContent.introductionActivities?.assessment || '',
          newTime: aiContent.newKnowledgeActivities?.time || '25 minutes',
          teachingNew: aiContent.newKnowledgeActivities?.teachingActivities || '',
          learningNew: aiContent.newKnowledgeActivities?.learningActivities || '',
          assessmentNew: aiContent.newKnowledgeActivities?.assessment || '',
          teacherEvaluation: aiContent.teacherEvaluation || '',
          pupilWork: aiContent.pupilWork || '',
          remarks: aiContent.remarks || ''
        };

        setFormData(updatedFormData);
        setPreviewData(updatedFormData);
        
        if (onLessonGenerated) {
          onLessonGenerated(response.data);
        }
      } catch (err) {
        if (err.response?.status === 403) {
          setError('Free plan limit reached. Please subscribe to generate more lessons.');
        } else {
          setError(err.response?.data?.detail || 'Failed to generate lesson plan. Please try again.');
        }
      } finally {
        setIsGenerating(false);
        setLoadingFields({});
      }
    } else {
      // Manual Mode - just preview what teacher entered
      setPreviewData({ ...formData });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const content = document.getElementById('lesson-plan-preview')?.innerText || '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.subject}_${formData.topic}_lesson_plan.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${formData.subject} Lesson Plan: ${formData.topic}`,
          text: `Check out this lesson plan for ${formData.subject}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  // Loading spinner component for fields
  const FieldLoader = () => (
    <div className="field-loader">
      <Loader2 className="animate-spin" size={20} />
    </div>
  );

  const grades = formData.syllabus === 'Zanzibar' ? ZANZIBAR_GRADES : TANZANIA_GRADES;

  return (
    <div className="lesson-plan-container">
      <div className="form-section">
        <form className="lesson-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>Create {formData.syllabus} Lesson Plan</h2>
          </div>

          {error && (
            <div className="error-alert">
              {error}
              <button type="button" onClick={() => setError(null)}>×</button>
            </div>
          )}

          {/* Basic Info */}
          <div className="form-row">
            <div className="form-group">
              <label>Syllabus</label>
              <select name="syllabus" value={formData.syllabus} onChange={handleChange} data-testid="select-syllabus">
                <option value="Zanzibar">Zanzibar</option>
                <option value="Tanzania Mainland">Tanzania Mainland</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Subject (Type any subject)</label>
              <input 
                type="text" 
                name="subject" 
                value={formData.subject} 
                onChange={handleChange} 
                placeholder="e.g., Kiswahili, Mathematics, اللغة العربية, Français" 
                data-testid="input-subject"
              />
              <small className="hint-text">
                💡 Language detection works automatically: Kiswahili → Swahili, العربية → Arabic, Français → French
              </small>
            </div>
            
            <div className="form-group">
              <label>Grade/Class</label>
              <select name="grade" value={formData.grade} onChange={handleChange} data-testid="select-grade">
                {grades.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Topic</label>
            <input 
              type="text" 
              name="topic" 
              value={formData.topic} 
              onChange={handleChange} 
              placeholder="Enter lesson topic" 
              required 
              data-testid="input-topic"
            />
          </div>

          <h3>LESSON PLAN (ANDALIO LA SOMO)</h3>

          {/* Student Info Table */}
          <table className="lesson-table">
            <thead>
              <tr>
                <th>DAY & DATE<br />SIKU & TAREHE</th>
                <th>SESSION<br />MKONDO</th>
                <th>CLASS<br />DARASA</th>
                <th>PERIODS<br />VIPINDI</th>
                <th>TIME<br />MUDA</th>
                <th>ENROLLED / PRESENT<br />WALIOANDIKISHWA / WALIOHUDHURIA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="date" name="dayDate" value={formData.dayDate} onChange={handleChange} /></td>
                <td><input type="text" name="session" value={formData.session} onChange={handleChange} placeholder="Session" /></td>
                <td><input type="text" name="class" value={formData.class} onChange={handleChange} placeholder="Class" /></td>
                <td><input type="number" name="periods" value={formData.periods} onChange={handleChange} placeholder="Periods" min="1" /></td>
                <td><input type="text" name="time" value={formData.time} onChange={handleChange} placeholder="Minutes" /></td>
                <td>
                  <div className="enrollment-table">
                    <div className="enrollment-row">
                      <div className="enrollment-label">Enrolled Girls:</div>
                      <input type="number" name="enrolledGirls" value={formData.enrolledGirls} onChange={handleChange} min="0" className="enrollment-input" />
                    </div>
                    <div className="enrollment-row">
                      <div className="enrollment-label">Enrolled Boys:</div>
                      <input type="number" name="enrolledBoys" value={formData.enrolledBoys} onChange={handleChange} min="0" className="enrollment-input" />
                    </div>
                    <div className="enrollment-row">
                      <div className="enrollment-label">Present Girls:</div>
                      <input type="number" name="presentGirls" value={formData.presentGirls} onChange={handleChange} min="0" className="enrollment-input" />
                    </div>
                    <div className="enrollment-row">
                      <div className="enrollment-label">Present Boys:</div>
                      <input type="number" name="presentBoys" value={formData.presentBoys} onChange={handleChange} min="0" className="enrollment-input" />
                    </div>
                    <div className="enrollment-totals">
                      <div>Total Enrolled: {totalEnrolled}</div>
                      <div>Total Present: {totalPresent}</div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Editable Lines - Left Aligned */}
          <div className="open-lines-left">
            <div className="form-group-left">
              <label>GENERAL LEARNING OUTCOME: MATOKEO YA JUMLA YA KUJIFUNZA</label>
              {loadingFields.generalOutcome ? <FieldLoader /> : (
                <textarea name="generalOutcome" value={formData.generalOutcome} onChange={handleChange} className="line-input" rows="3" />
              )}
            </div>
            
            <div className="form-group-left">
              <label>MAIN TOPIC: MADA KUU</label>
              {loadingFields.mainTopic ? <FieldLoader /> : (
                <textarea name="mainTopic" value={formData.mainTopic} onChange={handleChange} className="line-input" rows="3" />
              )}
            </div>
            
            <div className="form-group-left">
              <label>SUB TOPIC: MADA NDOGO</label>
              {loadingFields.subTopic ? <FieldLoader /> : (
                <textarea name="subTopic" value={formData.subTopic} onChange={handleChange} className="line-input" rows="3" />
              )}
            </div>
            
            <div className="form-group-left">
              <label>SPECIFIC LEARNING OUTCOME: MATOKEO MAHSUSI YA KUJIFUNZA</label>
              {loadingFields.specificOutcome ? <FieldLoader /> : (
                <textarea name="specificOutcome" value={formData.specificOutcome} onChange={handleChange} className="line-input" rows="3" />
              )}
            </div>
            
            <div className="form-group-left">
              <label>LEARNING RESOURCES: RASILIMALI ZA KUJIFUNZA</label>
              {loadingFields.learningResources ? <FieldLoader /> : (
                <textarea name="learningResources" value={formData.learningResources} onChange={handleChange} className="line-input" rows="3" />
              )}
            </div>
            
            <div className="form-group-left">
              <label>REFERENCES: REJEA</label>
              {loadingFields.references ? <FieldLoader /> : (
                <textarea name="references" value={formData.references} onChange={handleChange} className="line-input" rows="3" />
              )}
            </div>
          </div>

          {/* Lesson Development Table */}
          <h4 className="left-align">LESSON DEVELOPMENT (MAENDELEO YA SOMO)</h4>
          <table className="lesson-table lesson-development">
            <thead>
              <tr>
                <th>STEPS<br />HATUA</th>
                <th>TIME<br />MUDA</th>
                <th>TEACHING ACTIVITIES<br />VITENDO VYA KUFUNDISHIA</th>
                <th>LEARNING ACTIVITIES<br />VITENDO VYA KUJIFUNZIA</th>
                <th>ASSESSMENT<br />TATHMINI</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1. INTRODUCTION<br />UTANGULIZI</td>
                <td>
                  {loadingFields.introTime ? <FieldLoader /> : (
                    <textarea name="introTime" value={formData.introTime} onChange={handleChange} rows="3" placeholder="Time" />
                  )}
                </td>
                <td>
                  {loadingFields.teachingIntro ? <FieldLoader /> : (
                    <textarea name="teachingIntro" value={formData.teachingIntro} onChange={handleChange} rows="3" placeholder="Teaching activities" />
                  )}
                </td>
                <td>
                  {loadingFields.learningIntro ? <FieldLoader /> : (
                    <textarea name="learningIntro" value={formData.learningIntro} onChange={handleChange} rows="3" placeholder="Learning activities" />
                  )}
                </td>
                <td>
                  {loadingFields.assessmentIntro ? <FieldLoader /> : (
                    <textarea name="assessmentIntro" value={formData.assessmentIntro} onChange={handleChange} rows="3" placeholder="Assessment methods" />
                  )}
                </td>
              </tr>
              <tr>
                <td>2. BUILDING NEW KNOWLEDGE AND SKILLS<br />KUJENGA MAARIFA MAPYA NA UJUZI</td>
                <td>
                  {loadingFields.newTime ? <FieldLoader /> : (
                    <textarea name="newTime" value={formData.newTime} onChange={handleChange} rows="3" placeholder="Time" />
                  )}
                </td>
                <td>
                  {loadingFields.teachingNew ? <FieldLoader /> : (
                    <textarea name="teachingNew" value={formData.teachingNew} onChange={handleChange} rows="3" placeholder="Teaching activities" />
                  )}
                </td>
                <td>
                  {loadingFields.learningNew ? <FieldLoader /> : (
                    <textarea name="learningNew" value={formData.learningNew} onChange={handleChange} rows="3" placeholder="Learning activities" />
                  )}
                </td>
                <td>
                  {loadingFields.assessmentNew ? <FieldLoader /> : (
                    <textarea name="assessmentNew" value={formData.assessmentNew} onChange={handleChange} rows="3" placeholder="Assessment methods" />
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Evaluation Section - Left Aligned */}
          <div className="open-lines-left">
            <div className="form-group-left">
              <label>TEACHER'S EVALUATION: TATHMINI YA MWALIMU</label>
              {loadingFields.teacherEvaluation ? <FieldLoader /> : (
                <textarea name="teacherEvaluation" value={formData.teacherEvaluation} onChange={handleChange} className="line-input" rows="3" />
              )}
            </div>
            
            <div className="form-group-left">
              <label>PUPIL'S WORK: KAZI YA MWANAFUNZI</label>
              {loadingFields.pupilWork ? <FieldLoader /> : (
                <textarea name="pupilWork" value={formData.pupilWork} onChange={handleChange} className="line-input" rows="3" />
              )}
            </div>
            
            <div className="form-group-left">
              <label>REMARKS: MAELEZO</label>
              {loadingFields.remarks ? <FieldLoader /> : (
                <textarea name="remarks" value={formData.remarks} onChange={handleChange} className="line-input" rows="3" />
              )}
            </div>
          </div>

          <div className="ai-hint">
            {shouldUseAI() ? (
              <p>💡 <strong>AI Mode:</strong> Fill in basic info and topic above, leave the rest empty. AI will generate the lesson content for you!</p>
            ) : (
              <p>📝 <strong>Manual Mode:</strong> You've filled in some content. Click generate to preview your lesson plan.</p>
            )}
          </div>

          <button type="submit" className="generate-btn" disabled={isGenerating} data-testid="generate-btn">
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin inline mr-2" size={20} />
                Generating with AI...
              </>
            ) : (
              'Generate Lesson Plan'
            )}
          </button>
        </form>
      </div>

      {/* Preview Section */}
      {previewData && (
        <div className="preview-section">
          <div className="preview-actions">
            <button onClick={handlePrint} className="action-btn print" data-testid="print-btn">
              Print Lesson Plan
            </button>
            <button onClick={handleDownloadPDF} className="action-btn download" data-testid="download-btn">
              Download PDF
            </button>
            <button onClick={handleShare} className="action-btn share" data-testid="share-btn">
              Share
            </button>
          </div>
          
          <div id="lesson-plan-preview" className="lesson-preview">
            <h2 className="print-center">LESSON PLAN</h2>
            
            <div className="preview-header">
              <div><strong>Syllabus:</strong> {previewData.syllabus}</div>
              <div><strong>Subject:</strong> {previewData.subject}</div>
              <div><strong>Grade/Class:</strong> {previewData.grade}</div>
              <div><strong>Topic:</strong> {previewData.topic}</div>
            </div>

            <table className="preview-table">
              <tbody>
                <tr>
                  <td><strong>Day & Date:</strong> {previewData.dayDate}</td>
                  <td><strong>Session:</strong> {previewData.session}</td>
                  <td><strong>Class:</strong> {previewData.class}</td>
                  <td><strong>Periods:</strong> {previewData.periods}</td>
                  <td><strong>Time:</strong> {previewData.time}</td>
                </tr>
                <tr>
                  <td colSpan="5">
                    <strong>Enrollment & Attendance:</strong><br />
                    Girls: {previewData.enrolledGirls || 0} enrolled, {previewData.presentGirls || 0} present<br />
                    Boys: {previewData.enrolledBoys || 0} enrolled, {previewData.presentBoys || 0} present<br />
                    <strong>Total Present:</strong> {totalPresent}<br />
                    <strong>Total Registered:</strong> {totalEnrolled}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="preview-content-left">
              <div className="preview-item-left">
                <h4>GENERAL LEARNING OUTCOME: MATOKEO YA JUMLA YA KUJIFUNZA</h4>
                <p>{previewData.generalOutcome}</p>
              </div>

              <div className="preview-item-left">
                <h4>MAIN TOPIC: MADA KUU</h4>
                <p>{previewData.mainTopic}</p>
              </div>

              <div className="preview-item-left">
                <h4>SUB TOPIC: MADA NDOGO</h4>
                <p>{previewData.subTopic}</p>
              </div>

              <div className="preview-item-left">
                <h4>SPECIFIC LEARNING OUTCOME: MATOKEO MAHSUSI YA KUJIFUNZA</h4>
                <p>{previewData.specificOutcome}</p>
              </div>

              <div className="preview-item-left">
                <h4>LEARNING RESOURCES: RASILIMALI ZA KUJIFUNZA</h4>
                <p>{previewData.learningResources}</p>
              </div>

              <div className="preview-item-left">
                <h4>REFERENCES: REJEA</h4>
                <p>{previewData.references}</p>
              </div>
            </div>

            <h4 className="left-align">LESSON DEVELOPMENT (MAENDELEO YA SOMO)</h4>
            <table className="preview-table lesson-development">
              <thead>
                <tr>
                  <th>STEPS<br />HATUA</th>
                  <th>TIME<br />MUDA</th>
                  <th>TEACHING ACTIVITIES<br />VITENDO VYA KUFUNDISHIA</th>
                  <th>LEARNING ACTIVITIES<br />VITENDO VYA KUJIFUNZIA</th>
                  <th>ASSESSMENT<br />TATHMINI</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1. INTRODUCTION<br />UTANGULIZI</td>
                  <td><div className="cell-content">{previewData.introTime}</div></td>
                  <td><div className="cell-content">{previewData.teachingIntro}</div></td>
                  <td><div className="cell-content">{previewData.learningIntro}</div></td>
                  <td><div className="cell-content">{previewData.assessmentIntro}</div></td>
                </tr>
                <tr>
                  <td>2. BUILDING NEW KNOWLEDGE<br />KUJENGA MAARIFA MAPYA NA UJUZI</td>
                  <td><div className="cell-content">{previewData.newTime}</div></td>
                  <td><div className="cell-content">{previewData.teachingNew}</div></td>
                  <td><div className="cell-content">{previewData.learningNew}</div></td>
                  <td><div className="cell-content">{previewData.assessmentNew}</div></td>
                </tr>
              </tbody>
            </table>

            <div className="preview-content-left">
              <div className="preview-item-left">
                <h4>TEACHER'S EVALUATION: TATHMINI YA MWALIMU</h4>
                <p className={!previewData.teacherEvaluation ? 'empty-field' : ''}>
                  {previewData.teacherEvaluation || '(To be filled by teacher after lesson)'}
                </p>
              </div>

              <div className="preview-item-left">
                <h4>PUPIL'S WORK: KAZI YA MWANAFUNZI</h4>
                <p>{previewData.pupilWork || 'Not specified'}</p>
              </div>

              <div className="preview-item-left">
                <h4>REMARKS: MAELEZO</h4>
                <p className={!previewData.remarks ? 'empty-field' : ''}>
                  {previewData.remarks || '(To be filled by teacher)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ZanzibarLessonForm;
