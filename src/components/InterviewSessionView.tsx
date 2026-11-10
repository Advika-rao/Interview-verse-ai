import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  StopCircle,
  SkipForward,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Brain,
  Code2,
  Cpu,
  UserCheck,
  Award,
  Sparkles,
  Volume2,
  AlertCircle,
  Check,
  X,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Radio,
  AlertTriangle
} from 'lucide-react';
import { AiAvatar } from './AiAvatar';
import { CameraFeed } from './CameraFeed';
import { SpeechInterface } from './SpeechInterface';
import { CodingRound } from './CodingRound';
import {
  JobRole,
  ExperienceLevel,
  RoundId,
  Question,
  CandidateAnswer,
  SpeechDeliveryMetrics,
  CodingExecutionResult,
  QuestionEvaluation,
  FinalReport,
  UserProfile,
} from '../types';
import { getQuestionsForSession } from '../data/questionBank';

interface InterviewSessionViewProps {
  role: JobRole;
  experienceLevel: ExperienceLevel;
  user: UserProfile | null;
  onInterviewComplete: (report: FinalReport) => void;
  onExitInterview: () => void;
}

export const InterviewSessionView: React.FC<InterviewSessionViewProps> = ({
  role,
  experienceLevel,
  user,
  onInterviewComplete,
  onExitInterview,
}) => {
  // Session ID
  const [sessionId] = useState<string>(() => `session-${Date.now()}`);

  // Questions mapped by round
  const [questionsMap, setQuestionsMap] = useState<Record<RoundId, Question[]>>(() =>
    getQuestionsForSession(role, experienceLevel)
  );

  // Active round state (1: Aptitude, 2: Coding, 3: Technical, 4: HR)
  const [currentRound, setCurrentRound] = useState<RoundId>(1);

  // Independent question index for each round
  const [roundIndices, setRoundIndices] = useState<Record<RoundId, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });

  // Track completed answers across all rounds
  const [completedAnswers, setCompletedAnswers] = useState<CandidateAnswer[]>([]);

  // Controls & Dialogs
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // In-app Confirmation Modals
  const [isSkipModalOpen, setIsSkipModalOpen] = useState<boolean>(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState<boolean>(false);

  // Question expansion ("See More" / "See Less")
  const [isQuestionExpanded, setIsQuestionExpanded] = useState<boolean>(false);

  // Aptitude Round specific: MCQ mode vs Verbal mode
  const [aptitudeAnswerMode, setAptitudeAnswerMode] = useState<'mcq' | 'verbal'>('mcq');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

  // Live answer and metrics state
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [currentMetrics, setCurrentMetrics] = useState<SpeechDeliveryMetrics | undefined>(undefined);
  const [latestEvaluation, setLatestEvaluation] = useState<QuestionEvaluation | null>(null);

  // Coding round state
  const [submittedCode, setSubmittedCode] = useState<string>('');
  const [codingSandboxResult, setCodingSandboxResult] = useState<CodingExecutionResult | null>(null);

  // Current active question
  const currentQuestionList = questionsMap[currentRound] || [];
  const currentQuestionIndex = roundIndices[currentRound] ?? 0;
  const isRoundFinished = currentQuestionIndex >= currentQuestionList.length;
  const currentQuestion = !isRoundFinished ? currentQuestionList[currentQuestionIndex] : undefined;

  const speechTimeoutRef = useRef<any>(null);

  // Centralized SpeechSynthesis (TTS) controller: reads out question first, then transitions cleanly to silent mode
  const speakQuestion = (text: string) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsAiSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}

    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }

    // Small delay ensures previous cancellation completed in browser audio thread
    speechTimeoutRef.current = setTimeout(() => {
      try {
        const cleanText = text.trim();
        if (!cleanText) {
          setIsAiSpeaking(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.05;

        const voices = window.speechSynthesis.getVoices();
        const naturalVoice = voices.find(
          v =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('English'))
        );
        if (naturalVoice) {
          utterance.voice = naturalVoice;
        }

        utterance.onstart = () => {
          setIsAiSpeaking(true);
        };

        // When reading finishes, automatically transition to silent mode!
        utterance.onend = () => {
          setIsAiSpeaking(false);
        };

        utterance.onerror = () => {
          setIsAiSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis error:', err);
        setIsAiSpeaking(false);
      }
    }, 90);
  };

  // Replay question aloud on demand (stops ongoing audio cleanly and replays from beginning)
  const handleReplayVoice = () => {
    if (!currentQuestion?.question) return;
    speakQuestion(currentQuestion.question);
  };

  // Unique key identifying active question
  const activeQuestionId = currentQuestion?.id || `q-${currentRound}-${currentQuestionIndex}`;

  // Unified controller: When starting any round (including HR & Behavioral) or moving to the next question:
  // 1. Reset temporary inputs and evaluation states
  // 2. Read the question aloud first
  // 3. Transition to silent mode once finished (stays silent until Replay Voice or next question)
  useEffect(() => {
    setIsQuestionExpanded(false);
    setSelectedOptionIndex(null);
    setLiveTranscript('');
    setSubmittedCode('');
    setCodingSandboxResult(null);
    setLatestEvaluation(null);

    // Cancel ongoing audio immediately before switching
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsAiSpeaking(false);

    // If paused, round finished, or question text missing, stay silent
    if (isPaused || isRoundFinished || !currentQuestion?.question) {
      return;
    }

    // First, when entering any round or moving to the next question, read the question aloud!
    speakQuestion(currentQuestion.question);

    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsAiSpeaking(false);
    };
  }, [currentRound, currentQuestionIndex, activeQuestionId, isPaused, isRoundFinished]);

  // Cancel any audio when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const roundTitles: Record<RoundId, { name: string; icon: any; shortName: string; desc: string }> = {
    1: {
      name: 'Aptitude & Reasoning',
      shortName: 'Aptitude & Reasoning',
      icon: Brain,
      desc: 'Quantitative, logic puzzles, verbal reasoning, and data interpretation',
    },
    2: {
      name: 'Practical Coding',
      shortName: 'Coding',
      icon: Code2,
      desc: `${role} algorithmic implementation, data structures, and edge-cases`,
    },
    3: {
      name: 'Technical Deep-Dive',
      shortName: 'Technical',
      icon: Cpu,
      desc: 'System architecture, modeling theory, and real-world ML engineering',
    },
    4: {
      name: 'HR & Behavioral',
      shortName: 'HR & Behavioral',
      icon: UserCheck,
      desc: 'Leadership, collaboration, conflict resolution, and career trajectory',
    },
  };

  // Switch Round Tab handler
  const handleSwitchRound = (targetRound: RoundId) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
    }
    setCurrentRound(targetRound);
  };

  // Save session progress to server
  const saveProgress = async (answers: CandidateAnswer[], round: RoundId) => {
    try {
      await fetch('/api/sessions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionId,
          userId: user?.uid || 'guest-candidate',
          candidateName: user?.displayName || 'Candidate',
          role,
          experienceLevel,
          status: 'in_progress',
          currentRound: round,
          answers,
          startedAt: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.warn('Progress save warning:', e);
    }
  };

  // Submit MCQ Answer for Aptitude Round
  const handleSubmitMCQ = () => {
    if (!currentQuestion || selectedOptionIndex === null) return;

    const isCorrect = currentQuestion.correctOptionIndex !== undefined
      ? selectedOptionIndex === currentQuestion.correctOptionIndex
      : true;

    const selectedText = currentQuestion.options ? currentQuestion.options[selectedOptionIndex] : `Option ${selectedOptionIndex + 1}`;
    const targetLetter = currentQuestion.correctOptionIndex !== undefined ? String.fromCharCode(65 + currentQuestion.correctOptionIndex) : 'A';
    const correctText = currentQuestion.options && currentQuestion.correctOptionIndex !== undefined
      ? currentQuestion.options[currentQuestion.correctOptionIndex]
      : `Option ${targetLetter}`;

    const evaluation: QuestionEvaluation = {
      questionId: currentQuestion.id,
      round: currentRound,
      evaluationStatus: isCorrect ? 'correct' : 'incorrect',
      score: isCorrect ? 100 : 0,
      correctness: isCorrect ? 100 : 0,
      awardedMarks: isCorrect ? 10 : 0,
      maximumMarks: 10,
      problemSolving: isCorrect ? 100 : 0,
      communication: undefined, // Communication score NOT applicable to MCQs
      communicationType: 'none',
      conceptsCorrectlyIdentified: isCorrect ? [`Selected correct option: ${selectedText}`] : [],
      conceptsMissing: isCorrect ? [] : [`Expected option: ${correctText}`],
      incorrectStatements: isCorrect ? [] : [`Selected incorrect option: ${selectedText}`],
      feedback: isCorrect
        ? `Correct! You selected ${selectedText}. ${currentQuestion.explanation || ''}`
        : `Incorrect. You selected ${selectedText}, but the correct answer was ${correctText}. ${currentQuestion.explanation || ''}`,
      explanation: currentQuestion.explanation || `The correct answer is ${correctText}.`,
      referenceAnswer: correctText,
      confidenceInEvaluation: 'high',
      strengths: isCorrect ? ['Accurate logical reasoning and deduction.'] : [],
      areasToImprove: isCorrect ? ['Maintain precision on edge cases.'] : ['Review problem statements and option constraints.'],
      isDeterministic: true,
    };

    setLatestEvaluation(evaluation);

    const record: CandidateAnswer = {
      questionId: currentQuestion.id,
      round: currentRound,
      transcript: `[MCQ Selected]: ${selectedText}`,
      responseMode: 'mcq',
      selectedOptionIndex,
      evaluation,
      answeredAt: new Date().toISOString(),
    };

    const updated = [...completedAnswers, record];
    setCompletedAnswers(updated);
    saveProgress(updated, currentRound);
  };

  // Submit Verbal or Freeform Text Answer
  const handleAnswerSubmit = async (
    answerText: string,
    mode: 'spoken' | 'typed' = 'spoken',
    speechSeconds?: number,
    passedMetrics?: SpeechDeliveryMetrics
  ) => {
    if (!currentQuestion) return;

    setIsEvaluating(true);
    try {
      const activeMetrics = passedMetrics || currentMetrics;
      const evalResponse = await fetch('/api/gemini/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion,
          candidateAnswer: answerText,
          responseMode: mode,
          role,
          experienceLevel,
          round: currentRound,
          deliveryMetrics: mode === 'spoken' ? (activeMetrics ? {
            ...activeMetrics,
            responseDurationSeconds: speechSeconds || activeMetrics.responseDurationSeconds || 5,
          } : undefined) : undefined,
          codingResult: codingSandboxResult,
        }),
      });

      const evalData = await evalResponse.json();
      const evaluation: QuestionEvaluation = evalData.evaluation;

      setLatestEvaluation(evaluation);

      const candidateAnswerRecord: CandidateAnswer = {
        questionId: currentQuestion.id,
        round: currentRound,
        transcript: answerText,
        responseMode: mode,
        submittedCode: submittedCode || undefined,
        codingResult: codingSandboxResult || undefined,
        deliveryMetrics: mode === 'spoken' ? activeMetrics : undefined,
        communicationAnalysis: evaluation.communicationDetails,
        evaluation,
        answeredAt: new Date().toISOString(),
      };

      const updatedAnswers = [...completedAnswers, candidateAnswerRecord];
      setCompletedAnswers(updatedAnswers);
      saveProgress(updatedAnswers, currentRound);

      // Trigger follow-up only for substantive valid responses with score >= 50
      if (evaluation.suggestedFollowUp && !currentQuestion.isFollowUp && evaluation.score >= 50 && Math.random() > 0.5) {
        const followUpQ: Question = {
          id: `followup-${Date.now()}`,
          role,
          round: currentRound,
          topic: currentQuestion.topic + ' (Follow-Up)',
          difficulty: currentQuestion.difficulty,
          experienceLevel,
          question: evaluation.suggestedFollowUp,
          source: 'gemini',
          isFollowUp: true,
          parentQuestionId: currentQuestion.id,
        };

        const updatedList = [...currentQuestionList];
        updatedList.splice(currentQuestionIndex + 1, 0, followUpQ);
        setQuestionsMap(prev => ({ ...prev, [currentRound]: updatedList }));
      }
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Submit Coding Solution from Sandbox
  const handleCodingSubmit = async (code: string, result: CodingExecutionResult) => {
    if (!currentQuestion) return;

    setIsEvaluating(true);
    try {
      const evalResponse = await fetch('/api/gemini/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion,
          candidateAnswer: code,
          responseMode: 'code',
          role,
          experienceLevel,
          round: 2,
          codingResult: result,
        }),
      });

      const evalData = await evalResponse.json();
      const evaluation: QuestionEvaluation = evalData.evaluation;

      setLatestEvaluation(evaluation);

      const candidateAnswerRecord: CandidateAnswer = {
        questionId: currentQuestion.id,
        round: 2,
        transcript: `[Python Solution]: ${result.testsPassed}/${result.totalTests} tests passed. Quality: ${result.codeQualityScore}/100.`,
        responseMode: 'code',
        submittedCode: code,
        codingResult: result,
        evaluation,
        answeredAt: new Date().toISOString(),
      };

      const updatedAnswers = [...completedAnswers, candidateAnswerRecord];
      setCompletedAnswers(updatedAnswers);
      saveProgress(updatedAnswers, 2);
    } catch (err) {
      console.error('Coding submission error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Move to next question within active round
  const handleAdvanceQuestion = () => {
    setLatestEvaluation(null);
    setLiveTranscript('');
    setSubmittedCode('');
    setCodingSandboxResult(null);
    setSelectedOptionIndex(null);

    setRoundIndices(prev => ({
      ...prev,
      [currentRound]: prev[currentRound] + 1,
    }));
  };

  // Confirm and execute Skip Question
  const handleConfirmSkip = () => {
    if (!currentQuestion) return;

    const skippedRecord: CandidateAnswer = {
      questionId: currentQuestion.id,
      round: currentRound,
      transcript: '[Question Skipped by Candidate]',
      skipped: true,
      evaluation: {
        questionId: currentQuestion.id,
        round: currentRound,
        evaluationStatus: 'unanswered',
        score: 0,
        correctness: 0,
        awardedMarks: 0,
        maximumMarks: 10,
        technicalClarity: 0,
        problemSolving: 0,
        communication: 0,
        conceptsCorrectlyIdentified: [],
        conceptsMissing: ['Question was skipped.'],
        incorrectStatements: [],
        confidenceInEvaluation: 'high',
        explanation: 'This question was skipped by the candidate. No marks were awarded.',
        feedback: 'This question was skipped by the candidate. No marks were awarded.',
        strengths: [],
        areasToImprove: ['Question was skipped.'],
      },
      answeredAt: new Date().toISOString(),
    };

    const updated = [...completedAnswers, skippedRecord];
    setCompletedAnswers(updated);
    saveProgress(updated, currentRound);

    setIsSkipModalOpen(false);

    // Advance question index in current round
    setRoundIndices(prev => ({
      ...prev,
      [currentRound]: prev[currentRound] + 1,
    }));
  };

  // Stop all active media & TTS
  const stopAllMedia = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsAiSpeaking(false);
  };

  // End Session and Generate Report
  const handleConfirmEndSession = async () => {
    setIsEndModalOpen(false);
    stopAllMedia();
    setIsGeneratingReport(true);

    try {
      const res = await fetch('/api/gemini/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: user?.displayName || 'Candidate',
          candidateEmail: user?.email || 'candidate@example.com',
          role,
          experienceLevel,
          interviewId: sessionId,
          answers: completedAnswers,
          deliverySummaries: completedAnswers.map(a => a.deliveryMetrics).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (data.report) {
        onInterviewComplete(data.report);
      } else {
        throw new Error('Report generation returned invalid data');
      }
    } catch (err: any) {
      console.error('Error in handleFinishInterview:', err);
      alert('Could not generate final report: ' + err.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Compute status for each round
  const getRoundStatus = (rId: RoundId) => {
    const rAnswers = completedAnswers.filter(a => a.round === rId);
    const totalQ = questionsMap[rId]?.length || 0;
    const currentIndex = roundIndices[rId] || 0;

    if (rAnswers.length >= totalQ || currentIndex >= totalQ) {
      return 'completed';
    }
    if (rAnswers.length > 0 || currentIndex > 0) {
      return 'in_progress';
    }
    return 'unattempted';
  };

  const CurrentRoundIcon = roundTitles[currentRound].icon;
  const isQuestionLong = (currentQuestion?.question?.length || 0) > 150 || (currentQuestion?.question?.includes('\n') ?? false);

  if (isGeneratingReport) {
    return (
      <div className="w-full max-w-2xl mx-auto py-20 px-4 text-center flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#397fff] to-[#995cff] flex items-center justify-center animate-spin">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white">
          Synthesizing Your Candidate Assessment...
        </h2>
        <p className="text-sm md:text-base text-[#b8c5e6] max-w-lg leading-relaxed">
          The AI Interviewer and hiring committee are evaluating your attempted rounds, coding test cases,
          speech delivery pace, and compiling your personalized performance report.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1140px] mx-auto py-6 px-4 flex flex-col gap-6">
      {/* Top Header Bar: Interactive Round Tabs & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#101d40] border border-[#34436d] shadow-lg">
        {/* Interactive Round Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {([1, 2, 3, 4] as RoundId[]).map(rId => {
            const isCurrent = currentRound === rId;
            const status = getRoundStatus(rId);
            const RoundTabIcon = roundTitles[rId].icon;
            const totalQuestionsInRound = questionsMap[rId]?.length || 0;
            const answeredInRound = completedAnswers.filter(a => a.round === rId).length;

            return (
              <button
                key={rId}
                type="button"
                onClick={() => handleSwitchRound(rId)}
                className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isCurrent
                    ? 'bg-gradient-to-r from-[#397fff] to-[#995cff] text-white shadow-[0_4px_20px_rgba(57,127,255,0.4)] ring-2 ring-white/80 scale-[1.02]'
                    : status === 'completed'
                    ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-900/40'
                    : status === 'in_progress'
                    ? 'bg-[#172c5a] border border-[#398fe0] text-[#55b9ff] hover:text-white hover:border-[#55b9ff]'
                    : 'bg-[#080f27] border border-[#24335c] text-[#9eacd0] hover:text-white hover:border-[#55b9ff]'
                }`}
                title={`Switch to Round ${rId}: ${roundTitles[rId].name} (${answeredInRound}/${totalQuestionsInRound} answered)`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-transform ${
                    isCurrent
                      ? 'bg-white text-[#101d40] shadow-sm'
                      : status === 'completed'
                      ? 'bg-emerald-500 text-black'
                      : 'bg-black/40 text-current'
                  }`}
                >
                  {status === 'completed' ? '✓' : rId}
                </span>

                <RoundTabIcon className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-white' : 'text-[#8fa3db] group-hover:text-white'}`} />

                <span className="font-semibold tracking-wide">
                  <span className="hidden sm:inline">{roundTitles[rId].name}</span>
                  <span className="sm:hidden">{roundTitles[rId].shortName}</span>
                </span>

                {totalQuestionsInRound > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      isCurrent
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-[#8fa3db]'
                    }`}
                  >
                    {answeredInRound}/{totalQuestionsInRound}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Interview Controls */}
        <div className="flex items-center gap-2">
          {/* Pause / Resume */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#34436d] text-xs font-medium text-[#b8c5e6] hover:text-white transition cursor-pointer bg-[#142951]/60"
            title={isPaused ? 'Resume interview' : 'Pause interview'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          {/* Skip Question Button */}
          {!isRoundFinished && !latestEvaluation && (
            <button
              type="button"
              onClick={() => setIsSkipModalOpen(true)}
              disabled={isEvaluating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/40 text-xs font-semibold text-amber-300 hover:bg-amber-950/50 transition cursor-pointer bg-[#142951]/60"
              title="Skip this question (no marks awarded)"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip Question</span>
            </button>
          )}

          {/* End Session Button */}
          <button
            type="button"
            onClick={() => setIsEndModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-rose-500/40 text-xs font-semibold text-rose-300 hover:bg-rose-950/60 transition cursor-pointer"
            title="End Interview & View Final Report"
          >
            <StopCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* Paused Overlay Notice */}
      {isPaused && (
        <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-500/60 text-amber-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Interview is paused. Take a breath and resume whenever you are ready.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsPaused(false)}
            className="px-4 py-1.5 rounded-full bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 cursor-pointer"
          >
            Resume Interview
          </button>
        </div>
      )}

      {/* Main Dual Grid: AI Interviewer Avatar + Candidate Camera */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AiAvatar
          isSpeaking={isAiSpeaking}
          isListening={!isAiSpeaking && !isEvaluating && !latestEvaluation && !isRoundFinished}
          isAnalyzing={isEvaluating}
          currentSpeechText={currentQuestion?.question || (isRoundFinished ? `Round ${currentRound} completed! Please select another round or finish your interview.` : '')}
          onToggleMute={() => setIsMuted(!isMuted)}
          onReplayVoice={handleReplayVoice}
          isMuted={isMuted}
        />

        <CameraFeed
          isRecording={!isAiSpeaking && !isEvaluating && !isRoundFinished}
          transcript={liveTranscript}
          onMetricsUpdate={setCurrentMetrics}
        />
      </div>

      {/* Round Finished State Screen */}
      {isRoundFinished ? (
        <div className="rounded-2xl bg-[#101d40] border border-[#398fe0] p-6 shadow-xl flex flex-col items-center text-center gap-4 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Round {currentRound}: {roundTitles[currentRound].name} Completed!
            </h3>
            <p className="text-sm text-[#b8c5e6] mt-1 max-w-md">
              You have completed all questions in this round. You can switch to any other round or view your final assessment report.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            {([1, 2, 3, 4] as RoundId[]).filter(r => r !== currentRound).map(rId => (
              <button
                key={rId}
                type="button"
                onClick={() => handleSwitchRound(rId)}
                className="px-4 py-2 rounded-full bg-[#172c5a] border border-[#394b86] hover:border-[#55b9ff] text-xs font-semibold text-[#cbd5f3] hover:text-white transition cursor-pointer"
              >
                Go to Round {rId}: {roundTitles[rId].shortName} →
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsEndModalOpen(true)}
              className="btn-gradient px-6 py-2 rounded-full text-xs font-bold text-white shadow-md cursor-pointer"
            >
              Finish Interview &amp; Generate Report →
            </button>
          </div>
        </div>
      ) : currentQuestion && (
        <>
          {/* Question Header Card with Expandable "See More / See Less" */}
          <div className="rounded-2xl bg-[#101d40] border border-[#34436d] p-5 shadow-lg flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24335c] pb-3">
              <div className="flex items-center gap-2">
                <CurrentRoundIcon className="w-4 h-4 text-[#55b9ff]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#55b9ff]">
                  Round {currentRound}: {roundTitles[currentRound].name}
                </span>
                <span className="text-xs text-[#9eacd0]">
                  • Question {currentQuestionIndex + 1} of {currentQuestionList.length}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-[#172c5a] border border-[#2d4076] text-[#b8c5e6]">
                  {currentQuestion.topic}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2a2254] text-[#b18aff] border border-[#58399e]">
                  Source: {currentQuestion.source || 'dataset'}
                </span>
                <button
                  type="button"
                  onClick={handleReplayVoice}
                  disabled={isAiSpeaking}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#142951] border border-[#398fe0] text-[#55b9ff] hover:text-white transition cursor-pointer"
                  title="Listen to question again"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Replay Voice</span>
                </button>
              </div>
            </div>

            {/* Question Text with Readable Preview and See More / See Less */}
            <div className="flex flex-col gap-2">
              <div
                className={`text-sm md:text-base text-[#f7f8ff] font-medium leading-relaxed whitespace-pre-line ${
                  !isQuestionExpanded && isQuestionLong ? 'line-clamp-3' : ''
                }`}
              >
                {currentQuestion.question}
              </div>

              {/* See More / See Less Toggle Button */}
              {isQuestionLong && (
                <div className="flex items-center justify-start">
                  <button
                    type="button"
                    onClick={() => setIsQuestionExpanded(!isQuestionExpanded)}
                    className="text-xs font-semibold text-[#55b9ff] hover:text-[#a66bff] flex items-center gap-1 cursor-pointer transition py-0.5"
                  >
                    {isQuestionExpanded ? (
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
                </div>
              )}
            </div>
          </div>

          {/* Evaluation Feedback Card after answer submission */}
          {latestEvaluation ? (
            <div className="rounded-2xl bg-gradient-to-br from-[#101d40] to-[#151c42] border-2 border-[#55b9ff] p-6 shadow-2xl flex flex-col gap-4 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#24335c] pb-3">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#55b9ff]" />
                  <h3 className="text-base font-bold text-white">Evaluation &amp; Verification</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      latestEvaluation.evaluationCategory === 'fully_correct' || latestEvaluation.evaluationStatus === 'correct'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : latestEvaluation.evaluationCategory === 'partially_correct' || latestEvaluation.evaluationStatus === 'partially_correct'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : latestEvaluation.evaluationCategory === 'incomplete'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : latestEvaluation.evaluationCategory === 'incorrect' || latestEvaluation.evaluationStatus === 'incorrect'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : latestEvaluation.evaluationCategory === 'irrelevant'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : latestEvaluation.evaluationCategory === 'unclear_transcription'
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                        : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                    }`}
                  >
                    {latestEvaluation.evaluationCategory === 'fully_correct' || latestEvaluation.evaluationStatus === 'correct'
                      ? '✓ Fully Correct'
                      : latestEvaluation.evaluationCategory === 'partially_correct' || latestEvaluation.evaluationStatus === 'partially_correct'
                      ? '⚡ Partially Correct'
                      : latestEvaluation.evaluationCategory === 'incomplete'
                      ? '⏳ Incomplete Answer'
                      : latestEvaluation.evaluationCategory === 'incorrect' || latestEvaluation.evaluationStatus === 'incorrect'
                      ? '✕ Incorrect'
                      : latestEvaluation.evaluationCategory === 'irrelevant'
                      ? '⊘ Irrelevant Response'
                      : latestEvaluation.evaluationCategory === 'unclear_transcription'
                      ? '❓ Unclear Audio / Transcription'
                      : '∅ Unanswered / Skipped'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase text-[#9eacd0] font-semibold">Marks:</span>
                  <span
                    className={`text-2xl font-black ${
                      latestEvaluation.score >= 70
                        ? 'text-emerald-400'
                        : latestEvaluation.score > 0
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {latestEvaluation.awardedMarks !== undefined ? `${latestEvaluation.awardedMarks}/${latestEvaluation.maximumMarks || 10}` : `${latestEvaluation.score}/100`}
                  </span>
                  <span className="text-xs text-[#9eacd0]">({latestEvaluation.score}%)</span>
                </div>
              </div>

              {/* Assessed Dimensions Grid */}
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[120px] p-2.5 rounded-xl bg-[#080f27] border border-[#24335c] text-center">
                  <div className="text-[10px] uppercase tracking-wider text-[#9eacd0]">Answer Correctness</div>
                  <div className="text-lg font-bold text-emerald-400">{latestEvaluation.correctness}%</div>
                </div>

                {latestEvaluation.technicalClarity !== undefined && (
                  <div className="flex-1 min-w-[120px] p-2.5 rounded-xl bg-[#080f27] border border-[#24335c] text-center">
                    <div className="text-[10px] uppercase tracking-wider text-[#9eacd0]">Technical Depth</div>
                    <div className="text-lg font-bold text-[#55b9ff]">{latestEvaluation.technicalClarity}%</div>
                  </div>
                )}

                {latestEvaluation.problemSolving !== undefined && (
                  <div className="flex-1 min-w-[120px] p-2.5 rounded-xl bg-[#080f27] border border-[#24335c] text-center">
                    <div className="text-[10px] uppercase tracking-wider text-[#9eacd0]">Problem Solving</div>
                    <div className="text-lg font-bold text-[#a66bff]">{latestEvaluation.problemSolving}%</div>
                  </div>
                )}

                {latestEvaluation.communication !== undefined && (
                  <div className="flex-1 min-w-[120px] p-2.5 rounded-xl bg-[#080f27] border border-[#24335c] text-center">
                    <div className="text-[10px] uppercase tracking-wider text-[#9eacd0]">
                      {latestEvaluation.communicationType === 'written' ? 'Written Comm' : 'Spoken Comm'}
                    </div>
                    <div className="text-lg font-bold text-amber-400">{latestEvaluation.communication}%</div>
                  </div>
                )}
              </div>

              {/* Decomposed Question Sub-Criteria Breakdown */}
              {latestEvaluation.components && latestEvaluation.components.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#0a132c] border border-[#22396d] flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#55b9ff]" />
                      Question Sub-Criteria &amp; Multi-Part Decomposition:
                    </span>
                    <span className="text-[11px] text-[#9eacd0]">
                      {latestEvaluation.components.filter(c => c.category === 'fully_correct').length}/{latestEvaluation.components.length} components satisfied
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {latestEvaluation.components.map((comp, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 ${
                          comp.category === 'fully_correct'
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : comp.category === 'partially_correct'
                            ? 'bg-amber-950/20 border-amber-500/30'
                            : comp.category === 'incomplete'
                            ? 'bg-blue-950/20 border-blue-500/30'
                            : 'bg-rose-950/20 border-rose-500/30'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{comp.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-[#9eacd0]">
                              Weight: {comp.weight}%
                            </span>
                          </div>
                          <span className="text-[#b8c5e6] text-[11px]">{comp.feedback}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              comp.category === 'fully_correct'
                                ? 'bg-emerald-500/30 text-emerald-300'
                                : comp.category === 'partially_correct'
                                ? 'bg-amber-500/30 text-amber-300'
                                : comp.category === 'incomplete'
                                ? 'bg-blue-500/30 text-blue-300'
                                : 'bg-rose-500/30 text-rose-300'
                            }`}
                          >
                            {String(comp.category || comp.status || 'partially_correct').replace('_', ' ')}
                          </span>
                          <span className="text-xs font-bold text-white min-w-[45px] text-right">
                            {comp.awardedMarks}/{comp.maximumMarks || comp.maxMarks} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Text */}
              <div className="text-sm text-[#cbd5f3] leading-relaxed bg-[#080f27]/80 p-3.5 rounded-xl border border-[#1e2e5c]">
                <div className="font-semibold text-white text-xs mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#55b9ff]" /> Evaluator Review:
                </div>
                {latestEvaluation.feedback}
              </div>

              {/* Concepts Verified & Missing Breakdown */}
              {((latestEvaluation.conceptsCorrectlyIdentified && latestEvaluation.conceptsCorrectlyIdentified.length > 0) ||
                (latestEvaluation.conceptsMissing && latestEvaluation.conceptsMissing.length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {latestEvaluation.conceptsCorrectlyIdentified && latestEvaluation.conceptsCorrectlyIdentified.length > 0 && (
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200">
                      <div className="font-bold mb-1.5 flex items-center gap-1.5 text-emerald-400">
                        <Check className="w-3.5 h-3.5" /> Concepts Demonstrated:
                      </div>
                      <ul className="list-disc pl-4 space-y-1">
                        {latestEvaluation.conceptsCorrectlyIdentified.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {latestEvaluation.conceptsMissing && latestEvaluation.conceptsMissing.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200">
                      <div className="font-bold mb-1.5 flex items-center gap-1.5 text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" /> Concepts Missing / Required:
                      </div>
                      <ul className="list-disc pl-4 space-y-1">
                        {latestEvaluation.conceptsMissing.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Expected Solution / Reference Explanation */}
              {(latestEvaluation.explanation || latestEvaluation.referenceAnswer) && (
                <div className="p-3 rounded-xl bg-[#080f27] border border-[#2a3c70] text-xs text-[#b8c5e6]">
                  <span className="font-semibold text-[#55b9ff] block mb-1">
                    Expected Reference Answer &amp; Solution:
                  </span>
                  <p className="whitespace-pre-line leading-relaxed text-[#cbd5f3]">
                    {latestEvaluation.referenceAnswer || latestEvaluation.explanation}
                  </p>
                </div>
              )}

              {/* Spoken Communication Evidence Details */}
              {latestEvaluation.communicationDetails && (
                <div className="p-3.5 rounded-xl bg-[#0a132c] border border-[#233566] text-xs flex flex-col gap-2.5 text-[#9eacd0]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b2b52] pb-2">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-[#55b9ff]" />
                      {latestEvaluation.communicationDetails.type === 'spoken' ? 'Measurable Spoken Delivery Analysis:' : 'Written Composition Analysis:'}
                    </span>
                    <span className="font-bold text-amber-400">
                      Communication Score: {latestEvaluation.communication}%
                    </span>
                  </div>

                  {latestEvaluation.communicationDetails.type === 'spoken' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-[#080f27] border border-[#1e2e5c]">
                        <div className="text-[10px] text-[#9eacd0]">Speaking Pace</div>
                        <div className="text-sm font-bold text-white">
                          {latestEvaluation.communicationDetails.speakingPaceWpm ? `${latestEvaluation.communicationDetails.speakingPaceWpm} WPM` : 'N/A'}
                        </div>
                        <div className="text-[9px] text-[#55b9ff]">
                          {latestEvaluation.communicationDetails.paceAssessment || 'Normal pace'}
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-[#080f27] border border-[#1e2e5c]">
                        <div className="text-[10px] text-[#9eacd0]">Duration / Pauses</div>
                        <div className="text-sm font-bold text-white">
                          {latestEvaluation.communicationDetails.speakingDurationSeconds}s ({latestEvaluation.communicationDetails.pauseCount || 0} pauses)
                        </div>
                        <div className="text-[9px] text-[#9eacd0]">
                          {latestEvaluation.communicationDetails.totalPauseDurationSeconds ? `${latestEvaluation.communicationDetails.totalPauseDurationSeconds}s silence` : 'Smooth flow'}
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-[#080f27] border border-[#1e2e5c]">
                        <div className="text-[10px] text-[#9eacd0]">Filler Words</div>
                        <div className="text-sm font-bold text-white">
                          {latestEvaluation.communicationDetails.fillerWordsCount || 0} detected
                        </div>
                        <div className="text-[9px] text-amber-300 truncate max-w-[120px] mx-auto">
                          {latestEvaluation.communicationDetails.fillerWordsDetected?.length
                            ? latestEvaluation.communicationDetails.fillerWordsDetected.join(', ')
                            : 'None detected'}
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-[#080f27] border border-[#1e2e5c]">
                        <div className="text-[10px] text-[#9eacd0]">Clarity &amp; Org</div>
                        <div className="text-sm font-bold text-white">
                          {latestEvaluation.communicationDetails.clarityScore || 80}/100
                        </div>
                        <div className="text-[9px] text-emerald-400">
                          Org: {latestEvaluation.communicationDetails.organizationScore || 80}/100
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 text-xs">
                      <span>Clarity: <strong className="text-white">{latestEvaluation.communicationDetails.clarityScore}/100</strong></span>
                      <span>Organization: <strong className="text-white">{latestEvaluation.communicationDetails.organizationScore}/100</strong></span>
                    </div>
                  )}

                  {latestEvaluation.communicationDetails.suggestions?.[0] && (
                    <div className="text-[11px] text-[#a66bff] italic flex items-center gap-1.5 pt-1">
                      <span>Recommendation:</span>
                      <span>{latestEvaluation.communicationDetails.suggestions[0]}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAdvanceQuestion}
                  className="btn-gradient flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-white shadow-md cursor-pointer"
                >
                  <span>Continue to Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : currentRound === 1 && currentQuestion.options ? (
            /* Round 1: Aptitude MCQ Interface with clear mode separation */
            <div className="rounded-2xl bg-[#101d40] border border-[#34436d] p-5 shadow-lg flex flex-col gap-4">
              {/* Mode Switcher Tabs */}
              <div className="flex items-center justify-between border-b border-[#24335c] pb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#b8c5e6]">
                  Aptitude Answer Mode:
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#080f27] border border-[#24335c]">
                  <button
                    type="button"
                    onClick={() => setAptitudeAnswerMode('mcq')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                      aptitudeAnswerMode === 'mcq'
                        ? 'bg-[#397fff] text-white shadow-sm'
                        : 'text-[#9eacd0] hover:text-white'
                    }`}
                  >
                    Select Option (MCQ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAptitudeAnswerMode('verbal')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                      aptitudeAnswerMode === 'verbal'
                        ? 'bg-[#995cff] text-white shadow-sm'
                        : 'text-[#9eacd0] hover:text-white'
                    }`}
                  >
                    Answer Verbally (Voice)
                  </button>
                </div>
              </div>

              {aptitudeAnswerMode === 'mcq' ? (
                /* Pure MCQ Mode: Select Option and Submit */
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-[#9eacd0]">
                    Select the option that best answers the quantitative or logical reasoning question:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentQuestion.options.map((opt, oIdx) => {
                      const isSelected = selectedOptionIndex === oIdx;
                      const letter = String.fromCharCode(65 + oIdx);
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => setSelectedOptionIndex(oIdx)}
                          className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#172c5a] to-[#25236b] border-[#55b9ff] text-white ring-2 ring-[#55b9ff]/60 shadow-md'
                              : 'bg-[#080f27] border-[#24335c] text-[#cbd5f3] hover:border-[#397fff] hover:bg-[#0c1634]'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSelected
                                ? 'bg-[#55b9ff] text-black font-extrabold'
                                : 'bg-[#142951] text-[#9eacd0] border border-[#34436d]'
                            }`}
                          >
                            {letter}
                          </div>
                          <div className="text-xs md:text-sm font-medium leading-relaxed">
                            {opt}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#24335c]">
                    <span className="text-xs text-[#9eacd0]">
                      {selectedOptionIndex !== null
                        ? `Option ${String.fromCharCode(65 + selectedOptionIndex)} selected`
                        : 'Please choose an option above'}
                    </span>
                    <button
                      type="button"
                      disabled={selectedOptionIndex === null}
                      onClick={handleSubmitMCQ}
                      className="btn-gradient px-6 py-2.5 rounded-full text-white text-xs md:text-sm font-bold cursor-pointer disabled:opacity-40"
                    >
                      Submit MCQ Answer →
                    </button>
                  </div>
                </div>
              ) : (
                /* Verbal Speech Mode for Aptitude */
                <SpeechInterface
                  questionText={currentQuestion.question}
                  isAiSpeaking={isAiSpeaking}
                  onAnswerSubmit={handleAnswerSubmit}
                  onTranscriptChange={setLiveTranscript}
                  onAiSpeakingChange={setIsAiSpeaking}
                  onReplayVoice={handleReplayVoice}
                  isEvaluating={isEvaluating}
                  isMuted={isMuted}
                />
              )}
            </div>
          ) : currentRound === 2 ? (
            /* Round 2: Coding Assessment Interface */
            <CodingRound
              question={currentQuestion}
              isEvaluating={isEvaluating}
              onCodeEvaluated={(code, result) => {
                setSubmittedCode(code);
                setCodingSandboxResult(result);
                setLiveTranscript(`Code executed (${result.testsPassed}/${result.totalTests} tests passed).`);
              }}
              onSubmitSolution={handleCodingSubmit}
            />
          ) : (
            /* Rounds 3 & 4: Verbal Speech & Text Q&A Interface */
            <SpeechInterface
              questionText={currentQuestion.question}
              isAiSpeaking={isAiSpeaking}
              onAnswerSubmit={handleAnswerSubmit}
              onTranscriptChange={setLiveTranscript}
              onAiSpeakingChange={setIsAiSpeaking}
              onReplayVoice={handleReplayVoice}
              isEvaluating={isEvaluating}
              isMuted={isMuted}
            />
          )}
        </>
      )}

      {/* In-App Modal: Skip Question Confirmation */}
      {isSkipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#0c1634] border border-[#394b86] p-6 shadow-2xl flex flex-col gap-4 text-[#f7f8ff]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shrink-0">
                <SkipForward className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Skip Current Question?</h3>
                <p className="text-xs text-[#9eacd0]">Round {currentRound}: {roundTitles[currentRound].name}</p>
              </div>
            </div>

            <p className="text-xs text-[#cbd5f3] leading-relaxed bg-[#080f27] p-3 rounded-xl border border-[#24335c]">
              Are you sure you want to skip this question? No marks will be awarded, and it will be recorded as skipped in your candidate assessment.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSkipModalOpen(false)}
                className="px-4 py-2 rounded-full border border-[#34436d] text-xs font-semibold text-[#cbd5f3] hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSkip}
                className="px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition cursor-pointer shadow-md"
              >
                Yes, Skip Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Modal: End Session Confirmation */}
      {isEndModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#0c1634] border border-[#394b86] p-6 shadow-2xl flex flex-col gap-4 text-[#f7f8ff]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-400 flex items-center justify-center text-rose-400 shrink-0">
                <StopCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">End Interview Session?</h3>
                <p className="text-xs text-[#9eacd0]">Generate your candidate performance report</p>
              </div>
            </div>

            <div className="text-xs text-[#cbd5f3] flex flex-col gap-2 bg-[#080f27] p-3 rounded-xl border border-[#24335c]">
              <span className="font-semibold text-white">Current Round Progress:</span>
              {([1, 2, 3, 4] as RoundId[]).map(r => {
                const status = getRoundStatus(r);
                return (
                  <div key={r} className="flex items-center justify-between text-[11px]">
                    <span className="text-[#9eacd0]">Round {r} ({roundTitles[r].shortName}):</span>
                    <span
                      className={`font-semibold ${
                        status === 'completed'
                          ? 'text-emerald-400'
                          : status === 'in_progress'
                          ? 'text-[#55b9ff]'
                          : 'text-amber-300'
                      }`}
                    >
                      {status === 'completed' ? 'Completed' : status === 'in_progress' ? 'In Progress' : 'Not Attempted'}
                    </span>
                  </div>
                );
              })}
              <p className="text-[10px] text-amber-300/90 mt-1 italic">
                * Unattempted rounds will be truthfully marked as Incomplete in your final report.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEndModalOpen(false)}
                className="px-4 py-2 rounded-full border border-[#34436d] text-xs font-semibold text-[#cbd5f3] hover:text-white transition cursor-pointer"
              >
                Continue Interview
              </button>
              <button
                type="button"
                onClick={handleConfirmEndSession}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer shadow-md"
              >
                End &amp; View Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
