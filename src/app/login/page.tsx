'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Building,
  CheckCircle2,
} from 'lucide-react';

function SparkleStar({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, signup, user } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signup') {
      const res = await signup(name, email, password, businessName);
      setLoading(false);
      if (res.success) {
        router.push('/dashboard');
      } else {
        setError(res.error || 'Failed to create account');
      }
    } else {
      const res = await login(email, password);
      setLoading(false);
      if (res.success) {
        router.push('/dashboard');
      } else {
        setError(res.error || 'Failed to sign in');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#030611] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Lighting Vortex */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-sky-400/[0.1] pointer-events-none shadow-[0_0_120px_rgba(56,189,248,0.1)_inset]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[950px] h-[950px] rounded-full border border-sky-400/[0.04] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-b from-sky-400/20 via-blue-600/10 to-transparent blur-[120px] pointer-events-none rounded-full" />

      {/* Floating Logo Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 mb-6">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(56,189,248,0.5)]">
            <SparkleStar className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg text-white group-hover:text-sky-300 transition-colors">
            SwiftCent
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-medium tracking-tight text-white">
          {mode === 'signin' ? 'Sign in to your account' : 'Create your SwiftCent account'}
        </h2>
        <p className="mt-1.5 text-xs text-slate-400">
          {mode === 'signin'
            ? 'Manage your quotes, invoices, and businesses with precision'
            : 'Get started with multi-business billing in seconds'}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.1] backdrop-blur-2xl py-8 px-6 sm:px-10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Alex Morgan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs bg-white/[0.03] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Business / Workspace Name</span>
                    <span className="text-[10px] text-slate-400">Optional</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Morgan Creative, Apex Labs..."
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full text-xs bg-white/[0.03] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors"
                    />
                    <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs bg-white/[0.03] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs bg-white/[0.03] border border-white/[0.1] rounded-xl pl-9 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-[#c8e2fb] hover:bg-white text-[#051124] font-semibold text-xs px-5 py-3 rounded-xl shadow-[0_0_25px_rgba(200,226,251,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center text-xs text-slate-400">
            {mode === 'signin' ? (
              <span>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="text-sky-300 hover:text-white font-medium underline"
                >
                  Create one now
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="text-sky-300 hover:text-white font-medium underline"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1.5"
          >
            <span>← Back to Landing Page</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

