import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import SEO from '../components/SEO';
import { forgotPassword } from '../services/auth';
import { THEME, ensureWellnessFont, WELLNESS_FONT_FAMILY } from '../theme';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isOAuth, setIsOAuth] = useState(false);
  const [oauthProvider, setOauthProvider] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    ensureWellnessFont();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await forgotPassword(email);

      if (result.isOAuth) {
        const match = result.message.match(/uses (\w+) login/i);
        setOauthProvider(match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'a social');
        setIsOAuth(true);
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row"
      style={{
        backgroundColor: THEME.bg,
        color: THEME.ink,
        fontFamily: WELLNESS_FONT_FAMILY,
      }}
    >
      <SEO
        title="Reset your password — dialysis.live"
        description="Recover access to your dialysis.live account. We'll send you a secure reset link by email."
      />

      {/* Branding Side */}
      <div
        className="hidden lg:flex lg:w-1/2 p-12 lg:p-20 flex-col justify-between relative overflow-hidden order-1 lg:order-2"
        style={{ background: THEME.calmGradient }}
      >
        <div
          aria-hidden
          className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl"
          style={{ background: THEME.teal }}
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -right-24 w-[400px] h-[400px] rounded-full opacity-25 blur-3xl"
          style={{ background: THEME.lavender }}
        />

        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <span
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: THEME.heroGradient }}
            aria-hidden
          >
            d
          </span>
          <span className="text-xl font-bold tracking-tight" style={{ color: THEME.ink }}>
            dialysis.live
          </span>
        </Link>

        <div className="relative z-10 space-y-8">
          <h2
            className="font-bold tracking-tight"
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: THEME.ink,
            }}
          >
            Let's get you back{' '}
            <span
              style={{
                background: THEME.heroGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              into your account.
            </span>
          </h2>
          <p className="text-lg leading-relaxed max-w-md" style={{ color: THEME.muted }}>
            We'll email a secure recovery link. Your clinical data stays encrypted and private.
          </p>

          <div
            className="flex items-start gap-4 p-5 rounded-3xl"
            style={{
              backgroundColor: THEME.card,
              border: `1px solid ${THEME.border}`,
              boxShadow: `0 4px 20px -8px ${THEME.tealDark}1a`,
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${THEME.skyInk}e6, ${THEME.skyInk})` }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="text-sm leading-relaxed" style={{ color: THEME.ink }}>
              <div className="font-bold mb-1">Encrypted recovery</div>
              <div style={{ color: THEME.muted }}>
                Only you can complete the reset via the emailed link.
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative z-10 text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: THEME.muted }}
        >
          {new Date().getFullYear()} · dialysis.live
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 p-6 sm:p-8 md:p-12 lg:p-20 flex flex-col items-center justify-center relative order-2 lg:order-1">
        <div className="absolute top-6 sm:top-10 left-4 sm:left-10 lg:left-20">
          <Link
            to="/login"
            className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold group transition-colors"
            style={{ color: THEME.muted }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="group-hover:-translate-x-1 transition-transform"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to sign in
          </Link>
        </div>

        <div className="w-full max-w-md mt-16 lg:mt-0">
          {!isSubmitted ? (
            <div className="space-y-8">
              <div className="space-y-3">
                <h1
                  className="font-bold tracking-tight"
                  style={{
                    fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                    letterSpacing: '-0.015em',
                    color: THEME.ink,
                  }}
                >
                  Reset your password
                </h1>
                <p style={{ color: THEME.muted }}>
                  Enter the email you signed up with and we'll send a recovery link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold ml-1" style={{ color: THEME.muted }}>
                    Registered email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl px-4 py-3.5 font-medium transition-all outline-none"
                    style={{
                      backgroundColor: THEME.card,
                      border: `1.5px solid ${THEME.border}`,
                      color: THEME.ink,
                      fontFamily: WELLNESS_FONT_FAMILY,
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = THEME.teal;
                      (e.target as HTMLInputElement).style.boxShadow = `0 0 0 3px ${THEME.teal}33`;
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = THEME.border;
                      (e.target as HTMLInputElement).style.boxShadow = '';
                    }}
                    placeholder="you@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div
                    className="p-3 rounded-xl text-sm"
                    style={{
                      backgroundColor: THEME.peach,
                      color: THEME.peachInk,
                      border: `1px solid ${THEME.peachInk}44`,
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  disabled={isLoading}
                  className="w-full py-4 rounded-full font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    background: THEME.heroGradient,
                    boxShadow: `0 8px 24px -8px ${THEME.teal}80`,
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    'Send recovery link →'
                  )}
                </button>
              </form>

              <p className="text-xs text-center leading-relaxed" style={{ color: THEME.muted }}>
                The email usually arrives within a few minutes. Check spam if you don't see it.
              </p>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              {isOAuth ? (
                <>
                  <div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
                    style={{ backgroundColor: THEME.butter }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${THEME.butterInk}e6, ${THEME.butterInk})` }}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2
                      className="font-bold tracking-tight"
                      style={{ fontSize: '1.75rem', letterSpacing: '-0.015em', color: THEME.ink }}
                    >
                      No password to reset
                    </h2>
                    <p className="leading-relaxed" style={{ color: THEME.muted }}>
                      The account for{' '}
                      <span className="font-bold" style={{ color: THEME.ink }}>
                        {email}
                      </span>{' '}
                      was created using{' '}
                      <span className="font-bold" style={{ color: THEME.ink }}>
                        {oauthProvider}
                      </span>{' '}
                      sign-in. Please use that provider to access your account.
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="inline-block px-8 py-4 rounded-full font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ background: THEME.heroGradient }}
                  >
                    Sign in with {oauthProvider}
                  </Link>
                </>
              ) : (
                <>
                  <div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
                    style={{ backgroundColor: THEME.mint }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${THEME.mintInk}e6, ${THEME.mintInk})` }}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2
                      className="font-bold tracking-tight"
                      style={{ fontSize: '1.75rem', letterSpacing: '-0.015em', color: THEME.ink }}
                    >
                      Check your inbox
                    </h2>
                    <p className="leading-relaxed" style={{ color: THEME.muted }}>
                      We sent a recovery link to{' '}
                      <span className="font-bold" style={{ color: THEME.ink }}>
                        {email}
                      </span>
                      . Tap the link in the email to finish resetting your password.
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="inline-block px-8 py-4 rounded-full font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ background: THEME.heroGradient }}
                  >
                    Back to sign in
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
