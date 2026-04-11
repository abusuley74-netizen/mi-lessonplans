import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import {
  FileText, FlaskConical, Globe, Calculator, Atom, TestTubes,
  Download, Save, Check, X, ChevronLeft, Loader2, Lock
} from 'lucide-react';
import MathTemplate from './MathTemplate';
import PhysicsTemplate from './PhysicsTemplate';
import ChemistryTemplate from './ChemistryTemplate';
import GeographyTemplate from './GeographyTemplate';
import ScientificTemplate from './ScientificTemplate';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TYPE_META = {
  basic:       { icon: FileText,     color: 'bg-blue-100 text-blue-700',   label: 'Basic',      tier: 'Basic' },
  scientific:  { icon: FlaskConical, color: 'bg-green-100 text-green-700', label: 'Scientific', tier: 'Basic' },
  geography:   { icon: Globe,        color: 'bg-purple-100 text-purple-700', label: 'Geography', tier: 'Premium' },
  mathematics: { icon: Calculator,   color: 'bg-orange-100 text-orange-700', label: 'Mathematics', tier: 'Premium' },
  physics:     { icon: Atom,         color: 'bg-red-100 text-red-700',     label: 'Physics',    tier: 'Premium' },
  chemistry:   { icon: TestTubes,    color: 'bg-teal-100 text-teal-700',   label: 'Chemistry',  tier: 'Premium' },
};

const fetchAndDownload = async (url, filename, body) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('Export failed');
    const blob = await response.blob();
    const reader = new FileReader();
    reader.onload = () => {
      const a = document.createElement('a');
      a.href = reader.result;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    reader.readAsDataURL(blob);
  } catch (err) {
    console.error('Download error:', err);
  }
};

