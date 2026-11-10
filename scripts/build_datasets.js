import fs from 'fs';
import path from 'path';

function parseCSV(text) {
  const records = [];
  let currentRecord = [];
  let currentField = '';
  let insideQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRecord.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRecord.push(currentField.trim());
      if (currentRecord.length > 1 || (currentRecord.length === 1 && currentRecord[0] !== '')) {
        records.push(currentRecord);
      }
      currentRecord = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRecord.length > 0) {
    currentRecord.push(currentField.trim());
    records.push(currentRecord);
  }
  return records;
}

const outDir = path.join(process.cwd(), 'src', 'data', 'datasets');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Starting dataset parsing and extraction...');

// -------------------------------------------------------------
// 1. common aptitude and reasoning.csv -> Round 1 (Common to both roles)
// -------------------------------------------------------------
const aptCsvPath = path.join(process.cwd(), 'public', 'assets', 'aistudio', 'common_aptitude_and_reasoning_8f00d0dd.csv');
const aptRows = parseCSV(fs.readFileSync(aptCsvPath, 'utf8'));
const aptitudeQuestions = [];

for (let i = 2; i < aptRows.length; i++) {
  const row = aptRows[i];
  if (!row[4] || !row[4].trim()) continue;
  
  const rawCat = row[2] || 'Aptitude';
  const cleanCat = rawCat.replace(/^\d+\s*/, '').trim();
  const rawDiff = row[3] || 'Basic';
  const diff = rawDiff.includes('Basic') ? 'Easy' : rawDiff.includes('Intermediate') ? 'Medium' : 'Hard';
  const qText = row[4].trim();
  const solution = row[5] ? row[5].trim() : '';
  const answer = row[6] ? row[6].split('\n')[0].replace(/^##.*/, '').trim() : '';

  let options = undefined;
  let correctOptionIndex = undefined;

  // Helper to generate confusing, plausible similar distractors instead of giveaway boilerplate
  function buildConfusingDistractors(ansStr, qStr, cat) {
    const clean = (ansStr || '').trim().replace(/^##.*/, '').trim();
    if (!clean || /requires/i.test(clean)) return null;

    // 1. Percentage (e.g. "20%", "12.5%", "25%")
    const pct = clean.match(/^([+-]?\d+(?:\.\d+)?)\s*%$/);
    if (pct) {
      const val = parseFloat(pct[1]);
      const step = val <= 10 ? 1 : val <= 25 ? (val % 5 === 0 ? 5 : 2.5) : (val % 10 === 0 ? 10 : 5);
      const set = new Set([val]);
      set.add(Math.round((val + step) * 10) / 10);
      set.add(Math.max(0, Math.round((val - step) * 10) / 10));
      set.add(Math.round((val + step * 2) * 10) / 10);
      set.add(Math.max(0, Math.round((val - step * 2) * 10) / 10));
      const arr = Array.from(set).filter(v => v >= 0).slice(0, 4);
      while (arr.length < 4) arr.push(Math.round((arr[arr.length - 1] + step) * 10) / 10);
      return { options: arr.map(v => `${v}%`), target: `${val}%` };
    }

    // 2. Currency (e.g. "$180", "$250", "$10")
    const curr = clean.match(/^(\$|₹|€|£)\s*([+-]?\d+(?:\.\d+)?)$/);
    if (curr) {
      const sym = curr[1];
      const val = parseFloat(curr[2]);
      const delta = val <= 15 ? 2 : val <= 50 ? 5 : val <= 150 ? 15 : val <= 500 ? 25 : 50;
      const set = new Set([val]);
      set.add(val + delta);
      set.add(Math.max(1, val - delta));
      set.add(val + delta * 2);
      set.add(Math.max(1, val - delta * 2));
      const arr = Array.from(set).slice(0, 4);
      while (arr.length < 4) arr.push(arr[arr.length - 1] + delta);
      return { options: arr.map(v => `${sym}${v}`), target: `${sym}${val}` };
    }

    // 3. Number with unit (e.g. "5 days", "20 units", "60 km/h", "120 meters", "3 hours", "10 seconds")
    const unitMatch = clean.match(/^([+-]?\d+(?:\.\d+)?)\s+([a-zA-Z/]+(?:\s+[a-zA-Z/]+)?)$/);
    if (unitMatch) {
      const val = parseFloat(unitMatch[1]);
      const unit = unitMatch[2];
      const delta = val <= 5 ? 1 : val <= 20 ? 2 : val <= 50 ? 5 : 10;
      const set = new Set([val]);
      set.add(val + delta);
      set.add(Math.max(1, val - delta));
      set.add(val + delta * 2);
      set.add(Math.max(1, val - delta * 2));
      const arr = Array.from(set).slice(0, 4);
      while (arr.length < 4) arr.push(arr[arr.length - 1] + delta);
      return { options: arr.map(v => `${v} ${unit}`), target: `${val} ${unit}` };
    }

    // 4. Fractions (e.g. "1/10", "3/4")
    const frac = clean.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (frac) {
      const n = parseInt(frac[1]);
      const d = parseInt(frac[2]);
      const dList = [d, d - 2 > 0 ? d - 2 : d + 4, d + 2, d + 5];
      const unique = Array.from(new Set(dList));
      while (unique.length < 4) unique.push(unique[unique.length - 1] + 2);
      return { options: unique.map(den => `${n}/${den}`), target: `${n}/${d}` };
    }

    // 5. Ratios (e.g. "3:4", "5:6")
    const ratio = clean.match(/^(\d+)\s*:\s*(\d+)$/);
    if (ratio) {
      const a = parseInt(ratio[1]);
      const b = parseInt(ratio[2]);
      const set = new Set([`${a}:${b}`, `${a}:${b + 1}`, `${Math.max(1, a - 1)}:${b}`, `${a + 1}:${b}`]);
      const arr = Array.from(set);
      while (arr.length < 4) arr.push(`${a}:${b + arr.length}`);
      return { options: arr, target: `${a}:${b}` };
    }

    // 6. Pure numeric values
    const numMatch = clean.match(/^([+-]?\d+(?:\.\d+)?)$/);
    if (numMatch) {
      const val = parseFloat(numMatch[1]);
      const isInt = Number.isInteger(val);
      const delta = val <= 5 ? 1 : val <= 25 ? (val % 5 === 0 ? 5 : 2) : val <= 100 ? (val % 10 === 0 ? 10 : 5) : 25;
      const set = new Set([val]);
      set.add(val + delta);
      set.add(Math.max(isInt ? 0 : 0.1, val - delta));
      set.add(val + delta * 2);
      set.add(Math.max(isInt ? 0 : 0.1, val - delta * 2));
      const arr = Array.from(set).slice(0, 4);
      while (arr.length < 4) arr.push(arr[arr.length - 1] + delta);
      return {
        options: arr.map(v => isInt ? String(Math.round(v)) : String(Math.round(v * 100) / 100)),
        target: isInt ? String(Math.round(val)) : String(Math.round(val * 100) / 100)
      };
    }

    // 7. Boolean / Logic verification
    if (/^yes$/i.test(clean)) {
      return { options: ['Yes', 'No', 'Partially true', 'Only under specific constraints'], target: 'Yes' };
    }
    if (/^no$/i.test(clean)) {
      return { options: ['No', 'Yes', 'True for prime numbers only', 'Only when values are positive'], target: 'No' };
    }

    // 8. Directions
    const dirMap = {
      'North': ['North', 'South', 'East', 'West'],
      'South': ['South', 'North', 'West', 'East'],
      'East': ['East', 'West', 'North', 'South'],
      'West': ['West', 'East', 'South', 'North'],
      'North-East': ['North-East', 'North-West', 'South-East', 'South-West'],
      'North-West': ['North-West', 'North-East', 'South-West', 'South-East'],
      'South-East': ['South-East', 'South-West', 'North-East', 'North-West'],
      'South-West': ['South-West', 'South-East', 'North-West', 'North-East'],
    };
    if (dirMap[clean]) {
      return { options: dirMap[clean], target: clean };
    }

    // 9. Family / Blood Relations
    const relMap = {
      'Sister': ['Sister', 'Cousin', 'Aunt', 'Niece'],
      'Brother': ['Brother', 'Cousin', 'Uncle', 'Nephew'],
      'Mother': ['Mother', 'Aunt', 'Sister', 'Grandmother'],
      'Father': ['Father', 'Uncle', 'Brother', 'Grandfather'],
      'Son': ['Son', 'Nephew', 'Brother', 'Cousin'],
      'Daughter': ['Daughter', 'Niece', 'Sister', 'Cousin'],
      'Uncle': ['Uncle', 'Father', 'Grandfather', 'Brother'],
      'Aunt': ['Aunt', 'Mother', 'Grandmother', 'Sister'],
      'Nephew': ['Nephew', 'Son', 'Brother', 'Cousin'],
      'Niece': ['Niece', 'Daughter', 'Sister', 'Cousin'],
    };
    if (relMap[clean]) {
      return { options: relMap[clean], target: clean };
    }

    // 10. Syllogisms & Logical Deductions
    if (/only.*(conclusion|i\b|ii\b|1|2)/i.test(clean) || /both.*follow/i.test(clean) || /neither/i.test(clean)) {
      return {
        options: [
          'Only conclusion I follows',
          'Only conclusion II follows',
          'Both conclusions I and II follow',
          'Neither conclusion I nor II follows'
        ],
        target: clean.includes('Both')
          ? 'Both conclusions I and II follow'
          : clean.includes('Neither')
          ? 'Neither conclusion I nor II follows'
          : clean.includes('II')
          ? 'Only conclusion II follows'
          : 'Only conclusion I follows'
      };
    }

    // 11. Word Analogies & Vocabulary
    const analogyDict = {
      'Bark': ['Bark', 'Howl', 'Growl', 'Roar'],
      'Cut': ['Cut', 'Slice', 'Trim', 'Sever'],
      'Short': ['Short', 'Low', 'Petite', 'Compact'],
      'Vegetable': ['Vegetable', 'Fruit', 'Herb', 'Grain'],
      'Utensils': ['Utensils', 'Appliance', 'Furniture', 'Pantry'],
      'Talkative': ['Talkative', 'Eloquent', 'Reserved', 'Articulate'],
      'Pessimist': ['Pessimist', 'Realist', 'Fatalist', 'Cynic'],
      'True': ['True', 'False', 'Ambiguous', 'Partially valid'],
      'False': ['False', 'True', 'Indeterminate', 'Context dependent'],
    };
    if (analogyDict[clean]) {
      return { options: analogyDict[clean], target: clean };
    }

    return null;
  }

  // Check if options are in question text: e.g. A) ... B) ... C) ... D) ...
  const optMatch = qText.match(/(?:^|\n|\s)(?:A\)|A\.)\s+(.+?)(?:B\)|B\.)\s+(.+?)(?:C\)|C\.)\s+(.+?)(?:D\)|D\.)\s+(.+)$/s);
  const hasBadBoilerplate = optMatch && [optMatch[1], optMatch[2], optMatch[3], optMatch[4]].some(o => /insufficient|cannot be determined|none of the other/i.test(o));

  if (optMatch && !hasBadBoilerplate) {
    options = [
      'A) ' + optMatch[1].trim(),
      'B) ' + optMatch[2].trim(),
      'C) ' + optMatch[3].trim(),
      'D) ' + optMatch[4].trim()
    ];
    const ansUpper = answer.toUpperCase();
    if (ansUpper.includes('A')) correctOptionIndex = 0;
    else if (ansUpper.includes('B')) correctOptionIndex = 1;
    else if (ansUpper.includes('C')) correctOptionIndex = 2;
    else if (ansUpper.includes('D')) correctOptionIndex = 3;
    else correctOptionIndex = 0;
  } else {
    // Generate confusing similar options
    const generated = buildConfusingDistractors(answer, qText, cleanCat);
    if (generated && generated.options.length >= 4) {
      const targetAns = generated.target;
      // Deterministically or pseudo-randomly shuffle so correct answer is NOT always Option A!
      const rawOpts = [...generated.options];
      // Seeded shuffle using question index
      const seed = (i * 17 + 7) % 4;
      const targetOrigIdx = rawOpts.indexOf(targetAns);
      if (targetOrigIdx !== -1) {
        rawOpts.splice(targetOrigIdx, 1);
      } else {
        rawOpts.pop();
      }
      // Insert target answer at seed position
      rawOpts.splice(seed, 0, targetAns);

      options = rawOpts.slice(0, 4).map((opt, idx) => `${String.fromCharCode(65 + idx)}) ${opt}`);
      correctOptionIndex = seed;
    } else if (answer) {
      // Fallback close distractors based on raw answer string
      const optA = answer.trim();
      const optB = optA.replace(/\d+/, m => String(Number(m) + 5));
      const optC = optA.replace(/\d+/, m => String(Math.max(1, Number(m) - 5)));
      const optD = optA.replace(/\d+/, m => String(Number(m) + 10));
      const fallbackList = [optA, optB !== optA ? optB : optA + ' (Estimated)', optC !== optA ? optC : optA + ' (Adjusted)', optD !== optA ? optD : optA + ' (Approx)'];
      const seed = (i * 13) % 4;
      const targetVal = fallbackList[0];
      fallbackList.splice(0, 1);
      fallbackList.splice(seed, 0, targetVal);

      options = fallbackList.map((opt, idx) => `${String.fromCharCode(65 + idx)}) ${opt}`);
      correctOptionIndex = seed;
    }
  }

  aptitudeQuestions.push({
    id: `apt-common-${String(i - 1).padStart(4, '0')}`,
    role: 'Common',
    round: 1,
    topic: cleanCat,
    difficulty: diff,
    experienceLevel: 'All',
    question: qText,
    options,
    correctOptionIndex,
    explanation: solution ? solution : `Correct answer: ${answer}`,
    evaluationRubric: solution ? solution : `Candidate should deduce the correct answer: ${answer}`,
    source: 'dataset'
  });
}

