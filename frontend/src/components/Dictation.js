import React, { useState } from 'react';
import axios from 'axios';
import { Volume2, Languages, Loader2, Save, Play, Download } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LANGUAGES = [
  { code: 'en-GB', name: 'British English', flag: '🇬🇧' },
  { code: 'sw', name: 'Swahili', flag: '🇹🇿' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
];

const MAX_WORDS = 200;

const Dictation = () => {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en-GB');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > MAX_WORDS;

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    setAudioUrl(null);
    setSaved(false);
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.warning('Please enter some text to convert to speech');
      return;
    }
    if (isOverLimit) {
      toast.warning(`Please reduce your text to ${MAX_WORDS} words or less`);
      return;
    }

    setIsGenerating(true);
    setAudioUrl(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/dictation/generate`,
        { text, language },
        { withCredentials: true, responseType: 'blob' }
      );

      const url = URL.createObjectURL(response.data);
      setAudioUrl(url);
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error('Failed to generate audio. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!audioUrl) {
      toast.warning('Please generate audio first');
      return;
    }
    if (!title.trim()) {
      toast.warning('Please enter a title for this dictation');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/dictations`,
        {
          title,
          text,
          language,
          created_at: new Date().toISOString()
        },
        { withCredentials: true }
      );
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving dictation:', error);
      toast.error('Failed to save dictation. Please try again.');
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `dictation_${language}_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-[#1A2E16] mb-1">Dictation</h2>
        <p className="text-[#7A8A76]">Convert text to speech in multiple languages</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#4A5B46] mb-2">
              <Languages className="w-4 h-4 inline mr-2" />
              Select Language
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    language === lang.code
                      ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                      : 'bg-white text-[#4A5B46] border-[#E4DFD5] hover:border-[#2D5A27]'
                  }`}
                  data-testid={`lang-${lang.code}`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#4A5B46]">
                Enter Text (max {MAX_WORDS} words)
              </label>
              <span className={`text-sm ${isOverLimit ? 'text-red-500 font-bold' : 'text-[#7A8A76]'}`}>
                {wordCount} / {MAX_WORDS} words
              </span>
            </div>
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="Type or paste the text you want to convert to speech..."
              rows={8}
              className={`w-full p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 ${
                isOverLimit
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-[#E4DFD5] focus:ring-[#2D5A27]/20 focus:border-[#2D5A27]'
              }`}
              data-testid="dictation-text"
            />
            {isOverLimit && (
              <p className="text-red-500 text-sm mt-1">
                ⚠️ Text exceeds {MAX_WORDS} words. Please shorten it.
              </p>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim() || isOverLimit}
            className="w-full flex items-center justify-center gap-2 bg-[#D95D39] text-white py-3 rounded-lg font-medium hover:bg-[#BD4D2D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="generate-audio-btn"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Audio...
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                Generate Audio
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-6">
          <h3 className="font-heading font-semibold text-[#1A2E16] mb-4">Audio Output</h3>

          {audioUrl ? (
            <div className="space-y-4">
              {/* Audio Player */}
              <div className="bg-[#F2EFE8] rounded-lg p-4">
                <audio controls className="w-full" src={audioUrl}>
                  Your browser does not support the audio element.
                </audio>
              </div>

              {/* Save Section */}
              <div className="border-t border-[#E4DFD5] pt-4">
                <label className="block text-sm font-medium text-[#4A5B46] mb-2">
                  Save to My Files
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for this dictation..."
                  className="w-full p-3 border border-[#E4DFD5] rounded-lg mb-3 focus:outline-none focus:border-[#2D5A27]"
                  data-testid="dictation-title"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors ${
                      saved
                        ? 'bg-green-500 text-white'
                        : 'bg-[#2D5A27] text-white hover:bg-[#21441C]'
                    }`}
                    data-testid="save-dictation-btn"
                  >
                    <Save className="w-4 h-4" />
                    {saved ? 'Saved!' : 'Save'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[#E4DFD5] rounded-lg font-medium text-[#4A5B46] hover:bg-[#F2EFE8] transition-colors"
                    data-testid="download-audio-btn"
                  >
                    <Download className="w-4 h-4" />
                    Download MP3
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-[#F2EFE8] rounded-full flex items-center justify-center mb-4">
                <Volume2 className="w-8 h-8 text-[#8E9E82]" />
              </div>
              <p className="text-[#7A8A76] mb-2">No audio generated yet</p>
              <p className="text-sm text-[#A0A0A0]">
                Enter text and click "Generate Audio" to create speech
              </p>
            </div>
          )}

          {/* Language Info */}
          <div className="mt-6 p-4 bg-[#F8F8F8] rounded-lg">
            <h4 className="font-medium text-[#1A2E16] mb-2">Supported Languages:</h4>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <span key={lang.code} className="text-sm text-[#7A8A76]">
                  {lang.flag} {lang.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dictation;
