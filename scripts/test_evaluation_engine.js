/**
 * End-to-End Integration, Regression, and Mutation Test Suite
 * Tests actual backend endpoints, semantic evaluation engine, Python code sandbox,
 * and deterministic report generation.
 */

async function postJson(path, payload) {
  const res = await fetch(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch (e) {
    body = text;
  }
  return { statusCode: res.status, body };
}

async function waitForServer(maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch('http://localhost:3000/api/questions');
      if (res.ok || res.status === 200 || res.status === 404) return true;
    } catch (e) {
      // wait 400ms
      await new Promise(r => setTimeout(r, 400));
    }
  }
  return false;
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failedTests++;
    process.exitCode = 1;
  } else {
    console.log(`  ✅ PASSED: ${message}`);
    passedTests++;
  }
}

async function runTestSuite() {
  const ready = await waitForServer();
  if (!ready) {
    console.error('Server did not become ready on port 3000');
    process.exit(1);
  }

  console.log('======================================================================');
  console.log('       INTERVIEW WITH AI — VERIFICATION & INTEGRATION TEST SUITE      ');
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // SECTION 1: UNIT & INTEGRATION - DETERMINISTIC APTITUDE & MCQ EVALUATION
  // -------------------------------------------------------------------------
  console.log('--- SECTION 1: APTITUDE & NUMERICAL DETERMINISTIC TESTS ---');
  const numQuestion = {
    id: 'apt-arithmetic-1',
    round: 1,
    category: 'Percentages & Arithmetic',
    question: 'What is 25% of 400?',
    options: ['50', '80', '100', '120'],
    correctAnswer: '100',
    solution: '25% of 400 = (25/100) * 400 = 100.',
  };

  // 1a. Direct numeric value
  {
    const res = await postJson('/api/gemini/evaluate-answer', {
      question: numQuestion,
      round: 1,
      candidateAnswer: '100',
      responseMode: 'typed',
    });
    const ev = res.body?.evaluation;
    assert(ev?.evaluationStatus === 'correct', '1a: 100 receives correct status');
    assert(ev?.awardedMarks === 10, '1a: 100 receives full 10 marks');
    assert(ev?.isDeterministic === true, '1a: Marked deterministic');
  }

  // 1b. English worded number
  {
    const res = await postJson('/api/gemini/evaluate-answer', {
      question: numQuestion,
      round: 1,
      candidateAnswer: 'The calculated amount is one hundred.',
      responseMode: 'typed',
    });
    const ev = res.body?.evaluation;
    assert(ev?.evaluationStatus === 'correct', '1b: "one hundred" recognized as 100');
    assert(ev?.awardedMarks === 10, '1b: "one hundred" awarded 10 marks');
  }

  // 1c. Incorrect number
  {
    const res = await postJson('/api/gemini/evaluate-answer', {
      question: numQuestion,
      round: 1,
      candidateAnswer: '80',
      responseMode: 'typed',
    });
    const ev = res.body?.evaluation;
    assert(ev?.evaluationStatus === 'incorrect', '1c: 80 flagged as incorrect');
    assert(ev?.awardedMarks === 0, '1c: 80 receives 0 marks');
    assert(ev?.correctness === 0, '1c: 80 has 0 correctness');
  }

  // 1d. Non-substantive "I don't know"
  {
    const res = await postJson('/api/gemini/evaluate-answer', {
      question: numQuestion,
      round: 1,
      candidateAnswer: "I don't know the answer to this question",
      responseMode: 'typed',
    });
    const ev = res.body?.evaluation;
    assert(ev?.evaluationStatus === 'unanswered', '1d: "I don\'t know" flagged as unanswered');
    assert(ev?.awardedMarks === 0, '1d: "I don\'t know" receives 0 marks');
  }

  // 1e. Empty response
  {
    const res = await postJson('/api/gemini/evaluate-answer', {
      question: numQuestion,
      round: 1,
      candidateAnswer: '   ',
      responseMode: 'typed',
    });
    const ev = res.body?.evaluation;
    assert(ev?.evaluationStatus === 'unanswered', '1e: Empty string is unanswered');
    assert(ev?.awardedMarks === 0, '1e: Empty string receives 0 marks');
  }

  // 1f. Deterministic MCQ selection
  const mcqQuestion = {
    id: 'apt-mcq-1',
    round: 1,
    category: 'Probability',
    question: 'A fair die is rolled. Probability of rolling > 4?',
    options: ['1/6', '1/3', '1/2', '2/3'],
    correctOptionIndex: 1,
    correctAnswer: '1/3',
  };

  {
    const res = await postJson('/api/gemini/evaluate-answer', {
      question: mcqQuestion,
      round: 1,
      selectedOptionIndex: 1,
      responseMode: 'mcq',
    });
    const ev = res.body?.evaluation;
    assert(ev?.evaluationStatus === 'correct', '1f: MCQ option 1 is correct');
    assert(ev?.awardedMarks === 10, '1f: MCQ option 1 receives 10 marks');
  }

  {
    const res = await postJson('/api/gemini/evaluate-answer', {
      question: mcqQuestion,
      round: 1,
      selectedOptionIndex: 3,
      responseMode: 'mcq',
    });
    const ev = res.body?.evaluation;
    assert(ev?.evaluationStatus === 'incorrect', '1f: MCQ option 3 is incorrect');
    assert(ev?.awardedMarks === 0, '1f: MCQ option 3 receives 0 marks');
  }

  // -------------------------------------------------------------------------
  // SECTION 2: SEMANTIC EVALUATION - ALTERNATIVES, PARTIALS, CONTRADICTIONS
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 2: SEMANTIC EVALUATION & CONCEPT MATCHING ---');
  const techQuestion = {
    id: 'tech-bias-var-1',
    round: 3,
    category: 'Machine Learning',
    question: 'Explain the bias-variance tradeoff and how regularization affects it.',
    expectedAnswer: 'High bias causes underfitting through overly simple assumptions. High variance causes overfitting due to sensitivity to training fluctuations. Regularization penalizes large model weights, increasing bias slightly to substantially decrease variance and improve out-of-sample generalization.',
  };

  // 2a. Correct alternative explanation (different phrasing, no exact keyword requirements)
  {
    const res = await postJson('/api/gemini/evaluate-answer', {
      question: techQuestion,
      round: 3,
      candidateAnswer: 'When a model is too rigid, systematic error or underfitting occurs because the model cannot capture the true relationship. On the other hand, an overly complex model suffers from high variance because it memorizes sample noise. By introducing an L2 weight decay penalty, we constrain parameter magnitudes. This trades off a slight increase in bias for a major reduction in sample sensitivity, giving superior out-of-sample performance.',
      responseMode: 'typed',
    });
    const ev = res.body?.evaluation;
    assert(ev?.evaluationStatus === 'correct' || ev?.evaluationStatus === 'fully_correct', '2a: Alternative phrasing marked correct');
    assert(ev?.awardedMarks >= 8, `2a: High marks awarded for complete concepts (${ev?.awardedMarks}/10)`);
    assert(ev?.conceptsCorrectlyIdentified?.length >= 3, '2a: Multiple concepts identified');
  }

  // 2b. Genuinely partial answer (only describes bias, neglects variance and regularization)
  {
    const res = await postJson('/api/gemini/evaluate-answer', {
      question: techQuestion,
      round: 3,
      candidateAnswer: 'Bias is when the model is too simple and makes oversimplified assumptions, leading to underfitting on the training set.',
      responseMode: 'typed',
    });
    const ev = res.body?.evaluation;
    assert(ev?.evaluationStatus === 'partially_correct', `2b: Partial answer marked partially_correct, got ${ev?.evaluationStatus}`);
    assert(ev?.awardedMarks >= 2 && ev?.awardedMarks <= 7, `2b: Partial marks awarded (expected 2-7, got ${ev?.awardedMarks})`);
    assert(ev?.conceptsMissing?.length > 0, '2b: Missing concepts clearly documented');
  }

  // 2c. Factually contradictory / incorrect answer
  {
    const res = await postJson('/api/gemini/evaluate-answer', {
      question: techQuestion,
      round: 3,
      candidateAnswer: 'High bias causes overfitting because the model memorizes every point, while high variance causes underfitting.',
      responseMode: 'typed',
    });
    const ev = res.body?.evaluation;
    assert(ev?.evaluationStatus === 'incorrect' || ev?.evaluationCategory === 'incorrect' || ev?.awardedMarks === 0, `2c: Contradictory answer penalized heavily, got ${ev?.evaluationStatus} (${ev?.awardedMarks}/10)`);
    assert(ev?.awardedMarks === 0, `2c: 0 marks awarded for fatal contradiction, got ${ev?.awardedMarks}`);
    assert(ev?.incorrectStatements?.length > 0, '2c: Contradiction explicitly identified');
  }

  // 2d. Technical "I don't know" / non-substantive
  {
    const res = await postJson('/api/gemini/evaluate-answer', {
      question: techQuestion,
      round: 3,
      candidateAnswer: "I don't know the difference between bias and variance, I haven't studied it.",
      responseMode: 'typed',
    });
    const ev = res.body?.evaluation;
    assert(ev?.evaluationStatus === 'unanswered', `2d: 'I don't know' marked unanswered, got ${ev?.evaluationStatus}`);
    assert(ev?.awardedMarks === 0, `2d: 0 marks awarded, got ${ev?.awardedMarks}`);
    assert(ev?.correctness === 0, `2d: 0 correctness, got ${ev?.correctness}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 3: COMMUNICATION EVALUATION SEPARATION
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 3: COMMUNICATION SEPARATE FROM CORRECTNESS ---');
  // 3a. Typed response: no spoken pace or filler words
  {
    const res = await postJson('/api/gemini/evaluate-answer', {
      question: techQuestion,
      round: 3,
      candidateAnswer: 'L1 regularization induces sparsity by setting parameters exactly to zero, while L2 shrinks them smoothly.',
      responseMode: 'typed',
    });
    const ev = res.body?.evaluation;
    assert(ev?.communicationType === 'written', '3a: Communication type is written');
    assert(ev?.communicationDetails?.metrics?.speakingPaceWpm === undefined, '3a: Typed mode has no speaking pace');
    assert(ev?.communicationDetails?.metrics?.fillerWordsCount === undefined, '3a: Typed mode has no filler words');
  }

  // 3b. Spoken response: evaluates WPM and fillers, separate from technical score
  {
    const res = await postJson('/api/gemini/evaluate-answer', {
      question: techQuestion,
      round: 3,
      candidateAnswer: 'Um, basically, bias is underfitting and variance is overfitting.',
      responseMode: 'spoken',
      deliveryMetrics: {
        responseDurationSeconds: 15,
        pauseCount: 3,
        speakingPaceWpm: 135,
        fillerWordsCount: 2,
        fillerWordsDetected: ['um', 'basically'],
      },
    });
    const ev = res.body?.evaluation;
    assert(ev?.communicationType === 'spoken', '3b: Communication type is spoken');
    assert(ev?.communicationDetails?.speakingPaceWpm === 135 || ev?.communicationDetails?.metrics?.speakingPaceWpm === 135, '3b: Speaking pace accurately recorded');
    assert(ev?.communicationDetails?.fillerWordsCount === 2 || ev?.communicationDetails?.metrics?.fillerWordsCount === 2, '3b: Filler count accurately recorded');
    assert(typeof ev?.communication === 'number', '3b: Communication score is distinct number');
  }

  // -------------------------------------------------------------------------
  // SECTION 4: REAL CODING SANDBOX EXECUTION (PYTHON 3.10)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 4: REAL PYTHON CODE SANDBOX EXECUTION ---');

  // 4a. Passing candidate code
  {
    const candidateCode = `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`;

    const res = await postJson('/api/code/execute', {
      code: candidateCode,
      language: 'python',
      testCases: [
        { input: '[2, 7, 11, 15], 9', expected: '[0, 1]' },
        { input: '[3, 2, 4], 6', expected: '[1, 2]' },
        { input: '[3, 3], 6', expected: '[0, 1]' },
      ],
    });
    assert(res.body?.passed === true, '4a: Valid two_sum code passes all test cases');
    assert(res.body?.testsPassed === 3, '4a: 3 of 3 test cases passed');
    assert(res.body?.totalTests === 3, '4a: Total test count is 3');
    assert(res.body?.testResults?.length === 3, '4a: Individual test result details returned');
  }

  // 4b. Failing candidate code (logic error)
  {
    const faultyCode = `def two_sum(nums: list[int], target: int) -> list[int]:
    return [0, 0]`;

    const res = await postJson('/api/code/execute', {
      code: faultyCode,
      language: 'python',
      testCases: [
        { input: '[2, 7, 11, 15], 9', expected: '[0, 1]' },
      ],
    });
    assert(res.body?.passed === false, '4b: Faulty logic correctly fails test');
    assert(res.body?.testsPassed === 0, '4b: 0 tests passed');
    assert(res.body?.testResults?.[0]?.passed === false, '4b: Detailed test result shows failed');
  }

  // 4c. Syntax error in candidate code
  {
    const syntaxErrorCode = `def broken_func(x):
    return x + (`;

    const res = await postJson('/api/code/execute', {
      code: syntaxErrorCode,
      language: 'python',
      testCases: [{ input: '5', expected: '5' }],
    });
    assert(res.body?.passed === false, '4c: Syntax error code fails gracefully');
    assert(res.body?.error !== undefined, '4c: Error message contains syntax error details');
  }

  // 4d. Infinite loop / timeout protection
  {
    const loopCode = `def endless(x):
    while True:
        pass
    return x`;

    const res = await postJson('/api/code/execute', {
      code: loopCode,
      language: 'python',
      timeoutMs: 1200,
      testCases: [{ input: '1', expected: '1' }],
    });
    assert(res.body?.passed === false, '4d: Infinite loop safely terminates');
    assert(res.body?.error?.toLowerCase().includes('timeout') || res.body?.output?.toLowerCase().includes('timed out'), '4d: Timeout error reported');
  }

  // -------------------------------------------------------------------------
  // SECTION 5: COMPLETE END-TO-END SESSION & REPORT INTEGRITY
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 5: END-TO-END FLOW & REPORT ACCURACY ---');

  // Candidate completes 4 rounds:
  // Round 1 Aptitude: 10/10 -> 100%
  // Round 2 Coding: 3/3 passed -> 100%
  // Round 3 Technical: Partial answer 5/10 -> 50%
  // Round 4 HR: Strong answer 9/10 -> 90%
  const candidateSessionAnswers = [
    {
      questionId: 'apt-1',
      round: 1,
      transcript: '100',
      responseMode: 'typed',
      evaluation: { score: 100, correctness: 100, awardedMarks: 10, evaluationStatus: 'correct', feedback: 'Correct.' },
      answeredAt: new Date().toISOString(),
    },
    {
      questionId: 'code-1',
      round: 2,
      transcript: 'Implemented two-sum with hash map',
      responseMode: 'code',
      submittedCode: 'def two_sum...',
      codingResult: { passed: true, testsPassed: 3, totalTests: 3, executionTimeMs: 12, codeQualityScore: 90, feedback: 'Optimal.' },
      evaluation: { score: 100, correctness: 100, awardedMarks: 10, evaluationStatus: 'correct', feedback: 'All tests passed.' },
      answeredAt: new Date().toISOString(),
    },
    {
      questionId: 'tech-1',
      round: 3,
      transcript: 'Bias is underfitting.',
      responseMode: 'typed',
      evaluation: { score: 50, correctness: 50, awardedMarks: 5, evaluationStatus: 'partially_correct', feedback: 'Partial.' },
      answeredAt: new Date().toISOString(),
    },
    {
      questionId: 'hr-1',
      round: 4,
      transcript: 'I led the migration of our ML pipeline.',
      responseMode: 'typed',
      evaluation: { score: 90, correctness: 90, awardedMarks: 9, evaluationStatus: 'correct', feedback: 'Great STAR example.' },
      answeredAt: new Date().toISOString(),
    },
  ];

  {
    const res = await postJson('/api/gemini/generate-report', {
      candidateName: 'Jane Doe',
      candidateEmail: 'jane.doe@example.com',
      role: 'Data Scientist',
      experienceLevel: '0–2 years',
      answers: candidateSessionAnswers,
      deliverySummaries: [],
    });

    const report = res.body?.report;
    assert(report !== undefined, '5: Report object returned');
    assert(report?.roundScores?.round1Aptitude === 100, `5: Round 1 score is 100, got ${report?.roundScores?.round1Aptitude}`);
    assert(report?.roundScores?.round2Coding === 100, `5: Round 2 score is 100, got ${report?.roundScores?.round2Coding}`);
    assert(report?.roundScores?.round3Technical === 50, `5: Round 3 score is 50, got ${report?.roundScores?.round3Technical}`);
    assert(report?.roundScores?.round4HR === 90, `5: Round 4 score is 90, got ${report?.roundScores?.round4HR}`);

    // Expected overall: (100 + 100 + 50 + 90) / 4 = 340 / 4 = 85
    assert(report?.overallScore === 85, `5: Overall score is exactly 85, got ${report?.overallScore}`);
    assert(report?.dimensionScores?.correctnessScore === 85, `5: Correctness dimension is 85, got ${report?.dimensionScores?.correctnessScore}`);

    // Verify questionWiseScores match actual evaluations
    assert(report?.questionWiseScores?.length === 4, '5: Exactly 4 question-wise scores recorded');
    assert(report?.questionWiseScores?.[0]?.score === 100, '5: Question 1 score preserved in report');
    assert(report?.questionWiseScores?.[2]?.score === 50, '5: Question 3 partial score preserved in report');
  }

  // -------------------------------------------------------------------------
  // SECTION 6: UNATTEMPTED / SKIPPED QUESTIONS INTEGRITY
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 6: SKIPPED & UNATTEMPTED ROUND INTEGRITY ---');
  {
    const partialSessionAnswers = [
      {
        questionId: 'apt-1',
        round: 1,
        transcript: '100',
        responseMode: 'typed',
        evaluation: { score: 100, correctness: 100, awardedMarks: 10, evaluationStatus: 'correct' },
        answeredAt: new Date().toISOString(),
      },
      {
        questionId: 'code-1',
        round: 2,
        skipped: true,
        transcript: '[Candidate skipped this question]',
        evaluation: { score: 0, correctness: 0, awardedMarks: 0, evaluationStatus: 'unanswered' },
        answeredAt: new Date().toISOString(),
      },
    ];

    const res = await postJson('/api/gemini/generate-report', {
      candidateName: 'Skipping Candidate',
      candidateEmail: 'skip@candidate.com',
      role: 'Machine Learning Engineer',
      experienceLevel: '3–5 years',
      answers: partialSessionAnswers,
      deliverySummaries: [],
    });

    const report = res.body?.report;
    assert(report?.roundStatuses?.[1] === 'completed', '6: Round 1 status is completed');
    assert(report?.roundStatuses?.[2] === 'skipped', '6: Round 2 status is skipped');
    assert(report?.roundStatuses?.[3] === 'unattempted', '6: Round 3 status is unattempted');
    assert(report?.roundStatuses?.[4] === 'unattempted', '6: Round 4 status is unattempted');
    assert(report?.roundScores?.round2Coding === 0, '6: Skipped round receives 0 score');
  }

  // -------------------------------------------------------------------------
  // SECTION 7: SPOKEN COMMUNICATION METRICS VARIABILITY (PART A)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 7: SPOKEN COMMUNICATION DYNAMIC SCORING (PART A) ---');
  {
    // 7a. Normal paced, clear speech
    const resNormal = await postJson('/api/gemini/evaluate-answer', {
      question: techQuestion,
      round: 3,
      candidateAnswer: 'Random Forest is an ensemble of decision trees where each tree is trained on a bootstrap sample of data with random feature selection at each split.',
      responseMode: 'spoken',
      deliveryMetrics: {
        responseDurationSeconds: 12,
        speakingPaceWpm: 135,
        pauseCount: 1,
        fillerWordsCount: 0,
        fillerWordsDetected: [],
      },
    });
    const evNormal = resNormal.body?.evaluation;
    const scoreNormal = evNormal?.communication;

    // 7b. Excessively fast speech with high fillers
    const resFast = await postJson('/api/gemini/evaluate-answer', {
      question: techQuestion,
      round: 3,
      candidateAnswer: 'Um, like, basically, you know, Random Forest is like lots of trees, uh, like bagging with random features, you know, um, right?',
      responseMode: 'spoken',
      deliveryMetrics: {
        responseDurationSeconds: 6,
        speakingPaceWpm: 215, // excessively fast
        pauseCount: 4,
        fillerWordsCount: 6,
        fillerWordsDetected: ['um', 'like', 'basically', 'you know', 'uh', 'right?'],
      },
    });
    const evFast = resFast.body?.evaluation;
    const scoreFast = evFast?.communication;

    assert(typeof scoreNormal === 'number' && typeof scoreFast === 'number', '7: Communication scores are numbers');
    assert(scoreNormal !== 79, `7: Normal communication score is NOT stuck at 79% (got ${scoreNormal}%)`);
    assert(scoreFast !== 79, `7: Fast communication score is NOT stuck at 79% (got ${scoreFast}%)`);
    assert(scoreNormal > scoreFast, `7: Clear normal speech (${scoreNormal}%) scores higher than filler-heavy fast speech (${scoreFast}%)`);
    assert(evFast?.communicationDetails?.paceAssessment?.includes('Fast') || evFast?.communicationDetails?.speakingPaceWpm > 180, '7: Fast pace detected');
  }

  // 7c. Insufficient data (<3 words)
  {
    const resShort = await postJson('/api/gemini/evaluate-answer', {
      question: techQuestion,
      round: 3,
      candidateAnswer: 'Random forest.',
      responseMode: 'spoken',
      deliveryMetrics: {
        responseDurationSeconds: 2,
        speakingPaceWpm: 60,
        pauseCount: 0,
        fillerWordsCount: 0,
      },
    });
    const evShort = resShort.body?.evaluation;
    assert(evShort?.communicationDetails?.paceAssessment === 'Insufficient speech data' || evShort?.communicationDetails?.score === undefined || evShort?.communication === undefined || evShort?.communication < 50, '7c: Very short speech handled appropriately');
  }

  // -------------------------------------------------------------------------
  // SECTION 8: MULTI-PART TECHNICAL DECOMPOSITION (PART B)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 8: MULTI-PART TECHNICAL DECOMPOSITION (PART B) ---');
  const rfQuestion = {
    id: 'tech-rf-decomp-1',
    round: 3,
    category: 'Ensemble Learning',
    question: 'Explain Random Forest. How do bagging and random feature selection reduce variance? What are its primary advantages and disadvantages compared to single trees and gradient boosted trees?',
    expectedAnswer: 'Random Forest is an ensemble of decorrelated decision trees. Bagging trains each tree on a bootstrap sample, and random feature subspace selection ensures individual trees make independent errors, drastically reducing variance through averaging. Advantages: robust to overfitting, handles high dimensions, requires little hyperparameter tuning. Disadvantages: larger memory footprint, slower inference than single trees, and typically lower peak accuracy than well-tuned gradient boosting.',
  };

  // 8a. Partial answer: definition only, no advantages or disadvantages
  {
    const resPartial = await postJson('/api/gemini/evaluate-answer', {
      question: rfQuestion,
      round: 3,
      candidateAnswer: 'A random forest is an ensemble method composed of multiple decision trees trained together.',
      responseMode: 'typed',
    });
    const ev = resPartial.body?.evaluation;
    assert(ev?.evaluationCategory === 'incomplete' || ev?.evaluationCategory === 'partially_correct' || ev?.evaluationStatus === 'partially_correct', `8a: Incomplete RF answer flagged incomplete/partially_correct, got ${ev?.evaluationCategory || ev?.evaluationStatus}`);
    assert(ev?.awardedMarks < 6, `8a: Partial answer does NOT receive full marks (got ${ev?.awardedMarks}/10)`);
    assert(ev?.components?.length >= 2, `8a: Multi-part question decomposed into components (count: ${ev?.components?.length})`);
  }

  // 8b. Complete answer: definition, variance reduction, advantages, and disadvantages
  {
    const resFull = await postJson('/api/gemini/evaluate-answer', {
      question: rfQuestion,
      round: 3,
      candidateAnswer: 'Random Forest is an ensemble of decision trees. Bagging draws bootstrap samples for each tree, and random feature selection at each node split decorrelates the trees so that their errors average out, substantially reducing model variance. Key advantages include strong robustness to overfitting, automatic handling of missing values, and good default performance without excessive tuning. However, its disadvantages include high memory usage, slower inference latency, and it generally gets outperformed by gradient boosting on tabular benchmarks.',
      responseMode: 'typed',
    });
    const ev = resFull.body?.evaluation;
    assert(ev?.evaluationCategory === 'fully_correct' || ev?.evaluationStatus === 'fully_correct' || ev?.evaluationStatus === 'correct' || ev?.awardedMarks >= 7, `8b: Comprehensive RF answer marked high quality, got ${ev?.evaluationCategory || ev?.evaluationStatus}`);
    assert(ev?.awardedMarks >= 7, `8b: Comprehensive answer receives high marks (${ev?.awardedMarks}/10)`);
  }

  // -------------------------------------------------------------------------
  // SECTION 9: HR / BEHAVIORAL STAR RUBRIC (PART C)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 9: HR BEHAVIORAL STAR EVALUATION (PART C) ---');
  const hrQuestion = {
    id: 'hr-conflict-1',
    round: 4,
    category: 'Collaboration & Conflict',
    question: 'Describe a challenging conflict you experienced with a team member on a data project. How did you resolve it, and what was the outcome?',
  };

  // 9a. 1-2 word vague answer
  {
    const resVague = await postJson('/api/gemini/evaluate-answer', {
      question: hrQuestion,
      round: 4,
      candidateAnswer: 'Teamwork.',
      responseMode: 'typed',
    });
    const ev = resVague.body?.evaluation;
    assert(ev?.awardedMarks <= 2, `9a: 1-word answer "teamwork" receives low/zero marks (got ${ev?.awardedMarks}/10)`);
    assert(ev?.evaluationCategory === 'incomplete' || ev?.evaluationCategory === 'unanswered' || ev?.evaluationStatus === 'incorrect' || ev?.evaluationStatus === 'partially_correct', `9a: Vague answer categorized as incomplete/unanswered, got ${ev?.evaluationCategory || ev?.evaluationStatus}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 10: CODING SANDBOX STATUSES & STARTER CODE (PART E)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 10: CODING SANDBOX STATUSES (PART E) ---');

  // 10a. Unmodified starter code -> NOT IMPLEMENTED
  {
    const starterAttentionCode = `import math

def scaled_dot_product_attention(Q, K, V):
    # TODO: Calculate attention scores (Q @ K.T)
    # TODO: Scale the scores by sqrt(d_k)
    # TODO: Apply softmax along the rows
    # TODO: Return result with elements rounded to 4 decimal places
    pass
`;
    const res = await postJson('/api/code/execute', {
      code: starterAttentionCode,
      language: 'python',
      testCases: [
        {
          input: 'Q=[[1.0, 0.0]], K=[[1.0, 0.0]], V=[[5.0, 10.0]]',
          expected: '[[5.0, 10.0]]',
          description: 'Single token identity pass-through',
        },
      ],
    });
    assert(res.body?.overallStatus === 'NOT IMPLEMENTED' || res.body?.status === 'NOT IMPLEMENTED', `10a: Unmodified starter code detected as NOT IMPLEMENTED, got ${res.body?.overallStatus || res.body?.status}`);
    assert(res.body?.passed === false, '10a: Unmodified code does NOT pass');
    assert(res.body?.testResults?.[0]?.status === 'NOT IMPLEMENTED', `10a: Test result marked NOT IMPLEMENTED, got ${res.body?.testResults?.[0]?.status}`);
  }

  // 10b. Full working Scaled Dot-Product Attention implementation -> PASS
  {
    const workingAttentionCode = `import math

def softmax_row(row):
    max_val = max(row)
    exp_vals = [math.exp(x - max_val) for x in row]
    sum_exp = sum(exp_vals)
    return [v / sum_exp for v in exp_vals]

def scaled_dot_product_attention(Q, K, V):
    N = len(Q)
    D = len(Q[0])
    scale = math.sqrt(D)
    scores = []
    for i in range(N):
        row_score = []
        for j in range(N):
            dot = sum(Q[i][d] * K[j][d] for d in range(D))
            row_score.append(dot / scale)
        scores.append(softmax_row(row_score))
    output = []
    for i in range(N):
        out_row = []
        for d in range(D):
            val = sum(scores[i][j] * V[j][d] for j in range(N))
            out_row.append(round(val, 4))
        output.append(out_row)
    return output
`;
    const res = await postJson('/api/code/execute', {
      code: workingAttentionCode,
      language: 'python',
      testCases: [
        {
          input: 'Q=[[1.0, 0.0]], K=[[1.0, 0.0]], V=[[5.0, 10.0]]',
          expected: '[[5.0, 10.0]]',
          description: 'Single token identity pass-through',
        },
      ],
    });
    assert(res.body?.overallStatus === 'PASS' || res.body?.status === 'PASS' || res.body?.passed === true, `10b: Working attention code passes sandbox tests, got ${res.body?.overallStatus || res.body?.status}`);
    assert(res.body?.testsPassed === 1, '10b: 1 test passed');
  }

  // -------------------------------------------------------------------------
  // SECTION 11: DATASET PRIVACY & ADMIN SECURITY (PART F)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 11: DATASET PRIVACY & ADMIN ACCESS CONTROL (PART F) ---');

  // 11a. Candidate /api/questions endpoint is sanitized
  {
    const res = await fetch('http://localhost:3000/api/questions');
    const data = await res.json();
    const questions = data?.questions || [];
    assert(questions.length > 0, '11a: Questions fetched from /api/questions');

    const codingQ = questions.find(q => q.round === 2);
    assert(codingQ !== undefined, '11a: Coding question exists in questions list');
    assert(codingQ.referenceSolution === undefined, '11a: referenceSolution is strictly stripped from candidate questions');
    assert(codingQ.solution === undefined, '11a: solution is strictly stripped');

    const mcqQ = questions.find(q => q.options && q.options.length > 0);
    if (mcqQ) {
      assert(mcqQ.correctOptionIndex === undefined, '11a: correctOptionIndex is stripped from candidate questions');
      assert(mcqQ.correctAnswer === undefined, '11a: correctAnswer is stripped from candidate questions');
    }
  }

  // 11b. /api/datasets/stats without admin key returns 403 Forbidden
  {
    const res = await fetch('http://localhost:3000/api/datasets/stats');
    assert(res.status === 403, `11b: /api/datasets/stats without admin key returns 403 Forbidden, got ${res.status}`);
  }

  // 11c. /api/datasets/stats with admin key returns 200 OK
  {
    const res = await fetch('http://localhost:3000/api/datasets/stats', {
      headers: { 'x-admin-key': 'admin-secret-2026' },
    });
    const body = await res.json();
    assert(res.status === 200, `11c: /api/datasets/stats with admin key returns 200 OK, got ${res.status}`);
    assert(body.stats !== undefined, '11c: Dataset stats returned to authenticated admin');
  }

  // -------------------------------------------------------------------------
  // SECTION 12: AUTOENCODERS BUG FIX & ANTI-HALLUCINATION GATE
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 12: AUTOENCODERS QUESTION & ANTI-HALLUCINATION TESTS ---');

  // 12a. Autoencoders question with fabricated types ("noise, neck, and gray") must receive 0% and "incorrect"
  {
    const autoencoderQ = {
      id: 'tech-ds-001',
      round: 3,
      role: 'Data Scientist',
      topic: 'Deep Learning',
      question: 'What are autoencoders? Explain the different layers of autoencoders and mention three practical usages of them?',
      expectedAnswer: 'Autoencoders are unsupervised neural networks designed to compress input to a bottleneck latent representation and reconstruct the input. Layers: Encoder, Bottleneck/Latent Space, Decoder. Types include Denoising, Variational (VAE), Sparse, Contractive. Usages include dimensionality reduction, feature extraction, compression.',
      evaluationRubric: 'Candidate must explain encoder, bottleneck, and decoder without fabricating non-existent terms.',
    };

    const res = await postJson('/api/gemini/evaluate-answer', {
      question: autoencoderQ,
      round: 3,
      role: 'Data Scientist',
      experienceLevel: '2–5 years',
      candidateAnswer: 'the three types of auto encoders was noise, neck, and gray',
      responseMode: 'spoken',
      deliveryMetrics: {
        responseDurationSeconds: 6,
        speakingPaceWpm: 120,
        pauseCount: 0,
        fillerWordsCount: 0,
      },
    });

    const ev = res.body?.evaluation;
    assert(ev !== undefined, '12a: Evaluation returned for autoencoders response');
    assert(ev?.evaluationStatus === 'incorrect', `12a: Status is 'incorrect' (got: ${ev?.evaluationStatus})`);
    assert(ev?.awardedMarks === 0, `12a: Awarded marks must be 0 (got: ${ev?.awardedMarks})`);
    assert(ev?.score === 0, `12a: Total score must be 0% (NOT 30%!) (got: ${ev?.score}%)`);
    assert(ev?.correctness === 0, `12a: Correctness must be 0% (NOT 30%!) (got: ${ev?.correctness}%)`);
    assert(ev?.technicalClarity === 0, `12a: Technical depth/clarity must be 0% (NOT 30%!) (got: ${ev?.technicalClarity}%)`);
    assert(ev?.problemSolving === 0, `12a: Problem solving must be 0% (NOT 30%!) (got: ${ev?.problemSolving}%)`);
  }

  // 12b. Autoencoders question with genuine technical answer receives high score
  {
    const autoencoderQ = {
      id: 'tech-ds-001',
      round: 3,
      role: 'Data Scientist',
      topic: 'Deep Learning',
      question: 'What are autoencoders? Explain the different layers of autoencoders and mention three practical usages of them?',
      expectedAnswer: 'Autoencoders are unsupervised neural networks designed to compress input to a bottleneck latent representation and reconstruct the input. Layers: Encoder, Bottleneck/Latent Space, Decoder.',
    };

    const res = await postJson('/api/gemini/evaluate-answer', {
      question: autoencoderQ,
      round: 3,
      role: 'Data Scientist',
      experienceLevel: '2–5 years',
      candidateAnswer: 'Autoencoders are unsupervised neural networks that learn low-dimensional latent space representations. The encoder compresses input data into a bottleneck layer, and the decoder reconstructs the original input. Three major types are Denoising autoencoders, Variational autoencoders (VAE), and Sparse autoencoders.',
      responseMode: 'spoken',
      deliveryMetrics: {
        responseDurationSeconds: 22,
        speakingPaceWpm: 135,
        pauseCount: 1,
        fillerWordsCount: 0,
      },
    });

    const ev = res.body?.evaluation;
    assert(ev?.evaluationStatus === 'fully_correct' || ev?.evaluationStatus === 'partially_correct', `12b: Valid autoencoders answer recognized as valid (got: ${ev?.evaluationStatus})`);
    assert(ev?.awardedMarks >= 7, `12b: High marks awarded for genuine answer (got: ${ev?.awardedMarks}/10)`);
  }

  // -------------------------------------------------------------------------
  // SECTION 13: SPOKEN COMMUNICATION DYNAMIC SENSITIVITY (NOT STUCK AT 79%)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 13: SPOKEN COMMUNICATION DYNAMIC SENSITIVITY TESTS ---');

  // 13a. Confident, fluent delivery with ideal pace, 0 pauses, 0 fillers -> High score (>= 88%)
  {
    const testQ = {
      id: 'comm-test-1',
      round: 4,
      role: 'Data Scientist',
      topic: 'Motivation',
      question: 'What motivates you to come to work every day?',
      expectedAnswer: 'I am motivated by solving complex data problems that drive tangible business impact.',
    };

    const res = await postJson('/api/gemini/evaluate-answer', {
      question: testQ,
      round: 4,
      role: 'Data Scientist',
      candidateAnswer: 'I am driven every single day by solving high-impact analytical challenges. In my previous role, collaborating with cross-functional engineering teams to deploy production ML models was deeply rewarding.',
      responseMode: 'spoken',
      deliveryMetrics: {
        responseDurationSeconds: 15,
        speakingPaceWpm: 138,
        pauseCount: 0,
        measuredPausesCount: 0,
        totalPauseDurationSeconds: 0,
        fillerWordsCount: 0,
        speechDisfluencies: [],
      },
    });

    const comm = res.body?.evaluation?.communication;
    assert(typeof comm === 'number', '13a: Communication score returned');
    assert(comm >= 88, `13a: Confident delivery receives high communication score >= 88% (got: ${comm}%)`);
    assert(comm !== 79, `13a: Communication score is NOT stuck at 79% (got: ${comm}%)`);
  }

  // 13b. Heavy dead air and prolonged pauses -> Score visibly drops (<= 68%)
  {
    const testQ = {
      id: 'comm-test-2',
      round: 4,
      role: 'Data Scientist',
      topic: 'Motivation',
      question: 'What motivates you to come to work every day?',
      expectedAnswer: 'I am motivated by solving complex data problems.',
    };

    const res = await postJson('/api/gemini/evaluate-answer', {
      question: testQ,
      round: 4,
      role: 'Data Scientist',
      candidateAnswer: 'I am motivated... by... data challenges... and... working with my team.',
      responseMode: 'spoken',
      deliveryMetrics: {
        responseDurationSeconds: 25,
        speakingPaceWpm: 75,
        pauseCount: 5,
        measuredPausesCount: 5,
        totalPauseDurationSeconds: 6.2,
        fillerWordsCount: 1,
        speechDisfluencies: [],
      },
    });

    const comm = res.body?.evaluation?.communication;
    assert(typeof comm === 'number', '13b: Communication score returned');
    assert(comm <= 68, `13b: Heavy pauses visibly lower communication score <= 68% (got: ${comm}%)`);
    assert(comm !== 79, `13b: Communication score is NOT stuck at 79% (got: ${comm}%)`);
  }

  // 13c. Stuttering and repeated word disfluencies -> Score visibly drops (<= 65%)
  {
    const testQ = {
      id: 'comm-test-3',
      round: 4,
      role: 'Data Scientist',
      topic: 'Motivation',
      question: 'What motivates you to come to work every day?',
      expectedAnswer: 'I am motivated by solving complex data problems.',
    };

    const res = await postJson('/api/gemini/evaluate-answer', {
      question: testQ,
      round: 4,
      role: 'Data Scientist',
      candidateAnswer: 'I, I... the, the reason why I come is... we we... wait no... scratch that... I mean learning new algorithms.',
      responseMode: 'spoken',
      deliveryMetrics: {
        responseDurationSeconds: 18,
        speakingPaceWpm: 88,
        pauseCount: 3,
        measuredPausesCount: 3,
        totalPauseDurationSeconds: 3.5,
        fillerWordsCount: 2,
        speechDisfluencies: ['Repetition: "I, I"', 'Repetition: "the, the"', 'Repetition: "we we"', 'Self-correction restart: "wait no"'],
      },
    });

    const comm = res.body?.evaluation?.communication;
    assert(typeof comm === 'number', '13c: Communication score returned');
    assert(comm <= 65, `13c: Stuttering & disfluencies visibly lower communication score <= 65% (got: ${comm}%)`);
    assert(comm !== 79, `13c: Communication score is NOT stuck at 79% (got: ${comm}%)`);
  }

  // 13d. Rushed fast delivery (>185 WPM) with excessive filler words -> Score drops (<= 62%)
  {
    const testQ = {
      id: 'comm-test-4',
      round: 4,
      role: 'Data Scientist',
      topic: 'Motivation',
      question: 'What motivates you to come to work every day?',
      expectedAnswer: 'I am motivated by solving complex data problems.',
    };

    const res = await postJson('/api/gemini/evaluate-answer', {
      question: testQ,
      round: 4,
      role: 'Data Scientist',
      candidateAnswer: 'Um, like, basically, you know, actually, I really, like, enjoy, you know, doing data analysis and stuff, basically.',
      responseMode: 'spoken',
      deliveryMetrics: {
        responseDurationSeconds: 10,
        speakingPaceWpm: 195,
        pauseCount: 2,
        measuredPausesCount: 2,
        totalPauseDurationSeconds: 1.8,
        fillerWordsCount: 6,
        fillerWordsDetected: ['um', 'like', 'basically', 'you know', 'actually'],
      },
    });

    const comm = res.body?.evaluation?.communication;
    assert(typeof comm === 'number', '13d: Communication score returned');
    assert(comm <= 62, `13d: Excessive fillers & rushed pace lower communication score <= 62% (got: ${comm}%)`);
    assert(comm !== 79, `13d: Communication score is NOT stuck at 79% (got: ${comm}%)`);
  }

  // -------------------------------------------------------------------------
  // SECTION 14: HR & TECHNICAL ANSWER EVALUATION AGAINST DATASET
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 14: HR & TECHNICAL DATASET MATCHING TESTS ---');

  // 14a. DS HR question evaluated against dataset ideal answer
  {
    const hrQ = {
      id: 'hr-ds-001',
      round: 4,
      role: 'Data Scientist',
      topic: 'Career Goals',
      question: 'Where do you see yourself in 5 years?',
      expectedAnswer: 'My long-term goal is to grow into a senior role where I can contribute more strategically and mentor others. This role brings me closer to that.',
      evaluationRubric: 'Evaluate candidate response against dataset reference: "My long-term goal is to grow into a senior role where I can contribute more strategically and mentor others." Key signals: aspiration, dream.',
    };

    const res = await postJson('/api/gemini/evaluate-answer', {
      question: hrQ,
      round: 4,
      role: 'Data Scientist',
      candidateAnswer: 'In five years, my aspiration is to advance into a Senior Data Scientist role where I can lead architecture decisions, drive strategy, and actively mentor junior machine learning engineers.',
      responseMode: 'spoken',
      deliveryMetrics: {
        responseDurationSeconds: 16,
        speakingPaceWpm: 130,
        pauseCount: 1,
        fillerWordsCount: 0,
      },
    });

    const ev = res.body?.evaluation;
    assert(ev?.evaluationStatus === 'fully_correct' || ev?.evaluationStatus === 'partially_correct', '14a: HR answer evaluated against dataset ideal answer');
    assert(ev?.awardedMarks >= 7, `14a: High marks awarded for matching HR ideal answer (got: ${ev?.awardedMarks}/10)`);
  }

  console.log('\n======================================================================');
  console.log(`TEST RUN COMPLETE: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('======================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
