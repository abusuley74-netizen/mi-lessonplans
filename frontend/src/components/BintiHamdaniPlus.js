import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Send, Loader2, Trash2, Download, Printer, FileText, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import './BintiHamdaniPlus.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const BINTI_ICON = 'https://customer-assets.emergentagent.com/job_mi-learning-hub/artifacts/7qqip1h1_binti%20hamdani.avif';

const SUBJECTS_MAINLAND = [
  'English Language', 'Kiswahili', 'Mathematics', 'Biology', 'Chemistry', 'Physics',
  'History', 'Geography', 'Civics', 'Bible Knowledge', 'Elimu ya Dini ya Kiislamu',
  'Commerce', 'Bookkeeping', 'French Language', 'Arabic Language', 'Literature in English',
  'Fine Art', 'Music', 'Physical Education', 'Theatre Arts'
];

const SUBJECTS_ZANZIBAR = [
  'English Language', 'Kiswahili', 'Hisabati', 'Sayansi', 'Social Studies',
  'Arabic / Quran', 'Islamic Studies', 'French', 'Science and Technology',
  'Civics and Moral Education'
];

const LEVELS = {
  mainland: ['Standard 1','Standard 2','Standard 3','Standard 4','Standard 5','Standard 6','Standard 7',
             'Form 1','Form 2','Form 3','Form 4','Form 5','Form 6'],
  zanzibar: ['Standard 1','Standard 2','Standard 3','Standard 4','Standard 5','Standard 6','Standard 7',
             'Form 1','Form 2','Form 3','Form 4']
};

