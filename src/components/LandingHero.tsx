import React, { useState } from 'react';
import { Brain, Code2, Cpu, UserCheck, Sparkles } from 'lucide-react';
import { JobRole, ExperienceLevel } from '../types';

interface LandingHeroProps {
  onStartInterview: (role: JobRole, experience: ExperienceLevel) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onStartInterview }) => {
  const [selectedRole, setSelectedRole] = useState<JobRole | ''>('');
  const [selectedExperience, setSelectedExperience] = useState<ExperienceLevel>('0–2 years');

  const experienceOptions: ExperienceLevel[] = ['Fresher', '0–2 years', '2–5 years', '5+ years'];

  const handleRoleSelect = (role: JobRole) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      onStartInterview(selectedRole, selectedExperience);
    }
  };

  return (
    <div className="w-full max-w-[1120px] mx-auto px-4 md:px-0">
      {/* Hero section from uploaded frontend */}
      <section className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] items-center gap-[35px] pt-12 md:pt-[78px] pb-8 md:pb-[48px]">
        <div>
          <h1 className="text-[clamp(2.7rem,6vw,5.3rem)] leading-[1.04] tracking-[-3px] font-black">
            Interview with <span className="text-[#a77bff]">AI</span>
          </h1>
          <p className="mt-5 text-[clamp(1.25rem,2.6vw,2rem)] font-[650] text-[#f7f8ff]">
            Your Dream Job Starts With <span className="text-[#b18aff]">Practice.</span>
          </p>
          <p className="mt-4 text-[#b8c5e6] text-lg leading-[1.7] max-w-[620px]">
            Prepare. Practise. Improve. Get interview-ready with your personal AI interview assistant.
            Build confidence one practice interview at a time.
          </p>
        </div>

        {/* Robot Illustration Card from uploaded frontend */}
        <div
          className="robot-card"
          aria-label="Friendly AI robot illustration"
        >
          <div className="speech-bubble absolute top-[22px] left-[22px] z-10">
            Ace your interview!
          </div>
          <div className="z-[1] text-[7rem] select-none drop-shadow-[0_12px_20px_#00000088] animate-bounce" style={{ animationDuration: '3s' }}>
            🤖
          </div>
        </div>
      </section>

      {/* Career Path Selection from uploaded frontend */}
      <section aria-labelledby="career-heading" className="mt-4 pb-12">
        <h2 className="text-center my-6 md:my-[26px] text-2xl md:text-[1.8rem] font-bold text-[#f7f8ff]" id="career-heading">
          Choose Your Career Path
        </h2>

        {/* The two strictly preserved job roles: Data Scientist & ML Engineer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Role Card 1: Data Scientist */}
          <button
            type="button"
            onClick={() => handleRoleSelect('Data Scientist')}
            aria-pressed={selectedRole === 'Data Scientist'}
            className={`text-left text-[#f7f8ff] cursor-pointer p-[26px] flex items-center gap-[22px] rounded-[22px] min-h-[165px] transition duration-200 role-card-ds hover:-translate-y-1 hover:shadow-[0_15px_35px_#00000055] ${
              selectedRole === 'Data Scientist' ? 'outline-3 outline-white outline-offset-4 ring-2 ring-[#398fe0]' : ''
            }`}
          >
            <div className="text-[3.2rem] min-w-[70px] text-center select-none">📊</div>
            <div className="flex-1">
              <h3 className="text-[1.45rem] font-bold mb-[9px] text-[#f7f8ff]">Data Scientist</h3>
              <p className="text-[#c7d2ef] leading-[1.5] text-sm md:text-base">
                Practise data science interviews and strengthen your analytical skills.
              </p>
            </div>
            <span
              className="ml-auto text-[1.6rem] bg-[#7775ff] rounded-full w-[44px] h-[44px] grid place-items-center shrink-0 text-white select-none"
              aria-hidden="true"
            >
              ➜
            </span>
          </button>

          {/* Role Card 2: ML Engineer */}
          <button
            type="button"
            onClick={() => handleRoleSelect('ML Engineer')}
            aria-pressed={selectedRole === 'ML Engineer'}
            className={`text-left text-[#f7f8ff] cursor-pointer p-[26px] flex items-center gap-[22px] rounded-[22px] min-h-[165px] transition duration-200 role-card-mle hover:-translate-y-1 hover:shadow-[0_15px_35px_#00000055] ${
              selectedRole === 'ML Engineer' ? 'outline-3 outline-white outline-offset-4 ring-2 ring-[#9560ed]' : ''
            }`}
          >
            <div className="text-[3.2rem] min-w-[70px] text-center select-none">🧠</div>
            <div className="flex-1">
              <h3 className="text-[1.45rem] font-bold mb-[9px] text-[#f7f8ff]">ML Engineer</h3>
              <p className="text-[#c7d2ef] leading-[1.5] text-sm md:text-base">
                Prepare for machine learning interviews and test your ML knowledge.
              </p>
            </div>
            <span
              className="ml-auto text-[1.6rem] bg-[#7775ff] rounded-full w-[44px] h-[44px] grid place-items-center shrink-0 text-white select-none"
              aria-hidden="true"
            >
              ➜
            </span>
          </button>
        </div>

        {/* Experience Level Selector (Requirement 4) */}
        {selectedRole && (
          <div className="mt-8 p-5 rounded-2xl bg-[#101d40]/80 border border-[#34436d] flex flex-col items-center gap-3 animate-fadeIn">
            <span className="text-sm font-semibold uppercase tracking-wider text-[#b8c5e6]">
              Select Experience Level for {selectedRole}
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {experienceOptions.map(exp => (
                <button
                  key={exp}
                  type="button"
                  onClick={() => setSelectedExperience(exp)}
                  className={`px-5 py-2 rounded-full text-xs md:text-sm font-semibold transition cursor-pointer ${
                    selectedExperience === exp
                      ? 'bg-gradient-to-r from-[#397fff] to-[#995cff] text-white shadow-md ring-2 ring-white/60'
                      : 'bg-[#080f27] border border-[#2d3e70] text-[#b8c5e6] hover:text-white hover:border-[#55b9ff]'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4-Round Assessment Pipeline Overview */}
        <div className="mt-8 p-5 md:p-6 rounded-2xl bg-[#101d40]/80 border border-[#2d3e70] flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24335c] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#55b9ff]" />
              <h3 className="text-sm md:text-base font-bold text-white tracking-wide">
                4-Stage Assessment Pipeline
              </h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#172c5a] border border-[#398fe0]/40 text-[#55b9ff] font-medium">
              Starts with Round 1: Aptitude &amp; Reasoning
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Round 1: Aptitude & Reasoning */}
            <div className="p-3.5 rounded-xl bg-[#080f27]/90 border border-[#398fe0]/60 shadow-[0_0_15px_rgba(57,127,255,0.15)] flex flex-col gap-2 group hover:border-[#55b9ff] transition-all">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#397fff] to-[#995cff] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                  1
                </span>
                <Brain className="w-4 h-4 text-[#55b9ff]" />
                <span className="text-xs md:text-sm font-bold text-white group-hover:text-[#55b9ff] transition-colors">
                  Aptitude &amp; Reasoning
                </span>
              </div>
              <p className="text-xs text-[#9eacd0] leading-relaxed">
                Quantitative math, logic puzzles, verbal reasoning &amp; data interpretation.
              </p>
              <div className="mt-auto pt-1 flex items-center gap-1.5 text-[10px] text-[#55b9ff] font-semibold">
                <span>MCQ &amp; Voice mode</span>
              </div>
            </div>

            {/* Round 2: Practical Coding */}
            <div className="p-3.5 rounded-xl bg-[#080f27]/90 border border-[#24335c] hover:border-[#398fe0] transition-all flex flex-col gap-2 group">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#142951] text-[#9eacd0] border border-[#34436d] flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </span>
                <Code2 className="w-4 h-4 text-[#8fa3db]" />
                <span className="text-xs md:text-sm font-bold text-white group-hover:text-[#55b9ff] transition-colors">
                  Practical Coding
                </span>
              </div>
              <p className="text-xs text-[#9eacd0] leading-relaxed">
                Live coding sandbox with automated test case execution &amp; code analysis.
              </p>
              <div className="mt-auto pt-1 flex items-center gap-1.5 text-[10px] text-[#9eacd0] font-semibold">
                <span>Python &amp; unit tests</span>
              </div>
            </div>

            {/* Round 3: Technical Deep-Dive */}
            <div className="p-3.5 rounded-xl bg-[#080f27]/90 border border-[#24335c] hover:border-[#398fe0] transition-all flex flex-col gap-2 group">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#142951] text-[#9eacd0] border border-[#34436d] flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </span>
                <Cpu className="w-4 h-4 text-[#8fa3db]" />
                <span className="text-xs md:text-sm font-bold text-white group-hover:text-[#55b9ff] transition-colors">
                  Technical Deep-Dive
                </span>
              </div>
              <p className="text-xs text-[#9eacd0] leading-relaxed">
                Core domain concepts, ML architecture, statistical theory &amp; trade-offs.
              </p>
              <div className="mt-auto pt-1 flex items-center gap-1.5 text-[10px] text-[#9eacd0] font-semibold">
                <span>Domain &amp; architecture</span>
              </div>
            </div>

            {/* Round 4: HR & Behavioral */}
            <div className="p-3.5 rounded-xl bg-[#080f27]/90 border border-[#24335c] hover:border-[#398fe0] transition-all flex flex-col gap-2 group">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#142951] text-[#9eacd0] border border-[#34436d] flex items-center justify-center text-xs font-bold shrink-0">
                  4
                </span>
                <UserCheck className="w-4 h-4 text-[#8fa3db]" />
                <span className="text-xs md:text-sm font-bold text-white group-hover:text-[#55b9ff] transition-colors">
                  HR &amp; Behavioral
                </span>
              </div>
              <p className="text-xs text-[#9eacd0] leading-relaxed">
                Situational scenarios, leadership, speech pace &amp; communication clarity.
              </p>
              <div className="mt-auto pt-1 flex items-center gap-1.5 text-[10px] text-[#9eacd0] font-semibold">
                <span>Voice delivery &amp; fit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Wrap from uploaded frontend */}
        <div className="text-center pt-[30px] pb-[18px]">
          <button
            id="continueBtn"
            disabled={!selectedRole}
            onClick={handleContinue}
            className="btn-gradient border-0 rounded-[30px] py-[14px] px-[30px] text-white font-[750] text-base cursor-pointer shadow-[0_8px_25px_#684bce55] transition"
          >
            Continue →
          </button>
          <p id="message" className="text-[#cbd5f3] mt-[14px] min-h-[24px] text-sm" aria-live="polite">
            {selectedRole
              ? `${selectedRole} (${selectedExperience}) selected. Click Continue to enter the 4-round interview.`
              : 'Select a career path to get started.'}
          </p>
        </div>
      </section>
    </div>
  );
};
