export type JobRole = 'Data Scientist' | 'ML Engineer';

export type ExperienceLevel = 'Fresher' | '0–2 years' | '2–5 years' | '5+ years';

export type RoundId = 1 | 2 | 3 | 4;

export interface EvaluationComponent {
  name: string;
  weight: number; // percentage or marks (e.g. 40, 30, 30)
  maxMarks: number;
  maximumMarks?: number;
  awardedMarks: number;
  status: 'covered' | 'partial' | 'missing' | 'incorrect';
  category?: EvaluationCategory | string;
  feedback: string;
}

export interface Question {
  id: string;
  role: JobRole | 'Common';
  round: RoundId;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  experienceLevel?: ExperienceLevel | 'All';
  question: string;
  expectedAnswer?: string; // Reference ideal answer from dataset
  options?: string[]; // For aptitude multiple choice
  correctOptionIndex?: number;
  explanation?: string;
  codingStarterCode?: string; // Candidate starter template only (no reference solutions!)
  referenceSolution?: string; // Hidden reference solution for backend execution only
  codingLanguage?: 'python' | 'javascript' | 'sql';
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    description: string;
  }>;
  evaluationRubric?: string;
  source: 'dataset' | 'gemini';
  isFollowUp?: boolean;
  parentQuestionId?: string;
}

export interface SpeechDeliveryMetrics {
  speakingPaceWpm?: number;
  pauseCount?: number;
  measuredPausesCount?: number;
  totalPauseDurationSeconds?: number;
  averagePauseDurationSeconds?: number;
  fillerWordsCount?: number;
  fillerWordsDetected?: string[];
  fillerWordRatioPercent?: number;
  speechDisfluencies?: string[];
  responseDurationSeconds?: number;
  speechFluencyScore?: number; // 0 - 100 estimated
  faceVisibilityDetected?: boolean;
  cameraFramingGood?: boolean;
  notes?: string;
}

export interface CommunicationDetails {
  type: 'spoken' | 'written';
  score?: number; // 0 - 100 (undefined if insufficient data)
  speakingPaceWpm?: number;
  speakingDurationSeconds?: number;
  fillerWordsCount?: number;
  fillerWordsDetected?: string[];
  fillerWordRatioPercent?: number;
  pauseCount?: number;
  totalPauseDurationSeconds?: number;
  speechDisfluencies?: string[];
  clarityScore: number;
  organizationScore: number;
  deliveryScore?: number;
  paceAssessment?: string;
  pauseAssessment?: string;
  fillerAssessment?: string;
  fluencyAssessment?: string;
  clarityAssessment?: string;
  organizationAssessment?: string;
  writtenReadabilityScore?: number;
  rubricBreakdown?: Record<string, { weight: number; score?: number; label: string }>;
  feedback: string;
  suggestions: string[];
}

export type EvaluationCategory =
  | 'fully_correct'
  | 'partially_correct'
  | 'incorrect'
  | 'incomplete'
  | 'irrelevant'
  | 'unanswered'
  | 'unclear_transcription'
  | 'correct';

export interface QuestionEvaluation {
  questionId: string;
  round: RoundId;
  evaluationStatus: EvaluationCategory;
  evaluationCategory?: EvaluationCategory | string;
  score: number; // 0 - 100
  correctness: number; // 0 - 100
  awardedMarks: number;
  maximumMarks: number;
  technicalClarity?: number; // 0 - 100 (only when assessed)
  problemSolving?: number; // 0 - 100 (only when assessed)
  communication?: number; // 0 - 100 (only when assessed)
  communicationType?: 'spoken' | 'written' | 'none';
  communicationDetails?: CommunicationDetails;
  components?: EvaluationComponent[];
  conceptsCorrectlyIdentified: string[];
  conceptsMissing: string[];
  incorrectStatements: string[];
  feedback: string;
  explanation: string;
  referenceAnswer?: string;
  confidenceInEvaluation?: 'high' | 'medium' | 'low';
  strengths: string[];
  areasToImprove: string[];
  suggestedFollowUp?: string;
  deliveryNotes?: string;
  isDeterministic?: boolean;
  isAiGeneratedRubric?: boolean;
}

