import React, { useState } from 'react';
import axios from 'axios';
import { ChevronLeft, Download, Save, Check, Loader2, Atom, Lock, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import PhysicsKeyboard from './PhysicsKeyboard';
import './SpecialTemplates.css';

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

const PhysicsTemplate = ({ template, onBack, onSaved }) => {
  const [title, setTitle] = useState(template.content?.title || '');
  const [subject, setSubject] = useState(template.content?.subject || 'Physics');
  const [category, setCategory] = useState(template.content?.category || '');
  const [content, setContent] = useState(template.content?.body || '');
  const [showFormulas, setShowFormulas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleKeyPress = (key) => {
    const ta = document.getElementById('physics-content-textarea');
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    setContent(content.substring(0, s) + key + content.substring(e));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + key.length, s + key.length); }, 0);
  };

  const handleBackspace = () => {
    const ta = document.getElementById('physics-content-textarea');
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    if (s === e && s > 0) {
      setContent(content.substring(0, s - 1) + content.substring(s));
      setTimeout(() => { ta.focus(); ta.setSelectionRange(s - 1, s - 1); }, 0);
    } else if (s !== e) {
      setContent(content.substring(0, s) + content.substring(e));
      setTimeout(() => { ta.focus(); ta.setSelectionRange(s, s); }, 0);
    }
  };

  const handleClear = () => { setContent(''); document.getElementById('physics-content-textarea')?.focus(); };
  const handleEnter = () => handleKeyPress('\n');

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/templates`, {
        template_id: template.template_id, name: template.name, type: template.type,
        description: template.description, content: { title, subject, category, body: content },
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
      `${(title || 'physics').replace(/\s+/g, '_')}_physics.doc`,
      { type: template.type, content: { title, subject, category, body: content } }
    );
    setExporting(false);
  };

  return (
    <div className="special-template-editor physics-theme" data-testid="physics-template-editor">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-[#F2EFE8] text-[#4A5B46]" data-testid="editor-back">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <Atom className="w-5 h-5 text-[#E74C3C]" />
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

        <div className="special-text-section">
          <div className="section-header-with-toggle">
            <span className="section-label">Content</span>
            <button className="formulas-toggle-btn" onClick={() => setShowFormulas(!showFormulas)} data-testid="formulas-toggle">
              <BookOpen className="w-3.5 h-3.5" />
              {showFormulas ? 'Hide' : 'Show'} Tanzania Syllabus Formulas
            </button>
          </div>
          {showFormulas && (
            <div className="formulas-reference" data-testid="formulas-panel">
              <div className="formulas-section">
                <h4>FORM 1-2 (BASIC PHYSICS)</h4>
                <div className="formulas-group">
                  <strong>Mechanics:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('v = u + at\n')}>v = u + at</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('s = ut + ½at²\n')}>s = ut + ½at²</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('v² = u² + 2as\n')}>v² = u² + 2as</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('F = ma\n')}>F = ma</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('W = mg\n')}>W = mg</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('P = F/A\n')}>P = F/A</p>
                </div>
                <div className="formulas-group">
                  <strong>Energy:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('KE = ½mv²\n')}>KE = ½mv²</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('PE = mgh\n')}>PE = mgh</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('P = W/t\n')}>P = W/t</p>
                </div>
              </div>
              <div className="formulas-section">
                <h4>FORM 3-4 (O-LEVEL)</h4>
                <div className="formulas-group">
                  <strong>Mechanics:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('p = mv\n')}>p = mv</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('F = Δp/Δt\n')}>F = Δp/Δt</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('τ = Fd\n')}>τ = Fd</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('F = Gm₁m₂/r²\n')}>F = Gm₁m₂/r²</p>
                </div>
                <div className="formulas-group">
                  <strong>Thermal Physics:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('Q = mcΔT\n')}>Q = mcΔT</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('PV = nRT\n')}>PV = nRT</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('ΔL = αL₀ΔT\n')}>ΔL = αL₀ΔT</p>
                </div>
                <div className="formulas-group">
                  <strong>Waves & Optics:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('v = fλ\n')}>v = fλ</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('n = c/v\n')}>n = c/v</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('1/f = 1/u + 1/v\n')}>1/f = 1/u + 1/v</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('sin i/sin r = n\n')}>sin i/sin r = n</p>
                </div>
                <div className="formulas-group">
                  <strong>Electricity:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('V = IR\n')}>V = IR</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('P = IV\n')}>P = IV</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('R = ρL/A\n')}>R = ρL/A</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('Q = It\n')}>Q = It</p>
                </div>
              </div>
              <div className="formulas-section">
                <h4>FORM 5-6 (A-LEVEL)</h4>
                <div className="formulas-group">
                  <strong>Circular Motion:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('a = v²/r\n')}>a = v²/r</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('F = mv²/r\n')}>F = mv²/r</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('ω = 2π/T\n')}>ω = 2π/T</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('v = rω\n')}>v = rω</p>
                </div>
                <div className="formulas-group">
                  <strong>Gravitation:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('F = Gm₁m₂/r²\n')}>F = Gm₁m₂/r²</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('g = GM/r²\n')}>g = GM/r²</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('T² ∝ r³ (Kepler)\n')}>T² ∝ r³ (Kepler)</p>
                </div>
                <div className="formulas-group">
                  <strong>Oscillations:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('x = A sin(ωt)\n')}>x = A sin(ωt)</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('v = Aω cos(ωt)\n')}>v = Aω cos(ωt)</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('T = 2π√(m/k)\n')}>T = 2π√(m/k)</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('T = 2π√(l/g)\n')}>T = 2π√(l/g)</p>
                </div>
                <div className="formulas-group">
                  <strong>Electromagnetism:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('F = BIL sin θ\n')}>F = BIL sin θ</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('F = Bqv sin θ\n')}>F = Bqv sin θ</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('ε = -N dΦ/dt\n')}>ε = -N dΦ/dt</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('Vₚ/Vₛ = Nₚ/Nₛ\n')}>Vₚ/Vₛ = Nₚ/Nₛ</p>
                </div>
                <div className="formulas-group">
                  <strong>Modern Physics:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('E = hf\n')}>E = hf</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('λ = h/p\n')}>λ = h/p</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('E = mc²\n')}>E = mc²</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('N = N₀e^(-λt)\n')}>N = N₀e^(-λt)</p>
                </div>
                <div className="formulas-group">
                  <strong>Quantum & Nuclear:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('hf = φ + ½mv²ₘₐₓ\n')}>hf = φ + ½mv²ₘₐₓ</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('E = Δmc²\n')}>E = Δmc²</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('N = N₀(½)^(t/t½)\n')}>N = N₀(½)^(t/t½)</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('f = 1/2π√(LC)\n')}>f = 1/2π√(LC)</p>
                </div>
              </div>
            </div>
          )}
          <textarea id="physics-content-textarea" value={content} onChange={e => setContent(e.target.value)}
            placeholder="Type your physics content here. Use the keyboard below for special symbols..."
            className="special-content-textarea" data-testid="physics-content-textarea" />
        </div>

        <div className="special-tools-section">
          <div className="tools-header"><span>Physics Keyboard</span></div>
          <div className="keyboard-scroll-container">
            <PhysicsKeyboard onKeyPress={handleKeyPress} onBackspace={handleBackspace} onClear={handleClear} onEnter={handleEnter} />
          </div>
        </div>

        <div className="border-t border-[#E4DFD5] p-4 flex items-center justify-between bg-[#F8F8F8]">
          <p className="text-sm text-[#7A8A76]">Edit content above, then save or export</p>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#E74C3C] text-[#E74C3C] rounded-lg font-medium hover:bg-red-50 transition-colors text-sm"
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

export default PhysicsTemplate;
