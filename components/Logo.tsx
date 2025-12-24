
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", showText = false }) => {
  return (
    <div className={`flex items-center gap-3 group ${className.includes('h-') ? '' : 'h-12'}`}>
      <svg 
        viewBox="0 0 100 100" 
        className={`${className} drop-shadow-xl transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110`} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="kidneyMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" /> {/* Orange */}
            <stop offset="50%" stopColor="#EC4899" /> {/* Pink */}
            <stop offset="100%" stopColor="#A855F7" /> {/* Purple */}
          </linearGradient>
          <linearGradient id="kidneyVessels" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" /> {/* Cyan */}
            <stop offset="100%" stopColor="#0EA5E9" /> {/* Sky Blue */}
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Floating background spheres */}
        <circle cx="20" cy="25" r="5" fill="#FCA5A5" opacity="0.6" />
        <circle cx="85" cy="75" r="8" fill="#7DD3FC" opacity="0.4" />
        <circle cx="70" cy="20" r="4" fill="#F9A8D4" opacity="0.5" />
        <circle cx="15" cy="80" r="6" fill="#FDBA74" opacity="0.4" />

        {/* Kidney Main Body */}
        <path 
          d="M55 15C35 15 20 30 20 50C20 75 40 90 60 85C50 75 45 60 55 45C65 30 80 35 80 50C80 30 75 15 55 15Z" 
          fill="url(#kidneyMain)" 
          filter="url(#softGlow)"
        />

        {/* Internal Detail/Lobe */}
        <circle cx="48" cy="35" r="8" fill="#EF4444" opacity="0.8" />
        <circle cx="52" cy="65" r="10" fill="#9333EA" opacity="0.6" />

        {/* Kidney Vessels/Arteries */}
        <path 
          d="M55 45C55 45 65 50 75 40M55 45C55 45 60 55 60 75M75 40C85 35 90 45 80 55C75 60 65 55 60 75" 
          stroke="url(#kidneyVessels)" 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Vessel highlights */}
        <path 
          d="M62 68C62 68 63 60 60 52" 
          stroke="white" 
          strokeWidth="2" 
          strokeLinecap="round" 
          opacity="0.3"
        />
      </svg>
      {showText && (
        <div className="flex flex-col">
          <span className="font-black text-2xl text-slate-900 tracking-tighter leading-none">dialysis.live</span>
          <span className="text-[10px] font-bold text-pink-500 uppercase tracking-[0.2em] mt-1 italic">Vibrant Health</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