export type TestExecutionStatus =
  | 'PASS'
  | 'FAIL'
  | 'ERROR'
  | 'NOT RUN'
  | 'NOT IMPLEMENTED'
  | 'EXECUTION UNAVAILABLE';

export interface TestCaseResult {
  input: string;
  expected: string;
  expectedOutput?: string;
  actual?: string;
  actualOutput?: string;
  passed: boolean;
  status: TestExecutionStatus;
  error?: string;
  errorMessage?: string;
  executionTimeMs?: number;
  description?: string;
  testIndex?: number;
}

export interface CodingExecutionResult {
  passed: boolean;
  status: TestExecutionStatus;
  overallStatus?: TestExecutionStatus;
  testsPassed: number;
  totalTests: number;
  output: string;
  error?: string;
  executionTimeMs: number;
  codeQualityScore: number;
  timeComplexityRating?: string;
  feedback: string;
  testResults?: TestCaseResult[];
}

export interface CandidateAnswer {
  questionId: string;
  round: RoundId;
  transcript: string;
  responseMode?: 'spoken' | 'typed' | 'code' | 'mcq';
  submittedCode?: string;
  codingResult?: CodingExecutionResult;
  deliveryMetrics?: SpeechDeliveryMetrics;
  communicationAnalysis?: CommunicationDetails;
  evaluation?: QuestionEvaluation;
  answeredAt: string;
  skipped?: boolean;
  selectedOptionIndex?: number;
}

export interface RoundPerformance {
  round: RoundId;
  name: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  answers: CandidateAnswer[];
}

export interface DimensionScores {
  correctnessScore: number;
  technicalKnowledgeScore?: number;
  problemSolvingScore?: number;
  communicationScore?: {
    overall: number;
    mode: 'spoken' | 'written' | 'mixed' | 'unassessed';
    averageWpm?: number;
    fillerWordsTotal?: number;
    detailsNote: string;
  };
  codingPerformance?: {
    score: number;
    testsPassedRatio: string;
    codeQualityRating: string;
    efficiencyRating: string;
  };
}

export interface FinalReport {
  id: string;
  interviewId: string;
  candidateName: string;
  candidateEmail: string;
  role: JobRole;
  experienceLevel: ExperienceLevel;
  date: string;
  overallScore: number; // 0 - 100
  dimensionScores?: DimensionScores;
  roundScores: {
    round1Aptitude: number;
    round2Coding: number;
    round3Technical: number;
    round4HR: number;
  };
  roundStatuses?: Record<RoundId, 'completed' | 'in_progress' | 'unattempted' | 'skipped'>;
  questionWiseScores: Array<{
    round: RoundId;
    topic: string;
    question: string;
    score: number;
    feedback: string;
    category?: EvaluationCategory | string;
    awardedMarks?: number;
    maximumMarks?: number;
    components?: EvaluationComponent[];
    communicationDetails?: CommunicationDetails;
  }>;
  codingAssessment: {
    language: string;
    testsPassedRatio: string;
    codeQuality: string;
    efficiencyRating: string;
    review: string;
  };
  technicalAssessment: {
    depthScore: number;
    breadthScore: number;
    summary: string;
  };
  aptitudeAssessment: {
    accuracy: number;
    analyticalReasoning: string;
  };
  hrAssessment: {
    behavioralScore: number;
    cultureAndValues: string;
  };
  strengths: string[];
  weaknessesAndGaps: string[];
  speechAndDeliveryObservations: {
    averagePaceWpm: number;
    totalFillerWords: number;
    cameraFramingSummary: string;
    deliveryFluencyNote: string;
  };
  specificImprovementSuggestions: string[];
  recommendedTopicsToStudy: string[];
  personalizedPracticePlan: Array<{
    phase: string;
    timeline: string;
    focusAreas: string[];
    resources: string;
  }>;
  overallPerformanceSummary: string;
  disclaimer: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  candidateName: string;
  role: JobRole;
  experienceLevel: ExperienceLevel;
  status: 'setup' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
  currentRound: RoundId;
  currentQuestionIndex: number;
  startedAt: string;
  completedAt?: string;
  answers: CandidateAnswer[];
  roundPerformances: Record<RoundId, RoundPerformance | null>;
  finalReport?: FinalReport;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  preferredRole?: JobRole;
  preferredExperience?: ExperienceLevel;
  createdAt: string;
}
