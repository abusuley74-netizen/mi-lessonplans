import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  BookOpen, Trash2, Eye, Download, Search,
  Printer, X, FileText, Mic, Upload, FolderOpen, Play, Volume2, Calendar
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MyFiles = () => {
  const [lessons, setLessons] = useState([]);
  const [notes, setNotes] = useState([]);
  const [dictations, setDictations] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [playingDictation, setPlayingDictation] = useState(null);
  const [generatingAudio, setGeneratingAudio] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // {type, id, name}
  const audioRef = useRef(null);
  const printRef = useRef(null);

  useEffect(() => {
    fetchAllFiles();
  }, []);

  const fetchAllFiles = async () => {
    try {
      const [lessonsRes, notesRes, dictationsRes, uploadsRes, schemesRes] = await Promise.all([
        axios.get(`${API_URL}/api/lessons`, { withCredentials: true }),
        axios.get(`${API_URL}/api/notes`, { withCredentials: true }),
        axios.get(`${API_URL}/api/dictations`, { withCredentials: true }),
        axios.get(`${API_URL}/api/uploads`, { withCredentials: true }),
        axios.get(`${API_URL}/api/schemes`, { withCredentials: true }),
      ]);
      setLessons(lessonsRes.data.lessons || []);
      setNotes(notesRes.data.notes || []);
      setDictations(dictationsRes.data.dictations || []);
      setUploads(uploadsRes.data.uploads || []);
      setSchemes(schemesRes.data.schemes || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    try {
      await axios.delete(`${API_URL}/api/lessons/${lessonId}`, { withCredentials: true });
      setLessons(lessons.filter(l => l.lesson_id !== lessonId));
      if (selectedLesson?.lesson_id === lessonId) setSelectedLesson(null);
    } catch (error) { console.error('Error deleting lesson:', error); }
    setConfirmDelete(null);
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await axios.delete(`${API_URL}/api/notes/${noteId}`, { withCredentials: true });
      setNotes(notes.filter(n => n.note_id !== noteId));
    } catch (error) { console.error('Error deleting note:', error); }
    setConfirmDelete(null);
  };

  const handleDeleteDictation = async (dictationId) => {
    try {
      await axios.delete(`${API_URL}/api/dictations/${dictationId}`, { withCredentials: true });
      setDictations(dictations.filter(d => d.dictation_id !== dictationId));
      if (playingDictation === dictationId) {
        setPlayingDictation(null);
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      }
    } catch (error) { console.error('Error deleting dictation:', error); }
    setConfirmDelete(null);
  };

  const handleDeleteUpload = async (uploadId) => {
    try {
      await axios.delete(`${API_URL}/api/uploads/${uploadId}`, { withCredentials: true });
      setUploads(uploads.filter(u => u.upload_id !== uploadId));
    } catch (error) { console.error('Error deleting upload:', error); }
    setConfirmDelete(null);
  };

  const handleDeleteScheme = async (schemeId) => {
    try {
      await axios.delete(`${API_URL}/api/schemes/${schemeId}`, { withCredentials: true });
      setSchemes(schemes.filter(s => s.scheme_id !== schemeId));
    } catch (error) { console.error('Error deleting scheme:', error); }
    setConfirmDelete(null);
  };

  const executeDelete = () => {
    if (!confirmDelete) return;
    const { type, id } = confirmDelete;
    if (type === 'lesson') handleDeleteLesson(id);
    else if (type === 'note') handleDeleteNote(id);
    else if (type === 'dictation') handleDeleteDictation(id);
    else if (type === 'upload') handleDeleteUpload(id);
    else if (type === 'scheme') handleDeleteScheme(id);
  };

  const handlePlayDictation = async (dictation) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }

    if (playingDictation === dictation.dictation_id) {
      setPlayingDictation(null);
      return;
    }

    setGeneratingAudio(dictation.dictation_id);
    try {
      const response = await axios.post(
        `${API_URL}/api/dictation/generate`,
        { text: dictation.text, language: dictation.language },
        { withCredentials: true, responseType: 'blob' }
      );
      const url = URL.createObjectURL(response.data);
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlayingDictation(dictation.dictation_id);
      audio.play();
      audio.onended = () => {
        setPlayingDictation(null);
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error('Error generating audio:', error);
      alert('Failed to play dictation audio.');
    } finally {
      setGeneratingAudio(null);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(`
      <html><head><title>Lesson Plan - ${selectedLesson?.topic}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.4; padding: 15px; color: #000; }
        h1 { font-size: 16pt; text-align: center; margin-bottom: 10px; text-transform: uppercase; }
        h2 { font-size: 13pt; margin: 15px 0 8px; border-bottom: 1px solid #000; padding-bottom: 3px; }
        h3 { font-size: 11pt; margin: 12px 0 5px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; page-break-inside: avoid; }
        th, td { border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top; font-size: 10pt; }
        th { background-color: #e0e0e0; font-weight: bold; text-align: center; }
        .section-title { font-weight: bold; background: #f0f0f0; padding: 5px 8px; border: 1px solid #ccc; }
        .section-content { padding: 8px; border: 1px solid #ccc; border-top: none; min-height: 30px; }
        @media print { body { padding: 0; } }
      </style></head><body>${printContent.innerHTML}</body></html>
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
    const content = lesson.content;
    let text = `${'='.repeat(70)}\n                         LESSON PLAN\n${'='.repeat(70)}\n\n`;
    text += `SYLLABUS: ${lesson.syllabus}\nSUBJECT: ${lesson.subject}\nGRADE/CLASS: ${lesson.grade}\nTOPIC: ${lesson.topic}\nDATE: ${new Date(lesson.created_at).toLocaleDateString()}\n\n`;
    if (lesson.syllabus === 'Zanzibar') {
      text += `GENERAL OUTCOME: ${content.generalOutcome || 'N/A'}\nMAIN TOPIC: ${content.mainTopic || 'N/A'}\nSUB TOPIC: ${content.subTopic || 'N/A'}\n`;
    } else {
      text += `MAIN COMPETENCE: ${content.mainCompetence || 'N/A'}\nSPECIFIC COMPETENCE: ${content.specificCompetence || 'N/A'}\n`;
    }
    text += `\nGenerated by MiLesson Plan\n`;
    return text;
  };

  const renderLessonPreview = (lesson) => {
    const content = lesson.content;
    const formData = lesson.form_data || {};
    return (
      <div ref={printRef}>
        <h1 style={{textAlign:'center',fontSize:'18pt',marginBottom:'15px',borderBottom:'2px solid #000',paddingBottom:'10px'}}>
          {lesson.syllabus.toUpperCase()} LESSON PLAN
        </h1>
        <table style={{width:'100%',marginBottom:'15px'}}>
          <tbody>
            <tr><td style={{fontWeight:'bold',width:'100px'}}>Subject:</td><td>{lesson.subject}</td><td style={{fontWeight:'bold',width:'100px'}}>Grade:</td><td>{lesson.grade}</td></tr>
            <tr><td style={{fontWeight:'bold'}}>Topic:</td><td colSpan="3">{lesson.topic}</td></tr>
          </tbody>
        </table>
        {lesson.syllabus === 'Zanzibar' ? (
          <>
            <div style={{marginBottom:'10px'}}><strong>General Outcome:</strong> {content.generalOutcome}</div>
            <div style={{marginBottom:'10px'}}><strong>Main Topic:</strong> {content.mainTopic}</div>
            <div style={{marginBottom:'10px'}}><strong>Sub Topic:</strong> {content.subTopic}</div>
            <div style={{marginBottom:'10px'}}><strong>Specific Outcome:</strong> {content.specificOutcome}</div>
            <div style={{marginBottom:'10px'}}><strong>Resources:</strong> {content.learningResources}</div>
            <div style={{marginBottom:'10px'}}><strong>References:</strong> {content.references}</div>
            {content.introductionActivities && (
              <div style={{margin:'15px 0',padding:'10px',border:'1px solid #ccc',borderRadius:'4px'}}>
                <h3>Introduction ({content.introductionActivities.time})</h3>
                <p><strong>Teaching:</strong> {content.introductionActivities.teachingActivities}</p>
                <p><strong>Learning:</strong> {content.introductionActivities.learningActivities}</p>
                <p><strong>Assessment:</strong> {content.introductionActivities.assessment}</p>
              </div>
            )}
            {content.newKnowledgeActivities && (
              <div style={{margin:'15px 0',padding:'10px',border:'1px solid #ccc',borderRadius:'4px'}}>
                <h3>Building New Knowledge ({content.newKnowledgeActivities.time})</h3>
                <p><strong>Teaching:</strong> {content.newKnowledgeActivities.teachingActivities}</p>
                <p><strong>Learning:</strong> {content.newKnowledgeActivities.learningActivities}</p>
                <p><strong>Assessment:</strong> {content.newKnowledgeActivities.assessment}</p>
              </div>
            )}
            <div style={{margin:'15px 0'}}><strong>Teacher's Evaluation:</strong> <em style={{color:'#888'}}>{content.teacherEvaluation || '(To be filled by teacher)'}</em></div>
            <div><strong>Remarks:</strong> <em style={{color:'#888'}}>{content.remarks || '(To be filled by teacher)'}</em></div>
          </>
        ) : (
          <>
            <div style={{marginBottom:'10px'}}><strong>Main Competence:</strong> {content.mainCompetence}</div>
            <div style={{marginBottom:'10px'}}><strong>Specific Competence:</strong> {content.specificCompetence}</div>
            <div style={{marginBottom:'10px'}}><strong>Main Activity:</strong> {content.mainActivity}</div>
            <div style={{marginBottom:'10px'}}><strong>Resources:</strong> {content.teachingResources}</div>
            {content.stages && Object.entries(content.stages).map(([stage, data]) => (
              <div key={stage} style={{margin:'15px 0',padding:'10px',border:'1px solid #ccc',borderRadius:'4px'}}>
                <h3>{stage.replace(/([A-Z])/g, ' $1').trim()} ({data.time})</h3>
                <p><strong>Teaching:</strong> {data.teachingActivities}</p>
                <p><strong>Learning:</strong> {data.learningActivities}</p>
                <p><strong>Assessment:</strong> {data.assessment}</p>
              </div>
            ))}
            <div><strong>Remarks:</strong> <em style={{color:'#888'}}>{content.remarks || '(To be filled by teacher)'}</em></div>
          </>
        )}
      </div>
    );
  };

  const LANG_NAMES = { 'en-GB': 'English', sw: 'Swahili', ar: 'Arabic', tr: 'Turkish', fr: 'French' };

  // Build unified file list
  const allFiles = [
    ...lessons.map(l => ({ ...l, _type: 'lesson', _name: l.topic, _date: l.created_at })),
    ...notes.map(n => ({ ...n, _type: 'note', _name: n.title, _date: n.created_at })),
    ...dictations.map(d => ({ ...d, _type: 'dictation', _name: d.title, _date: d.created_at })),
    ...uploads.map(u => ({ ...u, _type: 'upload', _name: u.name, _date: u.created_at })),
    ...schemes.map(s => ({ ...s, _type: 'scheme', _name: `${s.subject || 'Scheme'} - ${s.syllabus}`, _date: s.created_at })),
  ].filter(file => {
    const matchesSearch = (file._name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const typeMap = { lessons: 'lesson', notes: 'note', dictations: 'dictation', uploads: 'upload', schemes: 'scheme' };
    const matchesType = filterType === 'all' || file._type === (typeMap[filterType] || filterType);
    return matchesSearch && matchesType;
  }).sort((a, b) => new Date(b._date) - new Date(a._date));

  const renderFileCard = (file) => {
    if (file._type === 'lesson') {
      return (
        <div key={file.lesson_id} className="bg-white border border-[#E4DFD5] rounded-xl p-5 hover:shadow-lg transition-shadow" data-testid={`file-lesson-${file.lesson_id}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#2D5A27]" />
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${file.syllabus === 'Zanzibar' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {file.syllabus}
              </span>
            </div>
            <button onClick={() => setConfirmDelete({ type: 'lesson', id: file.lesson_id, name: file.topic })} className="text-[#7A8A76] hover:text-[#D95D39]"><Trash2 className="w-4 h-4" /></button>
          </div>
          <h3 className="font-heading font-semibold text-[#1A2E16] mb-2 line-clamp-2">{file.topic}</h3>
          <div className="flex items-center gap-4 text-sm text-[#7A8A76] mb-4">
            <span>{file.subject}</span><span>{file.grade}</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#E4DFD5]">
            <span className="text-xs text-[#7A8A76]">{new Date(file.created_at).toLocaleDateString()}</span>
            <div className="flex items-center gap-3">
              <button onClick={() => window.open(`${API_URL}/api/lessons/${file.lesson_id}/view`, '_blank')} className="flex items-center gap-1 text-sm text-[#2D5A27] font-medium hover:text-[#21441C]" data-testid={`view-lesson-${file.lesson_id}`}>
                <Eye className="w-4 h-4" />View
              </button>
              <button onClick={() => window.open(`${API_URL}/api/lessons/${file.lesson_id}/export`, '_blank')} className="flex items-center gap-1 text-sm text-[#8E44AD] font-medium hover:text-[#6C3483]" data-testid={`download-lesson-${file.lesson_id}`}>
                <Download className="w-4 h-4" />Download
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (file._type === 'note') {
      return (
        <div key={file.note_id} className="bg-white border border-[#E4DFD5] rounded-xl p-5 hover:shadow-lg transition-shadow" data-testid={`file-note-${file.note_id}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#E5A93D]" />
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">Note</span>
            </div>
            <button onClick={() => setConfirmDelete({ type: 'note', id: file.note_id, name: file.title })} className="text-[#7A8A76] hover:text-[#D95D39]"><Trash2 className="w-4 h-4" /></button>
          </div>
          <h3 className="font-heading font-semibold text-[#1A2E16] mb-2 line-clamp-2">{file.title}</h3>
          <div className="text-sm text-[#7A8A76] mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: file.content?.substring(0, 100) }} />
          <div className="flex items-center justify-between pt-3 border-t border-[#E4DFD5]">
            <span className="text-xs text-[#7A8A76]">{new Date(file.created_at).toLocaleDateString()}</span>
            <button onClick={() => setSelectedNote(file)} className="flex items-center gap-1 text-sm text-[#2D5A27] font-medium hover:text-[#21441C]" data-testid={`view-note-${file.note_id}`}>
              <Eye className="w-4 h-4" />View
            </button>
          </div>
        </div>
      );
    }

    if (file._type === 'dictation') {
      const isPlaying = playingDictation === file.dictation_id;
      const isGenerating = generatingAudio === file.dictation_id;
      return (
        <div key={file.dictation_id} className="bg-white border border-[#E4DFD5] rounded-xl p-5 hover:shadow-lg transition-shadow" data-testid={`file-dictation-${file.dictation_id}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#D95D39]" />
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-orange-100 text-orange-700">Dictation</span>
              <span className="text-xs text-[#7A8A76]">{LANG_NAMES[file.language] || file.language}</span>
            </div>
            <button onClick={() => setConfirmDelete({ type: 'dictation', id: file.dictation_id, name: file.title })} className="text-[#7A8A76] hover:text-[#D95D39]"><Trash2 className="w-4 h-4" /></button>
          </div>
          <h3 className="font-heading font-semibold text-[#1A2E16] mb-2 line-clamp-2">{file.title}</h3>
          <p className="text-sm text-[#7A8A76] mb-4 line-clamp-2">{file.text}</p>
          <div className="flex items-center justify-between pt-3 border-t border-[#E4DFD5]">
            <span className="text-xs text-[#7A8A76]">{new Date(file.created_at).toLocaleDateString()}</span>
            <button
              onClick={() => handlePlayDictation(file)}
              disabled={isGenerating}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${isPlaying ? 'text-[#D95D39]' : 'text-[#2D5A27] hover:text-[#21441C]'}`}
              data-testid={`play-dictation-${file.dictation_id}`}
            >
              {isGenerating ? (
                <><div className="w-4 h-4 border-2 border-[#2D5A27] border-t-transparent rounded-full animate-spin" />Loading...</>
              ) : isPlaying ? (
                <><Volume2 className="w-4 h-4" />Playing...</>
              ) : (
                <><Play className="w-4 h-4" />Play</>
              )}
            </button>
          </div>
        </div>
      );
    }

    // Upload
    if (file._type === 'upload') {
      return (
        <div key={file.upload_id} className="bg-white border border-[#E4DFD5] rounded-xl p-5 hover:shadow-lg transition-shadow" data-testid={`file-upload-${file.upload_id}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#8E44AD]" />
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-100 text-purple-700">Upload</span>
            </div>
            <button onClick={() => setConfirmDelete({ type: 'upload', id: file.upload_id, name: file.name })} className="text-[#7A8A76] hover:text-[#D95D39]" data-testid={`delete-upload-${file.upload_id}`}><Trash2 className="w-4 h-4" /></button>
          </div>
          <h3 className="font-heading font-semibold text-[#1A2E16] mb-2 line-clamp-2">{file.name}</h3>
          <div className="text-sm text-[#7A8A76] mb-4">{file.type}</div>
          <div className="pt-3 border-t border-[#E4DFD5]">
            <span className="text-xs text-[#7A8A76]">{new Date(file.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      );
    }

    // Scheme of Work
    return (
      <div key={file.scheme_id} className="bg-white border border-[#E4DFD5] rounded-xl p-5 hover:shadow-lg transition-shadow" data-testid={`file-scheme-${file.scheme_id}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#3498db]" />
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-700">Scheme</span>
            <span className="text-xs text-[#7A8A76]">{file.syllabus}</span>
          </div>
          <button onClick={() => setConfirmDelete({ type: 'scheme', id: file.scheme_id, name: file.subject || 'Scheme' })} className="text-[#7A8A76] hover:text-[#D95D39]" data-testid={`delete-scheme-${file.scheme_id}`}><Trash2 className="w-4 h-4" /></button>
        </div>
        <h3 className="font-heading font-semibold text-[#1A2E16] mb-2 line-clamp-2">{file.subject || 'Untitled Scheme'}</h3>
        <div className="flex items-center gap-4 text-sm text-[#7A8A76] mb-4">
          {file.class_name && <span>Class {file.class_name}</span>}
          {file.term && <span>Term {file.term}</span>}
          {file.school && <span>{file.school}</span>}
        </div>
        <div className="text-xs text-[#7A8A76] mb-4">{(file.competencies || []).length} competencies</div>
        <div className="flex items-center justify-between pt-3 border-t border-[#E4DFD5]">
          <span className="text-xs text-[#7A8A76]">{new Date(file.created_at).toLocaleDateString()}</span>
          <div className="flex items-center gap-3">
            <button onClick={() => window.open(`${API_URL}/api/schemes/${file.scheme_id}/view`, '_blank')}
              className="flex items-center gap-1 text-sm text-[#2D5A27] font-medium hover:text-[#21441C]" data-testid={`view-scheme-${file.scheme_id}`}>
              <Eye className="w-4 h-4" />View
            </button>
            <button onClick={() => window.open(`${API_URL}/api/schemes/${file.scheme_id}/export`, '_blank')}
              className="flex items-center gap-1 text-sm text-[#8E44AD] font-medium hover:text-[#6C3483]" data-testid={`download-scheme-${file.scheme_id}`}>
              <Download className="w-4 h-4" />DOCX
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-[#1A2E16] mb-1">My Files</h2>
        <p className="text-[#7A8A76]">All your saved lesson plans, notes, and dictations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-4" data-testid="stat-lessons">
          <p className="text-2xl font-bold text-[#1A2E16]">{lessons.length}</p>
          <p className="text-sm text-[#7A8A76]">Lesson Plans</p>
        </div>
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-4" data-testid="stat-schemes">
          <p className="text-2xl font-bold text-[#1A2E16]">{schemes.length}</p>
          <p className="text-sm text-[#7A8A76]">Schemes</p>
        </div>
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-4" data-testid="stat-notes">
          <p className="text-2xl font-bold text-[#1A2E16]">{notes.length}</p>
          <p className="text-sm text-[#7A8A76]">Notes</p>
        </div>
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-4" data-testid="stat-dictations">
          <p className="text-2xl font-bold text-[#1A2E16]">{dictations.length}</p>
          <p className="text-sm text-[#7A8A76]">Dictations</p>
        </div>
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-4" data-testid="stat-uploads">
          <p className="text-2xl font-bold text-[#1A2E16]">{uploads.length}</p>
          <p className="text-sm text-[#7A8A76]">Uploads</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A8A76]" />
          <input type="text" placeholder="Search files..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#E4DFD5] rounded-lg pl-10 pr-4 py-2.5 text-[#1A2E16] focus:border-[#2D5A27]" data-testid="search-files" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="bg-white border border-[#E4DFD5] rounded-lg px-4 py-2.5 text-[#1A2E16]" data-testid="filter-type">
          <option value="all">All Files</option>
          <option value="lessons">Lesson Plans</option>
          <option value="schemes">Schemes of Work</option>
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
      ) : allFiles.length === 0 ? (
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-12 text-center" data-testid="empty-files">
          <FolderOpen className="w-12 h-12 text-[#8E9E82] mx-auto mb-4" />
          <h3 className="font-heading text-xl font-semibold text-[#1A2E16] mb-2">No files yet</h3>
          <p className="text-[#7A8A76]">Your saved files will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="files-grid">
          {allFiles.map(file => renderFileCard(file))}
        </div>
      )}

      {/* Lesson Detail Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[95vh] overflow-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-[#E4DFD5] p-4 flex items-center justify-between z-10">
              <h2 className="font-heading text-xl font-semibold text-[#1A2E16]">{selectedLesson.topic}</h2>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-[#4a5568] text-white rounded-lg hover:bg-[#2d3748]"><Printer className="w-4 h-4" />Print</button>
                <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-[#2D5A27] text-white rounded-lg hover:bg-[#21441C]"><Download className="w-4 h-4" />Download</button>
                <button onClick={() => setSelectedLesson(null)} className="p-2 text-[#7A8A76] hover:text-[#1A2E16] hover:bg-[#F2EFE8] rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6">{renderLessonPreview(selectedLesson)}</div>
          </div>
        </div>
      )}

      {/* Note Detail Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[95vh] overflow-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-[#E4DFD5] p-4 flex items-center justify-between z-10">
              <h2 className="font-heading text-xl font-semibold text-[#1A2E16]">{selectedNote.title}</h2>
              <button onClick={() => setSelectedNote(null)} className="p-2 text-[#7A8A76] hover:text-[#1A2E16] hover:bg-[#F2EFE8] rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedNote.content }} />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]" data-testid="delete-confirm-modal">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-[#1A2E16]">Delete {confirmDelete.type}?</h3>
                <p className="text-sm text-[#7A8A76] mt-0.5 line-clamp-1">"{confirmDelete.name}"</p>
              </div>
            </div>
            <p className="text-sm text-[#7A8A76] mb-6">This action cannot be undone. The file will be permanently removed.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border border-[#E4DFD5] rounded-lg text-[#4A5B46] font-medium hover:bg-[#F2EFE8] transition-colors"
                data-testid="delete-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                data-testid="delete-confirm-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFiles;
