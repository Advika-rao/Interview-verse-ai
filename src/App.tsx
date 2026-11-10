/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LandingHero } from './components/LandingHero';
import { InterviewSessionView } from './components/InterviewSessionView';
import { PerformanceReport } from './components/PerformanceReport';
import { AuthModal } from './components/AuthModal';
import { HistoryModal } from './components/HistoryModal';
import { DatasetManagerModal } from './components/DatasetManagerModal';
import { JobRole, ExperienceLevel, FinalReport, UserProfile } from './types';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

type AppView = 'landing' | 'interview' | 'report';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [selectedRole, setSelectedRole] = useState<JobRole>('Data Scientist');
  const [selectedExperience, setSelectedExperience] = useState<ExperienceLevel>('0–2 years');
  const [activeReport, setActiveReport] = useState<FinalReport | null>(null);

  // User Profile State
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('candidate_profile');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  // Modals State
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isDatasetsOpen, setIsDatasetsOpen] = useState<boolean>(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, fbUser => {
      if (fbUser) {
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || 'candidate@example.com',
          displayName: fbUser.displayName || 'Candidate',
          createdAt: new Date().toISOString(),
        };
        setUser(profile);
        localStorage.setItem('candidate_profile', JSON.stringify(profile));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setUser(null);
    localStorage.removeItem('candidate_profile');
  };

  const handleStartInterview = (role: JobRole, experience: ExperienceLevel) => {
    setSelectedRole(role);
    setSelectedExperience(experience);
    setView('interview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInterviewComplete = (report: FinalReport) => {
    setActiveReport(report);
    setView('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between text-[#f7f8ff] select-text">
      {/* Header strictly styled from uploaded frontend brand */}
      <Header
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenDatasets={() => setIsDatasetsOpen(true)}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        inInterview={view === 'interview'}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col">
        {view === 'landing' && (
          <LandingHero onStartInterview={handleStartInterview} />
        )}

        {view === 'interview' && (
          <InterviewSessionView
            role={selectedRole}
            experienceLevel={selectedExperience}
            user={user}
            onInterviewComplete={handleInterviewComplete}
            onExitInterview={handleGoHome}
          />
        )}

        {view === 'report' && activeReport && (
          <PerformanceReport
            report={activeReport}
            onGoHome={handleGoHome}
          />
        )}
      </main>

      {/* Footer from uploaded frontend */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[#9eacd0] py-6 px-4 md:px-[6%] text-sm border-t border-[#1c2c58]/40 mt-12">
        <span>Practise smarter. Speak confidently. Make your next opportunity count.</span>
        <button
          onClick={() => setIsDatasetsOpen(true)}
          className="text-xs text-[#9eacd0]/60 hover:text-[#55b9ff] transition cursor-pointer underline underline-offset-4"
        >
          Administrator Portal
        </button>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={newUser => setUser(newUser)}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        userId={user?.uid}
        onSelectReport={report => {
          setActiveReport(report);
          setView('report');
        }}
      />

      <DatasetManagerModal
        isOpen={isDatasetsOpen}
        onClose={() => setIsDatasetsOpen(false)}
        onDatasetImported={() => {}}
      />
    </div>
  );
}
