import React, { useState } from 'react';
import axios from 'axios';
import { ChevronLeft, Download, Save, Check, Loader2, TestTubes, Lock, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import ChemistryKeyboard from './ChemistryKeyboard';
import './SpecialTemplates.css';

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

const ChemistryTemplate = ({ template, onBack, onSaved }) => {
  const [title, setTitle] = useState(template.content?.title || '');
  const [subject, setSubject] = useState(template.content?.subject || 'Chemistry');
  const [category, setCategory] = useState(template.content?.category || '');
  const [content, setContent] = useState(template.content?.body || '');
  const [showFormulas, setShowFormulas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleKeyPress = (key) => {
    const ta = document.getElementById('chemistry-content-textarea');
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    setContent(content.substring(0, s) + key + content.substring(e));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + key.length, s + key.length); }, 0);
  };

  const handleBackspace = () => {
    const ta = document.getElementById('chemistry-content-textarea');
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

  const handleClear = () => { setContent(''); document.getElementById('chemistry-content-textarea')?.focus(); };
  const handleEnter = () => handleKeyPress('\n');

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/templates`, {
        template_id: template.template_id, name: template.name, type: template.type,
        description: template.description, content: { title, subject, category, body: content },
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
      `${(title || 'chemistry').replace(/\s+/g, '_')}_chemistry.doc`,
      { type: template.type, content: { title, subject, category, body: content } }
    );
    setExporting(false);
  };

  return (
    <div className="special-template-editor chemistry-theme" data-testid="chemistry-template-editor">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-[#F2EFE8] text-[#4A5B46]" data-testid="editor-back">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <TestTubes className="w-5 h-5 text-[#1ABC9C]" />
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
                <h4>FORM 1-2 (BASIC CHEMISTRY)</h4>
                <div className="formulas-group">
                  <p className="formula-clickable" onClick={() => handleKeyPress('n = m/M\n')}>n = m/M</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('C = n/V\n')}>C = n/V</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('ρ = m/V\n')}>ρ = m/V</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('% = (part/whole) × 100\n')}>% = (part/whole) × 100</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress("P₁V₁ = P₂V₂ (Boyle's Law)\n")}>P₁V₁ = P₂V₂ (Boyle's Law)</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress("V₁/T₁ = V₂/T₂ (Charles's Law)\n")}>V₁/T₁ = V₂/T₂ (Charles's Law)</p>
                </div>
              </div>
              <div className="formulas-section">
                <h4>FORM 3-4 (O-LEVEL)</h4>
                <div className="formulas-group">
                  <strong>Stoichiometry:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('n = m/M\n')}>n = m/M</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('C = n/V\n')}>C = n/V</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('% yield = (actual/theoretical) × 100\n')}>% yield = (actual/theoretical) × 100</p>
                </div>
                <div className="formulas-group">
                  <strong>Gas Laws:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('PV = nRT\n')}>PV = nRT</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('P₁V₁/T₁ = P₂V₂/T₂\n')}>P₁V₁/T₁ = P₂V₂/T₂</p>
                </div>
                <div className="formulas-group">
                  <strong>Acids & Bases:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('pH = -log[H⁺]\n')}>pH = -log[H⁺]</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('pOH = -log[OH⁻]\n')}>pOH = -log[OH⁻]</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('pH + pOH = 14\n')}>pH + pOH = 14</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('Kₐ = [H⁺][A⁻]/[HA]\n')}>Kₐ = [H⁺][A⁻]/[HA]</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('Kᵥ = 1×10⁻¹⁴\n')}>Kᵥ = 1×10⁻¹⁴</p>
                </div>
                <div className="formulas-group">
                  <strong>Reaction Rates:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('Rate = k[A]ᵐ[B]ⁿ\n')}>Rate = k[A]ᵐ[B]ⁿ</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('t½ = 0.693/k (1st order)\n')}>t½ = 0.693/k (1st order)</p>
                </div>
                <div className="formulas-group">
                  <strong>Electrochemistry:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('E°cell = E°cathode - E°anode\n')}>E°cell = E°cathode - E°anode</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('Q = It\n')}>Q = It</p>
                </div>
              </div>
              <div className="formulas-section">
                <h4>FORM 5-6 (A-LEVEL)</h4>
                <div className="formulas-group">
                  <strong>Thermochemistry:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('q = mcΔT\n')}>q = mcΔT</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('ΔH = ΣΔHf(products) - ΣΔHf(reactants)\n')}>ΔH = ΣΔHf(products) - ΣΔHf(reactants)</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('ΔG = ΔH - TΔS\n')}>ΔG = ΔH - TΔS</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('ΔG = -RT ln K\n')}>ΔG = -RT ln K</p>
                </div>
                <div className="formulas-group">
                  <strong>Equilibrium:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('Kc = [products]/[reactants]\n')}>Kc = [products]/[reactants]</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('Kp = Kc(RT)^Δn\n')}>Kp = Kc(RT)^Δn</p>
                </div>
                <div className="formulas-group">
                  <strong>Kinetics:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('k = Ae^(-Ea/RT)\n')}>k = Ae^(-Ea/RT)</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('ln(k₂/k₁) = (Ea/R)(1/T₁ - 1/T₂)\n')}>ln(k₂/k₁) = (Ea/R)(1/T₁ - 1/T₂)</p>
                </div>
                <div className="formulas-group">
                  <strong>Electrochemistry:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('E = E° - (RT/nF)lnQ\n')}>E = E° - (RT/nF)lnQ</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('ΔG = -nFE\n')}>ΔG = -nFE</p>
                </div>
                <div className="formulas-group">
                  <strong>Colligative Properties:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('ΔT = Kf × m\n')}>ΔT = Kf × m</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('ΔT = Kb × m\n')}>ΔT = Kb × m</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('π = MRT\n')}>π = MRT</p>
                </div>
                <div className="formulas-group">
                  <strong>Nuclear Chemistry:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('N = N₀(½)^(t/t½)\n')}>N = N₀(½)^(t/t½)</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('t½ = ln2/λ\n')}>t½ = ln2/λ</p>
                </div>
              </div>
            </div>
          )}
          <textarea id="chemistry-content-textarea" value={content} onChange={e => setContent(e.target.value)}
            placeholder="Type your chemistry content here. Use the keyboard below for special symbols..."
            className="special-content-textarea" data-testid="chemistry-content-textarea" />
        </div>

        <div className="special-tools-section">
          <div className="tools-header"><span>Chemistry Keyboard</span></div>
          <div className="keyboard-scroll-container">
            <ChemistryKeyboard onKeyPress={handleKeyPress} onBackspace={handleBackspace} onClear={handleClear} onEnter={handleEnter} />
          </div>
        </div>

        <div className="border-t border-[#E4DFD5] p-4 flex items-center justify-between bg-[#F8F8F8]">
          <p className="text-sm text-[#7A8A76]">Edit content above, then save or export</p>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#1ABC9C] text-[#1ABC9C] rounded-lg font-medium hover:bg-teal-50 transition-colors text-sm"
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

export default ChemistryTemplate;
