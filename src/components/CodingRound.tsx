import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, Code2, Cpu, Clock, Award, Terminal, RefreshCw } from 'lucide-react';
import { Question, CodingExecutionResult } from '../types';

interface CodingRoundProps {
  question: Question;
  onCodeEvaluated: (code: string, result: CodingExecutionResult) => void;
  onSubmitSolution?: (code: string, result: CodingExecutionResult) => void;
  isEvaluating: boolean;
}

export const CodingRound: React.FC<CodingRoundProps> = ({
  question,
  onCodeEvaluated,
  onSubmitSolution,
  isEvaluating,
}) => {
  const [code, setCode] = useState<string>(question.codingStarterCode || '# Write your solution here\n');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<CodingExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'problem' | 'testcases' | 'output'>('problem');

  const handleRunCode = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: question.codingLanguage || 'python',
          testCases: question.testCases || [],
        }),
      });

      const data = await response.json();
      setResult(data);
      setActiveTab('output');
      onCodeEvaluated(code, data);
    } catch (err: any) {
      console.error('Failed to run code:', err);
      const errResult: CodingExecutionResult = {
        passed: false,
        status: 'ERROR',
        overallStatus: 'ERROR',
        testsPassed: 0,
        totalTests: (question.testCases || []).length,
        output: '',
        error: err.message || 'Execution failed',
        executionTimeMs: 0,
        codeQualityScore: 0,
        feedback: 'Could not connect to sandbox runner.',
      };
      setResult(errResult);
      setActiveTab('output');
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetCode = () => {
    if (confirm('Reset editor to initial starter code?')) {
      setCode(question.codingStarterCode || '');
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Question Description and Tab Bar */}
      <div className="rounded-2xl bg-[#101d40] border border-[#34436d] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#34436d] bg-[#0c1634]">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#398fe0]/20 text-[#55b9ff] border border-[#398fe0]/40">
              {question.topic}
            </span>
            <span className="text-xs text-[#9eacd0]">
              Difficulty: <span className="font-semibold text-amber-300">{question.difficulty}</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('problem')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'problem'
                  ? 'bg-[#397fff] text-white'
                  : 'text-[#b8c5e6] hover:bg-[#172c5a]'
              }`}
            >
              Problem Statement
            </button>
            <button
              onClick={() => setActiveTab('testcases')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'testcases'
                  ? 'bg-[#397fff] text-white'
                  : 'text-[#b8c5e6] hover:bg-[#172c5a]'
              }`}
            >
              Test Cases ({question.testCases?.length || 0})
            </button>
            {result && (
              <button
                onClick={() => setActiveTab('output')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'output'
                    ? 'bg-[#995cff] text-white'
                    : 'text-[#b8c5e6] hover:bg-[#172c5a]'
                }`}
              >
                Sandbox Output
              </button>
            )}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-4 text-sm text-[#cbd5f3] leading-relaxed">
          {activeTab === 'problem' && (
            <div className="whitespace-pre-line font-normal">{question.question}</div>
          )}

          {activeTab === 'testcases' && (
            <div className="flex flex-col gap-3">
              {(question.testCases || []).map((tc, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#080f27] border border-[#2a3a6b] font-mono text-xs">
                  <div className="text-[#a66bff] font-semibold mb-1">
                    Test Case {idx + 1}: {tc.description}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div className="bg-[#101d40] p-2 rounded border border-[#1f2d57]">
                      <span className="text-[#9eacd0] block text-[10px] uppercase font-sans">Input:</span>
                      <span className="text-emerald-300">{tc.input}</span>
                    </div>
                    <div className="bg-[#101d40] p-2 rounded border border-[#1f2d57]">
                      <span className="text-[#9eacd0] block text-[10px] uppercase font-sans">Expected Output:</span>
                      <span className="text-[#55b9ff]">{tc.expectedOutput}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'output' && result && (
            <div className="flex flex-col gap-3">
              {/* Overall status banner */}
              <div className="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-[#080f27] border border-[#2a3a6b] gap-2">
                <div className="flex items-center gap-2.5">
                  {result.overallStatus === 'PASS' || result.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : result.overallStatus === 'NOT IMPLEMENTED' ? (
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-400 flex items-center justify-center font-bold text-xs shrink-0">!</div>
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-white text-sm block">
                      {result.overallStatus === 'PASS' || result.passed
                        ? 'All Test Cases Passed!'
                        : result.overallStatus === 'NOT IMPLEMENTED'
                        ? 'Starter Code Not Implemented'
                        : result.overallStatus === 'ERROR'
                        ? 'Execution Error in Code'
                        : 'Some Test Cases Failed'}
                    </span>
                    <span className="text-[11px] text-[#9eacd0]">
                      Status: <strong className="uppercase text-[#55b9ff]">{result.overallStatus || (result.passed ? 'PASS' : 'FAIL')}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[#55b9ff] flex items-center gap-1 font-semibold">
                    <Award className="w-3.5 h-3.5" /> Tests: {result.testsPassed} / {result.totalTests}
                  </span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {result.executionTimeMs}ms
                  </span>
                  {result.codeQualityScore > 0 && (
                    <span className="text-[#a66bff] flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5" /> Quality: {result.codeQualityScore}/100
                    </span>
                  )}
                </div>
              </div>

              {/* Per-Test Breakdown Cards */}
              {result.testResults && result.testResults.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[#55b9ff]" /> Detailed Test Case Results:
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {result.testResults.map((tc, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs font-mono flex flex-col gap-2 ${
                          tc.status === 'PASS'
                            ? 'bg-[#081a18] border-emerald-500/40'
                            : tc.status === 'NOT IMPLEMENTED'
                            ? 'bg-[#1a1708] border-amber-500/40'
                            : tc.status === 'ERROR'
                            ? 'bg-[#1f0a14] border-red-500/50'
                            : 'bg-[#180e18] border-rose-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between font-sans">
                          <span className="font-semibold text-white">
                            Test {tc.testIndex || idx + 1}: {tc.description}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              tc.status === 'PASS'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : tc.status === 'NOT IMPLEMENTED'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : tc.status === 'ERROR'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : tc.status === 'NOT RUN'
                                ? 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {tc.status}
                          </span>
                        </div>

                        {tc.input && (
                          <div className="bg-[#080f27] p-2 rounded border border-[#1e2e5c]">
                            <span className="text-[#9eacd0] block text-[10px] font-sans">Input:</span>
                            <span className="text-emerald-300 whitespace-pre-wrap">{tc.input}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {tc.expectedOutput && (
                            <div className="bg-[#080f27] p-2 rounded border border-[#1e2e5c]">
                              <span className="text-[#9eacd0] block text-[10px] font-sans">Expected Output:</span>
                              <span className="text-[#55b9ff] whitespace-pre-wrap">{tc.expectedOutput}</span>
                            </div>
                          )}
                          <div className="bg-[#080f27] p-2 rounded border border-[#1e2e5c]">
                            <span className="text-[#9eacd0] block text-[10px] font-sans">Actual Output:</span>
                            <span className={tc.status === 'PASS' ? 'text-emerald-300' : 'text-rose-300 font-bold'}>
                              {tc.actualOutput || (tc.status === 'NOT IMPLEMENTED' ? 'None (not implemented)' : 'None')}
                            </span>
                          </div>
                        </div>

                        {tc.errorMessage && (
                          <div className="bg-rose-950/40 border border-rose-500/40 p-2 rounded text-rose-200 text-[11px] whitespace-pre-wrap">
                            <span className="font-bold text-rose-400 block font-sans">Error Trace:</span>
                            {tc.errorMessage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Console log / output */}
              <div className="p-3 rounded-xl bg-[#050a1b] border border-[#1b274c] font-mono text-xs">
                <div className="text-[10px] text-[#9eacd0] uppercase mb-1 flex items-center gap-1 font-sans">
                  <Terminal className="w-3 h-3 text-[#55b9ff]" /> Sandbox Console &amp; Traceback Output:
                </div>
                <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                  {result.output || result.error || 'Execution completed with no errors.'}
                </pre>
              </div>

              {/* Feedback */}
              {result.feedback && (
                <div className="p-3 rounded-xl bg-[#142951]/60 border border-[#398fe0]/40 text-xs text-[#e5dcff]">
                  <span className="font-semibold text-white block mb-0.5">Code Review &amp; Complexity:</span>
                  {result.feedback}
                  {result.timeComplexityRating && (
                    <span className="ml-2 font-mono text-amber-300 font-semibold">
                      [{result.timeComplexityRating}]
                    </span>
                  )}
                </div>
              )}

              {onSubmitSolution && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => onSubmitSolution(code, result)}
                    disabled={isEvaluating || isRunning}
                    className="btn-gradient flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold text-white shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Solution &amp; View Evaluation →</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Code Editor */}
      <div className="rounded-2xl bg-[#080f27] border border-[#34436d] overflow-hidden flex flex-col shadow-2xl">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#24335c] bg-[#0c1634]">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#55b9ff]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {question.codingLanguage || 'python'} 3.x Sandbox Editor
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetCode}
              className="text-xs text-[#9eacd0] hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-[#172c5a] transition cursor-pointer"
              title="Reset code"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
            <button
              onClick={handleRunCode}
              disabled={isRunning || isEvaluating}
              className="btn-gradient flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white cursor-pointer"
            >
              {isRunning ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Running in Sandbox...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Run &amp; Evaluate Tests</span>
                </>
              )}
            </button>
            {result && onSubmitSolution && (
              <button
                type="button"
                onClick={() => onSubmitSolution(code, result)}
                disabled={isRunning || isEvaluating}
                className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer shadow-md transition"
                title="Submit solution and advance"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Submit Solution →</span>
              </button>
            )}
          </div>
        </div>

        {/* Textarea code editor with mono font */}
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          spellCheck={false}
          rows={14}
          className="w-full bg-[#070d23] text-[#e2e8f0] font-mono text-xs md:text-sm p-4 leading-relaxed outline-none border-0 resize-y"
          placeholder="# Implement your algorithmic solution here..."
        />
      </div>
    </div>
  );
};
