
import React from 'react';
import { Link } from 'react-router-dom';
import { ICONS } from '../constants';

const Features: React.FC = () => {
  const mainFeatures = [
    {
      title: "Dialysis Session Lifecycle",
      desc: "Comprehensive tracking from pre-treatment weight to post-treatment summary. Log events, vitals, and machine telemetry in real-time.",
      icon: ICONS.Activity,
      color: "bg-sky-500",
      details: ["Real-time duration tracking", "Biometric synchronization", "Event logging (pain, notes, meds)", "Outcome archiving"]
    },
    {
      title: "Precision Weight Analytics",
      desc: "Monitor inter-dialytic weight variations and dry weight stability with longitudinal charts and smart targets.",
      icon: ICONS.Scale,
      color: "bg-indigo-600",
      details: ["Dry weight goals", "Automated variance calculation", "Morning vs Session tracking", "Visual trend analysis"]
    },
    {
      title: "Fluid Intake Governance",
      desc: "Stay within clinical volume limits with a dynamic intake ledger and visual progress indicators.",
      icon: ICONS.Droplet,
      color: "bg-sky-400",
      details: ["Custom daily limits", "Beverage classification", "Quick-add presets", "Remaining allowance alerts"]
    },
    {
      title: "Prescription Protocol",
      desc: "Adherence tracking specifically designed for renal schedules, distinguishing between dialysis and off-day dosing.",
      icon: ICONS.Pill,
      color: "bg-indigo-400",
      details: ["Dialysis day logic", "Binder reminders", "Adherence metrics", "Medication cabinet history"]
    },
    {
      title: "Clinical Audit Reports",
      desc: "Generate professional PDF summaries for your healthcare team, including all synchronized vitals and outcome data.",
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
      color: "bg-emerald-500",
      details: ["PDF/A formatted exports", "Custom date ranges", "Provider-ready layouts", "Audit integrity verification"]
    },
    {
      title: "AI Health Insights",
      desc: "Powered by Gemini Pro, the platform analyzes your data to identify trends and provide proactive renal health tips.",
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M12 2L14.4 9.6H22L15.8 14.3L18.2 22L12 17.3L5.8 22L8.2 14.3L2 9.6H9.6L12 2Z"/></svg>,
      color: "bg-slate-900",
      details: ["Gemini 3 Pro Integration", "Trend pattern recognition", "Supportive clinical context", "Data-driven observations"]
    }
  ];

  return (
    <div className="bg-white min-h-screen selection:bg-sky-100 selection:text-sky-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-24 bg-white/70 backdrop-blur-2xl border-b border-slate-100 flex items-center justify-between px-10 lg:px-20 z-50">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:rotate-6 transition-transform">D</div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">dialysis.live</span>
        </Link>
        <div className="flex items-center gap-8">
           <Link to="/login" className="hidden sm:block text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Login</Link>
           <Link to="/register" className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sky-600 transition-all shadow-xl shadow-slate-200">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-48 pb-32 px-8 max-w-6xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-sky-50 text-sky-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-sky-100">
           <span className="flex h-2 w-2 relative">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
           </span>
           Platform Capabilities
        </div>
        <h1 className="text-6xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-none">
          Everything for <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600 italic">Renal Mastery.</span>
        </h1>
        <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
          A modular, secure, and clinical-grade platform designed to simplify the complexities of living with chronic kidney disease.
        </p>
      </header>

      {/* Features Bento Grid */}
      <main className="max-w-7xl mx-auto px-8 pb-40 space-y-32">
        {/* Features list rendering here */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {mainFeatures.map((f, i) => (
             <div key={i} className="group bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-3xl hover:border-sky-100 transition-all duration-500 flex flex-col">
                <div className={`${f.color} w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white mb-8 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                   <f.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4">{f.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-10 flex-1">{f.desc}</p>
                <div className="space-y-3">
                   {f.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-sky-400"></div>
                         {detail}
                      </div>
                   ))}
                </div>
             </div>
           ))}
        </div>

        {/* Deep Dive Section */}
        <section className="bg-slate-900 rounded-[5rem] p-16 lg:p-24 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">
              <div className="space-y-10">
                 <div className="space-y-6">
                    <span className="text-[10px] font-black text-sky-400 uppercase tracking-[0.4em]">Integrated Intelligence</span>
                    <h2 className="text-5xl lg:text-6xl font-black tracking-tighter leading-none">Built for Patients,<br/>Trusted by Clinics.</h2>
                 </div>
                 <p className="text-white/50 text-xl font-medium leading-relaxed">
                    dialysis.live bridges the gap between home treatment and clinical oversight. Our API-driven architecture ensures your data is always accurate and ready for review.
                 </p>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <span className="text-3xl font-black">256-bit</span>
                       <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">End-to-End Encryption</p>
                    </div>
                    <div className="space-y-2">
                       <span className="text-3xl font-black">Sync</span>
                       <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Real-time Telemetry</p>
                    </div>
                 </div>
              </div>
              <div className="bg-white/5 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/10 space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L14.4 9.6H22L15.8 14.3L18.2 22L12 17.3L5.8 22L8.2 14.3L2 9.6H9.6L12 2Z"/></svg>
                    </div>
                    <div>
                       <h4 className="font-black text-lg">Platform Security</h4>
                       <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Clinical Standards</p>
                    </div>
                 </div>
                 <p className="italic text-sky-100/60 font-medium leading-relaxed">
                   "We prioritize your privacy. All health records are stored in encrypted databases and accessible only to you and your authorized caregivers."
                 </p>
                 <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Verified Compliant</span>
                    <div className="flex gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30"></div>
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/10"></div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* CTA */}
        <section className="text-center space-y-12">
           <div className="space-y-6">
              <h2 className="text-5xl font-black text-slate-900 tracking-tight">Ready to streamline your care?</h2>
              <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto">Join the modern renal management community and take back control of your treatment schedule.</p>
           </div>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/register" className="w-full sm:w-auto px-16 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-sky-600 transition-all active:scale-95">Initialize Hub</Link>
              <Link to="/login" className="w-full sm:w-auto px-16 py-8 bg-slate-50 text-slate-900 rounded-[2.5rem] font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all">Member Login</Link>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-50 bg-slate-50/30">
         <div className="max-w-7xl mx-auto px-10 flex flex-col items-center gap-12">
            <div className="w-full flex flex-col md:flex-row justify-between items-center gap-8">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm">D</div>
                  <span className="font-bold text-slate-900 tracking-tight">dialysis.live</span>
               </div>
               <div className="flex gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
                  <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
                  <p className="normal-case">Website developed by <a href="https://kaspar.works/" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-pink-600 transition-colors">kaspar.works</a></p>
               </div>
            </div>
            
            <div className="text-center space-y-4">
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">© 2025 dialysis.live • Bio-Vibrant Architecture</p>
               <p className="text-slate-400 text-[10px] font-bold max-w-3xl mx-auto uppercase tracking-widest leading-relaxed">
                  Important Medical Disclaimer: This platform is for tracking only and does not provide medical advice. 
                  Please consult your doctor for all medical decisions. This platform is intended for tracking and informational purposes only.
               </p>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default Features;
