import React from 'react';
import { Link } from 'react-router-dom';
import { ICONS, COLORS } from '../constants';
import Logo from '../components/Logo';
import SEO from '../components/SEO';

const Landing: React.FC = () => {
  const bentoFeatures = [
    {
      title: 'Nutri-Scan AI',
      desc: 'Visual recognition for renal safety. Scan food to see potassium and sodium estimates instantly.',
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
      color: 'bg-emerald-500',
      span: 'md:col-span-2 md:row-span-2',
      tag: 'AI Vision',
      img: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Cycle Sync',
      desc: 'Real-time treatment tracking with clinical telemetry.',
      icon: ICONS.Activity,
      color: 'bg-orange-500',
      span: 'md:col-span-2 md:row-span-1',
      tag: 'Clinical'
    },
    {
      title: 'Fluid Ledger',
      desc: 'Precision hydration management.',
      icon: ICONS.Droplet,
      color: 'bg-sky-500',
      span: 'md:col-span-1 md:row-span-1',
      tag: 'Balance'
    },
    {
      title: 'Biometrics',
      desc: 'Stability charts for weight and BP.',
      icon: ICONS.Scale,
      color: 'bg-pink-600',
      span: 'md:col-span-1 md:row-span-1',
      tag: 'Trends'
    },
    {
      title: 'Adherence',
      desc: 'Smart meds for dialysis schedules.',
      icon: ICONS.Pill,
      color: 'bg-slate-900',
      span: 'md:col-span-2 md:row-span-1',
      tag: 'Protocol'
    }
  ];

  return (
    <div className="bg-[#020617] min-h-screen selection:bg-sky-500/30 selection:text-white overflow-x-hidden text-white w-full">
      <SEO 
        title="The Modern Standard for Renal Care" 
        description="Unified dialysis tracking, AI nutrition scanning, and clinical biometric monitoring." 
      />

      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[100vw] h-[100vw] bg-sky-900/20 rounded-full blur-[100px] md:blur-[160px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-pink-900/10 rounded-full blur-[140px]"></div>
      </div>

      <nav className="fixed top-0 left-0 right-0 h-20 md:h-24 border-b border-white/5 bg-[#020617]/40 backdrop-blur-3xl flex items-center justify-between px-6 md:px-20 z-[100] safe-pt">
        <Link to="/" className="flex items-center gap-3 md:gap-4 group">
          <Logo className="w-8 h-8 md:w-12 md:h-12" />
          <span className="font-black text-lg md:text-2xl tracking-tighter text-white">dialysis.live</span>
        </Link>
        <div className="flex items-center gap-4 md:gap-12">
           <Link to="/login" className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Login</Link>
           <Link to="/register" className="px-5 md:px-10 py-3 md:py-4 bg-white text-slate-950 rounded-xl md:rounded-2xl font-black text-[9px] md:text-xs uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all">Join</Link>
        </div>
      </nav>

      <section className="relative pt-32 sm:pt-48 md:pt-72 pb-24 md:pb-56 px-6 md:px-20 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
           <div className="lg:col-span-7 space-y-8 md:space-y-12 text-center lg:text-left animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] backdrop-blur-xl">
                 <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></div>
                 System Sync Active
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl xl:text-[11rem] font-black tracking-tighter leading-[0.85] md:leading-[0.78] text-white">
                 Renal <br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-white to-pink-500">Longevity.</span>
              </h1>
              <p className="text-white/40 text-lg md:text-2xl lg:text-3xl font-medium max-w-2xl leading-relaxed mx-auto lg:mx-0">
                 The ultimate clinical workspace for the dialysis journey. Integrated tracking for treatments, nutrients, and vitals.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 pt-6 md:pt-8 justify-center lg:justify-start">
                 <Link to="/register" className="w-full sm:w-auto px-10 md:px-16 py-6 md:py-8 bg-sky-500 text-white rounded-[2rem] md:rounded-[2.5rem] font-black text-xs md:text-sm uppercase tracking-[0.4em] shadow-[0_20px_80px_-20px_rgba(14,165,233,0.5)] hover:bg-sky-400 hover:-translate-y-2 transition-all active:scale-95 text-center">Start Free Access</Link>
                 <Link to="/features" className="w-full sm:w-auto flex items-center justify-center gap-4 text-white font-black text-xs md:text-sm uppercase tracking-[0.3em] group px-10 py-6 md:py-8 rounded-[2rem] md:rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    Specs
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-2 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                 </Link>
              </div>
           </div>

           <div className="lg:col-span-5 relative group animate-in fade-in zoom-in-95 duration-1000 delay-300 px-4 sm:px-0">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-pink-500 rounded-[3rem] md:rounded-[5rem] blur-[60px] md:blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
              <div className="relative z-10 bg-white/5 backdrop-blur-3xl p-4 md:p-6 rounded-[3rem] md:rounded-[5rem] border border-white/10 shadow-2xl">
                 <div className="bg-slate-950 p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-white/5 space-y-8 md:space-y-12">
                    <div className="flex justify-between items-center">
                       <div className="space-y-1">
                          <p className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-widest">Active Pulse</p>
                          <h4 className="text-3xl md:text-4xl font-black tabular-nums tracking-tighter">98.2<span className="text-lg text-white/30 ml-2">bpm</span></h4>
                       </div>
                       <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-2xl md:rounded-3xl flex items-center justify-center border border-white/10 animate-pulse">
                          <ICONS.Activity className="w-6 h-6 md:w-8 md:h-8 text-pink-500" />
                       </div>
                    </div>
                    <div className="space-y-4 md:space-y-6">
                       <div className="flex justify-between items-end">
                          <span className="text-[8px] md:text-[10px] font-black text-white/30 uppercase tracking-widest">Treatment</span>
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">In Sync</span>
                       </div>
                       <div className="h-3 md:h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                          <div className="h-full w-[88%] bg-gradient-to-r from-sky-500 via-pink-500 to-orange-400 rounded-full shadow-[0_0_20px_rgba(14,165,233,0.4)]"></div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      <section className="py-24 md:py-56 px-6 md:px-20 max-w-[1440px] mx-auto relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10 mb-16 md:mb-24 text-center md:text-left">
           <div className="space-y-4 md:space-y-6">
              <span className="text-[9px] md:text-[10px] font-black text-sky-400 uppercase tracking-[0.3em] md:tracking-[0.5em]">System Architecture</span>
              <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none">Modular Care.</h2>
           </div>
           <p className="text-white/30 text-lg md:text-xl font-medium max-w-md leading-relaxed">
              Every tracking tool a patient needs, refined into one high-performance interface.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-auto md:auto-rows-[450px] gap-6 md:gap-10">
           {bentoFeatures.map((f, i) => (
             <div 
               key={i} 
               className={`${f.span} group relative bg-white/5 backdrop-blur-3xl p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] border border-white/5 overflow-hidden hover:border-white/20 hover:bg-white/[0.08] transition-all duration-700 flex flex-col justify-between`}
             >
                <div className="flex justify-between items-start mb-12 md:mb-0">
                   <div className={`${f.color} w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700`}>
                      <f.icon className="w-6 h-6 md:w-8 md:h-8" />
                   </div>
                   <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/40"># {f.tag}</span>
                </div>

                <div className="space-y-3 md:space-y-4">
                   <h3 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter leading-tight">{f.title}</h3>
                   <p className="text-white/40 text-base md:text-xl font-medium leading-relaxed max-w-sm">{f.desc}</p>
                </div>
             </div>
           ))}
        </div>
      </section>

      <footer className="py-24 md:py-32 px-6 md:px-20 border-t border-white/5 bg-black">
         <div className="max-w-[1440px] mx-auto space-y-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
               <div className="lg:col-span-5 space-y-8 text-center lg:text-left">
                  <Logo className="w-12 h-12 mx-auto lg:mx-0" />
                  <p className="text-white/30 text-lg md:text-xl font-medium max-w-sm leading-relaxed mx-auto lg:mx-0">
                     Modern dialysis management. <br/>
                     Engineered for the resilient.
                  </p>
               </div>
               <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
                  <div className="space-y-6">
                     <h5 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white">Platform</h5>
                     <div className="flex flex-col gap-3 text-xs md:text-sm font-bold text-white/40">
                        <Link to="/features" className="hover:text-white transition-colors">Capabilities</Link>
                        <Link to="/edu" className="hover:text-white transition-colors">Education</Link>
                        <Link to="/subscription" className="hover:text-white transition-colors">Pricing</Link>
                     </div>
                  </div>
                  <div className="space-y-6">
                     <h5 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white">Legal</h5>
                     <div className="flex flex-col gap-3 text-xs md:text-sm font-bold text-white/40">
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </footer>

      <style>{`
        .animate-float { animation: float 8s ease-in-out infinite; }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default Landing;