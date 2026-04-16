import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send, Loader2, Trash2, Minimize2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BintiChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'binti', text: 'Hujambo Mwalimu! I am **Binti Hamdani**, your curriculum expert. Ask me anything about lesson plans, schemes of work, or how to use Mi-LessonPlan.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const getCurrentPage = () => {
    const path = window.location.pathname;
    if (path.includes('dashboard')) return 'Dashboard (Lesson Plan Creator)';
    if (path.includes('hub')) return 'My Hub';
    if (path.includes('scheme')) return 'Scheme of Work';
    return 'App';
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const endpoint = user ? '/api/binti-chat' : '/api/binti-public';
      const payload = {
        message: text,
        context: { current_page: getCurrentPage() },
        conversation_history: messages.slice(-10)
      };

      const response = await axios.post(`${API_URL}${endpoint}`, payload, { withCredentials: true });
      const reply = response.data.message || response.data?.data?.message || 'Samahani, I could not process that.';
      setMessages(prev => [...prev, { role: 'binti', text: reply }]);
    } catch (error) {
      console.error('Binti chat error:', error);
      setMessages(prev => [...prev, { role: 'binti', text: 'Samahani Mwalimu, I had trouble connecting. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      { role: 'binti', text: 'Hujambo Mwalimu! Chat cleared. How can I help you today?' }
    ]);
  };

  const renderMarkdown = (text) => {
    let html = text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-black/10 px-1 rounded text-xs">$1</code>')
      .replace(/^### (.+)$/gm, '<h4 class="font-bold mt-2 mb-1">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="font-bold text-sm mt-2 mb-1">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 class="font-bold text-base mt-2 mb-1">$1</h2>')
      .replace(/^\d+\.\s(.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
      .replace(/^[-*]\s(.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\n/g, '<br/>');
    
    html = html.replace(/(<li[^>]*>.*<\/li>)(<br\/>)?/g, '$1');
    return html;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#2D5A27] text-white rounded-full shadow-lg hover:bg-[#21441C] transition-all hover:scale-110 flex items-center justify-center group"
        data-testid="binti-chat-toggle"
        aria-label="Chat with Binti Hamdani"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-10 right-0 bg-[#1A2E16] text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
          Ask Binti Hamdani
        </span>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 bg-[#2D5A27] text-white rounded-full shadow-lg px-5 py-3 cursor-pointer hover:bg-[#21441C] transition-all flex items-center gap-2"
        data-testid="binti-chat-minimized"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-medium">Binti Hamdani</span>
        {messages.length > 1 && (
          <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{messages.length}</span>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-2xl border border-[#E4DFD5] flex flex-col overflow-hidden" data-testid="binti-chat-window">
      {/* Header */}
      <div className="bg-[#2D5A27] text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight">Binti Hamdani</h3>
          <p className="text-[10px] text-white/70 leading-tight">Curriculum Expert</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearChat} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Clear chat" data-testid="binti-clear-chat">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Minimize" data-testid="binti-minimize">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Close" data-testid="binti-close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" data-testid="binti-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#2D5A27] text-white rounded-br-md'
                  : 'bg-[#F2EFE8] text-[#1A2E16] rounded-bl-md'
              }`}
            >
              {msg.role === 'binti' ? (
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
              ) : (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#F2EFE8] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-[#2D5A27] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[#2D5A27] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[#2D5A27] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts for empty state */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {['Help me plan a lesson', 'How to create a scheme?', 'What subjects do you support?'].map((q) => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
              className="text-xs bg-[#F2EFE8] text-[#4A5B46] px-2.5 py-1.5 rounded-full hover:bg-[#E4DFD5] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-3 border-t border-[#E4DFD5] flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Binti anything..."
            rows={1}
            className="flex-1 resize-none border border-[#E4DFD5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27]/20 max-h-20 min-h-[38px]"
            style={{ height: 'auto', minHeight: '38px' }}
            onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'; }}
            data-testid="binti-input"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 bg-[#2D5A27] text-white rounded-xl flex items-center justify-center hover:bg-[#21441C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            data-testid="binti-send"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BintiChat;
