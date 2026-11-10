import React from 'react';
import { User, History, Database, LogIn, LogOut, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenHistory: () => void;
  onOpenDatasets: () => void;
  onLogout: () => void;
  onGoHome: () => void;
  inInterview?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAuth,
  onOpenHistory,
  onOpenDatasets,
  onLogout,
  onGoHome,
  inInterview,
}) => {
  return (
    <header className="min-h-[78px] px-4 md:px-[6%] flex items-center justify-between border-b border-[#34436d] bg-[#080f27]/80 backdrop-blur-md sticky top-0 z-50">
      <button
        onClick={onGoHome}
        className="flex items-center gap-3 text-[1.35rem] font-extrabold hover:opacity-90 transition text-left cursor-pointer bg-transparent border-0 text-[#f7f8ff]"
        title="Go to Home"
      >
        <span className="text-3xl select-none">🤖</span>
        <div className="tracking-tight">
          Interview with <span className="text-[#b18aff]">AI</span>
        </div>
      </button>

      <div className="flex items-center gap-3 md:gap-4">
        {/* History Button */}
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 text-xs md:text-sm text-[#b8c5e6] hover:text-white px-3 py-1.5 rounded-full border border-[#34436d] hover:border-[#a66bff] transition cursor-pointer"
          title="View Interview History"
        >
          <History className="w-3.5 h-3.5 text-[#a66bff]" />
          <span className="hidden xs:inline">Past Reports</span>
        </button>

        {/* Powered Tag matching existing design */}
        <div className="hidden lg:flex items-center gap-1.5 border border-[#9563ff] text-[#d5bdff] rounded-full px-4 py-1.5 text-xs md:text-sm font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#d5bdff]" />
          <span>✦ AI Powered</span>
        </div>

        {/* Candidate User Auth Profile */}
        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#101d40] border border-[#394b86]">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#397fff] to-[#995cff] flex items-center justify-center text-xs font-bold text-white">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs md:text-sm font-medium text-[#f7f8ff] max-w-[120px] truncate">
                {user.displayName}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-[#b8c5e6] hover:text-red-400 hover:bg-[#101d40] rounded-full transition cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-white px-4 py-2 rounded-full bg-gradient-to-r from-[#397fff] to-[#995cff] shadow-md hover:opacity-95 transition cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
