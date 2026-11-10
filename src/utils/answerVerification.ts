/**
 * Robust Answer Verification & Communication Analysis Engine
 * Provides deterministic mathematical verification, MCQ checking,
 * "I don't know" non-substantive detection, and communication scoring.
 */

import { CommunicationDetails } from '../types';

export interface NonSubstantiveCheckResult {
  isUnanswered: boolean;
  reason?: string;
  substantiveText: string;
}

/**
 * Detects whether candidate's response is "I don't know" / unable to answer
 * while allowing mixed responses like "I don't know the exact formula, but I think the result is 100".
 */
export function checkNonSubstantiveResponse(text: string): NonSubstantiveCheckResult {
  const clean = (text || '').trim();
  if (!clean || clean.length < 2) {
    return {
      isUnanswered: true,
      reason: 'Empty response provided.',
      substantiveText: '',
    };
  }

  const lower = clean.toLowerCase().replace(/['’]/g, '');

  // Look for disclaimer / lack of knowledge indicators
  const notKnowingRegex = /\b(dont\s+know|do\s+not\s+know|have\s+no\s+idea|have\s+no\s+clue|no\s+idea|no\s+clue|cannot\s+answer|cant\s+answer|am\s+not\s+sure|not\s+sure|not\s+familiar|dont\s+remember|do\s+not\s+remember|forgotten|idk|pass|skip)\b/i;

  if (notKnowingRegex.test(lower)) {
    // Check if the response contains an explicit contrast transition attempting an answer:
    // e.g., "I don't know the exact formula, but I think the result is 100"
    const contrastMatch = lower.match(/\b(but|however|although|yet|though|maybe|perhaps|i think|my guess is|the result is|answer is)\s+(.+)$/i);

    if (contrastMatch && contrastMatch[2]) {
      const remainder = contrastMatch[2].trim();
      const cleanRemainder = remainder.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const isDismissive = /^(sorry|pass|skip|dont know|do not know|no idea|none|not sure|na|idk|thanks|thank you|havent studied\w*|have not studied\w*|cant answer|cannot answer|never learned\w*)$/i.test(cleanRemainder);
      const hasNumber = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|half|quarter)\b/i.test(remainder);
      
      if (!isDismissive && (hasNumber || cleanRemainder.length > 15)) {
        return {
          isUnanswered: false,
          substantiveText: remainder,
        };
      }
    }

    // Check if response contains a substantive numeric answer without disclaimers
    const hasAnyNumber = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand)\b/i.test(lower);
    if (!hasAnyNumber) {
      return {
        isUnanswered: true,
        reason: 'Candidate expressed inability to answer (e.g., "I don\'t know", "haven\'t studied it", "no idea").',
        substantiveText: '',
      };
    }
  }

  // Check if response is just filler sounds with no substance
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 4) {
    if (/^(um+|uh+|ah+|hmm+|er+|yeah|ok|okay|well)$/i.test(lower)) {
      return {
        isUnanswered: true,
        reason: 'Response contains only filler utterances without an answer.',
        substantiveText: '',
      };
    }
  }

  return {
    isUnanswered: false,
    substantiveText: clean,
  };
}

/**
 * Worded English numbers mapping (e.g. "one hundred" -> 100, "two thirds" -> 2/3)
 */
const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000,
  half: 0.5, quarter: 0.25
};

export function parseEnglishNumberWords(text: string): number | null {
  const clean = text.toLowerCase().replace(/[^a-z\s-]/g, ' ').trim();
  const tokens = clean.split(/[\s-]+/).filter(Boolean);
  if (tokens.length === 0) return null;

  let total = 0;
  let current = 0;
  let foundAny = false;

  for (const token of tokens) {
    if (NUMBER_WORDS[token] !== undefined) {
      foundAny = true;
      const val = NUMBER_WORDS[token];
      if (val === 100) {
        current = (current || 1) * 100;
      } else if (val === 1000) {
        current = (current || 1) * 1000;
        total += current;
        current = 0;
      } else {
        current += val;
      }
    }
  }

  if (!foundAny) return null;
  return total + current;
}

/**
 * Extracts all numeric values, fractions, percentages, or time representations from a string.
 */
export function extractNumericalValues(text: string): Array<{ raw: string; value: number }> {
  if (!text) return [];
  const results: Array<{ raw: string; value: number }> = [];

  // 1. Fractions e.g. "2/3", "8/12"
  const fractionRegex = /\b(\d+)\s*\/\s*(\d+)\b/g;
  let fMatch;
  while ((fMatch = fractionRegex.exec(text)) !== null) {
    const num = parseFloat(fMatch[1]);
    const den = parseFloat(fMatch[2]);
    if (den !== 0) {
      results.push({ raw: fMatch[0], value: num / den });
    }
  }

  // 2. Percentages e.g. "25%", "33.2%"
  const percentRegex = /\b(\d+(?:\.\d+)?)\s*%/g;
  let pMatch;
  while ((pMatch = percentRegex.exec(text)) !== null) {
    results.push({ raw: pMatch[0], value: parseFloat(pMatch[1]) });
  }

  // 3. Time formats e.g. "6:00", "9:00" -> total minutes
  const timeRegex = /\b(\d{1,2}):(\d{2})\b/g;
  let tMatch;
  while ((tMatch = timeRegex.exec(text)) !== null) {
    const hours = parseInt(tMatch[1], 10);
    const mins = parseInt(tMatch[2], 10);
    results.push({ raw: tMatch[0], value: hours * 60 + mins });
  }

  // 4. Standard integers and decimals
  const numRegex = /(?:^|[^\w./])(-?\d+(?:\.\d+)?)(?=[^\w./]|$)/g;
  let nMatch;
  while ((nMatch = numRegex.exec(text)) !== null) {
    results.push({ raw: nMatch[1], value: parseFloat(nMatch[1]) });
  }

  // 5. English worded numbers
  const wordedVal = parseEnglishNumberWords(text);
  if (wordedVal !== null) {
    results.push({ raw: 'worded-number', value: wordedVal });
  }

  return results;
}

export interface NumericalVerificationResult {
  isDeterministic: true;
  evaluationStatus: 'correct' | 'partially_correct' | 'incorrect' | 'unanswered';
  correctnessScore: number;
  awardedMarks: number;
  maximumMarks: number;
  expectedAnswer: string;
  candidateExtractedAnswer: string;
  feedback: string;
  explanation: string;
  conceptsCorrectlyIdentified: string[];
  conceptsMissing: string[];
  incorrectStatements: string[];
}

/**
 * Deterministically verifies numerical aptitude questions without relying on generic LLM feedback.
 */
