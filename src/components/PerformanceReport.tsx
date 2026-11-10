import React, { useRef } from 'react';
import { jsPDF } from 'jspdf';
import {
  Download,
  Award,
  CheckCircle2,
  AlertCircle,
  Code2,
  Brain,
  MessageSquare,
  Sparkles,
  BookOpen,
  Calendar,
  Share2,
  ChevronRight,
  User,
  ArrowLeft
} from 'lucide-react';
import { FinalReport } from '../types';

interface PerformanceReportProps {
  report: FinalReport;
  onGoHome: () => void;
}

export const PerformanceReport: React.FC<PerformanceReportProps> = ({ report, onGoHome }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  // Generate & download PDF using jsPDF
  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 40;

      // Header Banner
      doc.setFillColor(8, 15, 39); // #080f27
      doc.rect(0, 0, pageWidth, 90, 'F');

      doc.setTextColor(247, 248, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Interview with AI - Performance Report', 40, 45);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(184, 197, 230);
      doc.text(`Candidate: ${report.candidateName}  |  Role: ${report.role}  |  Experience: ${report.experienceLevel}`, 40, 70);

      y = 115;

      // Overall Score Card
      doc.setFillColor(16, 29, 64);
      doc.roundedRect(40, y, pageWidth - 80, 70, 8, 8, 'F');

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(177, 138, 255);
      doc.text('OVERALL INTERVIEW SCORE', 60, y + 25);

      doc.setFontSize(30);
      doc.setTextColor(85, 185, 255);
      doc.text(`${report.overallScore}/100`, 60, y + 58);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 210, 235);
      const r1Text = report.roundStatuses?.[1] === 'unattempted' ? 'Round 1: Incomplete' : `Round 1 Aptitude: ${report.roundScores.round1Aptitude}%`;
      const r2Text = report.roundStatuses?.[2] === 'unattempted' ? 'Round 2: Incomplete' : `Round 2 Coding: ${report.roundScores.round2Coding}%`;
      const r3Text = report.roundStatuses?.[3] === 'unattempted' ? 'Round 3: Incomplete' : `Round 3 Technical: ${report.roundScores.round3Technical}%`;
      const r4Text = report.roundStatuses?.[4] === 'unattempted' ? 'Round 4: Incomplete' : `Round 4 HR: ${report.roundScores.round4HR}%`;
      doc.text(r1Text, 250, y + 28);
      doc.text(r2Text, 250, y + 46);
      doc.text(r3Text, 390, y + 28);
      doc.text(r4Text, 390, y + 46);

      y += 95;

      if (report.dimensionScores) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(90, 105, 135);
        doc.text(
          `Verified Competency Dimensions: Correctness: ${report.dimensionScores.correctnessScore}% | Tech: ${report.dimensionScores.technicalKnowledgeScore ?? 'N/A'}% | Problem Solving: ${report.dimensionScores.problemSolvingScore ?? 'N/A'}% | Communication (${report.dimensionScores.communicationScore?.mode || 'N/A'}): ${report.dimensionScores.communicationScore?.overall ?? 'N/A'}%`,
          40,
          y - 12
        );
      }

      // Executive Summary
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 29, 64);
      doc.text('Executive Performance Summary', 40, y);
      y += 16;

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 50, 75);
      const splitSummary = doc.splitTextToSize(report.overallPerformanceSummary, pageWidth - 80);
      doc.text(splitSummary, 40, y);
      y += splitSummary.length * 13 + 15;

      // Strengths & Weaknesses
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 29, 64);
      doc.text('Key Strengths', 40, y);
      doc.text('Areas for Improvement', pageWidth / 2 + 10, y);
      y += 16;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 50, 75);

      let strengthY = y;
      report.strengths.slice(0, 4).forEach((st) => {
        const lines = doc.splitTextToSize(`• ${st}`, pageWidth / 2 - 50);
        doc.text(lines, 40, strengthY);
        strengthY += lines.length * 11 + 4;
      });

      let gapY = y;
      report.weaknessesAndGaps.slice(0, 4).forEach((wg) => {
        const lines = doc.splitTextToSize(`• ${wg}`, pageWidth / 2 - 50);
        doc.text(lines, pageWidth / 2 + 10, gapY);
        gapY += lines.length * 11 + 4;
      });

      y = Math.max(strengthY, gapY) + 15;

      // Coding and Technical Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 29, 64);
      doc.text('Coding & Technical Assessment', 40, y);
      y += 16;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const codingSummary = `Coding: ${report.codingAssessment.testsPassedRatio} tests passed. Code Quality: ${report.codingAssessment.codeQuality}. Complexity: ${report.codingAssessment.efficiencyRating}. ${report.codingAssessment.review}`;
      const splitCoding = doc.splitTextToSize(codingSummary, pageWidth - 80);
      doc.text(splitCoding, 40, y);
      y += splitCoding.length * 11 + 8;

      const techSummary = `Technical Theory: Depth ${report.technicalAssessment.depthScore}/100, Breadth ${report.technicalAssessment.breadthScore}/100. ${report.technicalAssessment.summary}`;
      const splitTech = doc.splitTextToSize(techSummary, pageWidth - 80);
      doc.text(splitTech, 40, y);
      y += splitTech.length * 11 + 15;

      // Practice Plan
      if (y < 700) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 29, 64);
        doc.text('Personalized Practice Plan', 40, y);
        y += 16;

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        report.personalizedPracticePlan.forEach((plan) => {
          const planText = `${plan.phase} (${plan.timeline}): Focus on ${plan.focusAreas.join(', ')}. Resources: ${plan.resources}`;
          const splitPlan = doc.splitTextToSize(planText, pageWidth - 80);
          doc.text(splitPlan, 40, y);
          y += splitPlan.length * 11 + 3;
        });
      }

      // Disclaimer footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 130, 150);
      doc.text(
        report.disclaimer || 'Assessment generated by AI mock interview system for practice purposes.',
        40,
        doc.internal.pageSize.getHeight() - 25
      );

      doc.save(`Interview_Report_${report.candidateName.replace(/\s+/g, '_')}_${report.role.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Could not export PDF. You can also print the page directly.');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 flex flex-col gap-8 text-[#f7f8ff]">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#34436d] text-sm text-[#b8c5e6] hover:text-white hover:border-[#55b9ff] transition cursor-pointer bg-[#101d40]"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Home
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#34436d] text-sm text-[#b8c5e6] hover:text-white transition cursor-pointer bg-[#101d40]"
          >
            <Share2 className="w-4 h-4" /> Print / Share
          </button>
          <button
            onClick={handleDownloadPdf}
            className="btn-gradient flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-bold shadow-lg cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download PDF Report
          </button>
        </div>
      </div>

      <div ref={reportRef} className="flex flex-col gap-8">
        {/* Header Hero Card */}
        <div className="rounded-[28px] bg-gradient-to-r from-[#142951] via-[#1b2b62] to-[#30205f] border-2 border-[#398fe0] p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#b18aff] uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Official Candidate Assessment
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {report.candidateName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#c7d2ef] mt-1">
                <span className="px-3 py-1 rounded-full bg-[#101d40] border border-[#34436d] font-semibold text-[#55b9ff]">
                  {report.role}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#101d40] border border-[#34436d] text-[#b8c5e6]">
                  {report.experienceLevel}
                </span>
                <span className="flex items-center gap-1 text-[#9eacd0]">
                  <Calendar className="w-3.5 h-3.5" /> {report.date}
                </span>
              </div>
            </div>

            {/* Overall Score Badge */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#080f27]/80 border border-[#8c79ff]/60 shadow-inner min-w-[170px]">
              <span className="text-xs uppercase font-bold text-[#b18aff] tracking-wider mb-1">
                Overall Score
              </span>
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#55b9ff] to-[#a66bff]">
                {report.overallScore}
              </div>
              <span className="text-xs text-[#9eacd0] mt-1">out of 100</span>
            </div>
          </div>
        </div>

        {/* 4 Round Scores Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#101d40] border border-[#34436d] p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9eacd0] font-semibold">Round 1</span>
              {report.roundStatuses?.[1] === 'unattempted' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 font-semibold border border-amber-500/40">Incomplete</span>
              )}
            </div>
            <span className="text-sm font-bold text-white">Aptitude &amp; Logic</span>
            <div className="text-2xl font-black text-[#55b9ff] mt-2">
              {report.roundStatuses?.[1] === 'unattempted' ? '—' : `${report.roundScores.round1Aptitude}%`}
            </div>
            <div className="w-full bg-[#080f27] h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-[#55b9ff] h-full"
                style={{ width: report.roundStatuses?.[1] === 'unattempted' ? '0%' : `${report.roundScores.round1Aptitude}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-[#101d40] border border-[#34436d] p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9eacd0] font-semibold">Round 2</span>
              {report.roundStatuses?.[2] === 'unattempted' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 font-semibold border border-amber-500/40">Incomplete</span>
              )}
            </div>
            <span className="text-sm font-bold text-white">Coding Interview</span>
            <div className="text-2xl font-black text-[#a66bff] mt-2">
              {report.roundStatuses?.[2] === 'unattempted' ? '—' : `${report.roundScores.round2Coding}%`}
            </div>
            <div className="w-full bg-[#080f27] h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-[#a66bff] h-full"
                style={{ width: report.roundStatuses?.[2] === 'unattempted' ? '0%' : `${report.roundScores.round2Coding}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-[#101d40] border border-[#34436d] p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9eacd0] font-semibold">Round 3</span>
              {report.roundStatuses?.[3] === 'unattempted' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 font-semibold border border-amber-500/40">Incomplete</span>
              )}
            </div>
            <span className="text-sm font-bold text-white">Technical Deep-Dive</span>
            <div className="text-2xl font-black text-emerald-400 mt-2">
              {report.roundStatuses?.[3] === 'unattempted' ? '—' : `${report.roundScores.round3Technical}%`}
            </div>
            <div className="w-full bg-[#080f27] h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-emerald-400 h-full"
                style={{ width: report.roundStatuses?.[3] === 'unattempted' ? '0%' : `${report.roundScores.round3Technical}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-[#101d40] border border-[#34436d] p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9eacd0] font-semibold">Round 4</span>
              {report.roundStatuses?.[4] === 'unattempted' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 font-semibold border border-amber-500/40">Incomplete</span>
              )}
            </div>
            <span className="text-sm font-bold text-white">HR &amp; Behavioral</span>
            <div className="text-2xl font-black text-amber-400 mt-2">
              {report.roundStatuses?.[4] === 'unattempted' ? '—' : `${report.roundScores.round4HR}%`}
            </div>
            <div className="w-full bg-[#080f27] h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-amber-400 h-full"
                style={{ width: report.roundStatuses?.[4] === 'unattempted' ? '0%' : `${report.roundScores.round4HR}%` }}
              />
            </div>
          </div>
        </div>

        {/* Section 6C: Verified Dimension Scores Breakdown */}
        <div className="rounded-2xl bg-[#0d1838] border border-[#398fe0]/50 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#55b9ff]" />
              <h3 className="text-base font-bold text-white">Verified Competency Dimension Scores</h3>
            </div>
            <span className="text-xs text-[#9eacd0] bg-[#101d40] px-3 py-1 rounded-full border border-[#34436d]">
              Strictly Evaluated Against Answers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. Correctness */}
            <div className="p-3.5 rounded-xl bg-[#101d40] border border-[#24335c] flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-[#9eacd0] uppercase tracking-wider">
                1. Answer Correctness
              </span>
              <div className="text-2xl font-black text-emerald-400">
                {report.dimensionScores?.correctnessScore !== undefined
                  ? `${report.dimensionScores.correctnessScore}%`
                  : `${report.overallScore}%`}
              </div>
              <span className="text-[11px] text-[#cbd5f3] leading-snug">
                Factual &amp; mathematical accuracy across all questions.
              </span>
            </div>

            {/* 2. Technical Knowledge */}
            <div className="p-3.5 rounded-xl bg-[#101d40] border border-[#24335c] flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-[#9eacd0] uppercase tracking-wider">
                2. Technical Depth
              </span>
              <div className="text-2xl font-black text-[#55b9ff]">
                {report.dimensionScores?.technicalKnowledgeScore !== undefined
                  ? `${report.dimensionScores.technicalKnowledgeScore}%`
                  : report.roundStatuses?.[3] === 'completed'
                  ? `${report.roundScores.round3Technical}%`
                  : 'N/A'}
              </div>
              <span className="text-[11px] text-[#cbd5f3] leading-snug">
                {report.roundStatuses?.[3] === 'unattempted'
                  ? 'Round 3 unattempted.'
                  : 'Domain concepts, architecture & trade-offs.'}
              </span>
            </div>

            {/* 3. Problem Solving */}
            <div className="p-3.5 rounded-xl bg-[#101d40] border border-[#24335c] flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-[#9eacd0] uppercase tracking-wider">
                3. Problem Solving
              </span>
              <div className="text-2xl font-black text-[#a66bff]">
                {report.dimensionScores?.problemSolvingScore !== undefined
                  ? `${report.dimensionScores.problemSolvingScore}%`
                  : report.roundStatuses?.[1] === 'completed'
                  ? `${report.roundScores.round1Aptitude}%`
                  : 'N/A'}
              </div>
              <span className="text-[11px] text-[#cbd5f3] leading-snug">
                Analytical logic, numerical deduction &amp; reasoning.
              </span>
            </div>

            {/* 4. Communication (Spoken vs Written) */}
            <div className="p-3.5 rounded-xl bg-[#101d40] border border-[#24335c] flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#9eacd0] uppercase tracking-wider">
                  4. Communication
                </span>
                {report.dimensionScores?.communicationScore?.mode && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    report.dimensionScores.communicationScore.mode === 'spoken'
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30'
                      : 'bg-blue-950/70 text-blue-300 border border-blue-500/30'
                  }`}>
                    {report.dimensionScores.communicationScore.mode}
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-amber-400">
                {report.dimensionScores?.communicationScore?.overall !== undefined
                  ? `${report.dimensionScores.communicationScore.overall}%`
                  : '80%'}
              </div>
              <span className="text-[11px] text-[#cbd5f3] leading-snug truncate" title={report.dimensionScores?.communicationScore?.detailsNote}>
                {report.dimensionScores?.communicationScore?.detailsNote || 'Communication clarity and structured responses.'}
              </span>
            </div>

            {/* 5. Coding Performance */}
            <div className="p-3.5 rounded-xl bg-[#101d40] border border-[#24335c] flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-[#9eacd0] uppercase tracking-wider">
                5. Coding Execution
              </span>
              <div className="text-2xl font-black text-[#55b9ff]">
                {report.dimensionScores?.codingPerformance?.score !== undefined
                  ? `${report.dimensionScores.codingPerformance.score}%`
                  : report.roundStatuses?.[2] === 'completed'
                  ? `${report.roundScores.round2Coding}%`
                  : 'N/A'}
              </div>
              <span className="text-[11px] text-[#cbd5f3] leading-snug">
                {report.roundStatuses?.[2] === 'unattempted'
                  ? 'Round 2 unattempted.'
                  : `${report.codingAssessment.testsPassedRatio} passed (${report.codingAssessment.efficiencyRating}).`}
              </span>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="rounded-2xl bg-[#101d40] border border-[#34436d] p-6 flex flex-col gap-3">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <Brain className="w-5 h-5 text-[#55b9ff]" /> Executive Interview Summary
          </h2>
          <p className="text-sm md:text-base text-[#cbd5f3] leading-relaxed">
            {report.overallPerformanceSummary}
          </p>
        </div>

        {/* Strengths & Weaknesses Split Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-[#101d40] border border-emerald-500/40 p-6 flex flex-col gap-3">
            <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Key Strengths Demonstrated
            </h3>
            <ul className="flex flex-col gap-2.5">
              {report.strengths.map((st, i) => (
                <li key={i} className="text-sm text-[#cbd5f3] flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span>{st}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-[#101d40] border border-amber-500/40 p-6 flex flex-col gap-3">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" /> Weaknesses &amp; Knowledge Gaps
            </h3>
            <ul className="flex flex-col gap-2.5">
              {report.weaknessesAndGaps.map((wg, i) => (
                <li key={i} className="text-sm text-[#cbd5f3] flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">•</span>
                  <span>{wg}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Coding & Technical Deep Dive Assessment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-[#101d40] border border-[#34436d] p-6 flex flex-col gap-3">
            <h3 className="text-base font-bold text-[#55b9ff] flex items-center gap-2">
              <Code2 className="w-5 h-5" /> Coding Assessment Results
            </h3>
            <div className="flex flex-col gap-2 text-xs md:text-sm text-[#cbd5f3]">
              <div className="flex justify-between py-1 border-b border-[#24335c]">
                <span className="text-[#9eacd0]">Test Cases Ratio:</span>
                <span className="font-semibold text-white">{report.codingAssessment.testsPassedRatio}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#24335c]">
                <span className="text-[#9eacd0]">Code Quality &amp; Cleanliness:</span>
                <span className="font-semibold text-white">{report.codingAssessment.codeQuality}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#24335c]">
                <span className="text-[#9eacd0]">Algorithmic Complexity:</span>
                <span className="font-semibold text-amber-300">{report.codingAssessment.efficiencyRating}</span>
              </div>
              <p className="mt-2 text-xs text-[#cbd5f3] leading-relaxed italic">
                &ldquo;{report.codingAssessment.review}&rdquo;
              </p>
            </div>
          </div>

          {/* Speech & Delivery Observations */}
          <div className="rounded-2xl bg-[#101d40] border border-[#34436d] p-6 flex flex-col gap-3">
            <h3 className="text-base font-bold text-[#a66bff] flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Speech &amp; Delivery Observations
            </h3>
            <div className="flex flex-col gap-2 text-xs md:text-sm text-[#cbd5f3]">
              <div className="flex justify-between py-1 border-b border-[#24335c]">
                <span className="text-[#9eacd0]">Average Speaking Pace:</span>
                <span className="font-semibold text-white">{report.speechAndDeliveryObservations.averagePaceWpm} WPM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#24335c]">
                <span className="text-[#9eacd0]">Filler Words Detected:</span>
                <span className="font-semibold text-white">{report.speechAndDeliveryObservations.totalFillerWords} occurrences</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#24335c]">
                <span className="text-[#9eacd0]">Camera Framing Observation:</span>
                <span className="font-semibold text-white">{report.speechAndDeliveryObservations.cameraFramingSummary}</span>
              </div>
              <p className="mt-2 text-xs text-[#cbd5f3] leading-relaxed">
                {report.speechAndDeliveryObservations.deliveryFluencyNote}
              </p>
            </div>
          </div>
        </div>

        {/* Question-Wise Performance Breakdown */}
        <div className="rounded-2xl bg-[#101d40] border border-[#34436d] p-6 flex flex-col gap-4">
          <h3 className="text-base font-bold text-white flex items-center justify-between">
            <span>Question-by-Question Deep Breakdown</span>
            <span className="text-xs font-normal text-[#9eacd0]">
              {report.questionWiseScores.length} Questions Evaluated
            </span>
          </h3>
          <div className="flex flex-col gap-3">
            {report.questionWiseScores.map((q, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#0a122c] border border-[#24335c] flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#398fe0]/20 text-[#55b9ff]">
                      Round {q.round}
                    </span>
                    <span className="text-xs font-semibold text-white">{q.topic}</span>
                    {q.category && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          q.category === 'fully_correct' || q.category === 'correct'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : q.category === 'partially_correct'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : q.category === 'incomplete'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {String(q.category).replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {q.awardedMarks !== undefined && (
                      <span className="text-xs text-[#9eacd0]">
                        Marks: <strong className="text-white">{q.awardedMarks}/{q.maximumMarks || 10}</strong>
                      </span>
                    )}
                    <span className={`text-sm font-bold ${q.score >= 70 ? 'text-emerald-400' : q.score > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {q.score}/100
                    </span>
                  </div>
                </div>

                <div className="text-xs text-[#cbd5f3] font-normal leading-relaxed">&ldquo;{q.question}&rdquo;</div>

                {/* Sub-criteria decomposition if available */}
                {q.components && q.components.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-[#070e24] border border-[#1e2d57] flex flex-col gap-1.5 text-[11px]">
                    <span className="font-semibold text-[#55b9ff]">Multi-Part Sub-Criteria:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                      {q.components.map((comp, cIdx) => (
                        <div key={cIdx} className="p-1.5 rounded bg-[#0b1739] border border-[#1c2c58] flex items-center justify-between gap-1">
                          <span className="text-white truncate">{comp.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                            comp.category === 'fully_correct'
                              ? 'text-emerald-300 bg-emerald-950'
                              : comp.category === 'partially_correct'
                              ? 'text-amber-300 bg-amber-950'
                              : 'text-rose-300 bg-rose-950'
                          }`}>
                            {comp.awardedMarks}/{comp.maximumMarks}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spoken Communication Details */}
                {q.communicationDetails && q.communicationDetails.type === 'spoken' && (
                  <div className="p-2 rounded-lg bg-[#070e24] border border-[#1e2d57] text-[11px] text-[#9eacd0] flex flex-wrap items-center gap-3">
                    <span className="text-[#55b9ff] font-semibold">Spoken Delivery:</span>
                    <span>Pace: <strong className="text-white">{q.communicationDetails.speakingPaceWpm || 'N/A'} WPM</strong> ({q.communicationDetails.paceAssessment || 'Normal'})</span>
                    <span>Duration: <strong className="text-white">{q.communicationDetails.speakingDurationSeconds}s</strong></span>
                    <span>Fillers: <strong className="text-white">{q.communicationDetails.fillerWordsCount || 0}</strong></span>
                    <span>Pauses: <strong className="text-white">{q.communicationDetails.pauseCount || 0}</strong></span>
                  </div>
                )}

                <div className="text-xs text-[#9eacd0] pt-1.5 border-t border-[#1a274c] leading-relaxed">
                  <span className="font-semibold text-[#b8c5e6]">Evaluator Assessment:</span> {q.feedback}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Improvement Suggestions & Study Topics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-[#101d40] border border-[#34436d] p-6 flex flex-col gap-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Actionable Improvement Suggestions
            </h3>
            <ul className="flex flex-col gap-2">
              {report.specificImprovementSuggestions.map((sug, i) => (
                <li key={i} className="text-xs md:text-sm text-[#cbd5f3] flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-[#101d40] border border-[#34436d] p-6 flex flex-col gap-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#55b9ff]" /> Recommended Topics to Study
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.recommendedTopicsToStudy.map((top, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-[#080f27] border border-[#394b86] text-xs text-[#cbd5f3] font-medium"
                >
                  {top}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Personalized Practice Plan */}
        <div className="rounded-2xl bg-[#101d40] border border-[#34436d] p-6 flex flex-col gap-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#a66bff]" /> Personalized Multi-Week Practice Plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.personalizedPracticePlan.map((plan, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#080f27] border border-[#24335c] flex flex-col gap-2">
                <div className="text-xs font-bold text-[#b18aff] uppercase">{plan.timeline}</div>
                <div className="text-sm font-bold text-white">{plan.phase}</div>
                <div className="text-xs text-[#cbd5f3] flex flex-col gap-1 mt-1">
                  <span className="font-semibold text-[#9eacd0]">Focus Areas:</span>
                  <ul className="list-disc list-inside">
                    {plan.focusAreas.map((f, fi) => (
                      <li key={fi}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-[11px] text-[#9eacd0] mt-auto pt-2 border-t border-[#1a274c]">
                  Resources: {plan.resources}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="text-center p-4 rounded-xl bg-[#080f27]/50 border border-[#24335c] text-xs text-[#9eacd0] italic">
          {report.disclaimer}
        </div>
      </div>
    </div>
  );
};
