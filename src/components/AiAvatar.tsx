import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Sparkles, MessageSquare, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface AiAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  isAnalyzing: boolean;
  currentSpeechText?: string;
  onToggleMute?: () => void;
  onReplayVoice?: () => void;
  isMuted?: boolean;
}

export const AiAvatar: React.FC<AiAvatarProps> = ({
  isSpeaking,
  isListening,
  isAnalyzing,
  currentSpeechText,
  onToggleMute,
  onReplayVoice,
  isMuted,
}) => {
  const [blink, setBlink] = useState(false);
  const [mouthFrame, setMouthFrame] = useState(0);
  const [headTilt, setHeadTilt] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset expansion when speech text changes
  useEffect(() => {
    setIsExpanded(false);
  }, [currentSpeechText]);

  // Blinking loop: random interval between 3 to 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3500 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  // Subtle natural head movement
  useEffect(() => {
    const tiltInterval = setInterval(() => {
      setHeadTilt(prev => (prev === 0 ? (Math.random() > 0.5 ? 1.5 : -1.5) : 0));
    }, 4000);
    return () => clearInterval(tiltInterval);
  }, []);

  // Viseme / mouth animation while speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthFrame(0);
      return;
    }
    const mouthInterval = setInterval(() => {
      setMouthFrame(prev => (prev + 1) % 4);
    }, 140);

    return () => clearInterval(mouthInterval);
  }, [isSpeaking]);

  return (
    <div className="relative w-full rounded-[26px] bg-gradient-to-br from-[#172c5a] to-[#15133e] border border-[#394b86] p-5 shadow-2xl overflow-hidden flex flex-col items-center justify-between min-h-[340px]">
      {/* Background ambient lighting effects matching uploaded frontend */}
      <div className="absolute -top-16 -right-12 w-48 h-48 bg-[#5645d8]/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-12 w-48 h-48 bg-[#219bff]/20 rounded-full blur-2xl pointer-events-none" />

      {/* Top Bar inside Avatar card */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSpeaking
                  ? 'bg-[#a66bff]'
                  : isListening
                  ? 'bg-emerald-400'
                  : isAnalyzing
                  ? 'bg-amber-400'
                  : 'bg-blue-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isSpeaking
                  ? 'bg-[#a66bff]'
                  : isListening
                  ? 'bg-emerald-500'
                  : isAnalyzing
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`}
            />
          </span>
          <span className="text-xs font-semibold tracking-wide uppercase text-[#c7d2ef]">
            {isSpeaking
              ? 'Interviewer Speaking'
              : isListening
              ? 'Candidate Speaking'
              : isAnalyzing
              ? 'Evaluating Response...'
              : 'Interviewer Ready'}
          </span>
        </div>

        {onToggleMute && (
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-full bg-[#101d40]/80 hover:bg-[#1a2d5e] text-[#b8c5e6] hover:text-white transition cursor-pointer border border-[#394b86]"
            title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#55b9ff]" />}
          </button>
        )}
      </div>

      {/* Human-like Animated Avatar Canvas / SVG */}
      <div className="relative my-4 flex items-center justify-center">
        {/* Pulsing soundwave ring when speaking */}
        {isSpeaking && (
          <div className="absolute inset-0 -m-4 rounded-full border-2 border-[#a66bff]/60 animate-ping pointer-events-none" />
        )}
        {isListening && (
          <div className="absolute inset-0 -m-3 rounded-full border-2 border-emerald-400/50 animate-pulse pointer-events-none" />
        )}

        <div
          className="relative w-36 h-36 md:w-44 md:h-44 rounded-full p-1 bg-gradient-to-tr from-[#398fe0] via-[#8c79ff] to-[#9560ed] shadow-lg transition-transform duration-700 ease-out"
          style={{ transform: `rotate(${headTilt}deg)` }}
        >
          {/* Avatar Face Container */}
          <div className="w-full h-full rounded-full bg-[#101835] overflow-hidden flex flex-col items-center justify-center relative">
            <svg
              viewBox="0 0 120 120"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#253568" />
                  <stop offset="100%" stopColor="#121a38" />
                </linearGradient>
                <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8c79ff" />
                  <stop offset="100%" stopColor="#4338ca" />
                </linearGradient>
                <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#67e8f9" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>

              {/* Shoulders / Professional Collar */}
              <path
                d="M15 120 C15 95 35 90 60 90 C85 90 105 95 105 120 Z"
                fill="#1e2c56"
              />
              <path
                d="M48 90 L60 106 L72 90 Z"
                fill="#7c3aed"
              />

              {/* Head / Neck */}
              <rect x="52" y="74" width="16" height="20" rx="4" fill="#2d3f78" />
              <ellipse cx="60" cy="55" rx="30" ry="34" fill="url(#faceGrad)" stroke="#394b86" strokeWidth="1.5" />

              {/* Stylized Modern Tech Hair */}
              <path
                d="M30 46 C30 26 44 18 60 18 C76 18 90 26 90 46 C86 36 78 30 60 30 C42 30 34 36 30 46 Z"
                fill="url(#hairGrad)"
              />

              {/* Eyebrows */}
              <path
                d="M42 42 Q48 40 54 42"
                stroke="#a5b4fc"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M66 42 Q72 40 78 42"
                stroke="#a5b4fc"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Eyes with blinking logic */}
              {blink ? (
                <>
                  <path d="M43 49 Q48 53 53 49" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M67 49 Q72 53 77 49" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" />
                </>
              ) : (
                <>
                  {/* Left Eye */}
                  <ellipse cx="48" cy="49" rx="5" ry="5.5" fill="#0f172a" />
                  <ellipse cx="48" cy="49" rx="3.5" ry="4" fill="url(#eyeGrad)" />
                  <circle cx="49.5" cy="47.5" r="1.3" fill="#ffffff" />

                  {/* Right Eye */}
                  <ellipse cx="72" cy="49" rx="5" ry="5.5" fill="#0f172a" />
                  <ellipse cx="72" cy="49" rx="3.5" ry="4" fill="url(#eyeGrad)" />
                  <circle cx="73.5" cy="47.5" r="1.3" fill="#ffffff" />
                </>
              )}

              {/* Glasses frame (distinguished AI interviewer look) */}
              <rect x="40" y="43" width="16" height="13" rx="4" fill="none" stroke="#60a5fa" strokeWidth="1.2" opacity="0.8" />
              <rect x="64" y="43" width="16" height="13" rx="4" fill="none" stroke="#60a5fa" strokeWidth="1.2" opacity="0.8" />
              <path d="M56 49 L64 49" stroke="#60a5fa" strokeWidth="1.2" opacity="0.8" />

              {/* Nose */}
              <path d="M60 52 L58 60 L62 60" stroke="#4b6099" strokeWidth="1.5" strokeLinecap="round" />

              {/* Mouth with viseme speech animation */}
              {isSpeaking ? (
                mouthFrame === 0 ? (
                  <ellipse cx="60" cy="69" rx="6" ry="4" fill="#f43f5e" />
                ) : mouthFrame === 1 ? (
                  <rect x="54" y="68" width="12" height="3" rx="1.5" fill="#f43f5e" />
                ) : mouthFrame === 2 ? (
                  <ellipse cx="60" cy="70" rx="4.5" ry="6" fill="#be123c" />
                ) : (
                  <ellipse cx="60" cy="69" rx="7" ry="2.5" fill="#f43f5e" />
                )
              ) : isListening ? (
                // Attentive soft smile
                <path d="M54 68 Q60 72 66 68" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" fill="none" />
              ) : (
                // Neutral professional expression
                <path d="M55 69 L65 69" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Speech Bubble / Dialogue Output matching existing frontend styling */}
      <div className="w-full z-10 mt-1">
        <div className="border border-[#8c79ff] rounded-[18px] p-3 text-sm md:text-base font-semibold text-[#e5dcff] bg-[#171c49] shadow-md flex flex-col gap-2">
          <div className="flex items-start gap-2.5">
            <MessageSquare className="w-4 h-4 text-[#a66bff] shrink-0 mt-0.5" />
            <div className={`leading-relaxed flex-1 ${!isExpanded && (currentSpeechText?.length || 0) > 130 ? 'line-clamp-2' : ''}`}>
              {currentSpeechText || 'Welcome! I will be your interviewer today. Please answer clearly when prompted.'}
            </div>
          </div>

          {/* See More / See Less button & Replay Voice */}
          {((currentSpeechText?.length || 0) > 130 || onReplayVoice) && (
            <div className="flex items-center justify-between pt-1 border-t border-[#8c79ff]/30 text-xs">
              {(currentSpeechText?.length || 0) > 130 ? (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-[#55b9ff] hover:text-[#a66bff] font-medium flex items-center gap-1 cursor-pointer transition"
                >
                  {isExpanded ? (
                    <>
                      <span>See Less</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>See More</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              ) : <div />}

              {onReplayVoice && (
                <button
                  type="button"
                  onClick={onReplayVoice}
                  className="text-[#cbd5f3] hover:text-white font-medium flex items-center gap-1 cursor-pointer transition"
                  title="Replay Voice"
                >
                  <RotateCcw className="w-3 h-3 text-[#55b9ff]" />
                  <span>Replay Voice</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