console.log(`[Aptitude & Reasoning] Extracted ${aptitudeQuestions.length} questions.`);
fs.writeFileSync(path.join(outDir, 'aptitude_reasoning.json'), JSON.stringify(aptitudeQuestions, null, 2));

// -------------------------------------------------------------
// 2. data_scientist_hr_questions.csv -> Round 4 (Data Scientist only)
// -------------------------------------------------------------
const dsHrCsvPath = path.join(process.cwd(), 'public', 'assets', 'aistudio', 'data_scientist_hr_questions_fccf9921.csv');
const dsHrRows = parseCSV(fs.readFileSync(dsHrCsvPath, 'utf8'));
const dataScientistHrQuestions = [];

for (let i = 1; i < dsHrRows.length; i++) {
  const row = dsHrRows[i];
  if (!row[0] || !row[0].trim()) continue;

  const qText = row[0].trim();
  const category = row[1] ? row[1].trim() : 'Behavioral';
  const diffRaw = row[3] || 'Medium';
  const diff = (diffRaw === 'Easy' || diffRaw === 'Medium' || diffRaw === 'Hard') ? diffRaw : 'Medium';
  const idealAnswer = row[5] ? row[5].trim() : '';
  const keywords = row[6] ? row[6].trim() : '';

  dataScientistHrQuestions.push({
    id: `hr-ds-${String(i).padStart(3, '0')}`,
    role: 'Data Scientist',
    round: 4,
    topic: category,
    difficulty: diff,
    experienceLevel: 'All',
    question: qText,
    expectedAnswer: idealAnswer || undefined,
    explanation: idealAnswer ? `Ideal Answer Guide: ${idealAnswer}` : undefined,
    evaluationRubric: idealAnswer
      ? `Evaluate candidate response against dataset reference: "${idealAnswer}". Key signals and keywords: ${keywords}`
      : `Evaluate on behavioral maturity, situational context, and communication.`,
    source: 'dataset'
  });
}