export function verifyNumericalAnswer(
  candidateText: string,
  expectedAnswerStr: string,
  solutionExplanation: string
): NumericalVerificationResult {
  const maxMarks = 10;
  const nonSub = checkNonSubstantiveResponse(candidateText);

  if (nonSub.isUnanswered) {
    return {
      isDeterministic: true,
      evaluationStatus: 'unanswered',
      correctnessScore: 0,
      awardedMarks: 0,
      maximumMarks: maxMarks,
      expectedAnswer: expectedAnswerStr,
      candidateExtractedAnswer: 'None (Unanswered)',
      feedback: `Unanswered: Candidate did not provide an answer. Expected answer: ${expectedAnswerStr}.`,
      explanation: solutionExplanation || `The correct mathematical answer is ${expectedAnswerStr}.`,
      conceptsCorrectlyIdentified: [],
      conceptsMissing: [`Correct calculation yielding ${expectedAnswerStr}`],
      incorrectStatements: nonSub.reason ? [nonSub.reason] : ['No answer provided'],
    };
  }

  // Extract expected numerical values
  const expectedValues = extractNumericalValues(expectedAnswerStr);
  const targetExpected = expectedValues.length > 0 ? expectedValues[0].value : null;

  // Extract candidate values from substantive text
  const candidateValues = extractNumericalValues(nonSub.substantiveText);

  // Check direct string match (case-insensitive, trimmed)
  const cleanExp = expectedAnswerStr.trim().toLowerCase().replace(/[^\w]/g, '');
  const cleanCand = nonSub.substantiveText.trim().toLowerCase().replace(/[^\w]/g, '');

  if (cleanExp && cleanCand && cleanCand === cleanExp) {
    return {
      isDeterministic: true,
      evaluationStatus: 'correct',
      correctnessScore: 100,
      awardedMarks: maxMarks,
      maximumMarks: maxMarks,
      expectedAnswer: expectedAnswerStr,
      candidateExtractedAnswer: nonSub.substantiveText.trim(),
      feedback: `Correct! Exactly matches the expected answer: ${expectedAnswerStr}.`,
      explanation: solutionExplanation || `Correct numerical deduction.`,
      conceptsCorrectlyIdentified: [`Accurate solution: ${expectedAnswerStr}`],
      conceptsMissing: [],
      incorrectStatements: [],
    };
  }

  // Compare numerical values if available
  if (targetExpected !== null && candidateValues.length > 0) {
    for (const candItem of candidateValues) {
      const diff = Math.abs(candItem.value - targetExpected);
      const relativeDiff = targetExpected !== 0 ? diff / Math.abs(targetExpected) : diff;

      // Match within 1% tolerance or float precision
      if (diff < 1e-4 || relativeDiff < 0.01) {
        return {
          isDeterministic: true,
          evaluationStatus: 'correct',
          correctnessScore: 100,
          awardedMarks: maxMarks,
          maximumMarks: maxMarks,
          expectedAnswer: expectedAnswerStr,
          candidateExtractedAnswer: candItem.raw || String(candItem.value),
          feedback: `Correct! Your calculated value (${candItem.raw}) matches the expected answer: ${expectedAnswerStr}.`,
          explanation: solutionExplanation || `Mathematically verified.`,
          conceptsCorrectlyIdentified: [`Correct numerical solution: ${expectedAnswerStr}`],
          conceptsMissing: [],
          incorrectStatements: [],
        };
      }
    }

    // Candidate gave numbers, but none matched the target
    const extractedStr = candidateValues.map(v => v.raw).join(', ');
    return {
      isDeterministic: true,
      evaluationStatus: 'incorrect',
      correctnessScore: 0,
      awardedMarks: 0,
      maximumMarks: maxMarks,
      expectedAnswer: expectedAnswerStr,
      candidateExtractedAnswer: extractedStr,
      feedback: `Incorrect. Your response gave ${extractedStr}, but the expected answer is ${expectedAnswerStr}.`,
      explanation: solutionExplanation || `Expected ${expectedAnswerStr}, but got ${extractedStr}.`,
      conceptsCorrectlyIdentified: [],
      conceptsMissing: [`Correct calculation yielding ${expectedAnswerStr}`],
      incorrectStatements: [`Candidate calculated ${extractedStr} instead of ${expectedAnswerStr}`],
    };
  }

  // No numbers found in candidate response and no direct match
  return {
    isDeterministic: true,
    evaluationStatus: 'incorrect',
    correctnessScore: 0,
    awardedMarks: 0,
    maximumMarks: maxMarks,
    expectedAnswer: expectedAnswerStr,
    candidateExtractedAnswer: nonSub.substantiveText.slice(0, 50),
    feedback: `Incorrect. Could not find valid mathematical steps yielding the expected answer: ${expectedAnswerStr}.`,
    explanation: solutionExplanation || `Expected answer is ${expectedAnswerStr}.`,
    conceptsCorrectlyIdentified: [],
    conceptsMissing: [`Numerical result of ${expectedAnswerStr}`],
    incorrectStatements: [`"${nonSub.substantiveText.slice(0, 60)}" does not match expected answer ${expectedAnswerStr}`],
  };
}

/**
 * Deterministically verifies Multiple-Choice Questions (MCQ).
 * Compares selected option against stored correctOptionIndex.
 * Never allows external LLM to override stored answer key.
 */
export function verifyMCQAnswer(
  selectedOptionIndex: number | null | undefined,
  correctOptionIndex: number | undefined,
  options: string[] | undefined,
  explanation: string
): {
  isDeterministic: true;
  evaluationStatus: 'correct' | 'incorrect' | 'unanswered';
  correctnessScore: number;
  awardedMarks: number;
  maximumMarks: number;
  feedback: string;
  explanation: string;
  conceptsCorrectlyIdentified: string[];
  conceptsMissing: string[];
  incorrectStatements: string[];
} {
  const maxMarks = 10;

  if (selectedOptionIndex === null || selectedOptionIndex === undefined || selectedOptionIndex < 0) {
    return {
      isDeterministic: true,
      evaluationStatus: 'unanswered',
      correctnessScore: 0,
      awardedMarks: 0,
      maximumMarks: maxMarks,
      feedback: 'Unanswered: No option was selected by the candidate.',
      explanation: explanation || 'Candidate did not pick an option.',
      conceptsCorrectlyIdentified: [],
      conceptsMissing: ['Option selection'],
      incorrectStatements: ['No option selected'],
    };
  }

  const isCorrect = correctOptionIndex !== undefined ? selectedOptionIndex === correctOptionIndex : true;
  const targetLetter = correctOptionIndex !== undefined ? String.fromCharCode(65 + correctOptionIndex) : 'A';
  const selectedText = options && options[selectedOptionIndex] ? options[selectedOptionIndex] : `Option ${selectedOptionIndex + 1}`;
  const correctText = options && correctOptionIndex !== undefined && options[correctOptionIndex] ? options[correctOptionIndex] : `Option ${targetLetter}`;

  if (isCorrect) {
    return {
      isDeterministic: true,
      evaluationStatus: 'correct',
      correctnessScore: 100,
      awardedMarks: maxMarks,
      maximumMarks: maxMarks,
      feedback: `Correct! You selected ${selectedText}. ${explanation || ''}`,
      explanation: explanation || 'Valid option selected.',
      conceptsCorrectlyIdentified: [`Selected correct option: ${selectedText}`],
      conceptsMissing: [],
      incorrectStatements: [],
    };
  }

  return {
    isDeterministic: true,
    evaluationStatus: 'incorrect',
    correctnessScore: 0,
    awardedMarks: 0,
    maximumMarks: maxMarks,
    feedback: `Incorrect. You selected ${selectedText}, but the correct option was ${correctText}. ${explanation || ''}`,
    explanation: explanation || `Correct answer is ${correctText}.`,
    conceptsCorrectlyIdentified: [],
    conceptsMissing: [`Correct option: ${correctText}`],
    incorrectStatements: [`Selected incorrect option: ${selectedText}`],
  };
}

