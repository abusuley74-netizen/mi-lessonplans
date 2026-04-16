import React, { useState } from 'react';
import api from '../services/api';
import { Loader2, MessageCircle, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import './LessonForm.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Subject is now editable text field - user can type any subject
// Language detection will work based on subject name

const TANZANIA_GRADES = [
  'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5',
  'Standard 6', 'Standard 7', 'Form 1', 'Form 2', 'Form 3', 'Form 4',
  'Form 5', 'Form 6'
];

const TanzaniaMainlandLessonForm = ({ onLessonGenerated }) => {
  const [formData, setFormData] = useState({
    syllabus: 'Tanzania Mainland',
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
    mainCompetence: '',
    specificCompetence: '',
    mainActivity: '',
    specificActivity: '',
    teachingResources: '',
    references: '',
    // Introduction stage
    introTime: '',
    teachingIntro: '',
    learningIntro: '',
    assessmentIntro: '',
    // Competence Development stage
    compTime: '',
    teachingComp: '',
    learningComp: '',
    assessmentComp: '',
    // Design stage
    designTime: '',
    teachingDesign: '',
    learningDesign: '',
    assessmentDesign: '',
    // Realisation stage
    realTime: '',
    teachingReal: '',
    learningReal: '',
    assessmentReal: '',
    remarks: ''
  });

  const [previewData, setPreviewData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingFields, setLoadingFields] = useState({});
  const [error, setError] = useState(null);

  // Binti Hamdani Chat State
  const [showBintiChat, setShowBintiChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'binti', text: 'Hujambo! I am Binti Hamdani, your AI lesson planning assistant. Tell me what kind of lesson plan you need, and I will help you create something amazing! 📚✨' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Calculate totals
  const totalEnrolled = (+formData.enrolledGirls || 0) + (+formData.enrolledBoys || 0);
  const totalPresent = (+formData.presentGirls || 0) + (+formData.presentBoys || 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Check if content fields are empty (AI should generate)
  const shouldUseAI = () => {
    const contentFields = [
      'mainCompetence', 'specificCompetence', 'mainActivity', 'specificActivity',
      'teachingResources', 'references', 'introTime', 'teachingIntro',
      'learningIntro', 'assessmentIntro', 'compTime', 'teachingComp',
      'learningComp', 'assessmentComp', 'designTime', 'teachingDesign',
      'learningDesign', 'assessmentDesign', 'realTime', 'teachingReal',
      'learningReal', 'assessmentReal', 'remarks'
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
      // AI Generation Mode
      setIsGenerating(true);
      setLoadingFields({
        mainCompetence: true,
        specificCompetence: true,
        mainActivity: true,
        specificActivity: true,
        teachingResources: true,
        references: true,
        introTime: true,
        teachingIntro: true,
        learningIntro: true,
        assessmentIntro: true,
        compTime: true,
        teachingComp: true,
        learningComp: true,
        assessmentComp: true,
        designTime: true,
        teachingDesign: true,
        learningDesign: true,
        assessmentDesign: true,
        realTime: true,
        teachingReal: true,
        learningReal: true,
        assessmentReal: true,
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
          { withCredentials: true }
        );

        const aiContent = response.data.content;
        const stages = aiContent.stages || {};
        
        // Map AI response to form fields
        const updatedFormData = {
          ...formData,
          mainCompetence: aiContent.mainCompetence || '',
          specificCompetence: aiContent.specificCompetence || '',
          mainActivity: aiContent.mainActivity || '',
          specificActivity: aiContent.specificActivity || '',
          teachingResources: aiContent.teachingResources || '',
          references: aiContent.references || '',
          introTime: stages.introduction?.time || '10 minutes',
          teachingIntro: stages.introduction?.teachingActivities || '',
          learningIntro: stages.introduction?.learningActivities || '',
          assessmentIntro: stages.introduction?.assessment || '',
          compTime: stages.competenceDevelopment?.time || '20 minutes',
          teachingComp: stages.competenceDevelopment?.teachingActivities || '',
          learningComp: stages.competenceDevelopment?.learningActivities || '',
          assessmentComp: stages.competenceDevelopment?.assessment || '',
          designTime: stages.design?.time || '10 minutes',
          teachingDesign: stages.design?.teachingActivities || '',
          learningDesign: stages.design?.learningActivities || '',
          assessmentDesign: stages.design?.assessment || '',
          realTime: stages.realisation?.time || '10 minutes',
          teachingReal: stages.realisation?.teachingActivities || '',
          learningReal: stages.realisation?.learningActivities || '',
          assessmentReal: stages.realisation?.assessment || '',
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
      // Manual Mode
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
      const response = await api.post('/api/binti-chat', {
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

  // Loading spinner component for fields
  const FieldLoader = () => (
    <div className="field-loader">
      <Loader2 className="animate-spin" size={20} />
    </div>
  );

  return (
    <div className="lesson-plan-container">
      <div className="form-section">
        <form className="lesson-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>Create Tanzania Mainland Lesson Plan</h2>
            
            {/* Binti Hamdani Chat Button */}
            <button
              type="button"
              onClick={() => setShowBintiChat(!showBintiChat)}
              className="binti-chat-btn"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Chat with Binti Hamdani</span>
            </button>
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
                {TANZANIA_GRADES.map(g => (
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

          <h3>LESSON PLAN (MPANGO WA SOMO)</h3>

          {/* Student Info Table */}
          <table className="lesson-table">
            <thead>
              <tr>
                <th>DAY & DATE<br />SIKU & TAREHE</th>
                <th>SESSION<br />KIPINDI</th>
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

          {/* Competence Fields */}
          <div className="open-lines-left">
            <div className="form-group-left">
              <label>MAIN COMPETENCE: UMAHIRI MKUU</label>
              {loadingFields.mainCompetence ? <FieldLoader /> : (
                <textarea name="mainCompetence" value={formData.mainCompetence} onChange={handleChange} className="line-input" rows="3" />
              )}
            </div>
            
            <div className="form-group-left">
              <label>SPECIFIC COMPETENCE: UMAHIRI MAHUSUSI</label>
              {loadingFields.specificCompetence ? <FieldLoader /> : (
                <textarea name="specificCompetence" value={formData.specificCompetence} onChange={handleChange} className="line-input" rows="3" />
              )}
            </div>
            
            <div className="form-group-left">
              <label>MAIN ACTIVITY: SHUGHULI KUU</label>
              {loadingFields.mainActivity ? <FieldLoader /> : (
                <textarea name="mainActivity" value={formData.mainActivity} onChange={handleChange} className="line-input" rows="3" />
              )}
            </div>
            
            <div className="form-group-left">
              <label>SPECIFIC ACTIVITY: SHUGHULI MAHUSUSI</label>
              {loadingFields.specificActivity ? <FieldLoader /> : (
                <textarea name="specificActivity" value={formData.specificActivity} onChange={handleChange} className="line-input" rows="3" />
              )}
            </div>
            
            <div className="form-group-left">
              <label>TEACHING RESOURCES: RASILIMALI ZA KUFUNDISHIA</label>
              {loadingFields.teachingResources ? <FieldLoader /> : (
                <textarea name="teachingResources" value={formData.teachingResources} onChange={handleChange} className="line-input" rows="3" />
              )}
            </div>
            
            <div className="form-group-left">
              <label>REFERENCES: REJEA</label>
              {loadingFields.references ? <FieldLoader /> : (
                <textarea name="references" value={formData.references} onChange={handleChange} className="line-input" rows="3" />
              )}
            </div>
          </div>

          {/* Teaching and Learning Process Table */}
          <h4 className="left-align">TEACHING AND LEARNING PROCESS (MCHAKATO WA KUFUNDISHA NA KUJIFUNZA)</h4>
          <table className="lesson-table teaching-process">
            <thead>
              <tr>
                <th>STAGES<br />HATUA</th>
                <th>TIME<br />MUDA</th>
                <th>TEACHING ACTIVITIES<br />VITENDO VYA KUFUNDISHIA</th>
                <th>LEARNING ACTIVITIES<br />VITENDO VYA KUJIFUNZIA</th>
                <th>ASSESSMENT<br />TATHMINI</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1. INTRODUCTION<br />UTANGULIZI</td>
                <td>{loadingFields.introTime ? <FieldLoader /> : <textarea name="introTime" value={formData.introTime} onChange={handleChange} rows="3" placeholder="Time" />}</td>
                <td>{loadingFields.teachingIntro ? <FieldLoader /> : <textarea name="teachingIntro" value={formData.teachingIntro} onChange={handleChange} rows="3" placeholder="Teaching activities" />}</td>
                <td>{loadingFields.learningIntro ? <FieldLoader /> : <textarea name="learningIntro" value={formData.learningIntro} onChange={handleChange} rows="3" placeholder="Learning activities" />}</td>
                <td>{loadingFields.assessmentIntro ? <FieldLoader /> : <textarea name="assessmentIntro" value={formData.assessmentIntro} onChange={handleChange} rows="3" placeholder="Assessment" />}</td>
              </tr>
              <tr>
                <td>2. COMPETENCE DEVELOPMENT<br />KUJENGA UMAHIRI</td>
                <td>{loadingFields.compTime ? <FieldLoader /> : <textarea name="compTime" value={formData.compTime} onChange={handleChange} rows="3" placeholder="Time" />}</td>
                <td>{loadingFields.teachingComp ? <FieldLoader /> : <textarea name="teachingComp" value={formData.teachingComp} onChange={handleChange} rows="3" placeholder="Teaching activities" />}</td>
                <td>{loadingFields.learningComp ? <FieldLoader /> : <textarea name="learningComp" value={formData.learningComp} onChange={handleChange} rows="3" placeholder="Learning activities" />}</td>
                <td>{loadingFields.assessmentComp ? <FieldLoader /> : <textarea name="assessmentComp" value={formData.assessmentComp} onChange={handleChange} rows="3" placeholder="Assessment" />}</td>
              </tr>
              <tr>
                <td>3. DESIGN<br />KUBUNI</td>
                <td>{loadingFields.designTime ? <FieldLoader /> : <textarea name="designTime" value={formData.designTime} onChange={handleChange} rows="3" placeholder="Time" />}</td>
                <td>{loadingFields.teachingDesign ? <FieldLoader /> : <textarea name="teachingDesign" value={formData.teachingDesign} onChange={handleChange} rows="3" placeholder="Teaching activities" />}</td>
                <td>{loadingFields.learningDesign ? <FieldLoader /> : <textarea name="learningDesign" value={formData.learningDesign} onChange={handleChange} rows="3" placeholder="Learning activities" />}</td>
                <td>{loadingFields.assessmentDesign ? <FieldLoader /> : <textarea name="assessmentDesign" value={formData.assessmentDesign} onChange={handleChange} rows="3" placeholder="Assessment" />}</td>
              </tr>
              <tr>
                <td>4. REALISATION<br />UTEKELEZAJI</td>
                <td>{loadingFields.realTime ? <FieldLoader /> : <textarea name="realTime" value={formData.realTime} onChange={handleChange} rows="3" placeholder="Time" />}</td>
                <td>{loadingFields.teachingReal ? <FieldLoader /> : <textarea name="teachingReal" value={formData.teachingReal} onChange={handleChange} rows="3" placeholder="Teaching activities" />}</td>
                <td>{loadingFields.learningReal ? <FieldLoader /> : <textarea name="learningReal" value={formData.learningReal} onChange={handleChange} rows="3" placeholder="Learning activities" />}</td>
                <td>{loadingFields.assessmentReal ? <FieldLoader /> : <textarea name="assessmentReal" value={formData.assessmentReal} onChange={handleChange} rows="3" placeholder="Assessment" />}</td>
              </tr>
            </tbody>
          </table>

          {/* Remarks Section */}
          <div className="open-lines-left">
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
            <button onClick={handlePrint} className="action-btn print" data-testid="print-btn">Print</button>
            <button onClick={handleDownloadPDF} className="action-btn download" data-testid="download-btn">Download</button>
            <button onClick={handleShare} className="action-btn share" data-testid="share-btn">Share</button>
          </div>
          
          <div id="lesson-plan-preview" className="lesson-preview">
            <h2 className="print-center">LESSON PLAN (MPANGO WA SOMO)</h2>
            
            <div className="preview-header">
              <div><strong>Syllabus:</strong> {previewData.syllabus}</div>
              <div><strong>Subject:</strong> {previewData.subject}</div>
              <div><strong>Grade:</strong> {previewData.grade}</div>
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
                    <strong>Total Present:</strong> {totalPresent} | <strong>Total Enrolled:</strong> {totalEnrolled}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="preview-content-left">
              <div className="preview-item-left">
                <h4>MAIN COMPETENCE: UMAHIRI MKUU</h4>
                <p>{previewData.mainCompetence}</p>
              </div>
              <div className="preview-item-left">
                <h4>SPECIFIC COMPETENCE: UMAHIRI MAHUSUSI</h4>
                <p>{previewData.specificCompetence}</p>
              </div>
              <div className="preview-item-left">
                <h4>MAIN ACTIVITY: SHUGHULI KUU</h4>
                <p>{previewData.mainActivity}</p>
              </div>
              <div className="preview-item-left">
                <h4>SPECIFIC ACTIVITY: SHUGHULI MAHUSUSI</h4>
                <p>{previewData.specificActivity}</p>
              </div>
              <div className="preview-item-left">
                <h4>TEACHING RESOURCES: RASILIMALI ZA KUFUNDISHIA</h4>
                <p>{previewData.teachingResources}</p>
              </div>
              <div className="preview-item-left">
                <h4>REFERENCES: REJEA</h4>
                <p>{previewData.references}</p>
              </div>
            </div>

            <h4 className="left-align">TEACHING AND LEARNING PROCESS</h4>
            <table className="preview-table teaching-process">
              <thead>
                <tr>
                  <th>STAGES</th>
                  <th>TIME</th>
                  <th>TEACHING ACTIVITIES</th>
                  <th>LEARNING ACTIVITIES</th>
                  <th>ASSESSMENT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1. INTRODUCTION</td>
                  <td>{previewData.introTime}</td>
                  <td>{previewData.teachingIntro}</td>
                  <td>{previewData.learningIntro}</td>
                  <td>{previewData.assessmentIntro}</td>
                </tr>
                <tr>
                  <td>2. COMPETENCE DEVELOPMENT</td>
                  <td>{previewData.compTime}</td>
                  <td>{previewData.teachingComp}</td>
                  <td>{previewData.learningComp}</td>
                  <td>{previewData.assessmentComp}</td>
                </tr>
                <tr>
                  <td>3. DESIGN</td>
                  <td>{previewData.designTime}</td>
                  <td>{previewData.teachingDesign}</td>
                  <td>{previewData.learningDesign}</td>
                  <td>{previewData.assessmentDesign}</td>
                </tr>
                <tr>
                  <td>4. REALISATION</td>
                  <td>{previewData.realTime}</td>
                  <td>{previewData.teachingReal}</td>
                  <td>{previewData.learningReal}</td>
                  <td>{previewData.assessmentReal}</td>
                </tr>
              </tbody>
            </table>

            <div className="preview-content-left">
              <div className="preview-item-left">
                <h4>REMARKS: MAELEZO</h4>
                <p>{previewData.remarks}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Binti Hamdani Chat Modal */}
      {showBintiChat && (
        <div className="binti-chat-modal">
          <div className="binti-chat-overlay" onClick={() => setShowBintiChat(false)}></div>
          <div className="binti-chat-container">
            {/* Chat Header */}
            <div className="binti-chat-header">
              <div className="binti-chat-title">
                <Sparkles className="w-5 h-5" />
                <h3>Binti Hamdani</h3>
                <span className="binti-chat-badge">AI Assistant</span>
              </div>
              <button onClick={() => setShowBintiChat(false)} className="binti-chat-close">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="binti-chat-messages">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`binti-chat-message ${msg.role === 'user' ? 'user-message' : 'binti-message'}`}
                >
                  {msg.role === 'binti' && (
                    <div className="binti-name">Binti Hamdani</div>
                  )}
                  <p className="binti-text">{msg.text}</p>
                </div>
              ))}
              {isChatLoading && (
                <div className="binti-chat-message binti-message">
                  <div className="binti-name">Binti Hamdani</div>
                  <div className="binti-typing">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat Input */}
            <div className="binti-chat-input">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBintiChat()}
                placeholder="Ask Binti Hamdani anything about your lesson plan..."
                className="binti-chat-textbox"
              />
              <button
                onClick={handleBintiChat}
                disabled={isChatLoading || !chatInput.trim()}
                className="binti-chat-send"
              >
                Send
              </button>
            </div>
            <div className="binti-chat-hint">
              💡 Ask me: "Focus on group activities" or "Avoid too much writing" or "Make it suitable for Form 6 Arabic"
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TanzaniaMainlandLessonForm;
