import React, { useState } from 'react';
import axios from 'axios';
import { ChevronLeft, Download, Save, Check, Loader2, Calculator, Lock, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import MathKeyboard from './MathKeyboard';
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

const MathTemplate = ({ template, onBack, onSaved }) => {
  const [title, setTitle] = useState(template.content?.title || '');
  const [subject, setSubject] = useState(template.content?.subject || 'Mathematics');
  const [category, setCategory] = useState(template.content?.category || '');
  const [content, setContent] = useState(template.content?.body || '');
  const [showFormulas, setShowFormulas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleKeyPress = (key) => {
    const ta = document.getElementById('math-content-textarea');
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    setContent(content.substring(0, s) + key + content.substring(e));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + key.length, s + key.length); }, 0);
  };

  const handleBackspace = () => {
    const ta = document.getElementById('math-content-textarea');
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

  const handleClear = () => { setContent(''); document.getElementById('math-content-textarea')?.focus(); };
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
      `${(title || 'math').replace(/\s+/g, '_')}_mathematics.doc`,
      { type: template.type, content: { title, subject, category, body: content } }
    );
    setExporting(false);
  };

  return (
    <div className="special-template-editor math-theme" data-testid="math-template-editor">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-[#F2EFE8] text-[#4A5B46]" data-testid="editor-back">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <Calculator className="w-5 h-5 text-[#E67E22]" />
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
                <h4>FORM 1-2 (BASIC MATHEMATICS)</h4>
                <div className="formulas-group">
                  <strong>Algebra:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('a² - b² = (a - b)(a + b)\n')}>a² - b² = (a - b)(a + b)</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('(a ± b)² = a² ± 2ab + b²\n')}>(a ± b)² = a² ± 2ab + b²</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('ax² + bx + c = 0 → x = [-b ± √(b² - 4ac)]/2a\n')}>ax² + bx + c = 0 → x = [-b ± √(b² - 4ac)]/2a</p>
                </div>
                <div className="formulas-group">
                  <strong>Geometry:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('Pythagoras: a² + b² = c²\n')}>Pythagoras: a² + b² = c²</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('Circle: C = 2πr, A = πr²\n')}>Circle: C = 2πr, A = πr²</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('Triangle: A = ½bh\n')}>Triangle: A = ½bh</p>
                </div>
              </div>
              <div className="formulas-section">
                <h4>FORM 3-4 (O-LEVEL)</h4>
                <div className="formulas-group">
                  <strong>Algebra:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('aᵐ × aⁿ = aᵐ⁺ⁿ\n')}>aᵐ × aⁿ = aᵐ⁺ⁿ</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('(aᵐ)ⁿ = aᵐⁿ\n')}>(aᵐ)ⁿ = aᵐⁿ</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('logₐ(mn) = logₐm + logₐn\n')}>logₐ(mn) = logₐm + logₐn</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('logₐ(m/n) = logₐm - logₐn\n')}>logₐ(m/n) = logₐm - logₐn</p>
                </div>
                <div className="formulas-group">
                  <strong>Geometry & Trigonometry:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('sin²θ + cos²θ = 1\n')}>sin²θ + cos²θ = 1</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('sin(A ± B) = sinA cosB ± cosA sinB\n')}>sin(A ± B) = sinA cosB ± cosA sinB</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('cos(A ± B) = cosA cosB ∓ sinA sinB\n')}>cos(A ± B) = cosA cosB ∓ sinA sinB</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('Sine rule: a/sinA = b/sinB = c/sinC\n')}>Sine rule: a/sinA = b/sinB = c/sinC</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('Cosine rule: a² = b² + c² - 2bc cosA\n')}>Cosine rule: a² = b² + c² - 2bc cosA</p>
                </div>
                <div className="formulas-group">
                  <strong>Calculus:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('d/dx(xⁿ) = nxⁿ⁻¹\n')}>d/dx(xⁿ) = nxⁿ⁻¹</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('∫xⁿ dx = xⁿ⁺¹/(n+1) + C\n')}>∫xⁿ dx = xⁿ⁺¹/(n+1) + C</p>
                </div>
                <div className="formulas-group">
                  <strong>Statistics:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('Mean = Σx/n\n')}>Mean = Σx/n</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('Probability: P(A) = n(A)/n(S)\n')}>Probability: P(A) = n(A)/n(S)</p>
                </div>
              </div>
              <div className="formulas-section">
                <h4>FORM 5-6 (A-LEVEL)</h4>
                <div className="formulas-group">
                  <strong>Calculus:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('d/dx(eˣ) = eˣ\n')}>d/dx(eˣ) = eˣ</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('d/dx(ln x) = 1/x\n')}>d/dx(ln x) = 1/x</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('d/dx(sin x) = cos x\n')}>d/dx(sin x) = cos x</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('d/dx(cos x) = -sin x\n')}>d/dx(cos x) = -sin x</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('∫eˣ dx = eˣ + C\n')}>∫eˣ dx = eˣ + C</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('∫(1/x) dx = ln|x| + C\n')}>∫(1/x) dx = ln|x| + C</p>
                </div>
                <div className="formulas-group">
                  <strong>Complex Numbers:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('z = x + iy\n')}>z = x + iy</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('|z| = √(x² + y²)\n')}>|z| = √(x² + y²)</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('eⁱθ = cos θ + i sin θ\n')}>eⁱθ = cos θ + i sin θ</p>
                </div>
                <div className="formulas-group">
                  <strong>Vectors:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('|a| = √(a₁² + a₂² + a₃²)\n')}>|a| = √(a₁² + a₂² + a₃²)</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('a·b = |a||b| cos θ\n')}>a·b = |a||b| cos θ</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('a × b = |a||b| sin θ n̂\n')}>a × b = |a||b| sin θ n̂</p>
                </div>
                <div className="formulas-group">
                  <strong>Matrices:</strong>
                  <p className="formula-clickable" onClick={() => handleKeyPress('AB ≠ BA\n')}>AB ≠ BA</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('det(A) = ad - bc (2×2)\n')}>det(A) = ad - bc (2×2)</p>
                  <p className="formula-clickable" onClick={() => handleKeyPress('A⁻¹ = (1/det(A)) adj(A)\n')}>A⁻¹ = (1/det(A)) adj(A)</p>
                </div>
              </div>
            </div>
          )}
          <textarea id="math-content-textarea" value={content} onChange={e => setContent(e.target.value)}
            placeholder="Type your mathematics content here. Use the keyboard below for special symbols..."
            className="special-content-textarea" data-testid="math-content-textarea" />
        </div>

        <div className="special-tools-section">
          <div className="tools-header"><span>Mathematics Keyboard</span></div>
          <div className="keyboard-scroll-container">
            <MathKeyboard onKeyPress={handleKeyPress} onBackspace={handleBackspace} onClear={handleClear} onEnter={handleEnter} />
          </div>
        </div>

        <div className="border-t border-[#E4DFD5] p-4 flex items-center justify-between bg-[#F8F8F8]">
          <p className="text-sm text-[#7A8A76]">Edit content above, then save or export</p>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#E67E22] text-[#E67E22] rounded-lg font-medium hover:bg-orange-50 transition-colors text-sm"
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

export default MathTemplate;
