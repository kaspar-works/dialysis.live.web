import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { THEME, ensureWellnessFont, WELLNESS_FONT_FAMILY } from '../theme';

const PublicNav: React.FC = () => {
  useEffect(() => {
    ensureWellnessFont();
  }, []);

  return (
    <nav
      className="sticky top-0 z-40"
      style={{
        backgroundColor: 'rgba(244,241,236,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${THEME.border}`,
        fontFamily: WELLNESS_FONT_FAMILY,
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold transition-transform group-hover:scale-105"
            style={{ background: THEME.heroGradient, fontSize: 16 }}
            aria-hidden
          >
            d
          </span>
          <span className="text-base md:text-lg font-bold tracking-tight" style={{ color: THEME.ink }}>
            dialysis.live
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 md:gap-8 text-sm font-medium">
          <Link to="/features" className="hidden sm:inline hover:opacity-70 transition-opacity" style={{ color: THEME.muted }}>
            Features
          </Link>
          <Link to="/pricing" className="hidden sm:inline hover:opacity-70 transition-opacity" style={{ color: THEME.muted }}>
            Pricing
          </Link>
          <Link to="/demo" className="hidden md:inline hover:opacity-70 transition-opacity" style={{ color: THEME.muted }}>
            Demo
          </Link>
          <Link to="/login" className="hover:opacity-70 transition-opacity" style={{ color: THEME.muted }}>
            Sign in
          </Link>
          <Link
            to="/register"
            className="px-4 md:px-5 py-2 md:py-2.5 rounded-full text-white font-semibold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-xs md:text-sm"
            style={{ background: THEME.heroGradient }}
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default PublicNav;