console.log(`[Data Scientist HR] Extracted ${dataScientistHrQuestions.length} questions.`);
fs.writeFileSync(path.join(outDir, 'data_scientist_hr.json'), JSON.stringify(dataScientistHrQuestions, null, 2));

// -------------------------------------------------------------
// 3. data_scientist_technical_questions.csv -> Round 3 (Data Scientist only)
// -------------------------------------------------------------
const dsTechCsvPath = path.join(process.cwd(), 'public', 'assets', 'aistudio', 'data_scientist_technical_questions_0c96bfac.csv');
const dsTechRawContent = fs.readFileSync(dsTechCsvPath, 'utf8');
const dsTechRows = parseCSV(dsTechRawContent);

// Parse detailed Q&A answers from the markdown sections in data_scientist_technical_questions.csv
const qaMap = new Map();
const qnaRegex = /###\s*Q\d+:\s*(.*?)\s*###([\s\S]*?)(?=###\s*Q\d+:|##|$)/gi;
let match;
while ((match = qnaRegex.exec(dsTechRawContent)) !== null) {
  const qTitle = match[1].trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const ansBody = match[2].trim().replace(/^Answer:\s*/i, '').trim();
  if (qTitle && ansBody) {
    qaMap.set(qTitle, ansBody);
  }
}

