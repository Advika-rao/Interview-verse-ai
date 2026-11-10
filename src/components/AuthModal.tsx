import React, { useState } from 'react';
import { X, User, Mail, Lock, LogIn, UserPlus, Sparkles, AlertCircle } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile, JobRole, ExperienceLevel } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      const profile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || 'candidate@example.com',
        displayName: fbUser.displayName || 'Candidate',
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('candidate_profile', JSON.stringify(profile));
      onLoginSuccess(profile);
      onClose();
    } catch (err: any) {
      console.warn('Google auth warning:', err);
      // If popup was blocked or user cancelled, give clear error
      setError(err.message || 'Could not sign in with Google. You can sign in using Candidate Email directly.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide an email address.');
      return;
    }
    if (isRegister && !name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    setLoading(true);
    const profile: UserProfile = {
      uid: `cand-${Date.now()}`,
      email: email.trim(),
      displayName: isRegister ? name.trim() : email.split('@')[0],
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('candidate_profile', JSON.stringify(profile));
    onLoginSuccess(profile);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[24px] bg-[#0c1634] border border-[#394b86] shadow-2xl flex flex-col overflow-hidden text-[#f7f8ff]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#24335c] bg-[#101d40]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h2 className="text-base font-bold text-white">
              {isRegister ? 'Candidate Registration' : 'Candidate Sign In'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#b8c5e6] hover:text-white hover:bg-[#172c5a] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/60 text-xs text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-full bg-[#101d40] hover:bg-[#172c5a] border border-[#394b86] text-xs md:text-sm font-semibold text-white transition cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-[#24335c]" />
            <span className="text-[11px] uppercase tracking-wider text-[#9eacd0]">or email</span>
            <div className="flex-1 h-px bg-[#24335c]" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-[#b8c5e6] mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-[#55b9ff]" />
                  <input
                    type="text"
                    required={isRegister}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    className="w-full pl-9 pr-3 py-2 text-xs md:text-sm rounded-xl bg-[#080f27] border border-[#24335c] text-white placeholder-[#5a6a96] focus:border-[#55b9ff] outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#b8c5e6] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#55b9ff]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs md:text-sm rounded-xl bg-[#080f27] border border-[#24335c] text-white placeholder-[#5a6a96] focus:border-[#55b9ff] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#b8c5e6] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#55b9ff]" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs md:text-sm rounded-xl bg-[#080f27] border border-[#24335c] text-white placeholder-[#5a6a96] focus:border-[#55b9ff] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full py-2.5 rounded-full font-bold text-xs md:text-sm text-white mt-2 cursor-pointer shadow-md"
            >
              {isRegister ? 'Create Candidate Account' : 'Sign In as Candidate'}
            </button>
          </form>

          <div className="text-center text-xs text-[#9eacd0] mt-1">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-[#b18aff] hover:underline font-semibold cursor-pointer ml-1"
            >
              {isRegister ? 'Sign In' : 'Register Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
