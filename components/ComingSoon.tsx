import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { isUnderConstruction, PageKey } from '../config/underConstruction';

interface ComingSoonProps {
  page: PageKey;
  children: React.ReactNode;
  title?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ page, children, title }) => {
  if (!isUnderConstruction(page)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-sky-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-pink-900/15 rounded-full blur-[100px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 max-w-lg">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-3 group">
          <Logo className="w-12 h-12" />
          <span className="font-black text-2xl tracking-tighter text-white">dialysis.live</span>
        </Link>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Under Construction</span>
        </div>

        {/* Main heading */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none">
            Coming<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">Soon.</span>
          </h1>
          {title && (
            <p className="text-xl md:text-2xl font-bold text-white/60">{title}</p>
          )}
        </div>

        {/* Description */}
        <p className="text-white/40 text-lg leading-relaxed">
          We're working hard to bring you this feature. Check back soon for updates.
        </p>

        {/* Progress indicator */}
        <div className="space-y-3 pt-4">
          <div className="flex justify-between text-xs font-bold text-white/40 uppercase tracking-wider">
            <span>Progress</span>
            <span>In Development</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full w-[35%] bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Link
            to="/"
            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 rounded-2xl font-bold text-sm uppercase tracking-wider hover:scale-105 active:scale-95 transition-all"
          >
            Back to Home
          </Link>
          <Link
            to="/features"
            className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-white/10 transition-all"
          >
            View Features
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-white/20 font-medium">dialysis.live 2025</p>
      </div>
    </div>
  );
};

export default ComingSoon;
