import React, { useState, useRef } from 'react';
import axios from 'axios';
import { ChevronLeft, Download, Save, Check, Loader2, Globe, Lock, Plus, X, Camera, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import './GeographyTemplate.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const fetchAndDownload = async (url, filename, body) => {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...( localStorage.getItem('session_token') ? { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` } : {} ) }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const reader = new FileReader();
    reader.onload = () => { const a = document.createElement('a'); a.href = reader.result; a.download = filename; a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
    reader.readAsDataURL(blob);
  } catch (err) { toast.error('Export failed. Please try again.'); }
};

const GeographyTemplate = ({ template, onBack, onSaved }) => {
  const [title, setTitle] = useState(template.content?.title || '');
  const [subject, setSubject] = useState(template.content?.subject || 'Geography');
  const [category, setCategory] = useState(template.content?.category || '');
  const [uploadedImages, setUploadedImages] = useState(template.content?.images || [null, null, null, null]);
  const [questions, setQuestions] = useState(template.content?.questions || ['', '', '']);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleImageUpload = (index, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.warning('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.warning('Image too large. Max 2MB per image.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const newImages = [...uploadedImages];
      newImages[index] = { dataUrl: e.target.result, name: file.name, size: file.size };
      setUploadedImages(newImages);
    };
    reader.onerror = () => toast.error('Error reading image file');
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index) => {
    const newImages = [...uploadedImages];
    newImages[index] = null;
    setUploadedImages(newImages);
  };

  const handleQuestionChange = (index, value) => {
    const q = [...questions]; q[index] = value; setQuestions(q);
  };
  const addQuestion = () => setQuestions([...questions, '']);
  const removeQuestion = (index) => { if (questions.length > 1) setQuestions(questions.filter((_, i) => i !== index)); };

  const buildExportBody = () => {
    const qText = questions.filter(q => q.trim()).map((q, i) => `Q${i + 1}: ${q}`).join('\n\n');
    const imgNote = uploadedImages.filter(Boolean).length > 0
      ? `[${uploadedImages.filter(Boolean).length} image(s) uploaded - see template editor]`
      : '';
    return [imgNote, qText].filter(Boolean).join('\n\n');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/templates`, {
        template_id: template.template_id, name: template.name, type: template.type,
        description: template.description,
        content: { title, subject, category, body: buildExportBody(), images: uploadedImages.filter(Boolean), questions },
        is_active: template.is_active,
      });
      setSaved(true); toast.success('Template saved!');
      setTimeout(() => setSaved(false), 2000);
      if (onSaved) onSaved();
    } catch { toast.error('Failed to save template'); }
    finally { setSaving(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    await fetchAndDownload(
      `${API_URL}/api/templates/${template.template_id}/export`,
      `${(title || 'geography').replace(/\s+/g, '_')}_geography.doc`,
      { type: template.type, content: { title, subject, category, body: '', images: uploadedImages.filter(Boolean), questions } }
    );
    setExporting(false);
  };

  return (
    <div className="special-template-editor geo-theme" data-testid="geography-template-editor">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-[#F2EFE8] text-[#4A5B46]" data-testid="editor-back">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <Globe className="w-5 h-5 text-[#7C3AED]" />
        <h2 className="font-heading text-xl font-bold text-[#1A2E16]">{template.name}</h2>
        <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
          <Lock className="w-3 h-3" />Premium
        </span>
      </div>

      <div className="bg-white border border-[#E4DFD5] rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 border-b border-[#E4DFD5] bg-[#FAFAF8]">
          <div><label className="block text-xs font-medium text-[#7A8A76] mb-1">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2.5 border border-[#E4DFD5] rounded-lg text-sm" data-testid="template-title" /></div>
          <div><label className="block text-xs font-medium text-[#7A8A76] mb-1">Subject</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-2.5 border border-[#E4DFD5] rounded-lg text-sm" data-testid="template-subject" /></div>
          <div><label className="block text-xs font-medium text-[#7A8A76] mb-1">Category</label>
            <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2.5 border border-[#E4DFD5] rounded-lg text-sm" data-testid="template-category" /></div>
        </div>

        {/* Image Upload Section */}
        <div className="geo-image-section">
          <div className="geo-section-header">
            <ImageIcon className="w-4 h-4 text-[#7C3AED]" />
            <span>Upload Geography Images / Maps</span>
          </div>
          <div className="geo-image-grid">
            {[0, 1, 2, 3].map(index => (
              <div key={index} className="geo-image-card" data-testid={`geo-image-card-${index}`}>
                {uploadedImages[index] ? (
                  <div className="geo-image-preview">
                    <img src={uploadedImages[index].dataUrl} alt={`Map ${index + 1}`} />
                    <button className="geo-image-remove" onClick={() => handleRemoveImage(index)} data-testid={`remove-image-${index}`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="geo-image-label">{uploadedImages[index].name}</span>
                  </div>
                ) : (
                  <div className="geo-image-placeholder" onClick={() => fileInputRefs[index].current?.click()}>
                    <Camera className="w-6 h-6" />
                    <span>Image {index + 1}</span>
                    <span className="geo-upload-hint">Click to upload</span>
                    <input ref={fileInputRefs[index]} type="file" accept="image/*"
                      onChange={e => handleImageUpload(index, e.target.files[0])} style={{ display: 'none' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Questions Section */}
        <div className="geo-questions-section">
          <div className="geo-section-header">
            <span>Questions</span>
            <button className="geo-add-question-btn" onClick={addQuestion} data-testid="add-question-btn">
              <Plus className="w-3.5 h-3.5" /> Add Question
            </button>
          </div>
          <div className="geo-questions-list">
            {questions.map((question, index) => (
              <div key={index} className="geo-question-item" data-testid={`question-item-${index}`}>
                <div className="geo-question-badge">Q{index + 1}</div>
                <textarea value={question} onChange={e => handleQuestionChange(index, e.target.value)}
                  placeholder="Type your question here..." className="geo-question-textarea" rows={3} />
                {questions.length > 1 && (
                  <button className="geo-remove-question" onClick={() => removeQuestion(index)} data-testid={`remove-question-${index}`}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#E4DFD5] p-4 flex items-center justify-between bg-[#F8F8F8]">
          <p className="text-sm text-[#7A8A76]">Upload images and write questions, then save or export</p>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#7C3AED] text-[#7C3AED] rounded-lg font-medium hover:bg-purple-50 transition-colors text-sm"
              data-testid="template-export-btn">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export DOCX
            </button>
            <button onClick={handleSave} disabled={saving}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-[#2D5A27] text-white hover:bg-[#21441C]'}`}
              data-testid="template-save-btn">
              {saved ? <><Check className="w-4 h-4" />Saved!</> : saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                : <><Save className="w-4 h-4" />Save Template</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographyTemplate;
