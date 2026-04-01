import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Calendar, Trash2, Eye, Search, Filter, Printer, Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MyHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSyllabus, setFilterSyllabus] = useState('all');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/lessons`, {
        withCredentials: true
      });
      setLessons(response.data.lessons || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson plan?')) return;

    try {
      await axios.delete(`${API_URL}/api/lessons/${lessonId}`, {
        withCredentials: true
      });
      setLessons(lessons.filter(l => l.lesson_id !== lessonId));
      if (selectedLesson?.lesson_id === lessonId) {
        setSelectedLesson(null);
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const content = printContent.innerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Lesson Plan - ${selectedLesson?.topic}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Times New Roman', serif; 
              font-size: 12pt; 
              line-height: 1.4;
              padding: 20px;
              color: #000;
            }
            h1, h2 { text-align: center; margin-bottom: 15px; }
            h1 { font-size: 18pt; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; }
            h2 { font-size: 14pt; margin-top: 20px; }
            h3 { font-size: 12pt; margin: 15px 0 8px; text-transform: uppercase; }
            h4 { font-size: 11pt; margin: 10px 0 5px; font-weight: bold; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 10px 0;
              page-break-inside: avoid;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 8px; 
              text-align: left; 
              vertical-align: top;
              font-size: 11pt;
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold;
              text-align: center;
            }
            .header-info { 
              display: flex; 
              justify-content: space-between; 
              flex-wrap: wrap;
              margin-bottom: 15px;
              padding: 10px;
              background: #f9f9f9;
              border: 1px solid #ddd;
            }
            .header-info div { margin: 5px 15px 5px 0; }
            .section { margin: 15px 0; page-break-inside: avoid; }
            .section-title { 
              font-weight: bold; 
              background: #e9e9e9; 
              padding: 5px 10px;
              margin-bottom: 8px;
              border-left: 4px solid #333;
            }
            .section-content { 
              padding: 8px 10px;
              border: 1px solid #ddd;
              min-height: 30px;
              background: #fff;
            }
            .empty-field {
              color: #999;
              font-style: italic;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleDownloadPDF = () => {
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
    let text = `${'='.repeat(60)}\n`;
    text += `                    LESSON PLAN\n`;
    text += `${'='.repeat(60)}\n\n`;
    text += `Syllabus: ${lesson.syllabus}\n`;
    text += `Subject: ${lesson.subject}\n`;
    text += `Grade: ${lesson.grade}\n`;
    text += `Topic: ${lesson.topic}\n`;
    text += `Date: ${new Date(lesson.created_at).toLocaleDateString()}\n\n`;
    text += `${'-'.repeat(60)}\n\n`;
    
    const content = lesson.content;
    
    if (lesson.syllabus === 'Zanzibar') {
      text += `GENERAL LEARNING OUTCOME (MATOKEO YA JUMLA YA KUJIFUNZA):\n${content.generalOutcome || 'N/A'}\n\n`;
      text += `MAIN TOPIC (MADA KUU):\n${content.mainTopic || 'N/A'}\n\n`;
      text += `SUB TOPIC (MADA NDOGO):\n${content.subTopic || 'N/A'}\n\n`;
      text += `SPECIFIC LEARNING OUTCOME (MATOKEO MAHSUSI YA KUJIFUNZA):\n${content.specificOutcome || 'N/A'}\n\n`;
      text += `LEARNING RESOURCES (RASILIMALI ZA KUJIFUNZA):\n${content.learningResources || 'N/A'}\n\n`;
      text += `REFERENCES (REJEA):\n${content.references || 'N/A'}\n\n`;
      
      text += `${'-'.repeat(60)}\n`;
      text += `LESSON DEVELOPMENT (MAENDELEO YA SOMO)\n`;
      text += `${'-'.repeat(60)}\n\n`;
      
      if (content.introductionActivities) {
        text += `1. INTRODUCTION (UTANGULIZI) - ${content.introductionActivities.time || 'N/A'}\n`;
        text += `   Teaching Activities: ${content.introductionActivities.teachingActivities || 'N/A'}\n`;
        text += `   Learning Activities: ${content.introductionActivities.learningActivities || 'N/A'}\n`;
        text += `   Assessment: ${content.introductionActivities.assessment || 'N/A'}\n\n`;
      }
      
      if (content.newKnowledgeActivities) {
        text += `2. BUILDING NEW KNOWLEDGE (KUJENGA MAARIFA MAPYA) - ${content.newKnowledgeActivities.time || 'N/A'}\n`;
        text += `   Teaching Activities: ${content.newKnowledgeActivities.teachingActivities || 'N/A'}\n`;
        text += `   Learning Activities: ${content.newKnowledgeActivities.learningActivities || 'N/A'}\n`;
        text += `   Assessment: ${content.newKnowledgeActivities.assessment || 'N/A'}\n\n`;
      }
      
      text += `${'-'.repeat(60)}\n\n`;
      text += `TEACHER'S EVALUATION (TATHMINI YA MWALIMU):\n${content.teacherEvaluation || '(To be filled by teacher)'}\n\n`;
      text += `PUPIL'S WORK (KAZI YA MWANAFUNZI):\n${content.pupilWork || 'N/A'}\n\n`;
      text += `REMARKS (MAELEZO):\n${content.remarks || '(To be filled by teacher)'}\n`;
    } else {
      text += `MAIN COMPETENCE (UMAHIRI MKUU):\n${content.mainCompetence || 'N/A'}\n\n`;
      text += `SPECIFIC COMPETENCE (UMAHIRI MAHUSUSI):\n${content.specificCompetence || 'N/A'}\n\n`;
      text += `MAIN ACTIVITY (SHUGHULI KUU):\n${content.mainActivity || 'N/A'}\n\n`;
      text += `SPECIFIC ACTIVITY (SHUGHULI MAHUSUSI):\n${content.specificActivity || 'N/A'}\n\n`;
      text += `TEACHING RESOURCES (RASILIMALI ZA KUFUNDISHIA):\n${content.teachingResources || 'N/A'}\n\n`;
      text += `REFERENCES (REJEA):\n${content.references || 'N/A'}\n\n`;
      
      if (content.stages) {
        text += `${'-'.repeat(60)}\n`;
        text += `TEACHING AND LEARNING PROCESS\n`;
        text += `${'-'.repeat(60)}\n\n`;
        
        const stageNames = {
          introduction: '1. INTRODUCTION (UTANGULIZI)',
          competenceDevelopment: '2. COMPETENCE DEVELOPMENT (KUJENGA UMAHIRI)',
          design: '3. DESIGN (KUBUNI)',
          realisation: '4. REALISATION (UTEKELEZAJI)'
        };
        
        Object.entries(content.stages).forEach(([stage, data]) => {
          text += `${stageNames[stage] || stage.toUpperCase()} - ${data.time || 'N/A'}\n`;
          text += `   Teaching Activities: ${data.teachingActivities || 'N/A'}\n`;
          text += `   Learning Activities: ${data.learningActivities || 'N/A'}\n`;
          text += `   Assessment: ${data.assessment || 'N/A'}\n\n`;
        });
      }
      
      text += `${'-'.repeat(60)}\n\n`;
      text += `REMARKS (MAELEZO):\n${content.remarks || '(To be filled by teacher)'}\n`;
    }
    
    text += `\n${'='.repeat(60)}\n`;
    text += `Generated by MiLesson Plan\n`;
    
    return text;
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lesson.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSyllabus = filterSyllabus === 'all' || lesson.syllabus === filterSyllabus;
    return matchesSearch && matchesSyllabus;
  });

  const isSubscribed = user?.subscription_status === 'active';

  // Render Zanzibar lesson content
  const renderZanzibarContent = (lesson) => {
    const content = lesson.content;
    return (
      <div ref={printRef}>
        <h1>LESSON PLAN</h1>
        
        <div className="header-info">
          <div><strong>Syllabus:</strong> {lesson.syllabus}</div>
          <div><strong>Subject:</strong> {lesson.subject}</div>
          <div><strong>Grade:</strong> {lesson.grade}</div>
          <div><strong>Topic:</strong> {lesson.topic}</div>
          <div><strong>Date:</strong> {new Date(lesson.created_at).toLocaleDateString()}</div>
        </div>

        <div className="section">
          <div className="section-title">GENERAL LEARNING OUTCOME: MATOKEO YA JUMLA YA KUJIFUNZA</div>
          <div className="section-content">{content.generalOutcome || <span className="empty-field">Not specified</span>}</div>
        </div>

        <div className="section">
          <div className="section-title">MAIN TOPIC: MADA KUU</div>
          <div className="section-content">{content.mainTopic || <span className="empty-field">Not specified</span>}</div>
        </div>

        <div className="section">
          <div className="section-title">SUB TOPIC: MADA NDOGO</div>
          <div className="section-content">{content.subTopic || <span className="empty-field">Not specified</span>}</div>
        </div>

        <div className="section">
          <div className="section-title">SPECIFIC LEARNING OUTCOME: MATOKEO MAHSUSI YA KUJIFUNZA</div>
          <div className="section-content">{content.specificOutcome || <span className="empty-field">Not specified</span>}</div>
        </div>

        <div className="section">
          <div className="section-title">LEARNING RESOURCES: RASILIMALI ZA KUJIFUNZA</div>
          <div className="section-content">{content.learningResources || <span className="empty-field">Not specified</span>}</div>
        </div>

        <div className="section">
          <div className="section-title">REFERENCES: REJEA</div>
          <div className="section-content">{content.references || <span className="empty-field">Not specified</span>}</div>
        </div>

        <h3>LESSON DEVELOPMENT (MAENDELEO YA SOMO)</h3>
        <table>
          <thead>
            <tr>
              <th style={{width: '20%'}}>STEPS / HATUA</th>
              <th style={{width: '10%'}}>TIME / MUDA</th>
              <th style={{width: '25%'}}>TEACHING ACTIVITIES / VITENDO VYA KUFUNDISHIA</th>
              <th style={{width: '25%'}}>LEARNING ACTIVITIES / VITENDO VYA KUJIFUNZIA</th>
              <th style={{width: '20%'}}>ASSESSMENT / TATHMINI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>1. INTRODUCTION</strong><br/>UTANGULIZI</td>
              <td>{content.introductionActivities?.time || '-'}</td>
              <td>{content.introductionActivities?.teachingActivities || '-'}</td>
              <td>{content.introductionActivities?.learningActivities || '-'}</td>
              <td>{content.introductionActivities?.assessment || '-'}</td>
            </tr>
            <tr>
              <td><strong>2. BUILDING NEW KNOWLEDGE</strong><br/>KUJENGA MAARIFA MAPYA NA UJUZI</td>
              <td>{content.newKnowledgeActivities?.time || '-'}</td>
              <td>{content.newKnowledgeActivities?.teachingActivities || '-'}</td>
              <td>{content.newKnowledgeActivities?.learningActivities || '-'}</td>
              <td>{content.newKnowledgeActivities?.assessment || '-'}</td>
            </tr>
          </tbody>
        </table>

        <div className="section">
          <div className="section-title">TEACHER'S EVALUATION: TATHMINI YA MWALIMU</div>
          <div className="section-content">
            {content.teacherEvaluation || <span className="empty-field">(To be filled by teacher after lesson)</span>}
          </div>
        </div>

        <div className="section">
          <div className="section-title">PUPIL'S WORK: KAZI YA MWANAFUNZI</div>
          <div className="section-content">{content.pupilWork || <span className="empty-field">Not specified</span>}</div>
        </div>

        <div className="section">
          <div className="section-title">REMARKS: MAELEZO</div>
          <div className="section-content">
            {content.remarks || <span className="empty-field">(To be filled by teacher)</span>}
          </div>
        </div>
      </div>
    );
  };

  // Render Tanzania Mainland lesson content
  const renderTanzaniaContent = (lesson) => {
    const content = lesson.content;
    const stages = content.stages || {};
    return (
      <div ref={printRef}>
        <h1>LESSON PLAN (MPANGO WA SOMO)</h1>
        
        <div className="header-info">
          <div><strong>Syllabus:</strong> {lesson.syllabus}</div>
          <div><strong>Subject:</strong> {lesson.subject}</div>
          <div><strong>Grade:</strong> {lesson.grade}</div>
          <div><strong>Topic:</strong> {lesson.topic}</div>
          <div><strong>Date:</strong> {new Date(lesson.created_at).toLocaleDateString()}</div>
        </div>

        <div className="section">
          <div className="section-title">MAIN COMPETENCE: UMAHIRI MKUU</div>
          <div className="section-content">{content.mainCompetence || <span className="empty-field">Not specified</span>}</div>
        </div>

        <div className="section">
          <div className="section-title">SPECIFIC COMPETENCE: UMAHIRI MAHUSUSI</div>
          <div className="section-content">{content.specificCompetence || <span className="empty-field">Not specified</span>}</div>
        </div>

        <div className="section">
          <div className="section-title">MAIN ACTIVITY: SHUGHULI KUU</div>
          <div className="section-content">{content.mainActivity || <span className="empty-field">Not specified</span>}</div>
        </div>

        <div className="section">
          <div className="section-title">SPECIFIC ACTIVITY: SHUGHULI MAHUSUSI</div>
          <div className="section-content">{content.specificActivity || <span className="empty-field">Not specified</span>}</div>
        </div>

        <div className="section">
          <div className="section-title">TEACHING RESOURCES: RASILIMALI ZA KUFUNDISHIA</div>
          <div className="section-content">{content.teachingResources || <span className="empty-field">Not specified</span>}</div>
        </div>

        <div className="section">
          <div className="section-title">REFERENCES: REJEA</div>
          <div className="section-content">{content.references || <span className="empty-field">Not specified</span>}</div>
        </div>

        <h3>TEACHING AND LEARNING PROCESS (MCHAKATO WA KUFUNDISHA NA KUJIFUNZA)</h3>
        <table>
          <thead>
            <tr>
              <th style={{width: '18%'}}>STAGES / HATUA</th>
              <th style={{width: '10%'}}>TIME / MUDA</th>
              <th style={{width: '25%'}}>TEACHING ACTIVITIES</th>
              <th style={{width: '25%'}}>LEARNING ACTIVITIES</th>
              <th style={{width: '22%'}}>ASSESSMENT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>1. INTRODUCTION</strong><br/>UTANGULIZI</td>
              <td>{stages.introduction?.time || '-'}</td>
              <td>{stages.introduction?.teachingActivities || '-'}</td>
              <td>{stages.introduction?.learningActivities || '-'}</td>
              <td>{stages.introduction?.assessment || '-'}</td>
            </tr>
            <tr>
              <td><strong>2. COMPETENCE DEVELOPMENT</strong><br/>KUJENGA UMAHIRI</td>
              <td>{stages.competenceDevelopment?.time || '-'}</td>
              <td>{stages.competenceDevelopment?.teachingActivities || '-'}</td>
              <td>{stages.competenceDevelopment?.learningActivities || '-'}</td>
              <td>{stages.competenceDevelopment?.assessment || '-'}</td>
            </tr>
            <tr>
              <td><strong>3. DESIGN</strong><br/>KUBUNI</td>
              <td>{stages.design?.time || '-'}</td>
              <td>{stages.design?.teachingActivities || '-'}</td>
              <td>{stages.design?.learningActivities || '-'}</td>
              <td>{stages.design?.assessment || '-'}</td>
            </tr>
            <tr>
              <td><strong>4. REALISATION</strong><br/>UTEKELEZAJI</td>
              <td>{stages.realisation?.time || '-'}</td>
              <td>{stages.realisation?.teachingActivities || '-'}</td>
              <td>{stages.realisation?.learningActivities || '-'}</td>
              <td>{stages.realisation?.assessment || '-'}</td>
            </tr>
          </tbody>
        </table>

        <div className="section">
          <div className="section-title">REMARKS: MAELEZO</div>
          <div className="section-content">
            {content.remarks || <span className="empty-field">(To be filled by teacher)</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#1A2E16] mb-2">
            MyHub
          </h1>
          <p className="text-[#4A5B46] text-lg">
            View and manage all your saved lesson plans
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#E4DFD5] rounded-xl p-4">
            <p className="text-2xl font-bold text-[#1A2E16]">{lessons.length}</p>
            <p className="text-sm text-[#7A8A76]">Total Lessons</p>
          </div>
          <div className="bg-white border border-[#E4DFD5] rounded-xl p-4">
            <p className="text-2xl font-bold text-[#1A2E16]">
              {lessons.filter(l => l.syllabus === 'Zanzibar').length}
            </p>
            <p className="text-sm text-[#7A8A76]">Zanzibar</p>
          </div>
          <div className="bg-white border border-[#E4DFD5] rounded-xl p-4">
            <p className="text-2xl font-bold text-[#1A2E16]">
              {lessons.filter(l => l.syllabus === 'Tanzania Mainland').length}
            </p>
            <p className="text-sm text-[#7A8A76]">Tanzania Mainland</p>
          </div>
          <div className="bg-white border border-[#E4DFD5] rounded-xl p-4">
            <p className="text-2xl font-bold text-[#1A2E16]">
              {isSubscribed ? 'Unlimited' : `${Math.max(0, 3 - lessons.length)} left`}
            </p>
            <p className="text-sm text-[#7A8A76]">{isSubscribed ? 'Pro Plan' : 'Free Plan'}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A8A76]" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#E4DFD5] rounded-lg pl-10 pr-4 py-2.5 text-[#1A2E16] focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27]"
              data-testid="search-lessons"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#7A8A76]" />
            <select
              value={filterSyllabus}
              onChange={(e) => setFilterSyllabus(e.target.value)}
              className="bg-white border border-[#E4DFD5] rounded-lg px-4 py-2.5 text-[#1A2E16] focus:border-[#2D5A27]"
              data-testid="filter-syllabus"
            >
              <option value="all">All Syllabi</option>
              <option value="Zanzibar">Zanzibar</option>
              <option value="Tanzania Mainland">Tanzania Mainland</option>
            </select>
          </div>
        </div>

        {/* Lessons Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#2D5A27] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="bg-white border border-[#E4DFD5] rounded-xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-[#8E9E82] mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold text-[#1A2E16] mb-2">
              {lessons.length === 0 ? 'No lesson plans yet' : 'No matching lessons'}
            </h3>
            <p className="text-[#7A8A76] mb-6">
              {lessons.length === 0 
                ? 'Create your first lesson plan to get started!' 
                : 'Try adjusting your search or filters'}
            </p>
            {lessons.length === 0 && (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-[#D95D39] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#BD4D2D] transition-colors"
                data-testid="create-first-lesson"
              >
                Create Lesson Plan
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLessons.map((lesson, index) => (
              <div
                key={lesson.lesson_id}
                className="bg-white border border-[#E4DFD5] rounded-xl p-5 hover:shadow-lg transition-shadow"
                data-testid={`lesson-card-${lesson.lesson_id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    lesson.syllabus === 'Zanzibar' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {lesson.syllabus}
                  </span>
                  <button
                    onClick={() => handleDelete(lesson.lesson_id)}
                    className="text-[#7A8A76] hover:text-[#D95D39] transition-colors"
                    data-testid={`delete-lesson-${lesson.lesson_id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-heading font-semibold text-[#1A2E16] mb-2 line-clamp-2 text-lg">
                  {lesson.topic}
                </h3>

                <div className="flex items-center gap-4 text-sm text-[#7A8A76] mb-4">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {lesson.subject}
                  </span>
                  <span>{lesson.grade}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E4DFD5]">
                  <span className="flex items-center gap-1 text-xs text-[#7A8A76]">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(lesson.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setSelectedLesson(lesson)}
                    className="flex items-center gap-1 text-sm text-[#2D5A27] font-medium hover:text-[#21441C] transition-colors"
                    data-testid={`view-lesson-${lesson.lesson_id}`}
                  >
                    <Eye className="w-4 h-4" />
                    View
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
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-[#E4DFD5] p-4 flex items-center justify-between z-10">
                <h2 className="font-heading text-xl font-semibold text-[#1A2E16]">
                  {selectedLesson.topic}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-[#4a5568] text-white rounded-lg hover:bg-[#2d3748] transition-colors"
                    data-testid="modal-print-btn"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2D5A27] text-white rounded-lg hover:bg-[#21441C] transition-colors"
                    data-testid="modal-download-btn"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => setSelectedLesson(null)}
                    className="p-2 text-[#7A8A76] hover:text-[#1A2E16] hover:bg-[#F2EFE8] rounded-lg transition-colors"
                    data-testid="close-lesson-modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 lesson-view-content">
                <style>{`
                  .lesson-view-content h1 {
                    font-size: 1.5rem;
                    font-weight: bold;
                    text-align: center;
                    margin-bottom: 1rem;
                    color: #1A2E16;
                    border-bottom: 2px solid #2D5A27;
                    padding-bottom: 0.5rem;
                  }
                  .lesson-view-content h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin: 1.5rem 0 0.75rem;
                    color: #1A2E16;
                  }
                  .lesson-view-content .header-info {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                    background: #F2EFE8;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                  }
                  .lesson-view-content .header-info div {
                    font-size: 0.9rem;
                    color: #4A5B46;
                  }
                  .lesson-view-content .header-info strong {
                    color: #1A2E16;
                  }
                  .lesson-view-content .section {
                    margin-bottom: 1rem;
                  }
                  .lesson-view-content .section-title {
                    background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 6px 6px 0 0;
                    font-weight: 600;
                    font-size: 0.85rem;
                  }
                  .lesson-view-content .section-content {
                    padding: 1rem;
                    background: #FDFBF7;
                    border: 1px solid #E4DFD5;
                    border-top: none;
                    border-radius: 0 0 6px 6px;
                    min-height: 50px;
                    color: #1A2E16;
                    line-height: 1.6;
                  }
                  .lesson-view-content .empty-field {
                    color: #8E9E82;
                    font-style: italic;
                  }
                  .lesson-view-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1rem 0;
                    font-size: 0.9rem;
                  }
                  .lesson-view-content th {
                    background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
                    color: white;
                    padding: 0.75rem;
                    text-align: left;
                    font-weight: 600;
                    font-size: 0.8rem;
                    border: 1px solid #2c3e50;
                  }
                  .lesson-view-content td {
                    padding: 0.75rem;
                    border: 1px solid #E4DFD5;
                    vertical-align: top;
                    background: #FDFBF7;
                    color: #1A2E16;
                  }
                  .lesson-view-content td strong {
                    display: block;
                    color: #2D5A27;
                    margin-bottom: 0.25rem;
                  }
                `}</style>
                
                {selectedLesson.syllabus === 'Zanzibar' 
                  ? renderZanzibarContent(selectedLesson)
                  : renderTanzaniaContent(selectedLesson)
                }
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyHub;