const dataScientistTechQuestions = [];

for (let i = 1; i < dsTechRows.length; i++) {
  const row = dsTechRows[i];
  if (!row[3] || !row[3].trim()) continue;

  const subject = row[2] ? row[2].trim() : 'Machine Learning';
  const qText = row[3].trim();
  const diff = qText.length > 250 || subject === 'Deep Learning' ? 'Hard' : qText.length > 120 ? 'Medium' : 'Easy';

  // Check if we extracted an explicit reference answer from the dataset
  const qKey = qText.toLowerCase().replace(/[^a-z0-9]/g, '');
  let extractedAnswer = qaMap.get(qKey);
  if (!extractedAnswer) {
    for (const [key, ans] of qaMap.entries()) {
      if (key.includes(qKey.slice(0, 30)) || qKey.includes(key.slice(0, 30))) {
        extractedAnswer = ans;
        break;
      }
    }
  }

  // Pre-seed known core technical reference criteria if not extracted
  if (!extractedAnswer && qText.toLowerCase().includes('autoencoder')) {
    extractedAnswer = 'Autoencoders are unsupervised neural networks designed to learn efficient data codings. Core architecture consists of Encoder (compresses input to bottleneck latent representation) and Decoder (reconstructs input from latent code). Valid types include Denoising, Variational (VAE), Sparse, Contractive, and Convolutional autoencoders. Applications include dimensionality reduction, feature extraction, and image denoising.';
  } else if (!extractedAnswer && qText.toLowerCase().includes('activation function')) {
    extractedAnswer = 'Activation functions introduce non-linearity into neural network nodes, enabling the network to learn non-linear decision boundaries. Common types include Sigmoid (f(x) = 1/(1+e^-x)), ReLU (max(0,x) which mitigates vanishing gradients), Leaky ReLU (avoids dying ReLU), and Softmax (probability distribution over classes).';
  } else if (!extractedAnswer && qText.toLowerCase().includes('overfitting')) {
    extractedAnswer = 'Overfitting can be addressed at data, model, and training levels. Data level: data augmentation, gathering more diverse samples, cleaning noisy labels. Model level: reducing capacity/layers, adding L1/L2 regularization, dropout. Training level: early stopping with validation loss, batch normalization, and cross-validation.';
  } else if (!extractedAnswer && qText.toLowerCase().includes('batch normalization')) {
    extractedAnswer = 'Batch Normalization standardizes activations for each mini-batch during training (subtracting mean and dividing by standard deviation, then scaling and shifting with learnable gamma and beta). It reduces internal covariate shift, accelerates convergence, allows higher learning rates, and acts as a mild regularizer.';
  }

  dataScientistTechQuestions.push({
    id: `tech-ds-${String(i).padStart(3, '0')}`,
    role: 'Data Scientist',
    round: 3,
    topic: subject,
    difficulty: diff,
    experienceLevel: diff === 'Hard' ? '2–5 years' : 'All',
    question: qText,
    expectedAnswer: extractedAnswer || undefined,
    explanation: extractedAnswer ? `Reference Answer: ${extractedAnswer.slice(0, 300)}...` : undefined,
    evaluationRubric: extractedAnswer
      ? `Evaluate candidate response against dataset reference answer: "${extractedAnswer}". Candidate must demonstrate accuracy on core components without fabricating terms.`
      : `Evaluate foundational accuracy in ${subject}, mathematical understanding, practical constraints, and technical communication.`,
    source: 'dataset'
  });
}