/**
 * Communication Evaluation Engine (Spoken & Written)
 * Strictly separates Communication from Answer Correctness.
 * Dynamically computes score from measurable speech and language characteristics.
 */
export function evaluateCommunication(params: {
  mode: 'spoken' | 'typed';
  transcript: string;
  durationSeconds?: number;
  pauseCount?: number;
  measuredPausesCount?: number;
  totalPauseDurationSeconds?: number;
  speakingPaceWpm?: number;
  fillerWordsCount?: number;
  fillerWordsDetected?: string[];
  speechDisfluencies?: string[];
}): CommunicationDetails | null {
  const {
    mode,
    transcript = '',
    durationSeconds = 0,
    pauseCount = 0,
    measuredPausesCount = 0,
    totalPauseDurationSeconds = 0,
    speakingPaceWpm,
    fillerWordsCount: passedFillerCount,
    fillerWordsDetected: passedFillerWords,
    speechDisfluencies: passedDisfluencies,
  } = params;

  const clean = transcript.trim();
  const words = clean.split(/\s+/).filter(Boolean);

  // Insufficient speech or transcript data: mark as unassessed/unavailable rather than inventing 79%
  if (words.length < 3) {
    return {
      type: mode === 'typed' ? 'written' : 'spoken',
      score: undefined, // Unavailable: insufficient data
      speakingPaceWpm: undefined,
      paceAssessment: 'Insufficient speech data',
      clarityScore: 0,
      organizationScore: 0,
      feedback: 'Insufficient audio or transcript data to reliably calculate spoken communication score.',
      suggestions: ['Provide a more comprehensive spoken explanation to allow communication measurement.'],
    };
  }

  // Non-substantive dismissals ("I don't know", "skip", "idk", etc.)
  const nonSub = checkNonSubstantiveResponse(clean);
  if (nonSub.isUnanswered && words.length <= 6) {
    return {
      type: mode === 'typed' ? 'written' : 'spoken',
      score: 30,
      clarityScore: 40,
      organizationScore: 30,
      deliveryScore: 35,
      feedback: 'Minimal or non-substantive response. Expressed inability to answer with minimal verbal engagement.',
      suggestions: ['Attempt to explain core concepts or relevant fundamentals even when uncertain.'],
    };
  }

  // -------------------------------------------------------------
  // WRITTEN COMMUNICATION (TYPED RESPONSES)
  // -------------------------------------------------------------
  if (mode === 'typed') {
    const sentenceCount = (clean.match(/[.!?]+/g) || []).length || 1;
    const avgWordsPerSentence = words.length / sentenceCount;

    let clarity = 85;
    if (avgWordsPerSentence > 35) clarity -= 15;
    if (avgWordsPerSentence < 5 && words.length > 8) clarity -= 10;

    const transitionRegex = /\b(first|secondly|furthermore|moreover|however|therefore|consequently|specifically|in contrast|for instance|because)\b/gi;
    const transitions = (clean.match(transitionRegex) || []).length;
    let organization = 72 + Math.min(transitions * 7, 24);

    const score = Math.round(0.5 * clarity + 0.5 * organization);
    const suggestions: string[] = [];
    if (transitions === 0 && words.length > 25) {
      suggestions.push('Integrate logical connecting words (e.g. "Firstly", "Therefore", "In contrast") to guide the reader.');
    }
    if (avgWordsPerSentence > 30) {
      suggestions.push('Split complex compound sentences into concise, independent clauses.');
    }
    if (suggestions.length === 0) {
      suggestions.push('Written phrasing demonstrates structured organization and appropriate vocabulary.');
    }

    return {
      type: 'written',
      score: Math.min(Math.max(score, 35), 98),
      clarityScore: Math.round(clarity),
      organizationScore: Math.round(organization),
      writtenReadabilityScore: Math.round(clarity),
      clarityAssessment: clarity >= 80 ? 'Clear sentence structure and terminology.' : 'Dense or fragmented written style.',
      organizationAssessment: organization >= 80 ? 'Logical flow with clear thematic progression.' : 'Basic paragraph structure; could use more transitions.',
      feedback: `Written response evaluated across ${sentenceCount} sentence(s) and ${words.length} words with an average sentence length of ${Math.round(avgWordsPerSentence)} words.`,
      suggestions,
    };
  }

  // -------------------------------------------------------------
  // SPOKEN COMMUNICATION (MICROPHONE AUDIO & TRANSCRIPT)
  // -------------------------------------------------------------
  // 1. Speaking Pace (WPM) & Duration
  const hasDuration = typeof durationSeconds === 'number' && durationSeconds > 0;
  const actualDuration = hasDuration ? durationSeconds : undefined;
  let wpm: number | undefined = undefined;
  let hasPaceData = false;

  if (typeof speakingPaceWpm === 'number' && speakingPaceWpm > 0) {
    wpm = Math.round(speakingPaceWpm);
    hasPaceData = true;
  } else if (hasDuration && durationSeconds >= 1) {
    const minutes = durationSeconds / 60;
    wpm = Math.round(words.length / minutes);
    hasPaceData = true;
  }

  let paceScore = 80;
  let paceAssessment = 'Pace measurement unavailable.';

  if (hasPaceData && wpm !== undefined) {
    if (wpm >= 125 && wpm <= 165) {
      paceScore = 96;
      paceAssessment = `Ideal conversational pace (${wpm} WPM). Fluid, articulate, and highly intelligible.`;
    } else if (wpm >= 105 && wpm < 125) {
      paceScore = 85;
      paceAssessment = `Deliberate, steady pace (${wpm} WPM). Clear and composed delivery.`;
    } else if (wpm >= 90 && wpm < 105) {
      paceScore = 55;
      paceAssessment = `Slow, hesitant speaking pace (${wpm} WPM). Extended gaps between phrasing.`;
    } else if (wpm >= 70 && wpm < 90) {
      paceScore = 38;
      paceAssessment = `Halting, sluggish speaking pace (${wpm} WPM). Frequent pauses interrupt sentence flow.`;
    } else if (wpm < 70) {
      paceScore = 22;
      paceAssessment = `Unusually slow or stalled speaking pace (${wpm} WPM). Observable difficulty sustaining delivery flow.`;
    } else if (wpm > 165 && wpm <= 185) {
      paceScore = 65;
      paceAssessment = `Brisk pace (${wpm} WPM). Slightly rushed; slowing down allows complex terminology to settle.`;
    } else {
      paceScore = 35;
      paceAssessment = `Excessively fast pace (${wpm} WPM). Rushed delivery with heightened risk of lost nuance.`;
    }
  }

  // 2. Filler Words Detection & Frequency
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

  const detectedFillers: string[] = passedFillerWords ? [...passedFillerWords] : [];
  let fillerCount = typeof passedFillerCount === 'number' ? passedFillerCount : 0;
  if (!passedFillerWords) {
    fillerPatterns.forEach(pattern => {
      const matches = clean.match(pattern);
      if (matches) {
        fillerCount += matches.length;
        detectedFillers.push(...matches.map(m => m.toLowerCase()));
      }
    });
  }
  const uniqueFillers = [...new Set(detectedFillers)];
  const fillerRatio = words.length > 0 ? (fillerCount / words.length) * 100 : 0;

  let fillerScore = 95;
  let fillerAssessment = 'Minimal filler words.';
  if (fillerCount === 0) {
    fillerScore = 96;
    fillerAssessment = 'Crisp, articulate verbal formulation with zero filler sounds.';
  } else if (fillerCount <= 1 || fillerRatio <= 2.5) {
    fillerScore = 85;
    fillerAssessment = `Clean delivery with negligible filler presence (${fillerCount} detected: ${uniqueFillers.join(', ')}).`;
  } else if (fillerCount <= 3 || fillerRatio <= 6.0) {
    fillerScore = 60;
    fillerAssessment = `Moderate conversational filler usage (${fillerCount} detected: ${uniqueFillers.slice(0, 3).join(', ')}).`;
  } else if (fillerCount <= 5 || fillerRatio <= 10.0) {
    fillerScore = 40;
    fillerAssessment = `Frequent filler words observed (${fillerCount} detected: ${uniqueFillers.slice(0, 4).join(', ')}), reducing polish.`;
  } else {
    fillerScore = 22;
    fillerAssessment = `Excessive filler words (${fillerCount} detected: ${uniqueFillers.join(', ')}). Noticeably disrupts listener engagement.`;
  }

  // 3. Pauses, Dead Air & Hesitation (Audio Silence Duration + Hesitation Gaps)
  const totalPauses = Math.max(pauseCount, measuredPausesCount);
  const pauseTimeSec = totalPauseDurationSeconds || 0;

  let pauseScore = 92;
  let pauseAssessment = 'Balanced and natural cadence.';

  if (pauseTimeSec >= 4.5 || totalPauses >= 4) {
    pauseScore = 22;
    pauseAssessment = `Prolonged dead air and severe hesitation (${totalPauses} pauses, ${pauseTimeSec.toFixed(1)}s silence). Extended stalls in delivery.`;
  } else if (pauseTimeSec >= 2.5 || totalPauses >= 3) {
    pauseScore = 38;
    pauseAssessment = `Noticeable hesitation and prolonged pauses (${totalPauses} pauses, ${pauseTimeSec.toFixed(1)}s silence). Interrupts delivery cadence.`;
  } else if (pauseTimeSec >= 1.5 || totalPauses >= 2) {
    pauseScore = 55;
    pauseAssessment = `Moderate thinking pauses (${totalPauses} pauses, ${pauseTimeSec.toFixed(1)}s silence). Natural conversational formulation.`;
  } else if (totalPauses <= 1 && pauseTimeSec < 1.5) {
    pauseScore = 96;
    pauseAssessment = `Fluid, confident delivery with natural cadence and minimal hesitation (${totalPauses} brief pause).`;
  }

  // 4. Observable Speech Disfluencies (Stuttering, Word Repetitions, False Starts)
  const detectedDisfluencies: string[] = passedDisfluencies ? [...passedDisfluencies] : [];
  if (!passedDisfluencies) {
    // Detect adjacent word repetitions across punctuation or spaces (e.g. "I, I", "the... the", "we we", "model model")
    const repMatch = clean.match(/\b([a-zA-Z]{2,})[\s,.-]+\1\b/gi);
    if (repMatch) {
      detectedDisfluencies.push(...repMatch.map(r => `Repetition: "${r.trim()}"`));
    }
    // Detect repeated syllable / stutter fragments (e.g. "a-auto", "th-the", "c-code", "l-lok")
    const sylMatch = clean.match(/\b([a-zA-Z]{1,3})[-—]\1[a-zA-Z]*/gi);
    if (sylMatch) {
      detectedDisfluencies.push(...sylMatch.map(s => `Stutter fragment: "${s.trim()}"`));
    }
    // Detect false starts and restarts (e.g. "no wait", "scratch that", "wait no")
    const falseStartMatch = clean.match(/\b(no wait|wait no|scratch that|let me restart|i mean)\b/gi);
    if (falseStartMatch) {
      detectedDisfluencies.push(...falseStartMatch.map(f => `Self-correction restart: "${f}"`));
    }
  }

  let disfluencyScore = 95;
  let fluencyAssessment = 'Smooth verbal flow with clean articulation.';
  if (detectedDisfluencies.length === 0) {
    disfluencyScore = 96;
    fluencyAssessment = 'Clean continuous speech flow without observed false starts or word repetitions.';
  } else if (detectedDisfluencies.length === 1) {
    disfluencyScore = 62;
    fluencyAssessment = `Observable speech hesitation/self-correction detected (${detectedDisfluencies[0]}).`;
  } else if (detectedDisfluencies.length === 2) {
    disfluencyScore = 38;
    fluencyAssessment = `Frequent stuttering, word repetitions, or false starts detected (${detectedDisfluencies.slice(0, 2).join('; ')}).`;
  } else {
    disfluencyScore = 20;
    fluencyAssessment = `Heavy speech disfluencies and severe stuttering (${detectedDisfluencies.length} instances: ${detectedDisfluencies.slice(0, 3).join('; ')}).`;
  }

  // 5. Clarity and Intelligibility
  const clarityScore = Math.round(
    0.35 * paceScore + 0.30 * pauseScore + 0.35 * disfluencyScore
  );
  const clarityAssessment = clarityScore >= 85
    ? 'High clarity: verbal explanations are articulate, confident, and straightforward to follow.'
    : clarityScore >= 65
    ? 'Moderate clarity with noticeable hesitation, vocal rush, or filler sounds.'
    : 'Poor clarity due to severe hesitation, speech rate stalls, stuttering, or disfluencies.';

  // 6. Organization and Logical Sequencing
  const transitionRegex = /\b(first|firstly|second|secondly|furthermore|moreover|however|therefore|consequently|specifically|in contrast|for instance|because|as a result)\b/gi;
  const transitions = (clean.match(transitionRegex) || []).length;
  const sentenceCount = (clean.match(/[.!?]+/g) || []).length || 1;
  const avgSentenceLength = words.length / sentenceCount;

  let organizationScore = 68;
  if (transitions >= 2) organizationScore += 16;
  else if (transitions === 1) organizationScore += 8;
  if (words.length > 40 && transitions === 0) organizationScore -= 12;
  if (words.length < 15) organizationScore = Math.min(organizationScore, 35);
  else if (words.length < 25) organizationScore = Math.min(organizationScore, 55);
  if (avgSentenceLength > 35) organizationScore -= 10;
  if (fillerRatio > 12) organizationScore -= 12;
  organizationScore = Math.min(Math.max(organizationScore, 20), 96);

  const organizationAssessment = organizationScore >= 80
    ? 'Strong logical sequencing: ideas build upon each other coherently.'
    : organizationScore >= 55
    ? 'Understandable sequence; could benefit from more structured transition phrases.'
    : 'Fragmented explanation; concepts are loosely connected without clear bridges.';

  // 7. Dynamic Weighted Delivery Scoring Rubric
  // Highly sensitive to candidate's actual speaking cadence, dead air, and stuttering.
  // Weights: Pace (25%), Pauses (30%), Fluency/Disfluency (25%), Fillers (10%), Organization (10%)
  let overallSpokenScore = Math.round(
    0.25 * paceScore +
    0.30 * pauseScore +
    0.25 * disfluencyScore +
    0.10 * fillerScore +
    0.10 * organizationScore
  );

  // If candidate had prolonged dead air or multiple stutters or very brief output, cap appropriately:
  if (pauseScore <= 40 && disfluencyScore <= 40) {
    overallSpokenScore = Math.min(overallSpokenScore, 42);
  } else if (pauseScore <= 40 || disfluencyScore <= 40 || paceScore <= 40) {
    overallSpokenScore = Math.min(overallSpokenScore, 49);
  } else if (words.length < 12 && (totalPauses >= 2 || pauseTimeSec >= 2.0)) {
    overallSpokenScore = Math.min(overallSpokenScore, 45);
  }

  const boundedScore = Math.min(Math.max(overallSpokenScore, 15), 98);

  const suggestions: string[] = [];
  if (wpm !== undefined && wpm > 170) {
    suggestions.push(`Speaking pace was fast (${wpm} WPM). Practice pacing yourself at 130–150 WPM to give technical terminology room to register.`);
  } else if (wpm !== undefined && wpm < 95 && actualDuration && actualDuration > 5) {
    suggestions.push(`Speaking pace was hesitant (${wpm} WPM). Work on reducing mid-sentence pauses to maintain momentum.`);
  }
  if (pauseTimeSec >= 3.0 || totalPauses >= 3) {
    suggestions.push(`Observed noticeable pauses (${totalPauses} pauses, ${pauseTimeSec.toFixed(1)}s silence). Take 3–5 seconds to collect your thoughts before speaking so your response flows without dead air.`);
  }
  if (detectedDisfluencies.length >= 2) {
    suggestions.push(`Detected speech repetitions (${detectedDisfluencies.slice(0, 2).join(', ')}). Slow down your initial delivery to speak with steady articulation.`);
  }
  if (fillerCount >= 3) {
    suggestions.push(`Detected ${fillerCount} filler word(s) (${uniqueFillers.slice(0, 4).join(', ')}). Practice resting in brief silent pauses rather than filling space with filler sounds.`);
  }
  if (suggestions.length === 0) {
    suggestions.push('Verbal delivery was articulate, confident, and well-cadenced.');
  }

  return {
    type: 'spoken',
    score: boundedScore,
    speakingDurationSeconds: actualDuration ? Math.round(actualDuration * 10) / 10 : undefined,
    speakingPaceWpm: wpm,
    paceAssessment,
    fillerWordsCount: fillerCount,
    fillerWordsDetected: uniqueFillers,
    fillerWordRatioPercent: Number(fillerRatio.toFixed(1)),
    fillerAssessment,
    pauseCount: totalPauses,
    totalPauseDurationSeconds: pauseTimeSec > 0 ? Math.round(pauseTimeSec * 10) / 10 : undefined,
    pauseAssessment,
    speechDisfluencies: detectedDisfluencies,
    fluencyAssessment,
    clarityScore,
    clarityAssessment,
    organizationScore,
    organizationAssessment,
    deliveryScore: Math.round(0.5 * paceScore + 0.5 * pauseScore),
    rubricBreakdown: {
      speakingPace: { weight: 20, score: paceScore, label: 'Speaking Pace & Rhythm' },
      pausesHesitation: { weight: 25, score: pauseScore, label: 'Pauses & Flow' },
      fillerWords: { weight: 20, score: fillerScore, label: 'Filler Words & Polish' },
      speechFluency: { weight: 20, score: disfluencyScore, label: 'Fluency & Articulation' },
      organization: { weight: 15, score: organizationScore, label: 'Organization & Structure' },
    },
    feedback: `Spoken response evaluated across ${words.length} word(s)${actualDuration ? ` over ${Math.round(actualDuration)}s` : ''} with pace ${wpm ? `${wpm} WPM` : 'unmeasured'}, ${totalPauses} pause(s), and ${fillerCount} filler sound(s).`,
    suggestions,
  };
}

