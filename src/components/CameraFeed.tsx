import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Mic, MicOff, AlertCircle, CheckCircle2, UserCheck, Activity } from 'lucide-react';
import { SpeechDeliveryMetrics } from '../types';

interface CameraFeedProps {
  isRecording: boolean;
  transcript: string;
  onMetricsUpdate?: (metrics: SpeechDeliveryMetrics) => void;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  isRecording,
  transcript,
  onMetricsUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [micActive, setMicActive] = useState<boolean>(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(true);
  const [isFramingCentered, setIsFramingCentered] = useState<boolean>(true);

  // Delivery Metrics State
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [wpm, setWpm] = useState<number>(0);
  const [fillerWordsCount, setFillerWordsCount] = useState<number>(0);
  const [fillersList, setFillersList] = useState<string[]>([]);
  const [pauseCount, setPauseCount] = useState<number>(0);

  // Timer during active candidate recording
  useEffect(() => {
    let timer: any = null;
    if (isRecording) {
      timer = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
    } else {
      // Don't reset duration immediately so candidate sees final metrics
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  // Analyze speech metrics from transcript
  useEffect(() => {
    if (!transcript) return;

    const words = transcript.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Calculate words per minute based on duration
    const minutes = Math.max(durationSeconds / 60, 0.1);
    const calculatedWpm = Math.round(wordCount / minutes);
    setWpm(calculatedWpm);

    // Detect filler words
    const fillerPatterns = [
      /\b(um|umm|uh|uhh)\b/gi,
      /\b(like)\b/gi,
      /\b(you know)\b/gi,
      /\b(basically)\b/gi,
      /\b(actually)\b/gi,
      /\b(sort of|kind of)\b/gi,
    ];

    const detected: string[] = [];
    let count = 0;
    fillerPatterns.forEach(pattern => {
      const matches = transcript.match(pattern);
      if (matches) {
        count += matches.length;
        detected.push(...matches.map(m => m.toLowerCase()));
      }
    });

    setFillerWordsCount(count);
    setFillersList([...new Set(detected)]);

    // Estimate pauses based on ellipses or punctuation
    const pauses = (transcript.match(/\.{3}|,|—|\.\s/g) || []).length;
    setPauseCount(pauses);

    // Notify parent of updated metrics
    if (onMetricsUpdate) {
      onMetricsUpdate({
        speakingPaceWpm: calculatedWpm,
        pauseCount: pauses,
        fillerWordsCount: count,
        fillerWordsDetected: [...new Set(detected)],
        responseDurationSeconds: durationSeconds,
        speechFluencyScore: Math.min(Math.max(100 - count * 4 - (calculatedWpm > 175 || calculatedWpm < 90 ? 15 : 0), 45), 98),
        faceVisibilityDetected: isFaceDetected,
        cameraFramingGood: isFramingCentered,
      });
    }
  }, [transcript, durationSeconds, isFaceDetected, isFramingCentered, onMetricsUpdate]);

  // Request & attach webcam video
  const startCamera = useCallback(async () => {
    try {
      setPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setMicActive(true);
    } catch (err: any) {
      console.warn('Camera/mic access error:', err);
      setPermissionError(
        err.name === 'NotAllowedError'
          ? 'Camera/microphone access was declined. You can still proceed using text responses.'
          : 'Could not activate webcam. Ensure permissions are granted.'
      );
      setCameraActive(false);
    }
  }, []);

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setCameraActive(prev => !prev);
    } else {
      startCamera();
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setMicActive(prev => !prev);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [startCamera]);

  return (
    <div className="w-full rounded-[26px] bg-gradient-to-br from-[#142951] to-[#17183f] border border-[#398fe0]/60 p-4 shadow-xl flex flex-col justify-between">
      {/* Top Header of Candidate Cam */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#c7d2ef]">
            Candidate Video &amp; Delivery Analysis
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMic}
            className={`p-1.5 rounded-full border transition cursor-pointer ${
              micActive
                ? 'bg-[#101d40] border-[#394b86] text-emerald-400 hover:text-white'
                : 'bg-rose-900/40 border-rose-500/50 text-rose-300'
            }`}
            title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleCamera}
            className={`p-1.5 rounded-full border transition cursor-pointer ${
              cameraActive
                ? 'bg-[#101d40] border-[#394b86] text-[#55b9ff] hover:text-white'
                : 'bg-rose-900/40 border-rose-500/50 text-rose-300'
            }`}
            title={cameraActive ? 'Turn Off Camera (Optional)' : 'Turn On Camera'}
          >
            {cameraActive ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Video Preview Box */}
      <div className="relative w-full aspect-video rounded-2xl bg-[#0a122c] border border-[#34436d] overflow-hidden flex items-center justify-center">
        {permissionError ? (
          <div className="p-4 text-center text-xs text-[#cbd5f3] flex flex-col items-center gap-2">
            <AlertCircle className="w-7 h-7 text-amber-400" />
            <p>{permissionError}</p>
            <button
              onClick={startCamera}
              className="mt-1 px-3 py-1 text-xs rounded-full bg-[#172c5a] border border-[#398fe0] text-[#55b9ff] hover:bg-[#1a3970]"
            >
              Retry Camera
            </button>
          </div>
        ) : cameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
            {/* Visual Framing Guide Overlay */}
            <div className="absolute inset-4 border border-dashed border-[#55b9ff]/30 rounded-xl pointer-events-none flex items-end justify-between p-2">
              <span className="text-[10px] bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[#cbd5f3] flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-400" /> Face Detected
              </span>
              <span className="text-[10px] bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[#cbd5f3]">
                Centred Frame
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center p-4">
            <CameraOff className="w-8 h-8 text-[#9eacd0]" />
            <span className="text-xs text-[#9eacd0]">Camera preview paused (Analysis is optional)</span>
          </div>
        )}
      </div>

      {/* Delivery Metrics Bar (Pace, Fillers, Duration) */}
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <div className="bg-[#101d40]/90 border border-[#34436d] rounded-xl p-1.5">
          <div className="text-[10px] uppercase font-semibold text-[#9eacd0]">Pace</div>
          <div className="text-sm font-bold text-[#55b9ff]">
            {wpm > 0 ? `${wpm}` : '--'} <span className="text-[10px] font-normal text-[#9eacd0]">WPM</span>
          </div>
          <div className="text-[9px] text-[#cbd5f3]/80">
            {wpm >= 110 && wpm <= 160 ? 'Optimal' : wpm > 160 ? 'Fast' : wpm > 0 ? 'Deliberate' : 'Steady'}
          </div>
        </div>

        <div className="bg-[#101d40]/90 border border-[#34436d] rounded-xl p-1.5">
          <div className="text-[10px] uppercase font-semibold text-[#9eacd0]">Filler Words</div>
          <div className="text-sm font-bold text-[#a66bff]">{fillerWordsCount}</div>
          <div className="text-[9px] text-[#cbd5f3]/80 truncate">
            {fillersList.length > 0 ? fillersList.slice(0, 2).join(', ') : 'None'}
          </div>
        </div>

        <div className="bg-[#101d40]/90 border border-[#34436d] rounded-xl p-1.5">
          <div className="text-[10px] uppercase font-semibold text-[#9eacd0]">Duration</div>
          <div className="text-sm font-bold text-[#f7f8ff]">
            {Math.floor(durationSeconds / 60)}:{(durationSeconds % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-[9px] text-[#cbd5f3]/80">Answer time</div>
        </div>

        <div className="bg-[#101d40]/90 border border-[#34436d] rounded-xl p-1.5">
          <div className="text-[10px] uppercase font-semibold text-[#9eacd0]">Fluency</div>
          <div className="text-sm font-bold text-emerald-400">
            {isRecording ? 'Active' : 'Standby'}
          </div>
          <div className="text-[9px] text-[#cbd5f3]/80">Approx. metric</div>
        </div>
      </div>

      <div className="mt-2 text-[10px] text-[#9eacd0] text-center italic">
        * Observable delivery indicators for self-practice, not an objective personality judgment.
      </div>
    </div>
  );
};
