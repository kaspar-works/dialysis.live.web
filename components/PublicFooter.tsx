import React from 'react';
import { Link } from 'react-router';
import Logo from './Logo';

const PublicFooter: React.FC = () => (
  <footer className="relative pt-16 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-6 md:px-20 overflow-hidden">
    {/* Gradient accent line */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent"></div>

    <div className="max-w-[1440px] mx-auto">
      {/* Main footer content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-6 sm:gap-8 md:gap-12 pb-12 sm:pb-16">
        {/* Brand */}
        <div className="col-span-2 space-y-4">
          <Link to="/" className="inline-flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="font-black text-lg tracking-tighter text-white">dialysis.live</span>
          </Link>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs">
            Clinical-grade dialysis management for modern patients.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <h5 className="text-xs font-bold text-white/60 uppercase tracking-wider">Features</h5>
          <div className="flex flex-col gap-2.5 text-sm text-white/40">
            <Link to="/features" className="hover:text-white transition-colors">Overview</Link>
            <Link to="/demo" className="hover:text-white transition-colors">Interactive Demo</Link>
            <Link to="/sessions" className="hover:text-white transition-colors">Sessions</Link>
            <Link to="/nutri-scan" className="hover:text-white transition-colors">Nutri-Scan</Link>
          </div>
        </div>

        {/* Tracking */}
        <div className="space-y-4">
          <h5 className="text-xs font-bold text-white/60 uppercase tracking-wider">Tracking</h5>
          <div className="flex flex-col gap-2.5 text-sm text-white/40">
            <Link to="/vitals" className="hover:text-white transition-colors">Vitals</Link>
            <Link to="/fluid" className="hover:text-white transition-colors">Fluids</Link>
            <Link to="/meds" className="hover:text-white transition-colors">Medications</Link>
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-4">
          <h5 className="text-xs font-bold text-white/60 uppercase tracking-wider">Resources</h5>
          <div className="flex flex-col gap-2.5 text-sm text-white/40">
            <Link to="/edu" className="hover:text-white transition-colors">Education</Link>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>

        {/* Legal */}
        <div className="space-y-4">
          <h5 className="text-xs font-bold text-white/60 uppercase tracking-wider">Legal</h5>
          <div className="flex flex-col gap-2.5 text-sm text-white/40">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-white/30">&copy; 2026 dialysis.live</p>
        <p className="text-xs text-white/30">Made with care for the dialysis community</p>
      </div>
    </div>
  </footer>
);

export default PublicFooter;
