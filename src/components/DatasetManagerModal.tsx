import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle2, AlertTriangle, FileText, Download, Database, Layers } from 'lucide-react';
import { Question } from '../types';

interface DatasetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetImported: () => void;
}

export const DatasetManagerModal: React.FC<DatasetManagerModalProps> = ({
  isOpen,
  onClose,
  onDatasetImported,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json');
  const [rawText, setRawText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterRole, setFilterRole] = useState<string>('All');
  const [filterRound, setFilterRound] = useState<string>('All');
  const [datasetStats, setDatasetStats] = useState<any>(null);

  const [adminKey, setAdminKey] = useState<string>(() => sessionStorage.getItem('admin_api_key') || '');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminKeyInput, setAdminKeyInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const fetchQuestions = async (keyToUse = adminKey) => {
    setLoading(true);
    try {
      const [resQ, resS] = await Promise.all([
        fetch('/api/questions'),
        fetch('/api/datasets/stats', {
          headers: keyToUse ? { 'x-admin-key': keyToUse } : {},
        }),
      ]);
      const dataQ = await resQ.json();
      const dataS = await resS.json();
      setQuestions(dataQ.questions || []);

      if (resS.ok && dataS?.stats) {
        setDatasetStats(dataS);
        setIsAdminAuthenticated(true);
        sessionStorage.setItem('admin_api_key', keyToUse);
      } else if (resS.status === 403) {
        setIsAdminAuthenticated(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (adminKey) {
        fetchQuestions(adminKey);
      } else {
        setIsAdminAuthenticated(false);
        setLoading(false);
      }
      setStatusMessage(null);
    }
  }, [isOpen]);

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKeyInput.trim()) {
      setAuthError('Please enter administrator key.');
      return;
    }
    setAdminKey(adminKeyInput.trim());
    setAuthError('');
    fetchQuestions(adminKeyInput.trim());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isCsv = file.name.endsWith('.csv');
    setImportFormat(isCsv ? 'csv' : 'json');

    const reader = new FileReader();
    reader.onload = event => {
      setRawText((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (!rawText.trim()) {
      setStatusMessage({ type: 'error', text: 'Please upload a file or paste dataset content.' });
      return;
    }

    try {
      const res = await fetch('/api/questions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          format: importFormat,
          rawContent: rawText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import dataset');
      }

      setStatusMessage({ type: 'success', text: data.message });
      setRawText('');
      fetchQuestions(adminKey);
      onDatasetImported();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const downloadSampleTemplate = (type: 'json' | 'csv') => {
    let content = '';
    let filename = '';

    if (type === 'json') {
      filename = 'interview_dataset_sample.json';
      content = JSON.stringify(
        [
          {
            role: 'Data Scientist',
            round: 3,
            topic: 'Machine Learning',
            difficulty: 'Medium',
            experienceLevel: '2–5 years',
            question: 'How do you handle class imbalance when training an XGBoost classifier for high-stakes fraud detection?',
            evaluationRubric: 'Expect discussion of scale_pos_weight, focal loss, SMOTE, precision-recall curve.',
          },
          {
            role: 'ML Engineer',
            round: 2,
            topic: 'Algorithms',
            difficulty: 'Hard',
            experienceLevel: '0–2 years',
            question: 'Write a python function to compute Top-K categorical accuracy given logits and targets.',
            codingStarterCode: 'def top_k_accuracy(logits, targets, k=5):\n    pass\n',
            codingLanguage: 'python',
          },
        ],
        null,
        2
      );
    } else {
      filename = 'interview_dataset_sample.csv';
      content = `question,round,role,topic,difficulty\n"Explain the difference between bagging and boosting ensembles.",3,Data Scientist,Ensemble Methods,Medium\n"How would you deploy an ONNX runtime model to an AWS Lambda function with cold start mitigation?",3,ML Engineer,MLOps & Deployment,Hard\n`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const filtered = questions.filter(q => {
    if (filterRole !== 'All' && q.role !== filterRole && q.role !== 'Common') return false;
    if (filterRound !== 'All' && q.round.toString() !== filterRound) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-[24px] bg-[#0c1634] border border-[#394b86] shadow-2xl flex flex-col overflow-hidden text-[#f7f8ff]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#24335c] bg-[#101d40]">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#55b9ff]" />
            <h2 className="text-lg font-bold">Interview Question Dataset Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#b8c5e6] hover:text-white hover:bg-[#172c5a] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {!isAdminAuthenticated ? (
            <div className="p-8 rounded-2xl bg-[#101d40] border border-[#34436d] flex flex-col items-center justify-center text-center max-w-lg mx-auto my-6 gap-4">
              <div className="w-12 h-12 rounded-full bg-[#172c5a] border border-[#55b9ff] flex items-center justify-center text-[#55b9ff]">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Administrator Access Required</h3>
                <p className="text-xs text-[#9eacd0] mt-1 leading-relaxed">
                  Question datasets, raw solutions, and import utilities are restricted to administrators. Candidates do not have access to these resources.
                </p>
              </div>

              {authError && (
                <div className="w-full p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAdminAuthSubmit} className="w-full flex flex-col gap-3">
                <input
                  type="password"
                  placeholder="Enter Administrator Key"
                  value={adminKeyInput}
                  onChange={e => setAdminKeyInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080f27] border border-[#34436d] text-white text-sm focus:border-[#55b9ff] outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl btn-gradient text-white text-xs font-bold cursor-pointer transition shadow-md"
                >
                  Authenticate Administrator
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Status Message */}
              {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs md:text-sm font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500 text-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Active Integrated Datasets Overview */}
          {datasetStats?.filesUsed && (
            <div className="rounded-2xl bg-[#101d40] border border-[#2a3c70] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                  <FileText className="w-4 h-4 text-[#55b9ff]" /> Active Integrated Datasets ({datasetStats.stats?.totalImported?.toLocaleString()} Total Questions)
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Verified & Ready
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {datasetStats.filesUsed.map((item: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#0a132c] border border-[#1e2e5c] flex items-center justify-between">
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <span className="font-semibold text-white truncate">{item.name}</span>
                      <span className="text-[11px] text-[#9eacd0]">{item.round} • <span className="text-[#a66bff]">{item.role}</span></span>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-[#142951] text-[#55b9ff] font-bold text-xs shrink-0">
                      {item.count?.toLocaleString()} Qs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Section */}
          <div className="rounded-2xl bg-[#142951]/60 border border-[#2a3c70] p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                <Upload className="w-4 h-4 text-[#a66bff]" /> Import Custom Question Dataset (CSV / JSON)
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#9eacd0]">Download Sample:</span>
                <button
                  onClick={() => downloadSampleTemplate('json')}
                  className="text-[#55b9ff] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" /> JSON
                </button>
                <span className="text-[#34436d]">|</span>
                <button
                  onClick={() => downloadSampleTemplate('csv')}
                  className="text-[#55b9ff] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs text-[#9eacd0] mb-1">Upload CSV or JSON file:</label>
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-[#cbd5f3] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#397fff] file:text-white hover:file:opacity-90 cursor-pointer bg-[#0a122c] p-2 rounded-xl border border-[#233566]"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="text-xs text-[#9eacd0]">Format:</label>
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    checked={importFormat === 'json'}
                    onChange={() => setImportFormat('json')}
                  />
                  <span>JSON</span>
                </label>
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    checked={importFormat === 'csv'}
                    onChange={() => setImportFormat('csv')}
                  />
                  <span>CSV</span>
                </label>
              </div>
            </div>

            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Or paste JSON array or CSV text with columns (question, round, role, topic, difficulty)..."
              rows={4}
              className="w-full text-xs font-mono bg-[#080f27] border border-[#233566] rounded-xl p-3 text-[#cbd5f3] outline-none focus:border-[#55b9ff]"
            />

            <div className="flex justify-end">
              <button
                onClick={handleImportSubmit}
                className="btn-gradient px-5 py-2 rounded-full text-xs font-bold text-white cursor-pointer"
              >
                Validate &amp; Import Dataset
              </button>
            </div>
          </div>

          {/* Filter and List Section */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                <Layers className="w-4 h-4 text-[#55b9ff]" /> Current Question Bank ({filtered.length} of {questions.length})
              </h3>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-[#9eacd0]">Role:</span>
                  <select
                    value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}
                    className="bg-[#101d40] border border-[#34436d] rounded-lg px-2 py-1 text-white text-xs outline-none"
                  >
                    <option value="All">All Roles</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="ML Engineer">ML Engineer</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[#9eacd0]">Round:</span>
                  <select
                    value={filterRound}
                    onChange={e => setFilterRound(e.target.value)}
                    className="bg-[#101d40] border border-[#34436d] rounded-lg px-2 py-1 text-white text-xs outline-none"
                  >
                    <option value="All">All Rounds</option>
                    <option value="1">Round 1: Aptitude</option>
                    <option value="2">Round 2: Coding</option>
                    <option value="3">Round 3: Technical</option>
                    <option value="4">Round 4: HR</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-xs text-[#9eacd0]">Loading question dataset...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#9eacd0]">No questions match the selected filter.</div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {filtered.map(q => (
                  <div key={q.id} className="p-3 rounded-xl bg-[#101d40]/70 border border-[#24335c] text-xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#398fe0]/20 text-[#55b9ff]">
                          Round {q.round}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#9560ed]/20 text-[#a66bff]">
                          {q.role}
                        </span>
                        <span className="text-[#cbd5f3] font-medium">{q.topic}</span>
                      </div>
                      <span className="text-[10px] text-[#9eacd0] uppercase px-1.5 py-0.5 rounded bg-[#0a122c]">
                        {q.source}
                      </span>
                    </div>
                    <p className="text-[#f7f8ff] leading-relaxed line-clamp-2">{q.question}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
};
