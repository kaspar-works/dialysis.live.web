import React from 'react';
import { Link } from 'react-router';
import Logo from './Logo';

const PublicNav: React.FC = () => (
  <nav className="fixed top-0 left-0 right-0 h-16 sm:h-20 md:h-24 border-b border-white/5 bg-[#020617]/40 backdrop-blur-3xl flex items-center justify-between px-4 sm:px-6 md:px-20 z-[100] safe-pt">
    <Link to="/" className="flex items-center gap-2 sm:gap-3 md:gap-4 group">
      <Logo className="w-8 h-8 md:w-12 md:h-12" />
      <span className="font-black text-base sm:text-lg md:text-2xl tracking-tighter text-white">dialysis.live</span>
    </Link>
    <div className="flex items-center gap-3 sm:gap-4 md:gap-12">
      <Link to="/features" className="hidden sm:block text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Features</Link>
      <Link to="/demo" className="hidden sm:block text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Demo</Link>
      <Link to="/pricing" className="hidden sm:block text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Pricing</Link>
      <Link to="/login" className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Login</Link>
      <Link to="/register" className="px-4 sm:px-5 md:px-10 py-2.5 sm:py-3 md:py-4 bg-white text-slate-950 rounded-xl md:rounded-2xl font-black text-[9px] md:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all">Join</Link>
    </div>
  </nav>
);

export default PublicNav;
