import { Question, JobRole, ExperienceLevel, RoundId } from '../types';
import aptitudeData from './datasets/aptitude_reasoning.json';
import dsTechData from './datasets/data_scientist_technical.json';
import dsHrData from './datasets/data_scientist_hr.json';
import mleCodingData from './datasets/ml_engineer_coding.json';
import mleTechData from './datasets/ml_engineer_technical.json';
import mleHrData from './datasets/ml_engineer_hr.json';

// ==========================================
// PRESERVED DATA SCIENTIST CODING QUESTIONS (ROUND 2)
// As strictly instructed: MUST preserve existing DS coding question bank, test cases, and sandbox.
// ==========================================
export const DATA_SCIENTIST_CODING_QUESTIONS: Question[] = [
  {
    id: 'code-ds-001',
    role: 'Data Scientist',
    round: 2,
    topic: 'Pandas & Data Manipulation: Missing Values & Outlier Clipping',
    difficulty: 'Medium',
    experienceLevel: '0–2 years',
    question: 'Write a Python function `clean_sensor_data(values)` that takes a list of numeric sensor measurements (which may include None/null or extreme outliers) and returns a cleaned list where:\n1. Any None/null is imputed with the median of valid values.\n2. Any value greater than the 95th percentile or less than the 5th percentile is clipped to those boundaries.\n3. Values are rounded to 2 decimal places.',
    codingLanguage: 'python',
    codingStarterCode: `def clean_sensor_data(values):
    # values: list of float/int or None
    # TODO: 1. Filter valid numeric values
    # TODO: 2. Compute median of valid values and impute None
    # TODO: 3. Compute 5th and 95th percentile boundaries and clip extreme outliers
    # TODO: 4. Return cleaned list rounded to 2 decimal places
    pass
`,
    referenceSolution: `def clean_sensor_data(values):
    valid = [v for v in values if v is not None]
    if not valid:
        return []
    valid_sorted = sorted(valid)
    n = len(valid_sorted)
    if n % 2 == 1:
        median = valid_sorted[n // 2]
    else:
        median = (valid_sorted[n // 2 - 1] + valid_sorted[n // 2]) / 2.0
    
    idx_5 = int(0.05 * (n - 1))
    idx_95 = int(0.95 * (n - 1))
    p5 = valid_sorted[idx_5]
    p95 = valid_sorted[idx_95]
    
    result = []
    for v in values:
        val = median if v is None else v
        if val < p5:
            val = p5
        elif val > p95:
            val = p95
        result.append(round(val, 2))
    return result
`,
    testCases: [
      {
        input: '[10.0, 12.0, None, 14.0, 100.0, 2.0, 11.0]',
        expectedOutput: '[10.0, 12.0, 12.0, 14.0, 74.2, 4.4, 11.0]',
        description: 'Imputes None with median (12.0) and clips extremes'
      },
      {
        input: '[5.0, 5.0, 5.0, 5.0]',
        expectedOutput: '[5.0, 5.0, 5.0, 5.0]',
        description: 'Identical elements array handling'
      }
    ],
    evaluationRubric: 'Correct median calculation, robust handling of None, proper percentile clipping and list comprehension.',
    source: 'dataset'
  },
  {
    id: 'code-ds-002',
    role: 'Data Scientist',
    round: 2,
    topic: 'NumPy Vectorization: Normalized Cosine Similarity Matrix',
    difficulty: 'Hard',
    experienceLevel: '2–5 years',
    question: 'Implement a vectorized Python function `cosine_similarity_matrix(A, B)` using NumPy operations (or pure math) that computes the cosine similarity between every row in matrix A (shape M x D) and every row in matrix B (shape N x D), returning an M x N matrix without using any explicit nested python for-loops.',
    codingLanguage: 'python',
    codingStarterCode: `import math

def cosine_similarity_matrix(A, B):
    # A is list of lists of shape (M, D)
    # B is list of lists of shape (N, D)
    # TODO: Compute Euclidean norm of each row
    # TODO: Calculate dot product between every pair of rows in A and B
    # TODO: Return 2D list of shape (M, N) with cosine similarities rounded to 3 decimal places
    pass
`,
    referenceSolution: `import math

def cosine_similarity_matrix(A, B):
    def norm(vec):
        return math.sqrt(sum(x * x for x in vec))
    
    A_norms = [norm(row) or 1e-9 for row in A]
    B_norms = [norm(row) or 1e-9 for row in B]
    
    sim_matrix = []
    for i, rowA in enumerate(A):
        sim_row = []
        for j, rowB in enumerate(B):
            dot = sum(a * b for a, b in zip(rowA, rowB))
            sim = dot / (A_norms[i] * B_norms[j])
            sim_row.append(round(sim, 3))
        sim_matrix.append(sim_row)
    return sim_matrix
`,
    testCases: [
      {
        input: 'A=[[1, 0], [0, 1]], B=[[1, 0], [1, 1]]',
        expectedOutput: '[[1.0, 0.707], [0.0, 0.707]]',
        description: 'Standard orthogonal and 45-degree vectors'
      }
    ],
    evaluationRubric: 'Vectorized dot product divided by norm product, avoiding zero division with epsilon.',
    source: 'dataset'
  },
  {
    id: 'code-ds-003',
    role: 'Data Scientist',
    round: 2,
    topic: 'Combinatorics & Recursion: Combinations of K Numbers (from DS Tech dataset)',
    difficulty: 'Medium',
    experienceLevel: 'All',
    question: 'Given two integers n and k, write a Python function `combine(n, k)` that returns a list of all possible combinations of k numbers chosen from 1 to n.\n\nExample:\nIf n = 4 and k = 2, return `[[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]]`.\nIf n = 3 and k = 2, return `[[1, 2], [1, 3], [2, 3]]`.\nOutput combinations should be sorted in lexicographical order.',
    codingLanguage: 'python',
    codingStarterCode: `def combine(n, k):
    # n, k: positive integers
    # TODO: Return all combinations of k numbers chosen from 1 to n
    # TODO: Output combinations should be sorted in lexicographical order
    pass
`,
    referenceSolution: `def combine(n, k):
    result = []
    def backtrack(start, current):
        if len(current) == k:
            result.append(list(current))
            return
        for i in range(start, n + 1):
            current.append(i)
            backtrack(i + 1, current)
            current.pop()
    backtrack(1, [])
    return result
`,
    testCases: [
      {
        input: 'n=3, k=2',
        expectedOutput: '[[1, 2], [1, 3], [2, 3]]',
        description: 'All 2-combinations of 1..3'
      },
      {
        input: 'n=4, k=1',
        expectedOutput: '[[1], [2], [3], [4]]',
        description: 'Single element selections'
      }
    ],
    evaluationRubric: 'Correct recursive backtracking or iterative combination generation, accurate edge cases when k=1 or k=n.',
    source: 'dataset'
  }
];

