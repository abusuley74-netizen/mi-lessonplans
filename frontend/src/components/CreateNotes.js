import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Save, Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, FileText, Check } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CreateNotes = () => {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const editorRef = useRef(null);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
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
      
      // Clear form
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

      <div className="bg-white border border-[#E4DFD5] rounded-xl overflow-hidden">
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

        {/* Toolbar */}
        <div className="border-b border-[#E4DFD5] p-2 flex flex-wrap gap-1 bg-[#F8F8F8]">
          <button onClick={() => execCommand('bold')} className="p-2 hover:bg-[#E4DFD5] rounded" title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('italic')} className="p-2 hover:bg-[#E4DFD5] rounded" title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('underline')} className="p-2 hover:bg-[#E4DFD5] rounded" title="Underline">
            <Underline className="w-4 h-4" />
          </button>
          <div className="w-px bg-[#E4DFD5] mx-1"></div>
          <button onClick={() => execCommand('formatBlock', '<h1>')} className="p-2 hover:bg-[#E4DFD5] rounded" title="Heading 1">
            <Heading1 className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('formatBlock', '<h2>')} className="p-2 hover:bg-[#E4DFD5] rounded" title="Heading 2">
            <Heading2 className="w-4 h-4" />
          </button>
          <div className="w-px bg-[#E4DFD5] mx-1"></div>
          <button onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-[#E4DFD5] rounded" title="Bullet List">
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-[#E4DFD5] rounded" title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </button>
          <div className="w-px bg-[#E4DFD5] mx-1"></div>
          <button onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-[#E4DFD5] rounded" title="Align Left">
            <AlignLeft className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-[#E4DFD5] rounded" title="Align Center">
            <AlignCenter className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-[#E4DFD5] rounded" title="Align Right">
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[400px] p-6 outline-none text-[#1A2E16] leading-relaxed"
          style={{ lineHeight: '1.8' }}
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
