import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  BookOpen, Calendar, Trash2, Eye, Download, Search, Filter,
  Printer, X, FileText, Mic, Upload, File
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MyFiles = () => {
  const [files, setFiles] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [notes, setNotes] = useState([]);
  const [dictations, setDictations] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    fetchAllFiles();
  }, []);

  const fetchAllFiles = async () => {
    try {
      // Fetch lessons
      const lessonsRes = await axios.get(`${API_URL}/api/lessons`, { withCredentials: true });
      setLessons(lessonsRes.data.lessons || []);
      
      // Fetch notes
      const notesRes = await axios.get(`${API_URL}/api/notes`, { withCredentials: true });
      setNotes(notesRes.data.notes || []);
      
      // Fetch dictations
      const dictationsRes = await axios.get(`${API_URL}/api/dictations`, { withCredentials: true });
      setDictations(dictationsRes.data.dictations || []);
      
      // Fetch uploads
      const uploadsRes = await axios.get(`${API_URL}/api/uploads`, { withCredentials: true });
      setUploads(uploadsRes.data.uploads || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson plan?')) return;
    try {
      await axios.delete(`${API_URL}/api/lessons/${lessonId}`, { withCredentials: true });
      setLessons(lessons.filter(l => l.lesson_id !== lessonId));
      if (selectedLesson?.lesson_id === lessonId) setSelectedLesson(null);
    } catch (error) {
      console.error('Error deleting lesson:', error);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    const content = printContent.innerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Lesson Plan - ${selectedLesson?.topic}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.4; padding: 15px; color: #000; }
            h1 { font-size: 16pt; text-align: center; margin-bottom: 10px; text-transform: uppercase; }
            h2 { font-size: 13pt; margin: 15px 0 8px; border-bottom: 1px solid #000; padding-bottom: 3px; }
            h3 { font-size: 11pt; margin: 12px 0 5px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 8px 0; page-break-inside: avoid; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top; font-size: 10pt; }
            th { background-color: #e0e0e0; font-weight: bold; text-align: center; }
            .header-table { margin-bottom: 15px; }
            .header-table td { border: none; padding: 3px 10px 3px 0; }
            .header-table .label { font-weight: bold; width: 120px; }
            .section { margin: 10px 0; page-break-inside: avoid; }
            .section-title { font-weight: bold; background: #f0f0f0; padding: 5px 8px; border: 1px solid #ccc; margin-bottom: 0; }
            .section-content { padding: 8px; border: 1px solid #ccc; border-top: none; min-height: 30px; }
            .empty-field { color: #666; font-style: italic; }
            .enrollment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
            @media print { body { padding: 0; } .no-print { display: none !important; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); printWindow.close(); };
  };

  const handleDownload = () => {
    if (!selectedLesson) return;
    const content = generateTextContent(selectedLesson);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedLesson.subject}_${selectedLesson.topic}_lesson_plan.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateTextContent = (lesson) => {
    const formData = lesson.form_data || {};
    let text = `${'='.repeat(70)}\n`;
    text += `                         LESSON PLAN\n`;
    text += `${'='.repeat(70)}\n\n`;
    
    text += `SYLLABUS: ${lesson.syllabus}\n`;
    text += `SUBJECT: ${lesson.subject}\n`;
    text += `GRADE/CLASS: ${lesson.grade}\n`;
    text += `TOPIC: ${lesson.topic}\n`;
    text += `DATE CREATED: ${new Date(lesson.created_at).toLocaleDateString()}\n\n`;
    
    text += `${'─'.repeat(70)}\n`;
    text += `LESSON PLAN (ANDALIO LA SOMO)\n`;
    text += `${'─'.repeat(70)}\n\n`;
    
    text += `DAY & DATE: ${formData.dayDate || '_____________'}\n`;
    text += `SESSION: ${formData.session || '_____________'}\n`;
    text += `CLASS: ${formData.class || '_____________'}\n`;
    text += `PERIODS: ${formData.periods || '_____________'}\n`;
    text += `TIME: ${formData.time || '_____________'} minutes\n\n`;
    
    text += `ENROLLMENT & ATTENDANCE:\n`;
    text += `  Enrolled Girls: ${formData.enrolledGirls || '___'}  Present Girls: ${formData.presentGirls || '___'}\n`;
    text += `  Enrolled Boys:  ${formData.enrolledBoys || '___'}  Present Boys:  ${formData.presentBoys || '___'}\n`;
    text += `  Total Enrolled: ${(+formData.enrolledGirls || 0) + (+formData.enrolledBoys || 0)}\n`;
    text += `  Total Present:  ${(+formData.presentGirls || 0) + (+formData.presentBoys || 0)}\n\n`;
    
    text += `${'─'.repeat(70)}\n\n`;
    
    const content = lesson.content;
    
    if (lesson.syllabus === 'Zanzibar') {
      text += `GENERAL LEARNING OUTCOME (MATOKEO YA JUMLA YA KUJIFUNZA):\n${content.generalOutcome || 'N/A'}\n\n`;
      text += `MAIN TOPIC (MADA KUU): ${content.mainTopic || 'N/A'}\n\n`;
      text += `SUB TOPIC (MADA NDOGO): ${content.subTopic || 'N/A'}\n\n`;
      text += `SPECIFIC LEARNING OUTCOME (MATOKEO MAHSUSI YA KUJIFUNZA):\n${content.specificOutcome || 'N/A'}\n\n`;
      text += `LEARNING RESOURCES (RASILIMALI ZA KUJIFUNZA):\n${content.learningResources || 'N/A'}\n\n`;
      text += `REFERENCES (REJEA):\n${content.references || 'N/A'}\n\n`;
      
      text += `${'─'.repeat(70)}\n`;
      text += `LESSON DEVELOPMENT (MAENDELEO YA SOMO)\n`;
      text += `${'─'.repeat(70)}\n\n`;
      
      if (content.introductionActivities) {
        text += `1. INTRODUCTION (UTANGULIZI) - ${content.introductionActivities.time || 'N/A'}\n`;
        text += `   Teaching: ${content.introductionActivities.teachingActivities || 'N/A'}\n`;
        text += `   Learning: ${content.introductionActivities.learningActivities || 'N/A'}\n`;
        text += `   Assessment: ${content.introductionActivities.assessment || 'N/A'}\n\n`;
      }
      
      if (content.newKnowledgeActivities) {
        text += `2. BUILDING NEW KNOWLEDGE (KUJENGA MAARIFA MAPYA) - ${content.newKnowledgeActivities.time || 'N/A'}\n`;
        text += `   Teaching: ${content.newKnowledgeActivities.teachingActivities || 'N/A'}\n`;
        text += `   Learning: ${content.newKnowledgeActivities.learningActivities || 'N/A'}\n`;
        text += `   Assessment: ${content.newKnowledgeActivities.assessment || 'N/A'}\n\n`;
      }
      
      text += `${'─'.repeat(70)}\n\n`;
      text += `TEACHER'S EVALUATION (TATHMINI YA MWALIMU):\n${content.teacherEvaluation || '(To be filled by teacher)'}\n\n`;
      text += `PUPIL'S WORK (KAZI YA MWANAFUNZI):\n${content.pupilWork || 'N/A'}\n\n`;
      text += `REMARKS (MAELEZO):\n${content.remarks || '(To be filled by teacher)'}\n`;
    } else {
      // Tanzania Mainland format
      text += `MAIN COMPETENCE (UMAHIRI MKUU):\n${content.mainCompetence || 'N/A'}\n\n`;
      text += `SPECIFIC COMPETENCE (UMAHIRI MAHUSUSI):\n${content.specificCompetence || 'N/A'}\n\n`;
      text += `MAIN ACTIVITY (SHUGHULI KUU): ${content.mainActivity || 'N/A'}\n\n`;
      text += `SPECIFIC ACTIVITY (SHUGHULI MAHUSUSI): ${content.specificActivity || 'N/A'}\n\n`;
      text += `TEACHING RESOURCES (RASILIMALI ZA KUFUNDISHIA):\n${content.teachingResources || 'N/A'}\n\n`;
      text += `REFERENCES (REJEA):\n${content.references || 'N/A'}\n\n`;
      
      if (content.stages) {
        text += `${'─'.repeat(70)}\n`;
        text += `TEACHING AND LEARNING PROCESS\n`;
        text += `${'─'.repeat(70)}\n\n`;
        
        const stageNames = {
          introduction: '1. INTRODUCTION',
          competenceDevelopment: '2. COMPETENCE DEVELOPMENT',
          design: '3. DESIGN',
          realisation: '4. REALISATION'
        };
        
        Object.entries(content.stages).forEach(([stage, data]) => {
          text += `${stageNames[stage] || stage.toUpperCase()} - ${data.time || 'N/A'}\n`;
          text += `   Teaching: ${data.teachingActivities || 'N/A'}\n`;
          text += `   Learning: ${data.learningActivities || 'N/A'}\n`;
          text += `   Assessment: ${data.assessment || 'N/A'}\n\n`;
        });
      }
      
      text += `REMARKS (MAELEZO):\n${content.remarks || '(To be filled by teacher)'}\n`;
    }
    
    text += `\n${'='.repeat(70)}\n`;
    text += `Generated by MiLesson Plan\n`;
    
    return text;
  };

  // Render Zanzibar lesson with full header
  const renderZanzibarLesson = (lesson) => {
    const content = lesson.content;
    const formData = lesson.form_data || {};
    const totalEnrolled = (+formData.enrolledGirls || 0) + (+formData.enrolledBoys || 0);
    const totalPresent = (+formData.presentGirls || 0) + (+formData.presentBoys || 0);

    return (
      <div ref={printRef}>
        <h1 style={{textAlign: 'center', fontSize: '18pt', marginBottom: '15px', borderBottom: '2px solid #000', paddingBottom: '10px'}}>
          {lesson.syllabus.toUpperCase()} LESSON PLAN
        </h1>
        
        {/* Basic Info Table */}
        <table className="header-table" style={{width: '100%', marginBottom: '15px'}}>
          <tbody>
            <tr>
              <td style={{fontWeight: 'bold', width: '100px'}}>Subject:</td>
              <td style={{textTransform: 'capitalize'}}>{lesson.subject}</td>
              <td style={{fontWeight: 'bold', width: '100px'}}>Grade/Class:</td>
              <td>{lesson.grade}</td>
            </tr>
            <tr>
              <td style={{fontWeight: 'bold'}}>Topic:</td>
              <td colSpan="3">{lesson.topic}</td>
            </tr>
          </tbody>
        </table>

        <h2 style={{fontSize: '13pt', margin: '15px 0 10px', borderBottom: '1px solid #333'}}>
          LESSON PLAN (ANDALIO LA SOMO)
        </h2>

        {/* Student Info Table */}
        <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '15px'}}>
          <thead>
            <tr>
              <th style={{border: '1px solid #000', padding: '8px', background: '#e0e0e0', fontSize: '10pt'}}>
                DAY & DATE<br/><span style={{fontSize: '9pt'}}>SIKU & TAREHE</span>
              </th>
              <th style={{border: '1px solid #000', padding: '8px', background: '#e0e0e0', fontSize: '10pt'}}>
                SESSION<br/><span style={{fontSize: '9pt'}}>MKONDO</span>
              </th>
              <th style={{border: '1px solid #000', padding: '8px', background: '#e0e0e0', fontSize: '10pt'}}>
                CLASS<br/><span style={{fontSize: '9pt'}}>DARASA</span>
              </th>
              <th style={{border: '1px solid #000', padding: '8px', background: '#e0e0e0', fontSize: '10pt'}}>
                PERIODS<br/><span style={{fontSize: '9pt'}}>VIPINDI</span>
              </th>
              <th style={{border: '1px solid #000', padding: '8px', background: '#e0e0e0', fontSize: '10pt'}}>
                TIME<br/><span style={{fontSize: '9pt'}}>MUDA</span>
              </th>
              <th style={{border: '1px solid #000', padding: '8px', background: '#e0e0e0', fontSize: '10pt'}}>
                ENROLLED / PRESENT<br/><span style={{fontSize: '9pt'}}>WALIOANDIKISHWA / WALIOHUDHURIA</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{border: '1px solid #000', padding: '8px', textAlign: 'center'}}>{formData.dayDate || '___/___/______'}</td>
              <td style={{border: '1px solid #000', padding: '8px', textAlign: 'center'}}>{formData.session || '________'}</td>
              <td style={{border: '1px solid #000', padding: '8px', textAlign: 'center'}}>{formData.class || '________'}</td>
              <td style={{border: '1px solid #000', padding: '8px', textAlign: 'center'}}>{formData.periods || '___'}</td>
              <td style={{border: '1px solid #000', padding: '8px', textAlign: 'center'}}>{formData.time || '___'} min</td>
              <td style={{border: '1px solid #000', padding: '8px', fontSize: '9pt'}}>
                <div>Girls: {formData.enrolledGirls || '___'} / {formData.presentGirls || '___'}</div>
                <div>Boys: {formData.enrolledBoys || '___'} / {formData.presentBoys || '___'}</div>
                <div style={{fontWeight: 'bold', marginTop: '5px'}}>Total: {totalEnrolled} / {totalPresent}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Content Sections */}
        <div className="section">
          <div className="section-title" style={{background: '#34495e', color: 'white', padding: '6px 10px', fontWeight: 'bold'}}>
            GENERAL LEARNING OUTCOME: MATOKEO YA JUMLA YA KUJIFUNZA
          </div>
          <div className="section-content" style={{padding: '10px', border: '1px solid #ccc', borderTop: 'none', minHeight: '40px'}}>
            {content.generalOutcome || <span className="empty-field">Not specified</span>}
          </div>
        </div>

        <div className="section">
          <div className="section-title" style={{background: '#34495e', color: 'white', padding: '6px 10px', fontWeight: 'bold'}}>
            MAIN TOPIC: MADA KUU
          </div>
          <div className="section-content" style={{padding: '10px', border: '1px solid #ccc', borderTop: 'none'}}>
            {content.mainTopic || <span className="empty-field">Not specified</span>}
          </div>
        </div>

        <div className="section">
          <div className="section-title" style={{background: '#34495e', color: 'white', padding: '6px 10px', fontWeight: 'bold'}}>
            SUB TOPIC: MADA NDOGO
          </div>
          <div className="section-content" style={{padding: '10px', border: '1px solid #ccc', borderTop: 'none'}}>
            {content.subTopic || <span className="empty-field">Not specified</span>}
          </div>
        </div>

        <div className="section">
          <div className="section-title" style={{background: '#34495e', color: 'white', padding: '6px 10px', fontWeight: 'bold'}}>
            SPECIFIC LEARNING OUTCOME: MATOKEO MAHSUSI YA KUJIFUNZA
          </div>
          <div className="section-content" style={{padding: '10px', border: '1px solid #ccc', borderTop: 'none'}}>
            {content.specificOutcome || <span className="empty-field">Not specified</span>}
          </div>
        </div>

        <div className="section">
          <div className="section-title" style={{background: '#34495e', color: 'white', padding: '6px 10px', fontWeight: 'bold'}}>
            LEARNING RESOURCES: RASILIMALI ZA KUJIFUNZA
          </div>
          <div className="section-content" style={{padding: '10px', border: '1px solid #ccc', borderTop: 'none'}}>
            {content.learningResources || <span className="empty-field">Not specified</span>}
          </div>
        </div>

        <div className="section">
          <div className="section-title" style={{background: '#34495e', color: 'white', padding: '6px 10px', fontWeight: 'bold'}}>
            REFERENCES: REJEA
          </div>
          <div className="section-content" style={{padding: '10px', border: '1px solid #ccc', borderTop: 'none'}}>
            {content.references || <span className="empty-field">Not specified</span>}
          </div>
        </div>

        <h3 style={{margin: '20px 0 10px', fontSize: '12pt'}}>LESSON DEVELOPMENT (MAENDELEO YA SOMO)</h3>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr>
              <th style={{border: '1px solid #000', padding: '8px', background: '#34495e', color: 'white', width: '18%', fontSize: '9pt'}}>
                STEPS / HATUA
              </th>
              <th style={{border: '1px solid #000', padding: '8px', background: '#34495e', color: 'white', width: '10%', fontSize: '9pt'}}>
                TIME / MUDA
              </th>
              <th style={{border: '1px solid #000', padding: '8px', background: '#34495e', color: 'white', width: '24%', fontSize: '9pt'}}>
                TEACHING ACTIVITIES<br/>VITENDO VYA KUFUNDISHIA
              </th>
              <th style={{border: '1px solid #000', padding: '8px', background: '#34495e', color: 'white', width: '24%', fontSize: '9pt'}}>
                LEARNING ACTIVITIES<br/>VITENDO VYA KUJIFUNZIA
              </th>
              <th style={{border: '1px solid #000', padding: '8px', background: '#34495e', color: 'white', width: '24%', fontSize: '9pt'}}>
                ASSESSMENT / TATHMINI
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{border: '1px solid #000', padding: '8px', fontWeight: 'bold', fontSize: '9pt'}}>
                1. INTRODUCTION<br/><span style={{fontWeight: 'normal'}}>UTANGULIZI</span>
              </td>
              <td style={{border: '1px solid #000', padding: '8px', fontSize: '9pt'}}>{content.introductionActivities?.time || '-'}</td>
              <td style={{border: '1px solid #000', padding: '8px', fontSize: '9pt'}}>{content.introductionActivities?.teachingActivities || '-'}</td>
              <td style={{border: '1px solid #000', padding: '8px', fontSize: '9pt'}}>{content.introductionActivities?.learningActivities || '-'}</td>
              <td style={{border: '1px solid #000', padding: '8px', fontSize: '9pt'}}>{content.introductionActivities?.assessment || '-'}</td>
            </tr>
            <tr>
              <td style={{border: '1px solid #000', padding: '8px', fontWeight: 'bold', fontSize: '9pt'}}>
                2. BUILDING NEW KNOWLEDGE<br/><span style={{fontWeight: 'normal'}}>KUJENGA MAARIFA MAPYA NA UJUZI</span>
              </td>
              <td style={{border: '1px solid #000', padding: '8px', fontSize: '9pt'}}>{content.newKnowledgeActivities?.time || '-'}</td>
              <td style={{border: '1px solid #000', padding: '8px', fontSize: '9pt'}}>{content.newKnowledgeActivities?.teachingActivities || '-'}</td>
              <td style={{border: '1px solid #000', padding: '8px', fontSize: '9pt'}}>{content.newKnowledgeActivities?.learningActivities || '-'}</td>
              <td style={{border: '1px solid #000', padding: '8px', fontSize: '9pt'}}>{content.newKnowledgeActivities?.assessment || '-'}</td>
            </tr>
          </tbody>
        </table>

        <div className="section" style={{marginTop: '15px'}}>
          <div className="section-title" style={{background: '#34495e', color: 'white', padding: '6px 10px', fontWeight: 'bold'}}>
            TEACHER'S EVALUATION: TATHMINI YA MWALIMU
          </div>
          <div className="section-content" style={{padding: '10px', border: '1px solid #ccc', borderTop: 'none', minHeight: '50px'}}>
            {content.teacherEvaluation || <span style={{color: '#888', fontStyle: 'italic'}}>(To be filled by teacher after lesson)</span>}
          </div>
        </div>

        <div className="section">
          <div className="section-title" style={{background: '#34495e', color: 'white', padding: '6px 10px', fontWeight: 'bold'}}>
            PUPIL'S WORK: KAZI YA MWANAFUNZI
          </div>
          <div className="section-content" style={{padding: '10px', border: '1px solid #ccc', borderTop: 'none'}}>
            {content.pupilWork || <span className="empty-field">Not specified</span>}
          </div>
        </div>

        <div className="section">
          <div className="section-title" style={{background: '#34495e', color: 'white', padding: '6px 10px', fontWeight: 'bold'}}>
            REMARKS: MAELEZO
          </div>
          <div className="section-content" style={{padding: '10px', border: '1px solid #ccc', borderTop: 'none', minHeight: '50px'}}>
            {content.remarks || <span style={{color: '#888', fontStyle: 'italic'}}>(To be filled by teacher)</span>}
          </div>
        </div>
      </div>
    );
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lesson.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || filterType === 'lessons';
    return matchesSearch && matchesType;
  });

  const allFiles = [
    ...lessons.map(l => ({ ...l, fileType: 'lesson', icon: BookOpen })),
    ...notes.map(n => ({ ...n, fileType: 'note', icon: FileText })),
    ...dictations.map(d => ({ ...d, fileType: 'dictation', icon: Mic })),
    ...uploads.map(u => ({ ...u, fileType: 'upload', icon: Upload })),
  ].filter(file => {
    const matchesSearch = (file.topic || file.title || file.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || file.fileType === filterType.replace('s', '');
    return matchesSearch && matchesType;
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-[#1A2E16] mb-1">My Files</h2>
        <p className="text-[#7A8A76]">All your saved lesson plans, notes, and dictations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-4">
          <p className="text-2xl font-bold text-[#1A2E16]">{lessons.length}</p>
          <p className="text-sm text-[#7A8A76]">Lesson Plans</p>
        </div>
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-4">
          <p className="text-2xl font-bold text-[#1A2E16]">{notes.length}</p>
          <p className="text-sm text-[#7A8A76]">Notes</p>
        </div>
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-4">
          <p className="text-2xl font-bold text-[#1A2E16]">{dictations.length}</p>
          <p className="text-sm text-[#7A8A76]">Dictations</p>
        </div>
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-4">
          <p className="text-2xl font-bold text-[#1A2E16]">{uploads.length}</p>
          <p className="text-sm text-[#7A8A76]">Uploads</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A8A76]" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#E4DFD5] rounded-lg pl-10 pr-4 py-2.5 text-[#1A2E16] focus:border-[#2D5A27]"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white border border-[#E4DFD5] rounded-lg px-4 py-2.5 text-[#1A2E16]"
        >
          <option value="all">All Files</option>
          <option value="lessons">Lesson Plans</option>
          <option value="notes">Notes</option>
          <option value="dictations">Dictations</option>
          <option value="uploads">Uploads</option>
        </select>
      </div>

      {/* Files Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#2D5A27] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-12 text-center">
          <FolderOpen className="w-12 h-12 text-[#8E9E82] mx-auto mb-4" />
          <h3 className="font-heading text-xl font-semibold text-[#1A2E16] mb-2">No files yet</h3>
          <p className="text-[#7A8A76]">Your saved files will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLessons.map((lesson) => (
            <div key={lesson.lesson_id} className="bg-white border border-[#E4DFD5] rounded-xl p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  lesson.syllabus === 'Zanzibar' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {lesson.syllabus}
                </span>
                <button onClick={() => handleDeleteLesson(lesson.lesson_id)} className="text-[#7A8A76] hover:text-[#D95D39]">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-heading font-semibold text-[#1A2E16] mb-2 line-clamp-2">{lesson.topic}</h3>
              <div className="flex items-center gap-4 text-sm text-[#7A8A76] mb-4">
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{lesson.subject}</span>
                <span>{lesson.grade}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#E4DFD5]">
                <span className="text-xs text-[#7A8A76]">{new Date(lesson.created_at).toLocaleDateString()}</span>
                <button onClick={() => setSelectedLesson(lesson)} className="flex items-center gap-1 text-sm text-[#2D5A27] font-medium hover:text-[#21441C]">
                  <Eye className="w-4 h-4" />View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lesson Detail Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[95vh] overflow-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-[#E4DFD5] p-4 flex items-center justify-between z-10">
              <h2 className="font-heading text-xl font-semibold text-[#1A2E16]">{selectedLesson.topic}</h2>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-[#4a5568] text-white rounded-lg hover:bg-[#2d3748]">
                  <Printer className="w-4 h-4" />Print
                </button>
                <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-[#2D5A27] text-white rounded-lg hover:bg-[#21441C]">
                  <Download className="w-4 h-4" />Download
                </button>
                <button onClick={() => setSelectedLesson(null)} className="p-2 text-[#7A8A76] hover:text-[#1A2E16] hover:bg-[#F2EFE8] rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {selectedLesson.syllabus === 'Zanzibar' ? renderZanzibarLesson(selectedLesson) : renderZanzibarLesson(selectedLesson)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFiles;