console.log(`[Data Scientist Technical] Extracted ${dataScientistTechQuestions.length} questions (${qaMap.size} reference answers matched).`);
fs.writeFileSync(path.join(outDir, 'data_scientist_technical.json'), JSON.stringify(dataScientistTechQuestions, null, 2));

// -------------------------------------------------------------
// 4. README.md -> ML Engineer Questions (Coding, Technical, HR/Behavioral)
// -------------------------------------------------------------
const readmePath = path.join(process.cwd(), 'public', 'assets', 'aistudio', 'README_5577e371.md');
const readmeContent = fs.readFileSync(readmePath, 'utf8');

function extractNumberedQuestions(text, defaultTopic = 'Core') {
  const lines = text.split('\n');
  const results = [];
  let curQ = null;
  let curSubTopic = defaultTopic;

  for (const line of lines) {
    if (line.startsWith('### ')) {
      curSubTopic = line.replace('### ', '').replace(/\*\(\d+ questions\)\*/, '').trim();
    }
    const match = line.match(/^(\d+)\.\s+(.+)$/);
    if (match) {
      if (curQ) results.push(curQ);
      curQ = { num: parseInt(match[1], 10), topic: curSubTopic, text: match[2].trim() };
    } else if (curQ && line.trim() && !line.startsWith('#') && !line.startsWith('---')) {
      curQ.text += ' ' + line.trim();
    }
  }
  if (curQ) results.push(curQ);
  return results;
}

// A. ML Coding Questions (Round 2)
const codingStart = readmeContent.indexOf('## Coding Problems');
const codingEnd = readmeContent.indexOf('## Behavioral Questions');
const codingSectionText = readmeContent.slice(codingStart, codingEnd);
const rawMlCoding = extractNumberedQuestions(codingSectionText, 'ML Coding');