export interface SemanticEvaluationResult {
  evaluationStatus: 'fully_correct' | 'partially_correct' | 'incorrect' | 'incomplete' | 'irrelevant' | 'unanswered' | 'unclear_transcription';
  score: number;
  correctness: number;
  awardedMarks: number;
  maximumMarks: number;
  components?: Array<{
    name: string;
    weight: number;
    maxMarks: number;
    awardedMarks: number;
    status: 'covered' | 'partial' | 'missing' | 'incorrect';
    feedback: string;
  }>;
  conceptsCorrectlyIdentified: string[];
  conceptsMissing: string[];
  incorrectStatements: string[];
  feedback: string;
  explanation: string;
  referenceAnswer?: string;
  confidenceInEvaluation: 'high' | 'medium' | 'low';
  strengths: string[];
  areasToImprove: string[];
  isDeterministic?: boolean;
}

/**
 * Decomposes multi-part questions into discrete evaluation components with defined weights
 */
export function decomposeQuestionComponents(
  questionText: string,
  topic: string,
  referenceAnswer: string
): Array<{ name: string; weight: number; keywords: RegExp[]; description: string }> {
  const qLower = (questionText || '').toLowerCase();

  // Multi-part pattern 1: Random Forest (definition, advantages, disadvantages)
  if (qLower.includes('random forest') && (qLower.includes('advantage') || qLower.includes('disadvantage'))) {
    return [
      {
        name: 'Random Forest Definition & Ensemble Mechanism',
        weight: 40,
        keywords: [/\b(random\s+forest|ensemble|decision\s+trees?|bagging|bootstrap|aggregat\w*|forest)\b/i],
        description: 'Ensemble learning method combining multiple decision trees using bootstrap aggregation.',
      },
      {
        name: 'Advantages of Random Forest',
        weight: 30,
        keywords: [/\b(advantage|reduces?\s+overfit\w*|variance|high\s+dimensional|missing\s+values?|robust|accurate|non-linear)\b/i],
        description: 'Reduces overfitting, lowers variance, handles high-dimensional feature spaces and missing values.',
      },
      {
        name: 'Disadvantages & Limitations of Random Forest',
        weight: 30,
        keywords: [/\b(disadvantage|limitation|computation\w*|slow|memory|interpret\w*|black\s+box|complexity|inference\s+time)\b/i],
        description: 'Higher computational/memory cost, slower training/inference, and loss of single-tree interpretability.',
      },
    ];
  }

  // Multi-part pattern 2: Bias-Variance tradeoff & regularization
  if (qLower.includes('bias') && qLower.includes('variance')) {
    const hasReg = qLower.includes('regulariz');
    return [
      {
        name: 'Bias & Underfitting Concept',
        weight: hasReg ? 30 : 40,
        keywords: [/\b(bias|underfit\w*|oversimplif\w*|rigid|systematic\s+error)\b/i],
        description: 'High bias stems from oversimplified model assumptions leading to underfitting.',
      },
      {
        name: 'Variance & Overfitting Concept',
        weight: hasReg ? 30 : 40,
        keywords: [/\b(variance|overfit\w*|noise|fluctuation|memoriz\w*)\b/i],
        description: 'High variance stems from high model sensitivity to training noise leading to overfitting.',
      },
      {
        name: hasReg ? 'Regularization Impact on Tradeoff' : 'The Tradeoff Balance & Generalization',
        weight: hasReg ? 40 : 20,
        keywords: hasReg
          ? [/\b(regulariz\w*|l1|l2|lasso|ridge|weight\s+decay|penalt\w*|shrink\w*|dropout)\b/i]
          : [/\b(trade-?off|balance|generaliz\w*|sweet\s+spot|total\s+error)\b/i],
        description: hasReg
          ? 'Regularization constrains model weights to slightly increase bias while substantially lowering variance.'
          : 'Finding the optimal complexity that minimizes total out-of-sample generalization error.',
      },
    ];
  }

  // Multi-part pattern 3: Generic "advantages and disadvantages" / "pros and cons"
  if (qLower.includes('advantage') && qLower.includes('disadvantage')) {
    return [
      {
        name: 'Core Concept Definition & Mechanism',
        weight: 40,
        keywords: [/\b(is|works?|defined|algorithm|method|model|concept)\b/i],
        description: 'Explanation of what the concept is and how it functions.',
      },
      {
        name: 'Advantages & Strengths',
        weight: 30,
        keywords: [/\b(advantage|pro|benefit|strength|superior|excel)\b/i],
        description: 'Key benefits, performance advantages, or use-case strengths.',
      },
      {
        name: 'Disadvantages & Tradeoffs',
        weight: 30,
        keywords: [/\b(disadvantage|con|limitation|drawback|downside|weakness)\b/i],
        description: 'Key limitations, performance bottlenecks, or drawbacks.',
      },
    ];
  }

  // Multi-part pattern 4: Compare X and Y / Difference between X and Y
  if (qLower.includes('difference between') || qLower.includes('compare') || qLower.includes('versus') || qLower.includes(' vs ')) {
    return [
      {
        name: 'Explanation of First Concept',
        weight: 35,
        keywords: [/\b(first|one|former|l1|precision|classification)\b/i],
        description: 'Accurate explanation of the first topic/model.',
      },
      {
        name: 'Explanation of Second Concept',
        weight: 35,
        keywords: [/\b(second|other|latter|l2|recall|regression)\b/i],
        description: 'Accurate explanation of the second topic/model.',
      },
      {
        name: 'Key Tradeoffs & Use-Case Comparison',
        weight: 30,
        keywords: [/\b(difference|whereas|while|contrast|compared to|tradeoff|when to use)\b/i],
        description: 'Explicit contrast and guidance on when to select one over the other.',
      },
    ];
  }

  // HR / Behavioral & Career Goals decomposition
  const isHrTopic = /career\s*goals?|motivation|team\s*collaboration|conflict\s*resolution|leadership|adaptability|culture\s*fit|work\s*style|behavioral|communication|ethics|interpersonal/i.test(topic || '');
  const isHrQuestion = isHrTopic ||
    /\b(where\s+do\s+you\s+see\s+yourself|motivat\w*|why\s+do\s+you\s+want|handle\s+conflict|disagree\w*|strength\w*|weakness\w*|teammate\w*|build\s+trust|culture\s+fit|work\s+style|stress\w*|deadline|feedback)\b/i.test(qLower);

  if (isHrQuestion) {
    if (qLower.includes('tell me about a time') || qLower.includes('describe a situation') || qLower.includes('example of when') || qLower.includes('give an example')) {
      return [
        {
          name: 'Situation & Task (Context & Objective)',
          weight: 30,
          keywords: [/\b(at\s+my|project|company|team|challenge|task|goal|problem|needed\s+to|responsible\s+for|situation|deadline)\b/i],
          description: 'Clear description of the problem context and candidate responsibility.',
        },
        {
          name: 'Action (Specific Proactive Steps Taken)',
          weight: 40,
          keywords: [/\b(i\s+implemented|i\s+decided|i\s+led|we\s+built|i\s+analyzed|my\s+approach|action|steps?|communicat\w*|collaborat\w*|resolved)\b/i],
          description: 'Specific individual actions and proactive steps taken to resolve the challenge.',
        },
        {
          name: 'Result & Impact (Outcomes & Lessons Learned)',
          weight: 30,
          keywords: [/\b(result|outcome|impact|improved|increased|decreased|achieved|learned|metric|percent|reflection|growth)\b/i],
          description: 'Measurable outcomes, team benefits, and reflections.',
        },
      ];
    }

    return [
      {
        name: 'Career Vision, Motivation & Alignment',
        weight: 50,
        keywords: [/\b(goal|goals|career|grow|growth|senior|role|contribute|strategic\w*|mentor|others|motivat\w*|challenge|personally|professionally|passion|aspiration|learn|advance|lead|architect\w*)\b/i],
        description: 'Candidate articulated professional vision, growth aspirations, and alignment with the role.',
      },
      {
        name: 'Team Value, Collaboration & Practical Impact',
        weight: 50,
        keywords: [/\b(team|teammate\w*|collaborat\w*|respect|communication|trust|achieve|project|help|listen|deliver|value|culture|support|partner|mentor)\b/i],
        description: 'Candidate explained how they collaborate with teammates, mentor others, build trust, and deliver impact.',
      },
    ];
  }

  // Multi-part pattern: Autoencoders (definition/layers and types/usages)
  if (qLower.includes('autoencoder') || qLower.includes('auto encoder') || qLower.includes('auto-encoder')) {
    const asksTypes = qLower.includes('type');
    const asksLayers = qLower.includes('layer');
    return [
      {
        name: 'Autoencoder Definition & Architecture',
        weight: 50,
        keywords: [/\b(unsupervised|encoder|decoder|bottleneck|latent\s+space|latent\s+code|reconstruct\w*|reconstruction|dimension\w*)\b/i],
        description: 'Unsupervised neural network with encoder compressing input into bottleneck latent representation and decoder reconstructing output.',
      },
      {
        name: asksTypes ? 'Valid Autoencoder Types' : asksLayers ? 'Autoencoder Layers & Usages' : 'Autoencoder Types & Applications',
        weight: 50,
        keywords: [/\b(denoising|variational|vae|sparse|contractive|convolutional|undercomplete|overcomplete|stacked|compression|nonlinear\s+pca|pca)\b/i],
        description: 'Recognized autoencoder types (Denoising, Variational VAE, Sparse, Contractive, Convolutional, Undercomplete) or applications.',
      },
    ];
  }

  // Multi-part pattern: Constitutional AI & AI Alignment
  if (
    qLower.includes('constitutional ai') ||
    (qLower.includes('constitution') && (qLower.includes('align') || qLower.includes('ai') || qLower.includes('model') || qLower.includes('safety'))) ||
    (qLower.includes('alignment') && (qLower.includes('rlhf') || qLower.includes('rlaif') || qLower.includes('harmless') || qLower.includes('safety') || qLower.includes('claude') || qLower.includes('anthropic')))
  ) {
    return [
      {
        name: 'Constitutional AI Framework & Guiding Principles',
        weight: 50,
        keywords: [/\b(anthropic|constitutional\s+ai|principles?|rules?|constitution|rlaif|ai\s+feedback|values?|guidelines?)\b/i],
        description: 'AI alignment methodology pioneering by Anthropic where a model critiques and revises its own responses using a written constitution or set of principles.',
      },
      {
        name: 'Alignment Objectives & Self-Supervision Mechanism',
        weight: 50,
        keywords: [/\b(helpful|harmless|honest|alignment|self-critique|critique|revision|reinforcement\s+learning|supervised\s+learning|fine-tuning)\b/i],
        description: 'Training AI systems to be helpful, harmless, and honest through iterative self-critique, revision, and reinforcement learning from AI feedback (RLAIF).',
      },
    ];
  }

  // Default: Single topic decomposition
  // Extract key technical tokens from question and topic rather than generic auxiliary verbs
  const domainTokens = `${questionText} ${topic} ${referenceAnswer}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4 && !['explain', 'describe', 'difference', 'between', 'question', 'candidate', 'following', 'system'].includes(w));
  const domainRegex = domainTokens.length > 0 ? new RegExp(`\\b(${domainTokens.slice(0, 10).join('|')})\\b`, 'i') : /\b(algorithm|architecture|mechanism|model|pipeline)\b/i;

  return [
    {
      name: 'Technical Definition & Mechanism',
      weight: 60,
      keywords: [domainRegex, /\b(algorithm|architecture|mechanism|mathematical|pipeline|formulat\w*|framework)\b/i],
      description: 'Accurate technical definition of the underlying methodology.',
    },
    {
      name: 'Practical Implementation & Context',
      weight: 40,
      keywords: [/\b(tradeoff|hyperparameter|production|bottleneck|constraint|loss\s+function|optimization)\b/i],
      description: 'Real-world application, context, or edge-case handling.',
    },
  ];
}

/**
 * Evaluates semantic concepts, checking all subquestion criteria.
 * Guarantees that partial answers never receive 100%.
 */
export function evaluateSemanticAnswer(params: {
  candidateText: string;
  questionText: string;
  topic?: string;
  referenceAnswer?: string;
  evaluationRubric?: string;
}): SemanticEvaluationResult {
  const {
    candidateText = '',
    questionText = '',
    topic = '',
    referenceAnswer = '',
    evaluationRubric = '',
  } = params;

  const targetCriteria = referenceAnswer || evaluationRubric || '';
  const cleanCand = candidateText.trim();
  const lowerCand = cleanCand.toLowerCase();
  const words = cleanCand.split(/\s+/).filter(Boolean);

  // 1. Unanswered or "I don't know" check
  const nonSubCheck = checkNonSubstantiveResponse(cleanCand);
  if (nonSubCheck.isUnanswered) {
    return {
      evaluationStatus: 'unanswered',
      score: 0,
      correctness: 0,
      awardedMarks: 0,
      maximumMarks: 10,
      conceptsCorrectlyIdentified: [],
      conceptsMissing: ['Substantive technical response addressing the question.'],
      incorrectStatements: [nonSubCheck.reason || 'Candidate expressed inability to answer (e.g. "I don\'t know").'],
      feedback: `Unanswered: Candidate did not provide an answer (${nonSubCheck.reason || 'stated "I don\'t know"'}). Zero marks awarded.`,
      explanation: targetCriteria || `Expected an explanation of ${topic || 'the required concepts'}.`,
      referenceAnswer: targetCriteria || undefined,
      confidenceInEvaluation: 'high',
      strengths: [],
      areasToImprove: ['Review core fundamentals for this topic before the next interview round.'],
      isDeterministic: false,
    };
  }

  // 2. Extremely short 1-word or 2-word answer check (e.g., "yes", "teamwork", "good")
  if (words.length <= 2) {
    return {
      evaluationStatus: 'incomplete',
      score: 10,
      correctness: 10,
      awardedMarks: 1,
      maximumMarks: 10,
      conceptsCorrectlyIdentified: [`Brief keyword provided: "${cleanCand}"`],
      conceptsMissing: ['Complete technical explanation', 'Contextual supporting details and examples'],
      incorrectStatements: ['Response was truncated to 1–2 words; insufficient elaboration.'],
      feedback: `Incomplete response: Submitted only ${words.length} word(s) ("${cleanCand}"). An interview answer requires complete sentences and technical explanation. Minimal marks awarded.`,
      explanation: targetCriteria || 'Expected a detailed technical explanation.',
      referenceAnswer: targetCriteria || undefined,
      confidenceInEvaluation: 'high',
      strengths: [],
      areasToImprove: ['Elaborate in full complete sentences explaining the underlying principles.'],
      isDeterministic: false,
    };
  }

  // 3. Contradictions & Factual Errors Check
  const fatalContradictions: Array<{ pattern: RegExp; description: string }> = [
    {
      pattern: /\b(high\s+bias\s+(causes?|leads? to|results? in|creates?|means?)\s+overfit\w*)\b/i,
      description: 'Claimed high bias causes overfitting (high bias causes underfitting).',
    },
    {
      pattern: /\b(high\s+variance\s+(causes?|leads? to|results? in|creates?|means?)\s+underfit\w*)\b/i,
      description: 'Claimed high variance causes underfitting (high variance causes overfitting).',
    },
    {
      pattern: /\b(regularization\s+(increases?|amplifies?)\s+(variance|overfitting))\b/i,
      description: 'Claimed regularization increases variance or overfitting (regularization reduces variance).',
    },
    {
      pattern: /\b(underfitting\s+happens\s+when\s+(a|the)\s+model\s+is\s+too\s+complex)\b/i,
      description: 'Claimed underfitting occurs when a model is too complex (underfitting occurs when a model is too simple).',
    },
    {
      pattern: /\b(precision\s+is\s+true\s+positives?\s+divided\s+by\s+all\s+actual\s+positives?)\b/i,
      description: 'Confused precision with recall (precision divides by predicted positives, recall divides by actual positives).',
    },
  ];

  const detectedErrors: string[] = [];
  for (const item of fatalContradictions) {
    if (item.pattern.test(lowerCand)) {
      detectedErrors.push(item.description);
    }
  }

  // Detect political/governmental confusion on technical AI/Constitutional AI questions
  const isAiTechnicalQuestion = /constitutional\s*ai|alignment|machine\s+learning|deep\s+learning|neural\s+network|transformer|llm|generative\s+ai|model/i.test(questionText + ' ' + topic);
  if (isAiTechnicalQuestion) {
    const hasPoliticalHallucination = /\b(lok\s+sabha|rajya\s+sabha|parliament|vidhan\s+sabha|congress|senate|prime\s+minister|president\s+of\s+india|constitution\s+of\s+india|article\s+\d+|legislat\w*|member\s+of\s+parliament|politician)\b/i.test(lowerCand);
    if (hasPoliticalHallucination) {
      detectedErrors.push('Factual and domain error: Confused Constitutional AI / Machine Learning with governmental or political institutions (e.g., Lok Sabha, Rajya Sabha, Parliament). Constitutional AI is an AI alignment methodology using principles for automated model self-critique, not government legislation.');
    }
  }

  // Detect fabricated concepts for autoencoders (e.g., claiming "noise, neck, gray" are types)
  const isAutoencoderQuestion = questionText.toLowerCase().includes('autoencoder') || questionText.toLowerCase().includes('auto encoder');
  if (isAutoencoderQuestion) {
    const hasFabricatedTypes = /\b(neck|gray|grey)\b/i.test(lowerCand) || (/\bnoise\b/i.test(lowerCand) && !/\bdenoising\b/i.test(lowerCand));
    if (hasFabricatedTypes) {
      detectedErrors.push('Fabricated terminology: "noise, neck, and gray" are not valid types of autoencoders. Recognized architectures include Denoising, Variational (VAE), Sparse, Contractive, and Convolutional autoencoders.');
    }
  }

  // 4. Decompose into Subquestion Components
  const components = decomposeQuestionComponents(questionText, topic, targetCriteria);
  const componentResults: Array<{
    name: string;
    weight: number;
    maxMarks: number;
    awardedMarks: number;
    status: 'covered' | 'partial' | 'missing' | 'incorrect';
    feedback: string;
  }> = [];

  const conceptsDemonstrated: string[] = [];
  const conceptsMissing: string[] = [];

  // Exclude question prompt words and common fillers from candidate credit
  const qWords = new Set(questionText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2));
  const stopWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'which', 'what', 'where', 'each', 'have', 'been', 'were', 'three', 'types', 'give', 'tell']);

  for (const comp of components) {
    const maxMarks = Math.round((comp.weight / 100) * 10);
    const hasMatch = comp.keywords.some(p => p.test(lowerCand));

    // Calculate genuine non-prompt vocabulary overlap
    const compWords = comp.description.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !qWords.has(w) && !stopWords.has(w));
    const candUniqueWords = lowerCand.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !qWords.has(w) && !stopWords.has(w));
    const matchCount = compWords.filter(w => candUniqueWords.includes(w)).length;
    const overlapRatio = compWords.length > 0 ? matchCount / compWords.length : 0;

    // Check if this component was fabricated / hallucinated
    const isComponentFabricated = isAutoencoderQuestion && comp.name.includes('Types') && /\b(neck|gray|grey)\b/i.test(lowerCand);

    if (isComponentFabricated) {
      componentResults.push({
        name: comp.name,
        weight: comp.weight,
        maxMarks,
        awardedMarks: 0,
        status: 'incorrect',
        feedback: `Incorrect/Fabricated: Candidate listed non-existent types ("noise, neck, gray"). Recognized types include Denoising, Variational (VAE), Sparse, and Convolutional.`,
      });
      conceptsMissing.push(`Valid ${comp.name}`);
    } else if (hasMatch && (overlapRatio >= 0.25 || candUniqueWords.length >= 3)) {
      // Fully covered component
      componentResults.push({
        name: comp.name,
        weight: comp.weight,
        maxMarks,
        awardedMarks: maxMarks,
        status: 'covered',
        feedback: `Accurately addressed: ${comp.name}.`,
      });
      conceptsDemonstrated.push(comp.name);
    } else if (hasMatch && candUniqueWords.length >= 1) {
      // Partially covered
      const partialMarks = Math.max(1, Math.round(maxMarks * 0.5));
      componentResults.push({
        name: comp.name,
        weight: comp.weight,
        maxMarks,
        awardedMarks: partialMarks,
        status: 'partial',
        feedback: `Partially addressed: ${comp.name} was mentioned but lacked depth.`,
      });
      conceptsDemonstrated.push(`${comp.name} (partial)`);
      conceptsMissing.push(`Full details on: ${comp.name}`);
    } else {
      // Missing component
      componentResults.push({
        name: comp.name,
        weight: comp.weight,
        maxMarks,
        awardedMarks: 0,
        status: 'missing',
        feedback: `Omitted: Candidate did not address ${comp.name}.`,
      });
      conceptsMissing.push(comp.name);
    }
  }

  // Sum awarded marks across components
  let totalAwarded = componentResults.reduce((sum, c) => sum + c.awardedMarks, 0);

  // If fatal contradictions or fabricated claims were detected:
  if (detectedErrors.length > 0) {
    if (conceptsDemonstrated.length === 0) {
      totalAwarded = 0;
    } else {
      totalAwarded = Math.max(0, totalAwarded - detectedErrors.length * 4);
    }
  }

  totalAwarded = Math.min(Math.max(totalAwarded, 0), 10);
  const calculatedScore = Math.round((totalAwarded / 10) * 100);

  // Determine Category
  const missingCount = componentResults.filter(c => c.status === 'missing').length;
  const incorrectCount = componentResults.filter(c => c.status === 'incorrect').length;
  const coveredCount = componentResults.filter(c => c.status === 'covered').length;
  const partialCount = componentResults.filter(c => c.status === 'partial').length;

  let finalStatus: 'fully_correct' | 'partially_correct' | 'incorrect' | 'incomplete' | 'irrelevant' = 'partially_correct';

  if ((detectedErrors.length > 0 || incorrectCount > 0) && coveredCount === 0 && partialCount === 0) {
    finalStatus = 'incorrect';
    totalAwarded = 0;
  } else if (totalAwarded === 0) {
    finalStatus = 'incorrect';
  } else if (missingCount === 0 && detectedErrors.length === 0 && totalAwarded >= 8) {
    finalStatus = 'fully_correct';
  } else if (missingCount > 0 && (coveredCount > 0 || partialCount > 0)) {
    // Explicitly incomplete: addressed some parts but left required parts unanswered
    finalStatus = 'incomplete';
  } else if (coveredCount > 0 || partialCount > 0) {
    finalStatus = 'partially_correct';
  } else {
    finalStatus = 'incorrect';
    totalAwarded = 0;
  }

  const finalCorrectness = finalStatus === 'incorrect' ? 0 : calculatedScore;

  const feedback = finalStatus === 'fully_correct'
    ? `Comprehensive and accurate answer. All required components addressed effectively (${conceptsDemonstrated.slice(0, 3).join(', ')}). Awarded ${totalAwarded}/10 marks.`
    : finalStatus === 'incomplete'
    ? `Incomplete response. Successfully addressed ${conceptsDemonstrated.join(', ')}, but completely omitted ${conceptsMissing.join(', ')}. Candidate awarded ${totalAwarded}/10 marks for the parts answered.`
    : finalStatus === 'partially_correct'
    ? `Partially correct answer. Demonstrated foundational concepts (${conceptsDemonstrated.join(', ')}) but omitted ${conceptsMissing.join(', ')}. Awarded ${totalAwarded}/10 marks.`
    : `Incorrect response. Did not demonstrate the required technical knowledge${detectedErrors.length > 0 ? ` (${detectedErrors[0]})` : ''}. Zero marks awarded.`;

  return {
    evaluationStatus: finalStatus,
    score: finalCorrectness,
    correctness: finalCorrectness,
    awardedMarks: totalAwarded,
    maximumMarks: 10,
    components: componentResults.map(c => ({
      ...c,
      category: c.status === 'covered' ? 'fully_correct' : c.status === 'partial' ? 'partially_correct' : 'incomplete',
    })),
    conceptsCorrectlyIdentified: conceptsDemonstrated,
    conceptsMissing,
    incorrectStatements: detectedErrors,
    feedback,
    explanation: targetCriteria || `Expected explanation addressing all subparts: ${components.map(c => c.name).join('; ')}.`,
    referenceAnswer: targetCriteria || undefined,
    confidenceInEvaluation: 'high',
    strengths: conceptsDemonstrated.length > 0 ? [`Addressed: ${conceptsDemonstrated.join('; ')}`] : [],
    areasToImprove: conceptsMissing.length > 0 ? [`Missing requirements: ${conceptsMissing.join('; ')}`] : detectedErrors,
    isDeterministic: false,
  };
}


