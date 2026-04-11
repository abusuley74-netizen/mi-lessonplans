import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Volume2, Languages, Loader2, Save, Play, Pause, Download } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LANGUAGES = [
  { code: 'en-GB', name: 'British English', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'sw', name: 'Swahili', flag: '\u{1F1F9}\u{1F1FF}' },
  { code: 'ar', name: 'Arabic', flag: '\u{1F1F8}\u{1F1E6}' },
  { code: 'tr', name: 'Turkish', flag: '\u{1F1F9}\u{1F1F7}' },
  { code: 'fr', name: 'French', flag: '\u{1F1EB}\u{1F1F7}' },
];

const MAX_WORDS = 200;

const Dictation = () => {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en-GB');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > MAX_WORDS;

  const handleTextChange = (e) => {
    setText(e.target.value);
    // Clear previous audio when text changes
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setAudioBlob(null);
      setIsPlaying(false);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    }
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
    if (audioUrl) { URL.revokeObjectURL(audioUrl); }
    setAudioUrl(null);
    setAudioBlob(null);
    setIsPlaying(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

    try {
      const response = await axios.post(
        `${API_URL}/api/dictation/generate`,
        { text, language },
        { withCredentials: true, responseType: 'blob' }
      );

      // Verify we got audio data, not an error response
      if (response.data.type && response.data.type.startsWith('application/json')) {
        const errorText = await response.data.text();
        const errorJson = JSON.parse(errorText);
        toast.error(errorJson.detail || 'Failed to generate audio');
        return;
      }

      const blob = response.data;
      const url = URL.createObjectURL(blob);
      setAudioBlob(blob);
      setAudioUrl(url);
      toast.success('Audio generated successfully!');
    } catch (error) {
      console.error('Error generating audio:', error);
      const msg = error.response?.data?.detail || 'Failed to generate audio. Please try again.';
      toast.error(typeof msg === 'string' ? msg : 'Failed to generate audio.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioUrl) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch((err) => {
      console.error('Playback error:', err);
      toast.error('Failed to play audio');
    });
    audio.onended = () => { setIsPlaying(false); audioRef.current = null; };
    audio.onerror = () => { setIsPlaying(false); toast.error('Audio playback error'); };
  };

  const handleSave = async () => {
    if (!audioBlob) {
      toast.warning('Please generate audio first');
      return;
    }
    if (!title.trim()) {
      toast.warning('Please enter a title for this dictation');
      return;
    }

    try {
      // Convert audio blob to base64 for storage
      const reader = new FileReader();
      const audioBase64 = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      await axios.post(
        `${API_URL}/api/dictations`,
        {
          title,
          text,
          language,
          audio_data: audioBase64,
          created_at: new Date().toISOString()
        },
        { withCredentials: true }
      );
      
      setSaved(true);
      toast.success('Dictation saved to My Files!');
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
        <p className="text-[#7A8A76]">Type text in any language and hear it spoken in your selected language</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white border border-[#E4DFD5] rounded-xl p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#4A5B46] mb-2">
              <Languages className="w-4 h-4 inline mr-2" />
              Output Language (translate & speak in)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); setAudioBlob(null); } }}
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
                Enter Text in any language (max {MAX_WORDS} words)
              </label>
              <span className={`text-sm ${isOverLimit ? 'text-red-500 font-bold' : 'text-[#7A8A76]'}`}>
                {wordCount} / {MAX_WORDS} words
              </span>
            </div>
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="Type or paste text in any language. It will be translated and spoken in the selected output language..."
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
                Text exceeds {MAX_WORDS} words. Please shorten it.
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
                Translating & Generating Audio...
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
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePlayPause}
                    className="w-12 h-12 rounded-full bg-[#2D5A27] text-white flex items-center justify-center hover:bg-[#21441C] transition-colors flex-shrink-0"
                    data-testid="audio-play-pause-btn"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1A2E16]">
                      {isPlaying ? 'Playing...' : 'Ready to play'}
                    </p>
                    <p className="text-xs text-[#7A8A76]">
                      {LANGUAGES.find(l => l.code === language)?.name || language} audio
                    </p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="p-2 text-[#7A8A76] hover:text-[#2D5A27] transition-colors"
                    data-testid="download-audio-inline-btn"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
                {/* HTML5 audio element as fallback */}
                <audio controls className="w-full mt-3" src={audioUrl} data-testid="audio-element">
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
            <h4 className="font-medium text-[#1A2E16] mb-2">How it works:</h4>
            <ol className="text-sm text-[#7A8A76] space-y-1 list-decimal list-inside">
              <li>Type or paste text in any language</li>
              <li>Select the output language you want to hear</li>
              <li>Click "Generate Audio" - text is translated then spoken</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dictation;