// Curate full ML Engineer coding questions with starter code & test cases
const mlCodingQuestions = [
  {
    id: 'code-mle-001',
    role: 'ML Engineer',
    round: 2,
    topic: 'ML Implementation: Logistic Regression with SGD & L2 Regularization (NumPy)',
    difficulty: 'Medium',
    experienceLevel: '0–2 years',
    question: 'Implement a Python function `logistic_regression_step(weights, X, y, lr=0.1, l2_reg=0.01)` that executes one step of batch gradient descent for logistic regression with L2 weight decay regularization.\n\nMathematical specifications:\n- Hypothesis: p = sigmoid(X @ weights)\n- Loss: Binary Cross-Entropy with L2 regularization: L = - (1/N) * sum(y * log(p) + (1-y) * log(1-p)) + (l2_reg / 2) * ||weights||^2\n- Gradient w.r.t weights: (1/N) * X.T @ (p - y) + l2_reg * weights\n- Update: new_weights = weights - lr * gradient\n\nReturn the updated weights rounded to 4 decimal places.',
    codingLanguage: 'python',
    codingStarterCode: `import math

def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))

def logistic_regression_step(weights, X, y, lr=0.1, l2_reg=0.01):
    # weights: list of float (length D)
    # X: list of lists of float (N samples x D features)
    # y: list of binary targets 0 or 1 (length N)
    # TODO: Compute model predictions using sigmoid(X @ weights)
    # TODO: Compute gradients with L2 regularization penalty
    # TODO: Update weights using gradient descent and return rounded to 4 decimals
    pass
`,
    referenceSolution: `import math

def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))

def logistic_regression_step(weights, X, y, lr=0.1, l2_reg=0.01):
    N = len(X)
    D = len(weights)
    predictions = []
    for row in X:
        dot = sum(w * x for w, x in zip(weights, row))
        predictions.append(sigmoid(dot))
    
    new_weights = []
    for j in range(D):
        grad_j = (1.0 / N) * sum((predictions[i] - y[i]) * X[i][j] for i in range(N))
        grad_j += l2_reg * weights[j]
        new_w = weights[j] - lr * grad_j
        new_weights.append(round(new_w, 4))
    return new_weights
`,
    testCases: [
      {
        input: 'weights=[0.0, 0.0], X=[[1.0, 1.0], [2.0, 2.0]], y=[1, 0], lr=0.1, l2_reg=0.0',
        expectedOutput: '[0.025, 0.025]',
        description: 'Single gradient update on 2-sample batch with zero L2 regularization'
      },
      {
        input: 'weights=[1.0, -1.0], X=[[0.0, 0.0]], y=[1], lr=0.1, l2_reg=0.1',
        expectedOutput: '[0.99, -0.99]',
        description: 'L2 regularization weight shrinkage when input features are zero'
      }
    ],
    evaluationRubric: 'Correct sigmoid computation, proper gradient accumulation over N samples, L2 regularization term addition, and gradient step.',
    source: 'dataset'
  },
  {
    id: 'code-mle-002',
    role: 'ML Engineer',
    round: 2,
    topic: 'Computer Vision & Object Detection: Intersection over Union (IoU)',
    difficulty: 'Medium',
    experienceLevel: 'All',
    question: 'Intersection over Union (IoU) is a fundamental evaluation metric in computer vision object detection and tracking. Write a Python function `compute_iou(boxA, boxB)` where each box is specified as `[x1, y1, x2, y2]` (coordinates of top-left and bottom-right corners).\n\nRequirements:\n1. If the boxes do not overlap, return 0.0.\n2. Handle touching edges gracefully (area = 0).\n3. Return the float IoU value rounded to 4 decimal places.',
    codingLanguage: 'python',
    codingStarterCode: `def compute_iou(boxA, boxB):
    # boxA, boxB: [x1, y1, x2, y2]
    # TODO: Calculate (x, y) coordinates of intersection rectangle
    # TODO: Calculate area of intersection (handle disjoint boxes)
    # TODO: Calculate area of both bounding boxes
    # TODO: Compute IoU = intersection_area / union_area rounded to 4 decimals
    pass
`,
    referenceSolution: `def compute_iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    inter_width = max(0.0, xB - xA)
    inter_height = max(0.0, yB - yA)
    inter_area = inter_width * inter_height

    boxA_area = max(0.0, (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]))
    boxB_area = max(0.0, (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]))

    union_area = boxA_area + boxB_area - inter_area
    if union_area <= 0:
        return 0.0

    return round(inter_area / union_area, 4)
`,
    testCases: [
      {
        input: 'boxA=[0, 0, 10, 10], boxB=[5, 5, 15, 15]',
        expectedOutput: '0.1429',
        description: 'Intersection 5x5=25, Union 100+100-25=175, IoU=25/175=0.1429'
      },
      {
        input: 'boxA=[0, 0, 4, 4], boxB=[4, 4, 8, 8]',
        expectedOutput: '0.0',
        description: 'Touching corners with zero overlapping area'
      }
    ],
    evaluationRubric: 'Correct coordinate bounding using max(x1_a, x1_b) and min(x2_a, x2_b), positive area check, union calculation without double-counting intersection.',
    source: 'dataset'
  },
  {
    id: 'code-mle-003',
    role: 'ML Engineer',
    round: 2,
    topic: 'Transformer Architecture: Scaled Dot-Product Self-Attention',
    difficulty: 'Hard',
    experienceLevel: '2–5 years',
    question: 'The core component of Transformers is Scaled Dot-Product Attention: Attention(Q, K, V) = softmax((Q @ K.T) / sqrt(d_k)) @ V.\n\nImplement `scaled_dot_product_attention(Q, K, V)` where:\n- Q, K, V are lists of lists representing 2D matrices of shape (seq_len, d_k).\n- Return the resulting attention output matrix of shape (seq_len, d_k), with each element rounded to 4 decimal places.',
    codingLanguage: 'python',
    codingStarterCode: `import math

def scaled_dot_product_attention(Q, K, V):
    # Q: (seq_len, d_k), K: (seq_len, d_k), V: (seq_len, d_k)
    # TODO: Calculate attention scores (Q @ K.T)
    # TODO: Scale the scores by sqrt(d_k)
    # TODO: Apply softmax along the rows
    # TODO: Calculate the final attention output by multiplying attention weights with V
    # TODO: Return result with elements rounded to 4 decimal places
    pass
`,
    referenceSolution: `import math

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
`,
    testCases: [
      {
        input: 'Q=[[1.0, 0.0]], K=[[1.0, 0.0]], V=[[5.0, 10.0]]',
        expectedOutput: '[[5.0, 10.0]]',
        description: 'Single token trivial attention identity pass-through'
      }
    ],
    evaluationRubric: 'Correct division by sqrt(d_k), numerical stability in softmax, matrix multiplication dimensions.',
    source: 'dataset'
  },
  {
    id: 'code-mle-004',
    role: 'ML Engineer',
    round: 2,
    topic: 'Systems & Caching: LRU Cache Implementation',
    difficulty: 'Hard',
    experienceLevel: '2–5 years',
    question: 'In high-throughput ML inference servers, an LRU (Least Recently Used) cache is used to store token embeddings or model outputs to reduce GPU compute. Implement a class `LRUCache(capacity)` with:\n- `get(key)`: Return value if exists, else -1. Updates key as most recently used.\n- `put(key, value)`: Update or insert key. If capacity exceeded, evict least recently used key.\nBoth operations should run in O(1) average time complexity.',
    codingLanguage: 'python',
    codingStarterCode: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        # TODO: Initialize internal data structures for O(1) retrieval and order tracking

    def get(self, key: int) -> int:
        # TODO: Return value if key exists and update access order, else -1
        pass

    def put(self, key: int, value: int) -> None:
        # TODO: Insert or update key-value pair, evicting the least recently used key if capacity exceeded
        pass
`,
    referenceSolution: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        val = self.cache.pop(key)
        self.cache[key] = val
        return val

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.pop(key)
        elif len(self.cache) >= self.capacity:
            oldest_key = next(iter(self.cache))
            self.cache.pop(oldest_key)
        self.cache[key] = value
`,
    testCases: [
      {
        input: 'cache = LRUCache(2); cache.put(1, 1); cache.put(2, 2); res1 = cache.get(1); cache.put(3, 3); res2 = cache.get(2)',
        expectedOutput: 'res1=1, res2=-1',
        description: 'Eviction of key 2 when capacity 2 is exceeded'
      }
    ],
    evaluationRubric: 'O(1) time complexity, proper eviction order, correctly updating usage on get().',
    source: 'dataset'
  },
  {
    id: 'code-mle-005',
    role: 'ML Engineer',
    round: 2,
    topic: 'ML Algorithms: 1-Nearest Neighbor (1-NN) Classifier',
    difficulty: 'Easy',
    experienceLevel: 'Fresher',
    question: 'Implement a 1-Nearest Neighbor classifier `nearest_neighbor_predict(X_train, y_train, x_query)` that predicts the label of an unlabeled query point `x_query` using Euclidean distance against all points in `X_train`. If there is a tie, return the label of the first occurring nearest neighbor.',
    codingLanguage: 'python',
    codingStarterCode: `def nearest_neighbor_predict(X_train, y_train, x_query):
    # X_train: list of list of floats
    # y_train: list of labels (int or str)
    # x_query: list of floats
    # TODO: Compute Euclidean distance from x_query to all points in X_train
    # TODO: Identify the nearest point and return its corresponding label
    pass
`,
    referenceSolution: `import math

def nearest_neighbor_predict(X_train, y_train, x_query):
    best_dist = float('inf')
    best_label = None
    for point, label in zip(X_train, y_train):
        dist = math.sqrt(sum((a - b) ** 2 for a, b in zip(point, x_query)))
        if dist < best_dist:
            best_dist = dist
            best_label = label
    return best_label
`,
    testCases: [
      {
        input: 'X_train=[[0.0, 0.0], [10.0, 10.0]], y_train=["classA", "classB"], x_query=[1.0, 1.0]',
        expectedOutput: '"classA"',
        description: 'Point (1,1) is closest to (0,0) so predicts classA'
      }
    ],
    evaluationRubric: 'Correct Euclidean distance formula, proper minimum distance tracking, tie handling.',
    source: 'dataset'
  }
];

