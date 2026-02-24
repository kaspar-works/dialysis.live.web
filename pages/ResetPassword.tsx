
import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Logo from '../components/Logo';
import SEO from '../components/SEO';
import { resetPassword } from '../services/auth';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, password);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-12">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-red-100">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Invalid Reset Link</h2>
          <p className="text-slate-500 font-medium">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="inline-block px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-sky-600 transition-all">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row animate-in fade-in duration-700">
      <SEO
        title="Reset Password - Set New Password"
        description="Set a new password for your dialysis.live account."
      />
      {/* Visual Side */}
      <div className="lg:w-1/2 bg-slate-50 p-12 lg:p-24 flex flex-col justify-between relative overflow-hidden order-1 lg:order-2">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2"></div>

        <Link to="/" className="relative z-10">
          <Logo className="w-14 h-14" />
          <span className="font-bold text-xl text-slate-900 tracking-tight mt-4 block">dialysis.live</span>
        </Link>

        <div className="relative z-10 space-y-12">
           <div className="space-y-4">
              <h2 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9]">
                New <br/>
                <span className="text-sky-600 font-black">Credentials.</span>
              </h2>
              <p className="text-slate-500 text-xl font-medium max-w-md leading-relaxed">
                Choose a strong password to secure your clinical data and health records.
              </p>
           </div>

           <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center gap-6">
              <div className="w-14 h-14 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                 Minimum 8 characters with uppercase, lowercase, and a number.
              </p>
           </div>
        </div>

        <div className="relative z-10 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">
           2025 dialysis.live • Secure Recovery Node
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 p-12 lg:p-24 flex items-center justify-center order-2 lg:order-1 relative">
        <div className="absolute top-10 left-10 lg:left-24">
          <Link to="/login" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:-translate-x-1 transition-transform"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Authentication
          </Link>
        </div>

        <div className="w-full max-w-md">
           {!isSubmitted ? (
             <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                   <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Set New Password</h1>
                   <p className="text-slate-500 font-medium">Enter your new secure credentials below.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 font-bold text-slate-900 focus:ring-4 focus:ring-sky-50 focus:border-sky-500 transition-all outline-none"
                        placeholder="Minimum 8 characters"
                        required
                        minLength={8}
                        disabled={isLoading}
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 font-bold text-slate-900 focus:ring-4 focus:ring-sky-50 focus:border-sky-500 transition-all outline-none"
                        placeholder="Re-enter password"
                        required
                        minLength={8}
                        disabled={isLoading}
                      />
                   </div>

                   {error && (
                     <p className="text-red-500 text-sm font-bold text-center">{error}</p>
                   )}

                   <button
                     disabled={isLoading}
                     className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-sky-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                   </button>
                </form>
             </div>
           ) : (
             <div className="space-y-8 text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-emerald-100 mb-8">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div className="space-y-4">
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">Password Updated</h2>
                   <p className="text-slate-500 font-medium leading-relaxed">
                      Your password has been successfully reset. You can now sign in with your new credentials.
                   </p>
                </div>
                <div className="pt-8">
                   <Link to="/login" className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-sky-600 transition-all">
                      Sign In
                   </Link>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
