import React, { useState, useEffect } from 'react';
import { X, History, Calendar, Award, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';
import { FinalReport } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReport: (report: FinalReport) => void;
  userId?: string;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectReport,
  userId,
}) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`/api/sessions/history${userId ? `?userId=${userId}` : ''}`)
        .then(res => res.json())
        .then(data => {
          setSessions(data.history || []);
        })
        .catch(err => console.error('Error fetching history:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, userId]);

  const handleOpenSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (data.session && data.session.finalReport) {
        onSelectReport(data.session.finalReport);
        onClose();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] rounded-[24px] bg-[#0c1634] border border-[#394b86] shadow-2xl flex flex-col overflow-hidden text-[#f7f8ff]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#24335c] bg-[#101d40]">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#a66bff]" />
            <h2 className="text-base font-bold text-white">Your Past Interview Sessions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#b8c5e6] hover:text-white hover:bg-[#172c5a] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-3">
          {loading ? (
            <div className="text-center py-10 text-xs text-[#9eacd0]">Loading past sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-2 text-[#9eacd0]">
              <FileText className="w-10 h-10 text-[#34436d]" />
              <p className="text-sm">No completed interview sessions yet.</p>
              <p className="text-xs text-[#5a6a96]">
                Complete all 4 interview rounds to generate your personalized performance assessment.
              </p>
            </div>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-[#101d40]/80 border border-[#24335c] hover:border-[#55b9ff] transition flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{s.role}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#398fe0]/20 text-[#55b9ff]">
                      {s.experienceLevel}
                    </span>
                    {s.status === 'completed' && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#9eacd0]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(s.startedAt).toLocaleDateString()}
                    </span>
                    {s.overallScore !== null && (
                      <span className="font-semibold text-[#a66bff]">
                        Score: {s.overallScore}/100
                      </span>
                    )}
                  </div>
                </div>

                {s.hasReport ? (
                  <button
                    onClick={() => handleOpenSession(s.id)}
                    className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white cursor-pointer"
                  >
                    <span>View Report</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs text-[#9eacd0] italic">Incomplete</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