// ---- Template Editor ----
const TemplateEditor = ({ template, onBack, onSaved }) => {
  const [content, setContent] = useState(template.content || { title: '', subject: '', category: '', body: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && content.body) {
      editorRef.current.innerHTML = DOMPurify.sanitize(content.body);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const body = editorRef.current?.innerHTML || '';
    const updatedContent = { ...content, body };
    try {
      await axios.post(`${API_URL}/api/templates`, {
        template_id: template.template_id,
        name: template.name,
        type: template.type,
        description: template.description,
        content: updatedContent,
        is_active: template.is_active,
      }, { withCredentials: true });
      setContent(updatedContent);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (onSaved) onSaved();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const body = editorRef.current?.innerHTML || '';
    const exportContent = { ...content, body };
    const filename = `${(content.title || 'document').replace(/\s+/g, '_')}_${template.type}.doc`;
    await fetchAndDownload(
      `${API_URL}/api/templates/${template.template_id}/export`,
      filename,
      { type: template.type, content: exportContent }
    );
    setExporting(false);
  };

  const meta = TYPE_META[template.type] || TYPE_META.basic;
  const Icon = meta.icon;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-[#F2EFE8] text-[#4A5B46]" data-testid="editor-back">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-[#2D5A27]" />
          <h2 className="font-heading text-xl font-bold text-[#1A2E16]">{template.name}</h2>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${meta.color}`}>{meta.tier}</span>
      </div>

      <div className="bg-white border border-[#E4DFD5] rounded-xl overflow-hidden shadow-sm">
        {/* Meta fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 border-b border-[#E4DFD5] bg-[#FAFAF8]">
          <div>
            <label className="block text-xs font-medium text-[#7A8A76] mb-1">Title</label>
            <input type="text" value={content.title} onChange={e => setContent({ ...content, title: e.target.value })}
              className="w-full p-2.5 border border-[#E4DFD5] rounded-lg text-sm" data-testid="template-title" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#7A8A76] mb-1">Subject</label>
            <input type="text" value={content.subject} onChange={e => setContent({ ...content, subject: e.target.value })}
              className="w-full p-2.5 border border-[#E4DFD5] rounded-lg text-sm" data-testid="template-subject" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#7A8A76] mb-1">Category</label>
            <input type="text" value={content.category} onChange={e => setContent({ ...content, category: e.target.value })}
              className="w-full p-2.5 border border-[#E4DFD5] rounded-lg text-sm" data-testid="template-category" />
          </div>
        </div>

        {/* Geography questions */}
        {template.type === 'geography' && (
          <div className="p-5 border-b border-[#E4DFD5]">
            <label className="block text-xs font-medium text-[#7A8A76] mb-2">Questions</label>
            {(content.questions || ['', '', '']).map((q, i) => (
              <input key={i} type="text" value={q} placeholder={`Question ${i + 1}`}
                onChange={e => {
                  const qs = [...(content.questions || ['', '', ''])];
                  qs[i] = e.target.value;
                  setContent({ ...content, questions: qs });
                }}
                className="w-full p-2.5 border border-[#E4DFD5] rounded-lg text-sm mb-2" data-testid={`question-${i}`} />
            ))}
            <button onClick={() => setContent({ ...content, questions: [...(content.questions || []), ''] })}
              className="text-sm text-[#2D5A27] font-medium hover:underline">+ Add Question</button>
          </div>
        )}

        {/* Editor area */}
        <div className="p-1">
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[350px] p-5 outline-none text-[#1A2E16] leading-relaxed"
            style={{
              fontFamily: (template.type === 'mathematics' || template.type === 'physics' || template.type === 'chemistry')
                ? "'Courier New', monospace" : "'Segoe UI', sans-serif",
              whiteSpace: (template.type === 'mathematics' || template.type === 'physics' || template.type === 'chemistry')
                ? 'pre-wrap' : 'normal'
            }}
            data-testid="template-body-editor"
            suppressContentEditableWarning
          />
        </div>

        {/* Actions */}
        <div className="border-t border-[#E4DFD5] p-4 flex items-center justify-between bg-[#F8F8F8]">
          <p className="text-sm text-[#7A8A76]">Edit content above, then save or export</p>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#8E44AD] text-[#8E44AD] rounded-lg font-medium hover:bg-purple-50 transition-colors text-sm"
              data-testid="template-export-btn">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export DOCX
            </button>
            <button onClick={handleSave} disabled={saving}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                saved ? 'bg-green-500 text-white' : 'bg-[#2D5A27] text-white hover:bg-[#21441C]'
              }`} data-testid="template-save-btn">
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

// ---- Main Templates Component ----
const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/templates`, { withCredentials: true });
      setTemplates(res.data.templates || []);
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  if (editing) {
    const specialEditors = { mathematics: MathTemplate, physics: PhysicsTemplate, chemistry: ChemistryTemplate, geography: GeographyTemplate, scientific: ScientificTemplate };
    const SpecialEditor = specialEditors[editing.type];
    if (SpecialEditor) {
      return <SpecialEditor template={editing} onBack={() => setEditing(null)} onSaved={fetchTemplates} />;
    }
    return <TemplateEditor template={editing} onBack={() => setEditing(null)} onSaved={fetchTemplates} />;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-[#1A2E16] mb-1">Templates</h2>
        <p className="text-[#7A8A76]">Structured document templates for different subjects — edit, save, and export as Word</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#2D5A27] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="templates-grid">
          {templates.map(t => {
            const meta = TYPE_META[t.type] || TYPE_META.basic;
            const Icon = meta.icon;
            const isPremium = meta.tier === 'Premium';
            return (
              <div key={t.template_id}
                className="bg-white border border-[#E4DFD5] rounded-xl p-5 hover:shadow-lg transition-all group cursor-pointer"
                onClick={() => setEditing(t)}
                data-testid={`template-card-${t.template_id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${meta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {isPremium && (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      <Lock className="w-3 h-3" />Premium
                    </span>
                  )}
                </div>
                <h3 className="font-heading font-semibold text-[#1A2E16] mb-1 group-hover:text-[#2D5A27] transition-colors">{t.name}</h3>
                <p className="text-sm text-[#7A8A76] mb-4 line-clamp-2">{t.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-[#E4DFD5]">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>{meta.label}</span>
                  <span className="text-sm text-[#2D5A27] font-medium group-hover:underline">Open &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Templates;
