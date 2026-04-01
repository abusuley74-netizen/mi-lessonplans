import React, { useState, useRef } from 'react';
import axios from 'axios';
import { ChevronLeft, Download, Save, Check, Loader2, FlaskConical, Camera, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import './ScientificTemplate.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const fetchAndDownload = async (url, filename, body) => {
  try {
    const res = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const reader = new FileReader();
    reader.onload = () => { const a = document.createElement('a'); a.href = reader.result; a.download = filename; a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
    reader.readAsDataURL(blob);
  } catch (err) { toast.error('Export failed. Please try again.'); }
};

const ScientificTemplate = ({ template, onBack, onSaved }) => {
  const [title, setTitle] = useState(template.content?.title || '');
  const [subject, setSubject] = useState(template.content?.subject || 'Science');
  const [category, setCategory] = useState(template.content?.category || '');
  const [content, setContent] = useState(template.content?.body || '');
  const [uploadedImages, setUploadedImages] = useState(template.content?.images || [null, null, null]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRefs = [useRef(null), useRef(null), useRef(null)];

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/templates`, {
        template_id: template.template_id, name: template.name, type: template.type,
        description: template.description,
        content: { title, subject, category, body: content, images: uploadedImages.filter(Boolean) },
        is_active: template.is_active,
      }, { withCredentials: true });
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
      `${(title || 'scientific').replace(/\s+/g, '_')}_scientific.doc`,
      { type: template.type, content: { title, subject, category, body: content, images: uploadedImages.filter(Boolean) } }
    );
    setExporting(false);
  };

  return (
    <div className="special-template-editor sci-theme" data-testid="scientific-template-editor">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-[#F2EFE8] text-[#4A5B46]" data-testid="editor-back">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <FlaskConical className="w-5 h-5 text-[#059669]" />
        <h2 className="font-heading text-xl font-bold text-[#1A2E16]">{template.name}</h2>
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

        {/* Vertical Split: Notes (left) + Images (right) */}
        <div className="sci-split-container">
          {/* Left: Notes */}
          <div className="sci-notes-side">
            <div className="sci-side-header">
              <FlaskConical className="w-4 h-4 text-[#059669]" />
              <span>Scientific Notes</span>
            </div>
            <textarea
              id="scientific-content-textarea"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your scientific observations, experiment notes, procedures, and findings here..."
              className="sci-notes-textarea"
              data-testid="scientific-content-textarea"
            />
          </div>

          {/* Divider */}
          <div className="sci-divider" />

          {/* Right: Images */}
          <div className="sci-images-side">
            <div className="sci-side-header">
              <ImageIcon className="w-4 h-4 text-[#059669]" />
              <span>Diagrams & Photos</span>
            </div>
            <div className="sci-image-stack">
              {[0, 1, 2].map(index => (
                <div key={index} className="sci-image-card" data-testid={`sci-image-card-${index}`}>
                  {uploadedImages[index] ? (
                    <div className="sci-image-preview">
                      <img src={uploadedImages[index].dataUrl} alt={`Diagram ${index + 1}`} />
                      <button className="sci-image-remove" onClick={() => handleRemoveImage(index)} data-testid={`remove-image-${index}`}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <span className="sci-image-name">{uploadedImages[index].name}</span>
                    </div>
                  ) : (
                    <div className="sci-image-placeholder" onClick={() => fileInputRefs[index].current?.click()}>
                      <Camera className="w-5 h-5" />
                      <span>Image {index + 1}</span>
                      <span className="sci-upload-hint">Click to upload (max 2MB)</span>
                      <input ref={fileInputRefs[index]} type="file" accept="image/*"
                        onChange={e => handleImageUpload(index, e.target.files[0])} style={{ display: 'none' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#E4DFD5] p-4 flex items-center justify-between bg-[#F8F8F8]">
          <p className="text-sm text-[#7A8A76]">Write notes and upload diagrams, then save or export</p>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#059669] text-[#059669] rounded-lg font-medium hover:bg-emerald-50 transition-colors text-sm"
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

export default ScientificTemplate;