// Add the other 35 coding questions as structured problem statements
rawMlCoding.forEach((item, idx) => {
  if (idx >= 5) {
    mlCodingQuestions.push({
      id: `code-mle-${String(idx + 1).padStart(3, '0')}`,
      role: 'ML Engineer',
      round: 2,
      topic: item.topic || 'Algorithms & ML Coding',
      difficulty: idx > 25 ? 'Hard' : idx > 15 ? 'Medium' : 'Easy',
      experienceLevel: 'All',
      question: item.text,
      codingLanguage: 'python',
      codingStarterCode: `# Solution for: ${item.text.slice(0, 80)}\ndef solution(*args, **kwargs):\n    pass\n`,
      evaluationRubric: `Evaluate algorithmic correctness, complexity, and idiomatic Python design for: ${item.text}`,
      source: 'dataset'
    });
  }
});

console.log(`[ML Engineer Coding] Extracted ${mlCodingQuestions.length} coding questions.`);
fs.writeFileSync(path.join(outDir, 'ml_engineer_coding.json'), JSON.stringify(mlCodingQuestions, null, 2));

// B. ML Technical Questions (Round 3)
const techStart = readmeContent.indexOf('## Machine Learning Interview Questions');
const techEnd = readmeContent.indexOf('## Coding Problems');
const techSectionText = readmeContent.slice(techStart, techEnd);
const rawMlTech = extractNumberedQuestions(techSectionText, 'Machine Learning');

