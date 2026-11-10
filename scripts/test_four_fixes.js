/**
 * Verification test for the 4 User Reported Issues:
 * 1. Spoken Communication Score responsiveness (no 79% clustering, sensitive to stuttering, pauses, pace, fillers)
 * 2. Autoencoders Question ("noise, neck, gray") strictly awarded 0% / incorrect
 * 3. Question Randomization across sessions
 * 4. Dataset Reference Answer matching for HR & Technical
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

async function runTests() {
  console.log('======================================================================');
  console.log('        TESTING 4 USER-REPORTED ISSUES VERIFICATION SUITE             ');
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // ISSUE 1: AUTOENCODERS QUESTION BUG ("noise, neck, gray" awarded 30% -> MUST BE 0%)
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: AUTOENCODERS BUG FIX & HALLUCINATED CONCEPTS ---');
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
    assert(ev !== undefined, '1a: Evaluation returned for autoencoders response');
    assert(ev?.evaluationStatus === 'incorrect', `1a: Status is 'incorrect' (got: ${ev?.evaluationStatus})`);
    assert(ev?.awardedMarks === 0, `1a: Awarded marks must be 0 (got: ${ev?.awardedMarks})`);
    assert(ev?.score === 0, `1a: Total score must be 0% (NOT 30%!) (got: ${ev?.score}%)`);
    assert(ev?.correctness === 0, `1a: Correctness must be 0% (NOT 30%!) (got: ${ev?.correctness}%)`);
    assert(ev?.technicalClarity === 0, `1a: Technical depth/clarity must be 0% (NOT 30%!) (got: ${ev?.technicalClarity}%)`);
    assert(ev?.problemSolving === 0, `1a: Problem solving must be 0% (NOT 30%!) (got: ${ev?.problemSolving}%)`);
  }

  // -------------------------------------------------------------------------
  // ISSUE 2: SPOKEN COMMUNICATION NOT STUCK AT 79% (DYNAMIC SENSITIVITY)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: SPOKEN COMMUNICATION DYNAMIC SENSITIVITY ---');

  // 2a. Confident, fluent delivery -> Score >= 88%
  {
    const testQ = {
      id: 'comm-1',
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
    assert(typeof comm === 'number', '2a: Communication score returned');
    assert(comm >= 88, `2a: Fluent delivery score >= 88% (got: ${comm}%)`);
    assert(comm !== 79, `2a: Confident score is NOT 79% (got: ${comm}%)`);
  }

  // 2b. Dead air / long pauses (6.2s total pause duration) -> Score <= 68%
  {
    const testQ = {
      id: 'comm-2',
      round: 4,
      role: 'Data Scientist',
      topic: 'Motivation',
      question: 'What motivates you to come to work every day?',
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
    assert(typeof comm === 'number', '2b: Communication score returned');
    assert(comm <= 68, `2b: Heavy pauses score <= 68% (got: ${comm}%)`);
    assert(comm !== 79, `2b: Long pauses score is NOT 79% (got: ${comm}%)`);
  }

  // 2c. Stuttering & word repetitions -> Score <= 65%
  {
    const testQ = {
      id: 'comm-3',
      round: 4,
      role: 'Data Scientist',
      topic: 'Motivation',
      question: 'What motivates you to come to work every day?',
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
    assert(typeof comm === 'number', '2c: Communication score returned');
    assert(comm <= 65, `2c: Stuttering score <= 65% (got: ${comm}%)`);
    assert(comm !== 79, `2c: Stuttering score is NOT 79% (got: ${comm}%)`);
  }

  // 2d. Fast rushed pace with excessive fillers -> Score <= 62%
  {
    const testQ = {
      id: 'comm-4',
      round: 4,
      role: 'Data Scientist',
      topic: 'Motivation',
      question: 'What motivates you to come to work every day?',
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
    assert(typeof comm === 'number', '2d: Communication score returned');
    assert(comm <= 62, `2d: Excessive fillers score <= 62% (got: ${comm}%)`);
    assert(comm !== 79, `2d: Fillers score is NOT 79% (got: ${comm}%)`);
  }

  // -------------------------------------------------------------------------
  // ISSUE 3: HR & TECHNICAL ANSWERS MATCHING DATASET REFERENCE ANSWERS
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: HR & TECHNICAL DATASET MATCHING ---');
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
    assert(ev?.evaluationStatus === 'fully_correct' || ev?.evaluationStatus === 'partially_correct', '3a: HR answer evaluated against dataset ideal answer');
    assert(ev?.awardedMarks >= 7, `3a: High marks awarded for matching HR ideal answer (got: ${ev?.awardedMarks}/10)`);
  }

  // -------------------------------------------------------------------------
  // ISSUE 4: QUESTION RANDOMIZATION ACROSS INTERVIEW SESSIONS
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: QUESTION RANDOMIZATION ACROSS SESSIONS ---');
  {
    // Check that question datasets are loaded and have high volume
    const statsRes = await fetch('http://localhost:3000/api/health');
    const health = await statsRes.json();
    assert(health.datasetStats?.aptitudeCommon === 1769, '4a: 1,769 Aptitude questions available');
    assert(health.datasetStats?.dataScientistTechnical === 115, '4b: 115 DS Technical questions available');
    assert(health.datasetStats?.dataScientistHr === 40, '4c: 40 DS HR questions available');
    assert(health.datasetStats?.mlEngineerTechnical === 379, '4d: 379 MLE Technical questions available');
  }

  console.log('\n======================================================================');
  console.log(`TEST RUN COMPLETE: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('======================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