// Cast parsed dataset arrays to Question type
const rawAptitude = aptitudeData as Question[];
const rawDsTech = dsTechData as Question[];
const rawDsHr = dsHrData as Question[];
const rawMleCoding = mleCodingData as Question[];
const rawMleTech = mleTechData as Question[];
const rawMleHr = mleHrData as Question[];

// Curate a balanced default bank of questions representing all categories
export const DEFAULT_QUESTIONS: Question[] = [
  // Round 1: Aptitude (Common to both roles, extracted from common aptitude and reasoning.csv)
  ...rawAptitude.slice(0, 30),

  // Round 2 (DS): Preserved Data Scientist coding challenges
  ...DATA_SCIENTIST_CODING_QUESTIONS,

  // Round 2 (MLE): Extracted ML Engineer coding challenges with test cases
  ...rawMleCoding.slice(0, 5),

  // Round 3 (DS): Data Scientist technical deep-dive questions (from data_scientist_technical_questions.csv)
  ...rawDsTech.slice(0, 25),

  // Round 3 (MLE): ML Engineer technical deep-dive questions (from README.md)
  ...rawMleTech.slice(0, 25),

  // Round 4 (DS): Data Scientist HR & Behavioral questions (from data_scientist_hr_questions.csv)
  ...rawDsHr.slice(0, 15),

  // Round 4 (MLE): ML Engineer HR & Behavioral questions (from README.md)
  ...rawMleHr.slice(0, 15),
];

// Helper to strip hidden reference solutions before questions reach candidate session and ensure similar, confusing options
export function sanitizeQuestionForCandidate(q: Question): Question {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { referenceSolution, ...safeQ } = q;

  // Extra safety: If any question in Round 1 has giveaway boilerplate options, refine them into close distractors
  if (safeQ.round === 1 && safeQ.options && safeQ.options.some(o => /insufficient|cannot be determined|none of the other/i.test(o))) {
    const rawTarget = safeQ.correctOptionIndex !== undefined ? safeQ.options[safeQ.correctOptionIndex].replace(/^[A-D]\)\s*/, '') : safeQ.options[0].replace(/^[A-D]\)\s*/, '');
    const num = parseFloat(rawTarget);
    if (!isNaN(num)) {
      const step = num <= 10 ? 1 : num <= 50 ? (num % 5 === 0 ? 5 : 2) : 10;
      const opts = [
        rawTarget,
        rawTarget.replace(/\d+/, () => String(num + step)),
        rawTarget.replace(/\d+/, () => String(Math.max(1, num - step))),
        rawTarget.replace(/\d+/, () => String(num + step * 2))
      ];
      const targetVal = opts[0];
      const shuffled = shuffleArray(opts);
      const newTargetIdx = shuffled.indexOf(targetVal);
      safeQ.options = shuffled.map((o, idx) => `${String.fromCharCode(65 + idx)}) ${o}`);
      safeQ.correctOptionIndex = newTargetIdx >= 0 ? newTargetIdx : 0;
    }
  }

  return safeQ;
}