const mlTechQuestions = rawMlTech.map((q, idx) => {
  const diff = q.topic.includes('Optimization') || q.topic.includes('Agents') || q.topic.includes('RAG') || q.topic.includes('Fine-tuning')
    ? 'Hard'
    : 'Medium';
  return {
    id: `tech-mle-${String(idx + 1).padStart(3, '0')}`,
    role: 'ML Engineer',
    round: 3,
    topic: q.topic || 'Machine Learning',
    difficulty: diff,
    experienceLevel: diff === 'Hard' ? '2–5 years' : 'All',
    question: q.text,
    evaluationRubric: `Candidate should demonstrate deep practical understanding of ${q.topic}, explain trade-offs, architecture choices, and concrete production considerations for: ${q.text}`,
    source: 'dataset'
  };
});

console.log(`[ML Engineer Technical] Extracted ${mlTechQuestions.length} technical questions.`);
fs.writeFileSync(path.join(outDir, 'ml_engineer_technical.json'), JSON.stringify(mlTechQuestions, null, 2));

// C. ML Behavioral Questions (Round 4)
const behStart = readmeContent.indexOf('## Behavioral Questions');
const behEnd = readmeContent.indexOf('## Take-Home Assignments');
const behSectionText = behEnd !== -1 ? readmeContent.slice(behStart, behEnd) : readmeContent.slice(behStart);
const rawMlBeh = extractNumberedQuestions(behSectionText, 'Behavioral');

const mlBehQuestions = rawMlBeh.map((q, idx) => {
  return {
    id: `hr-mle-${String(idx + 1).padStart(3, '0')}`,
    role: 'ML Engineer',
    round: 4,
    topic: q.topic || 'Behavioral & Leadership',
    difficulty: 'Medium',
    experienceLevel: 'All',
    question: q.text,
    evaluationRubric: `Evaluate using STAR method (Situation, Task, Action, Result), leadership maturity, technical clarity, ownership, and collaborative communication for: ${q.text}`,
    source: 'dataset'
  };
});

console.log(`[ML Engineer Behavioral] Extracted ${mlBehQuestions.length} behavioral questions.`);
fs.writeFileSync(path.join(outDir, 'ml_engineer_hr.json'), JSON.stringify(mlBehQuestions, null, 2));

console.log('Dataset extraction completed successfully!');
