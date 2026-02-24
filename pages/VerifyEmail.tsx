
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import Logo from '../components/Logo';
import SEO from '../components/SEO';
import { verifyEmail } from '../services/auth';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No verification token provided.');
      setIsLoading(false);
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token);
        setIsVerified(true);
      } catch (err: any) {
        setError(err.message || 'Failed to verify email. The link may be invalid or expired.');
      } finally {
        setIsLoading(false);
      }
    };

    verify();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-12">
        <SEO title="Verifying Email" description="Verifying your email address." />
        <div className="text-center space-y-6 animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-sky-50 text-sky-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-sky-100">
            <div className="w-10 h-10 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Verifying Email...</h2>
          <p className="text-slate-500 font-medium">Please wait while we verify your email address.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-12">
        <SEO title="Verification Failed" description="Email verification failed." />
        <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-red-100">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Verification Failed</h2>
          <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">{error}</p>
          <div className="pt-4 space-y-3">
            <Link to="/login" className="inline-block px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-sky-600 transition-all">
              Go to Login
            </Link>
            <p className="text-slate-400 text-sm font-medium">
              You can resend the verification email from your account settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row animate-in fade-in duration-700">
      <SEO title="Email Verified" description="Your email has been successfully verified." />

      {/* Visual Side */}
      <div className="lg:w-1/2 bg-slate-50 p-12 lg:p-24 flex flex-col justify-between relative overflow-hidden order-1 lg:order-2">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2"></div>

        <Link to="/" className="relative z-10">
          <Logo className="w-14 h-14" />
          <span className="font-bold text-xl text-slate-900 tracking-tight mt-4 block">dialysis.live</span>
        </Link>

        <div className="relative z-10 space-y-12">
          <div className="space-y-4">
            <h2 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9]">
              Email <br/>
              <span className="text-emerald-600 font-black">Verified.</span>
            </h2>
            <p className="text-slate-500 text-xl font-medium max-w-md leading-relaxed">
              Your account is now fully activated and ready to use.
            </p>
          </div>

          <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Your email address has been confirmed. All security features are now active.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">
          2025 dialysis.live • Secure Verification Node
        </div>
      </div>

      {/* Success Side */}
      <div className="flex-1 p-12 lg:p-24 flex items-center justify-center order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="space-y-8 text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-emerald-100 mb-8">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Email Verified!</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                Your email has been successfully verified. You can now sign in and access all features.
              </p>
            </div>
            <div className="pt-8">
              <Link to="/login" className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-sky-600 transition-all">
                Continue to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
