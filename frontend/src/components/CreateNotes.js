import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  Save, Bold, Italic, Underline, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, 
  FileText, Check, Undo, Redo, Type, Palette, Strikethrough,
  Minus
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const FONT_SIZES = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];
const FONT_FAMILIES = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 
  'Verdana', 'Trebuchet MS', 'Comic Sans MS', 'Tahoma'
];
const TEXT_COLORS = [
  '#000000', '#333333', '#666666', '#999999',
  '#C0392B', '#E74C3C', '#D35400', '#E67E22',
  '#F39C12', '#27AE60', '#2ECC71', '#1ABC9C',
  '#2980B9', '#3498DB', '#8E44AD', '#9B59B6',
];

const CreateNotes = () => {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [fontSize, setFontSize] = useState('16px');
  const [fontFamily, setFontFamily] = useState('Arial');
  const editorRef = useRef(null);
  const colorPickerRef = useRef(null);

  const execCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleFontSize = (size) => {
    setFontSize(size);
    // execCommand fontSize only supports 1-7, so use a span approach
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      document.execCommand('fontSize', false, '7');
      // Find all font elements with size 7 and replace with span
      const fonts = editorRef.current?.querySelectorAll('font[size="7"]');
      if (fonts) {
        fonts.forEach(font => {
          const span = document.createElement('span');
          span.style.fontSize = size;
          span.innerHTML = font.innerHTML;
          font.parentNode.replaceChild(span, font);
        });
      }
    }
  };

  const handleFontFamily = (family) => {
    setFontFamily(family);
    execCommand('fontName', family);
  };

  const handleColorSelect = (color) => {
    execCommand('foreColor', color);
    setShowColorPicker(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title for your note');
      return;
    }
    
    const content = editorRef.current?.innerHTML || '';
    if (!content.trim() || content === '<br>') {
      alert('Please write some content');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/notes`, {
        title,
        content,
        created_at: new Date().toISOString()
      }, { withCredentials: true });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      setTitle('');
      if (editorRef.current) editorRef.current.innerHTML = '';
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-[#1A2E16] mb-1">Create Notes</h2>
        <p className="text-[#7A8A76]">Write and format your teaching notes</p>
      </div>

      <div className="bg-white border border-[#E4DFD5] rounded-xl overflow-hidden shadow-sm">
        {/* Title Input */}
        <div className="border-b border-[#E4DFD5] p-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title..."
            className="w-full text-xl font-semibold text-[#1A2E16] border-none outline-none placeholder-[#A0A0A0]"
            data-testid="note-title"
          />
        </div>

        {/* Toolbar Row 1 - Font controls */}
        <div className="border-b border-[#E4DFD5] px-2 py-1.5 flex flex-wrap items-center gap-1 bg-[#FAFAF8]">
          {/* Font Family */}
          <select
            value={fontFamily}
            onChange={(e) => handleFontFamily(e.target.value)}
            className="h-8 px-2 border border-[#E4DFD5] rounded text-sm bg-white text-[#1A2E16] cursor-pointer"
            data-testid="font-family-select"
          >
            {FONT_FAMILIES.map(f => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
            ))}
          </select>

          {/* Font Size */}
          <select
            value={fontSize}
            onChange={(e) => handleFontSize(e.target.value)}
            className="h-8 w-16 px-1 border border-[#E4DFD5] rounded text-sm bg-white text-[#1A2E16] cursor-pointer"
            data-testid="font-size-select"
          >
            {FONT_SIZES.map(s => (
              <option key={s} value={s}>{parseInt(s)}</option>
            ))}
          </select>

          <div className="w-px h-6 bg-[#E4DFD5] mx-1"></div>

          {/* Bold, Italic, Underline, Strikethrough */}
          <button onClick={() => execCommand('bold')} className="p-1.5 hover:bg-[#E4DFD5] rounded transition-colors" title="Bold (Ctrl+B)" data-testid="btn-bold">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('italic')} className="p-1.5 hover:bg-[#E4DFD5] rounded transition-colors" title="Italic (Ctrl+I)" data-testid="btn-italic">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('underline')} className="p-1.5 hover:bg-[#E4DFD5] rounded transition-colors" title="Underline (Ctrl+U)" data-testid="btn-underline">
            <Underline className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('strikeThrough')} className="p-1.5 hover:bg-[#E4DFD5] rounded transition-colors" title="Strikethrough" data-testid="btn-strikethrough">
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-[#E4DFD5] mx-1"></div>

          {/* Text Color */}
          <div className="relative" ref={colorPickerRef}>
            <button 
              onClick={() => setShowColorPicker(!showColorPicker)} 
              className="p-1.5 hover:bg-[#E4DFD5] rounded transition-colors flex items-center gap-0.5" 
              title="Text Color"
              data-testid="btn-text-color"
            >
              <Palette className="w-4 h-4" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-[#E4DFD5] rounded-lg shadow-lg z-50 grid grid-cols-4 gap-1" data-testid="color-picker-dropdown">
                {TEXT_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className="w-7 h-7 rounded border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-[#E4DFD5] mx-1"></div>

          {/* Headings */}
          <button onClick={() => execCommand('formatBlock', '<h1>')} className="p-1.5 hover:bg-[#E4DFD5] rounded transition-colors" title="Heading 1" data-testid="btn-h1">
            <Heading1 className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('formatBlock', '<h2>')} className="p-1.5 hover:bg-[#E4DFD5] rounded transition-colors" title="Heading 2" data-testid="btn-h2">
            <Heading2 className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('formatBlock', '<p>')} className="p-1.5 hover:bg-[#E4DFD5] rounded transition-colors text-xs font-bold" title="Normal Text" data-testid="btn-paragraph">
            <Type className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-[#E4DFD5] mx-1"></div>

          {/* Lists */}
          <button onClick={() => execCommand('insertUnorderedList')} className="p-1.5 hover:bg-[#E4DFD5] rounded transition-colors" title="Bullet List" data-testid="btn-unordered-list">
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('insertOrderedList')} className="p-1.5 hover:bg-[#E4DFD5] rounded transition-colors" title="Numbered List" data-testid="btn-ordered-list">
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-[#E4DFD5] mx-1"></div>

          {/* Alignment */}
          <button onClick={() => execCommand('justifyLeft')} className="p-1.5 hover:bg-[#E4DFD5] rounded transition-colors" title="Align Left" data-testid="btn-align-left">
            <AlignLeft className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('justifyCenter')} className="p-1.5 hover:bg-[#E4DFD5] rounded transition-colors" title="Align Center" data-testid="btn-align-center">
            <AlignCenter className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('justifyRight')} className="p-1.5 hover:bg-[#E4DFD5] rounded transition-colors" title="Align Right" data-testid="btn-align-right">
            <AlignRight className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-[#E4DFD5] mx-1"></div>

          {/* Horizontal Rule */}
          <button onClick={() => execCommand('insertHorizontalRule')} className="p-1.5 hover:bg-[#E4DFD5] rounded transition-colors" title="Horizontal Line" data-testid="btn-hr">
            <Minus className="w-4 h-4" />
          </button>

          {/* Undo / Redo */}
          <div className="w-px h-6 bg-[#E4DFD5] mx-1"></div>
          <button onClick={() => execCommand('undo')} className="p-1.5 hover:bg-[#E4DFD5] rounded transition-colors" title="Undo (Ctrl+Z)" data-testid="btn-undo">
            <Undo className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('redo')} className="p-1.5 hover:bg-[#E4DFD5] rounded transition-colors" title="Redo (Ctrl+Y)" data-testid="btn-redo">
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[400px] p-6 outline-none text-[#1A2E16] leading-relaxed"
          style={{ lineHeight: '1.8', fontFamily: fontFamily, fontSize: fontSize }}
          data-testid="note-editor"
          suppressContentEditableWarning={true}
        />

        {/* Footer */}
        <div className="border-t border-[#E4DFD5] p-4 flex items-center justify-between bg-[#F8F8F8]">
          <div className="flex items-center gap-2 text-sm text-[#7A8A76]">
            <FileText className="w-4 h-4" />
            <span>Auto-saved to My Files</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-[#2D5A27] text-white hover:bg-[#21441C]'
            }`}
            data-testid="save-note-btn"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Note
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateNotes;
