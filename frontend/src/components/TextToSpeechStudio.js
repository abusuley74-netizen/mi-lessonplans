import React, { useState, useEffect, useRef } from 'react';
import './TextToSpeechStudio.css';

const TextToSpeechStudio = () => {
  // State Management
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // idle, recording, processing
  const [error, setError] = useState(null);
  
  // Refs for audio handling
  const utteranceRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // Load available voices on component mount
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const filteredVoices = voices.filter(voice => 
        ['en-US', 'en-GB', 'zh-CN', 'zh-TW', 'ja-JP', 'ko-KR', 'fr-FR', 'de-DE', 'es-ES'].includes(voice.lang)
      );
      setAvailableVoices(filteredVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Language options
  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'zh-CN', name: '中文 (简体)' },
    { code: 'zh-TW', name: '中文 (繁體)' },
    { code: 'ja-JP', name: '日本語' },
    { code: 'ko-KR', name: '한국어' },
    { code: 'fr-FR', name: 'Français' },
    { code: 'de-DE', name: 'Deutsch' },
    { code: 'es-ES', name: 'Español' },
  ];

  // FUNCTION 1: Preview Audio (Play without recording)
  const handlePreview = () => {
    if (!text.trim()) {
      setError('Please enter some text first');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Select appropriate voice
    const voiceForLang = availableVoices.find(voice => voice.lang === selectedLanguage);
    if (voiceForLang) {
      utterance.voice = voiceForLang;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setError('Error playing audio');
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // FUNCTION 2: Stop Playback
  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // FUNCTION 3: Record and Download (MediaRecorder Approach)
  const handleRecordAndDownload = async () => {
    if (!text.trim()) {
      setError('Please enter some text first');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setRecordingStatus('recording');
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Auto-download
        const link = document.createElement('a');
        link.href = url;
        link.download = `speech_${selectedLanguage}_${Date.now()}.wav`;
        link.click();
        
        setRecordingStatus('idle');
        setIsRecording(false);
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Speak the text
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage;
      utterance.rate = 0.9;
      
      utterance.onend = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      };
      
      utterance.onerror = () => {
        setError('Error during recording');
        setRecordingStatus('idle');
        setIsRecording(false);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      };
      
      window.speechSynthesis.speak(utterance);
      
    } catch (err) {
      console.error('Recording error:', err);
      setError('Could not access microphone. Please check permissions.');
      setRecordingStatus('idle');
      setIsRecording(false);
    }
  };

  // FUNCTION 4: Alternative Download using Screen Capture (Better Quality)
  const handleScreenCaptureDownload = async () => {
    if (!text.trim()) {
      setError('Please enter some text first');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setRecordingStatus('recording');
      setError(null);
      
      // Request screen capture with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        audio: true,
        video: true 
      });
      
      // Stop video track immediately (we only need audio)
      stream.getVideoTracks().forEach(track => track.stop());
      streamRef.current = stream;
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `tts_${selectedLanguage}_${Date.now()}.mp3`;
        link.click();
        
        setRecordingStatus('idle');
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorderRef.current.start();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage;
      utterance.rate = 0.9;
      
      utterance.onend = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      };
      
      utterance.onerror = () => {
        setError('Error during recording');
        setRecordingStatus('idle');
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      };
      
      window.speechSynthesis.speak(utterance);
      
    } catch (err) {
      console.error('Screen capture error:', err);
      setError('Screen sharing permission required for high-quality recording');
      setRecordingStatus('idle');
    }
  };

  return (
    <div className="tts-container">
      <h1>Text to Speech Studio</h1>
      
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}
      
      {/* Language Selection */}
      <div className="form-group">
        <label htmlFor="language">Select Language:</label>
        <select
          id="language"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Text Input Area */}
      <div className="form-group">
        <label htmlFor="text">Enter Text:</label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your lesson plan, scheme of work, or any text here..."
          rows={8}
        />
        <div className="char-counter">
          {text.length} characters
        </div>
      </div>

      {/* Action Buttons */}
      <div className="button-group">
        <button 
          onClick={handlePreview}
          disabled={isSpeaking || isRecording || !text.trim()}
          className="btn btn-primary"
        >
          {isSpeaking ? '🔊 Playing...' : '🔊 Preview Audio'}
        </button>
        
        {isSpeaking && (
          <button 
            onClick={handleStop}
            className="btn btn-warning"
          >
            ⏹️ Stop
          </button>
        )}
        
        <button 
          onClick={handleRecordAndDownload}
          disabled={isSpeaking || isRecording || !text.trim()}
          className="btn btn-success"
        >
          {recordingStatus === 'recording' ? '🎙️ Recording...' : '💾 Download as WAV'}
        </button>
        
        <button 
          onClick={handleScreenCaptureDownload}
          disabled={isSpeaking || isRecording || !text.trim()}
          className="btn btn-info"
        >
          🎬 Download as MP3 (Screen Share)
        </button>
      </div>

      {/* Status Indicators */}
      {isRecording && (
        <div className="status-indicator recording">
          🔴 Recording in progress... Please wait.
        </div>
      )}
      
      {recordingStatus === 'processing' && (
        <div className="status-indicator processing">
          ⚙️ Processing audio...
        </div>
      )}

      {/* Audio Preview for Downloaded Files */}
      {audioUrl && (
        <div className="audio-preview">
          <h3>Downloaded Audio Preview:</h3>
          <audio controls src={audioUrl} />
          <button 
            onClick={() => {
              const link = document.createElement('a');
              link.href = audioUrl;
              link.download = `speech_${Date.now()}.wav`;
              link.click();
            }}
            className="btn btn-secondary"
          >
            💾 Download Again
          </button>
        </div>
      )}
    </div>
  );
};

export default TextToSpeechStudio;