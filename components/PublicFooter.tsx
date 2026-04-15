import React from 'react';
import { Link } from 'react-router';
import { THEME, WELLNESS_FONT_FAMILY } from '../theme';

const PublicFooter: React.FC = () => (
  <footer
    className="py-12 md:py-16"
    style={{
      borderTop: `1px solid ${THEME.border}`,
      backgroundColor: THEME.card,
      fontFamily: WELLNESS_FONT_FAMILY,
    }}
  >
    <div className="max-w-[1200px] mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-12 gap-10">
      <div className="md:col-span-5">
        <Link to="/" className="flex items-center gap-2.5 mb-4">
          <span
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold"
            style={{ background: THEME.heroGradient, fontSize: 16 }}
            aria-hidden
          >
            d
          </span>
          <span className="text-lg font-bold tracking-tight" style={{ color: THEME.ink }}>
            dialysis.live
          </span>
        </Link>
        <p className="text-sm max-w-xs leading-relaxed mb-5" style={{ color: THEME.muted }}>
          A calm companion for dialysis patients and their care teams.
        </p>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <TrustBadge icon="🔒" label="HIPAA-ready infrastructure" />
          <TrustBadge icon="🛡️" label="256-bit encryption" />
          <TrustBadge icon="🩺" label="Clinician-reviewed" />
          <TrustBadge icon="🚫" label="Never sold or shared" />
        </div>

        {/* Data commitment */}
        <div
          className="text-xs px-3 py-2 rounded-lg mb-4 inline-block"
          style={{
            backgroundColor: THEME.mint,
            color: THEME.ink,
            border: `1px solid ${THEME.mintInk}33`,
          }}
        >
          <span style={{ color: THEME.mintInk }}>✓</span>{' '}
          Your data is never shared. Designed for healthcare privacy from day one.
        </div>

        {/* Contact */}
        <div className="text-xs space-y-1" style={{ color: THEME.muted }}>
          <div>
            Support:{' '}
            <a href="mailto:support@dialysis.live" style={{ color: THEME.tealDark, fontWeight: 600 }}>
              support@dialysis.live
            </a>
          </div>
          <div>We reply within 24 hours, Mon–Fri.</div>
        </div>
      </div>

      <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
        <FooterColumn title="Product">
          <FooterLink to="/features">Features</FooterLink>
          <FooterLink to="/pricing">Pricing</FooterLink>
          <FooterLink to="/demo">Demo</FooterLink>
        </FooterColumn>
        <FooterColumn title="Resources">
          <FooterLink to="/edu">Education</FooterLink>
          <FooterLink to="/help">Help</FooterLink>
          <FooterLink to="/community">Community</FooterLink>
        </FooterColumn>
        <FooterColumn title="Legal">
          <FooterLink to="/privacy">Privacy</FooterLink>
          <FooterLink to="/terms">Terms</FooterLink>
        </FooterColumn>
      </div>
    </div>

    <div
      className="max-w-[1200px] mx-auto px-6 md:px-10 mt-10 pt-6 flex flex-col sm:flex-row justify-between gap-3 text-xs"
      style={{ borderTop: `1px solid ${THEME.border}`, color: THEME.muted }}
    >
      <span>© {new Date().getFullYear()} dialysis.live — all rights reserved</span>
      <span className="flex items-center gap-1.5">
        Made with <span style={{ color: THEME.coral }}>♥</span> for kidney patients
      </span>
    </div>
  </footer>
);

const FooterColumn: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <div
      className="text-xs font-bold uppercase tracking-wider mb-3"
      style={{ color: THEME.ink }}
    >
      {title}
    </div>
    <ul className="space-y-2">{children}</ul>
  </div>
);

const FooterLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <li>
    <Link to={to} className="hover:opacity-70 transition-opacity" style={{ color: THEME.muted }}>
      {children}
    </Link>
  </li>
);

const TrustBadge: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <span
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
    style={{
      backgroundColor: THEME.bgSoft,
      color: THEME.ink,
      border: `1px solid ${THEME.border}`,
    }}
  >
    <span aria-hidden>{icon}</span>
    {label}
  </span>
);

export default PublicFooter;
