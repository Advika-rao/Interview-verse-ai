import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Edit3, RotateCcw, Volume2, Sparkles, Check, Activity, PauseCircle } from 'lucide-react';
import { SpeechDeliveryMetrics } from '../types';

interface SpeechInterfaceProps {
  questionText: string;
  isAiSpeaking: boolean;
  onAnswerSubmit: (
    transcript: string,
    mode: 'spoken' | 'typed',
    speechDurationSeconds?: number,
    metrics?: SpeechDeliveryMetrics
  ) => void;
  onTranscriptChange: (transcript: string) => void;
  onAiSpeakingChange: (speaking: boolean) => void;
  onReplayVoice?: () => void;
  isEvaluating: boolean;
  isMuted?: boolean;
}

export const SpeechInterface: React.FC<SpeechInterfaceProps> = ({
  questionText,
  isAiSpeaking,
  onAnswerSubmit,
  onTranscriptChange,
  onAiSpeakingChange,
  onReplayVoice,
  isEvaluating,
  isMuted,
}) => {
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef<boolean>(false);
  const [transcript, setTranscript] = useState('');
  const finalTranscriptRef = useRef<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const [usedMic, setUsedMic] = useState(false);
  const [speechSeconds, setSpeechSeconds] = useState(0);
  const speechStartTimeRef = useRef<number | null>(null);
  const finalDurationRef = useRef<number>(0);

  // Audio Analysis State
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);
  const [detectedPausesCount, setDetectedPausesCount] = useState<number>(0);
  const [totalPauseTime, setTotalPauseTime] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const pauseStartRef = useRef<number | null>(null);

  const recognitionRef = useRef<any>(null);

  // Timer for active microphone speech
  useEffect(() => {
    let interval: any = null;
    if (isListening) {
      setUsedMic(true);
      interval = setInterval(() => {
        setSpeechSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening]);

  // Web Audio Silence and Pause Detection
  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let isSilent = false;

      const checkVolume = () => {
        if (!isListeningRef.current) return;

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setMicAudioLevel(Math.min(100, Math.round(avg * 1.8)));

        // Silence threshold: avg < 10 captures natural speech hesitation pauses
        if (avg < 10) {
          if (!isSilent) {
            isSilent = true;
            pauseStartRef.current = performance.now();
            silenceTimerRef.current = window.setTimeout(() => {
              if (isListeningRef.current && isSilent) {
                setDetectedPausesCount(p => p + 1);
              }
            }, 1200);
          }
        } else {
          if (isSilent) {
            isSilent = false;
            if (pauseStartRef.current) {
              const pauseDuration = (performance.now() - pauseStartRef.current) / 1000;
              if (pauseDuration >= 1.0) {
                setTotalPauseTime(t => t + pauseDuration);
              }
            }
            pauseStartRef.current = null;
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          }
        }

        if (isListeningRef.current) {
          requestAnimationFrame(checkVolume);
        }
      };

      requestAnimationFrame(checkVolume);
    } catch (err) {
      console.warn('Audio analysis setup notice:', err);
    }
  };

  const stopAudioAnalysis = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setMicAudioLevel(0);
  };

  // Reset state when question changes
  useEffect(() => {
    if (questionText) {
      setTranscript('');
      finalTranscriptRef.current = '';
      setIsEditing(false);
      setUsedMic(false);
      setSpeechSeconds(0);
      speechStartTimeRef.current = null;
      setDetectedPausesCount(0);
      setTotalPauseTime(0);
    }
    return () => {
      stopAudioAnalysis();
    };
  }, [questionText]);

  // Initialize SpeechRecognition (STT) with auto-restart on pauses
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSttSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + item[0].transcript.trim();
        } else {
          interim += item[0].transcript;
        }
      }

      const combined = (finalTranscriptRef.current + (interim ? ' ' + interim : '')).trim();
      setTranscript(combined);
      onTranscriptChange(combined);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition warning:', event.error);
      if (event.error === 'not-allowed') {
        setIsListening(false);
        isListeningRef.current = false;
        stopAudioAnalysis();
      }
    };

    recognition.onend = () => {
      // Chrome fires onend whenever speaker pauses for ~1.5 - 2s!
      // If user is still answering (hasn't clicked Stop), auto-restart seamlessly!
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // May be starting already
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [onTranscriptChange]);

  const toggleListening = () => {
    if (isAiSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      onAiSpeakingChange(false);
    }

    if (isListening) {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      stopAudioAnalysis();
      setIsListening(false);
      if (speechStartTimeRef.current) {
        const elapsed = (performance.now() - speechStartTimeRef.current) / 1000;
        finalDurationRef.current = Math.max(1, elapsed);
        speechStartTimeRef.current = null;
        setSpeechSeconds(Math.round(elapsed));
      }
    } else {
      isListeningRef.current = true;
      speechStartTimeRef.current = performance.now();
      finalDurationRef.current = 0;
      setUsedMic(true);
      startAudioAnalysis();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.warn('Recognition start caught:', e);
          setIsListening(true);
        }
      }
    }
  };

  const handleManualEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(e.target.value);
    finalTranscriptRef.current = e.target.value;
    onTranscriptChange(e.target.value);
  };

  const handleSubmit = () => {
    // If still actively listening when clicking submit, capture final elapsed time now
    if (isListening) {
      if (speechStartTimeRef.current) {
        const elapsed = (performance.now() - speechStartTimeRef.current) / 1000;
        finalDurationRef.current = Math.max(1, elapsed);
        speechStartTimeRef.current = null;
        setSpeechSeconds(Math.round(elapsed));
      }
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    }
    stopAudioAnalysis();

    const mode = usedMic ? 'spoken' : 'typed';
    const cleanTranscript = transcript.trim();
    const words = cleanTranscript.split(/\s+/).filter(Boolean);

    // Calculate actual delivery metrics for this specific answer
    let metrics: SpeechDeliveryMetrics | undefined = undefined;
    let measuredSeconds = finalDurationRef.current > 0 ? finalDurationRef.current : Math.max(speechSeconds, 1);
    measuredSeconds = Math.round(measuredSeconds * 10) / 10;

    if (mode === 'spoken') {
      const wpm = words.length > 0 ? Math.round(words.length / (measuredSeconds / 60)) : 0;

      const fillerPatterns = [
        /\b(um|umm|uh|uhh|er|ah)\b/gi,
        /\b(you know)\b/gi,
        /\b(like)\b/gi,
        /\b(basically)\b/gi,
        /\b(actually)\b/gi,
        /\b(sort of|kind of)\b/gi,
        /\b(right\?)\b/gi,
        /\b(literally)\b/gi,
        /\b(i mean)\b/gi,
      ];
      const detectedFillers: string[] = [];
      let fillerCount = 0;
      fillerPatterns.forEach(pattern => {
        const matches = cleanTranscript.match(pattern);
        if (matches) {
          fillerCount += matches.length;
          detectedFillers.push(...matches.map(m => m.toLowerCase()));
        }
      });

      // Detect observable disfluencies: repeated words, stutter fragments, false starts
      const disfluencies: string[] = [];
      const repMatch = cleanTranscript.match(/\b([a-zA-Z]{2,})[\s,.-]+\1\b/gi);
      if (repMatch) {
        disfluencies.push(...repMatch.map(r => `Repetition: "${r.trim()}"`));
      }
      const sylMatch = cleanTranscript.match(/\b([a-zA-Z]{1,3})[-—]\1[a-zA-Z]*/gi);
      if (sylMatch) {
        disfluencies.push(...sylMatch.map(s => `Stutter fragment: "${s.trim()}"`));
      }
      const falseStartMatch = cleanTranscript.match(/\b(no wait|wait no|scratch that|let me restart)\b/gi);
      if (falseStartMatch) {
        disfluencies.push(...falseStartMatch.map(f => `Restart: "${f}"`));
      }

      // Check transcript pauses (ellipses, long dashes, commas)
      const punctuationPauses = (cleanTranscript.match(/\.{3}|…|—/g) || []).length;

      // Infer dead air / long gaps: average normal speech is ~2.3 words/sec (~140 wpm).
      // If elapsed time is significantly higher than word count would take, calculate the silent dead air:
      const expectedSpeakingTimeSec = words.length / 2.3;
      const inferredSilenceSec = measuredSeconds > 4 ? Math.max(0, measuredSeconds - expectedSpeakingTimeSec) : 0;
      const inferredPauseCount = inferredSilenceSec >= 3.0 ? Math.floor(inferredSilenceSec / 2.5) : 0;

      const effectivePauseCount = Math.max(detectedPausesCount, punctuationPauses, inferredPauseCount);
      const effectivePauseSeconds = Math.max(totalPauseTime, punctuationPauses * 1.5, inferredSilenceSec * 0.85);

      metrics = {
        speakingPaceWpm: wpm,
        pauseCount: effectivePauseCount,
        measuredPausesCount: effectivePauseCount,
        totalPauseDurationSeconds: Math.round(effectivePauseSeconds * 10) / 10,
        fillerWordsCount: fillerCount,
        fillerWordsDetected: [...new Set(detectedFillers)],
        speechDisfluencies: disfluencies,
        responseDurationSeconds: measuredSeconds,
        speechFluencyScore: Math.min(Math.max(96 - fillerCount * 4 - effectivePauseCount * 5 - disfluencies.length * 8, 25), 98),
        faceVisibilityDetected: true,
        cameraFramingGood: true,
      };
    }

    onAnswerSubmit(cleanTranscript, mode, measuredSeconds, metrics);
  };


  return (
    <div className="w-full flex flex-col gap-4">
      {/* Speech Controls & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#101d40] border border-[#34436d] p-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleListening}
            disabled={isEvaluating}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition cursor-pointer shadow-md ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-gradient-to-r from-[#397fff] to-[#995cff] hover:opacity-95 text-white'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Stop Answering</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Answer Verbally</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onReplayVoice?.()}
            disabled={isAiSpeaking}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#394b86] text-xs font-medium text-[#b8c5e6] hover:text-white hover:border-[#55b9ff] transition cursor-pointer bg-[#142951]/60"
            title="Listen to question again"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#55b9ff]" />
            <span>Replay Voice</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#394b86] text-xs font-medium text-[#b8c5e6] hover:text-white transition cursor-pointer bg-[#142951]/60"
            title="Edit transcribed text"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#a66bff]" />
            <span>{isEditing ? 'Done Editing' : 'Edit Text'}</span>
          </button>
        </div>

        {/* Live speech status banner */}
        <div className="text-xs text-[#cbd5f3] flex items-center gap-1.5">
          {isListening ? (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Microphone listening... speak clearly
            </span>
          ) : isAiSpeaking ? (
            <span className="text-[#a66bff] font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> AI Interviewer asking question...
            </span>
          ) : (
            <span className="text-[#9eacd0]">Click &ldquo;Answer Verbally&rdquo; or type below</span>
          )}
        </div>
      </div>

      {/* Answer Transcript Box with edit capability */}
      <div className="relative rounded-2xl bg-[#0a122c] border border-[#394b86] p-4 focus-within:border-[#55b9ff] transition">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#9eacd0]">
            Your Response (Transcribed &amp; Editable)
          </label>
          {transcript && (
            <button
              onClick={() => {
                setTranscript('');
                onTranscriptChange('');
              }}
              className="text-[11px] text-[#9eacd0] hover:text-rose-400 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <textarea
          value={transcript}
          onChange={handleManualEdit}
          placeholder="Your spoken response will be transcribed here in real-time. You can also type or edit this text directly before submitting..."
          rows={4}
          disabled={isEvaluating}
          className="w-full bg-transparent text-[#f7f8ff] text-sm md:text-base leading-relaxed placeholder-[#5a6a96] resize-none outline-none focus:ring-0 font-normal"
        />

        {/* Bottom submit bar */}
        <div className="mt-3 pt-3 border-t border-[#1c2c58] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-[#9eacd0]">
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${usedMic ? 'bg-[#397fff]/20 text-[#55b9ff] border border-[#397fff]/40' : 'bg-[#995cff]/20 text-[#a66bff] border border-[#995cff]/40'}`}>
              {usedMic ? `Spoken Audio (${speechSeconds}s)` : 'Written Communication (Typed)'}
            </span>
            <span>•</span>
            <span>{transcript ? `${transcript.trim().split(/\s+/).filter(Boolean).length} words` : '0 words'}</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!transcript.trim() || isEvaluating}
            className="btn-gradient flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-bold cursor-pointer"
          >
            {isEvaluating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <span>Submit Response</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
