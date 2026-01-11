
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", showText = false }) => {
  return (
    <div className={`flex items-center gap-3 group ${className.includes('h-') ? '' : 'h-12'}`}>
      <img
        src="/newlogo.png"
        alt="dialysis.live logo"
        className={`${className} drop-shadow-xl transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 object-contain`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className="font-black text-2xl text-slate-900 dark:text-white tracking-tighter leading-none">dialysis.live</span>
          <span className="text-[10px] font-bold text-cyan-500 dark:text-cyan-400 uppercase tracking-[0.2em] mt-1 italic">Vibrant Health</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