// Fisher-Yates shuffle algorithm for guaranteed unbiased random sampling across sessions
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper to provide randomized questions for each interview session from the dataset
export function getQuestionsForSession(
  role: JobRole,
  experienceLevel: ExperienceLevel
): Record<RoundId, Question[]> {
  // Round 1: Common Aptitude questions (covering all 6 categories from common aptitude & reasoning CSV)
  const round1Pool = rawAptitude.length > 0 ? rawAptitude : DEFAULT_QUESTIONS.filter(q => q.round === 1);
  const round1Selected: Question[] = [];
  const categories = [
    'Quantitative Aptitude (Numerical Ability)',
    'Logical Reasoning (Analytical Ability)',
    'Verbal Ability (English Comprehension)',
    'Data Interpretation and Analysis',
    'Abstract Reasoning (Non-Verbal Reasoning)',
    'Technical Aptitude (Basic Programming and AIML Concepts)'
  ];

  // Pick 1 randomized question from each category to ensure a diverse, balanced aptitude assessment
  for (const cat of categories) {
    const matched = round1Pool.filter(q => q.topic.includes(cat) || cat.includes(q.topic));
    if (matched.length > 0) {
      const shuffledCat = shuffleArray(matched);
      round1Selected.push(shuffledCat[0]);
    }
  }

  // If any categories were sparse, top up from the shuffled master aptitude pool to reach 6 questions
  let finalRound1 = round1Selected;
  if (finalRound1.length < 6) {
    const remaining = shuffleArray(round1Pool.filter(q => !finalRound1.some(s => s.id === q.id)));
    finalRound1 = [...finalRound1, ...remaining.slice(0, 6 - finalRound1.length)];
  }
  finalRound1 = shuffleArray(finalRound1).slice(0, 6);

  // Round 2: Coding questions (Role specific)
  let finalRound2: Question[] = [];
  if (role === 'Data Scientist') {
    // Preserve Data Scientist coding questions and randomize presentation order
    finalRound2 = shuffleArray(DATA_SCIENTIST_CODING_QUESTIONS).slice(0, 3);
  } else {
    // ML Engineer coding questions - pick 3 randomized challenges from the 40 coding problems
    finalRound2 = shuffleArray(rawMleCoding).slice(0, 3);
  }

  // Round 3: Technical questions (Role specific)
  let finalRound3: Question[] = [];
  if (role === 'Data Scientist') {
    const pool = rawDsTech.length > 0 ? rawDsTech : DEFAULT_QUESTIONS.filter(q => q.round === 3 && q.role === 'Data Scientist');
    finalRound3 = shuffleArray(pool).slice(0, 6);
  } else {
    const pool = rawMleTech.length > 0 ? rawMleTech : DEFAULT_QUESTIONS.filter(q => q.round === 3 && q.role === 'ML Engineer');
    finalRound3 = shuffleArray(pool).slice(0, 6);
  }

  // Round 4: HR & Behavioral questions (Role specific)
  let finalRound4: Question[] = [];
  if (role === 'Data Scientist') {
    const pool = rawDsHr.length > 0 ? rawDsHr : DEFAULT_QUESTIONS.filter(q => q.round === 4 && q.role === 'Data Scientist');
    finalRound4 = shuffleArray(pool).slice(0, 5);
  } else {
    const pool = rawMleHr.length > 0 ? rawMleHr : DEFAULT_QUESTIONS.filter(q => q.round === 4 && q.role === 'ML Engineer');
    finalRound4 = shuffleArray(pool).slice(0, 5);
  }

  return {
    1: finalRound1.map(sanitizeQuestionForCandidate),
    2: finalRound2.map(sanitizeQuestionForCandidate),
    3: finalRound3.map(sanitizeQuestionForCandidate),
    4: finalRound4.map(sanitizeQuestionForCandidate),
  };
}

// Export dataset counts for summary reporting
export const DATASET_STATS = {
  aptitudeCommon: rawAptitude.length,
  dataScientistTechnical: rawDsTech.length,
  dataScientistHr: rawDsHr.length,
  dataScientistCoding: DATA_SCIENTIST_CODING_QUESTIONS.length,
  mlEngineerCoding: rawMleCoding.length,
  mlEngineerTechnical: rawMleTech.length,
  mlEngineerHr: rawMleHr.length,
  totalImported: rawAptitude.length + rawDsTech.length + rawDsHr.length + rawMleCoding.length + rawMleTech.length + rawMleHr.length + DATA_SCIENTIST_CODING_QUESTIONS.length
};