const BintiHamdaniPlus = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([{
    role: 'binti',
    text: `**Hujambo Mwalimu!** Mimi ni **Binti Hamdani+**, mtaalamu wako wa kutengeneza mitihani.

Niambie unataka mtihani wa aina gani — somo, darasa, mada, na alama za jumla — nitakuandikia mtihani kamili kwa muundo rasmi wa **NECTA** au **ZEC**.

*Mfano: "Create me an English Standard 7 first term test covering Grammar and Comprehension, total marks 100"*`
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTest, setGeneratedTest] = useState(null);
  const [syllabus, setSyllabus] = useState('Tanzania Mainland');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const testRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/binti-plus/generate`, {
        message: text,
        syllabus,
        conversation_history: messages.slice(-10)
      });

      // Handle async polling
      if (response.data.task_id && response.data.status === 'generating') {
        const taskId = response.data.task_id;
        let attempts = 0;
        const maxAttempts = 60;

        while (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 2500));
          attempts++;
          try {
            const statusRes = await axios.get(`${API_URL}/api/binti-plus/${taskId}/status`);
            if (statusRes.data.status === 'complete') {
              const reply = statusRes.data.message || '';
              const test = statusRes.data.test_content || null;
              setMessages(prev => [...prev, { role: 'binti', text: reply }]);
              if (test) setGeneratedTest(test);
              break;
            } else if (statusRes.data.status === 'failed') {
              setMessages(prev => [...prev, { role: 'binti', text: 'Samahani Mwalimu, nilipatwa na tatizo. Tafadhali jaribu tena.' }]);
              break;
            }
          } catch (e) { /* continue polling */ }
        }
        if (attempts >= maxAttempts) {
          setMessages(prev => [...prev, { role: 'binti', text: 'Samahani, inachukua muda mrefu. Jaribu tena baadaye.' }]);
        }
      } else {
        const reply = response.data.message || '';
        if (response.data.test_content) setGeneratedTest(response.data.test_content);
        setMessages(prev => [...prev, { role: 'binti', text: reply }]);
      }
    } catch (error) {
      console.error('Binti+ error:', error);
      if (error.response?.status === 403) {
        setMessages(prev => [...prev, { role: 'binti', text: '**Mwalimu**, Binti Hamdani+ ni kwa Master Plan tu. Tafadhali subscribe kwanza!' }]);
      } else {
        setMessages(prev => [...prev, { role: 'binti', text: 'Samahani Mwalimu, kuna tatizo la mtandao. Jaribu tena.' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => {
    setMessages([{ role: 'binti', text: 'Mazungumzo yamefutwa. Niambie unataka mtihani gani, Mwalimu!' }]);
    setGeneratedTest(null);
  };

  const handlePrint = () => {
    if (!testRef.current) return;
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(`<!DOCTYPE html><html><head><title>Exam Paper</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
          body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6; margin: 2cm; color: #000; }
          h1 { text-align: center; font-size: 14pt; text-transform: uppercase; margin-bottom: 4px; }
          h2 { text-align: center; font-size: 13pt; margin-bottom: 4px; }
          h3 { font-size: 12pt; font-weight: bold; margin-top: 16px; margin-bottom: 8px; text-transform: uppercase; }
          .header-line { text-align: center; margin: 2px 0; }
          .instructions { border: 1px solid #000; padding: 10px; margin: 12px 0; font-style: italic; }
          ol { margin-left: 20px; }
          ol li { margin-bottom: 8px; }
          .section-divider { border-top: 2px solid #000; margin: 16px 0; }
          @media print { body { margin: 1.5cm; } }
        </style>
      </head><body>${testRef.current.innerHTML}</body></html>`);
      printWin.document.close();
      printWin.onload = () => printWin.print();
    }
  };

  const renderMarkdown = (text) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:#f0ede6;padding:1px 4px;border-radius:3px;font-size:0.85em;">$1</code>')
      .replace(/^### (.+)$/gm, '<h4 style="font-weight:700;margin:8px 0 4px;">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 style="font-weight:700;font-size:1rem;margin:8px 0 4px;">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 style="font-weight:700;font-size:1.1rem;margin:8px 0 4px;">$1</h2>')
      .replace(/^\d+\.\s(.+)$/gm, '<li style="margin-left:16px;list-style:decimal;">$1</li>')
      .replace(/^[-*]\s(.+)$/gm, '<li style="margin-left:16px;list-style:disc;">$1</li>')
      .replace(/\n/g, '<br/>');
  };

  const subjects = syllabus === 'Tanzania Mainland' ? SUBJECTS_MAINLAND : SUBJECTS_ZANZIBAR;

  return (
    <div className="binti-plus-container" data-testid="binti-hamdani-plus">
      {/* Left Panel - Chat */}
      <div className="binti-plus-chat">
        {/* Header */}
        <div className="binti-plus-header">
          <div className="binti-plus-avatar">
            <img src={BINTI_ICON} alt="Binti Hamdani+" />
          </div>
          <div className="binti-plus-title">
            <h2>Binti Hamdani+</h2>
            <span className="binti-plus-badge">Test Generator</span>
          </div>
          <div className="binti-plus-actions">
            <select
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
              className="binti-plus-syllabus-select"
              data-testid="binti-plus-syllabus"
            >
              <option value="Tanzania Mainland">NECTA (Mainland)</option>
              <option value="Zanzibar">ZEC (Zanzibar)</option>
            </select>
            <button onClick={clearChat} className="binti-plus-clear" title="Clear chat" data-testid="binti-plus-clear">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Subjects */}
        <div className="binti-plus-subjects">
          {subjects.slice(0, 8).map(s => (
            <button
              key={s}
              onClick={() => setInput(`Create a ${s} test for `)}
              className="binti-subject-chip"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="binti-plus-messages" data-testid="binti-plus-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`binti-msg ${msg.role === 'user' ? 'binti-msg-user' : 'binti-msg-binti'}`}>
              {msg.role === 'binti' && (
                <div className="binti-msg-avatar">
                  <img src={BINTI_ICON} alt="" />
                </div>
              )}
              <div className={`binti-msg-bubble ${msg.role === 'user' ? 'binti-bubble-user' : 'binti-bubble-binti'}`}>
                {msg.role === 'binti' ? (
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="binti-msg binti-msg-binti">
              <div className="binti-msg-avatar"><img src={BINTI_ICON} alt="" /></div>
              <div className="binti-bubble-binti" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px' }}>
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#2D5A27' }} />
                <span style={{ fontSize: '13px', color: '#6b7c67' }}>Binti anaandika mtihani...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="binti-plus-input-area">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Create me English Form 2 mid-term test, topics: Tenses and Comprehension, total 50 marks"
            rows={2}
            className="binti-plus-input"
            data-testid="binti-plus-input"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="binti-plus-send"
            data-testid="binti-plus-send"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Right Panel - Test Preview */}
      <div className="binti-plus-preview">
        {generatedTest ? (
          <>
            <div className="binti-preview-toolbar">
              <h3><FileText className="w-4 h-4" /> Exam Paper Preview</h3>
              <div className="binti-preview-actions">
                <button onClick={handlePrint} className="binti-preview-btn" data-testid="binti-plus-print">
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
            </div>
            <div className="binti-preview-paper" ref={testRef} data-testid="binti-plus-paper">
              <div dangerouslySetInnerHTML={{ __html: generatedTest }} />
            </div>
          </>
        ) : (
          <div className="binti-preview-empty">
            <img src={BINTI_ICON} alt="Binti Hamdani+" className="binti-empty-icon" />
            <h3>Mtihani utaonekana hapa</h3>
            <p>Mwambie Binti Hamdani+ aina ya mtihani unaotaka — somo, darasa, mada, na alama — naye atakuandikia mtihani kamili kwa muundo rasmi.</p>
            <div className="binti-empty-examples">
              <button onClick={() => setInput('Create English Standard 7 first term test, topics: Grammar, Comprehension, Composition. Total 100 marks')}>
                English Std 7 Test
              </button>
              <button onClick={() => setInput('Tengeneza mtihani wa Kiswahili Kidato cha 2, mada: Sarufi na Fasihi, alama 100')}>
                Kiswahili Form 2
              </button>
              <button onClick={() => setInput('Create Mathematics Form 4 mock exam covering Algebra, Geometry and Statistics, 100 marks')}>
                Maths Form 4 Mock
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BintiHamdaniPlus;
