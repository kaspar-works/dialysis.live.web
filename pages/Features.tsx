import React from 'react';
import { Link } from 'react-router-dom';
import { ICONS } from '../constants';
import Logo from '../components/Logo';
import SEO from '../components/SEO';

const Features: React.FC = () => {
  const coreFeatures = [
    {
      title: "Cycle Sync",
      subtitle: "Session Tracking",
      desc: "Comprehensive dialysis session lifecycle management. Track from pre-treatment weight to post-treatment summary with real-time duration monitoring.",
      icon: ICONS.Activity,
      color: "from-orange-500 to-red-500",
      details: ["Real-time duration tracking", "Pre/Post vital synchronization", "Event logging (pain, notes, meds)", "Session rating & outcomes", "Complete history archive"]
    },
    {
      title: "Nutri-Scan AI",
      subtitle: "AI Vision",
      desc: "Snap a photo of any meal and get instant analysis. Our Gemini-powered AI evaluates sodium, potassium, and phosphorus levels for kidney safety.",
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
      color: "from-emerald-500 to-teal-500",
      details: ["Visual food recognition", "Renal safety scoring", "Nutrient breakdown", "Meal history logging", "Common foods database"]
    },
    {
      title: "Vitals Hub",
      subtitle: "Health Monitoring",
      desc: "Track all your vital signs in one place. Blood pressure, heart rate, temperature, and oxygen saturation with trend visualization.",
      icon: ICONS.Vitals,
      color: "from-pink-500 to-rose-500",
      details: ["Blood pressure tracking", "Heart rate monitoring", "Temperature logging", "SpO2 saturation", "Historical trend charts"]
    },
    {
      title: "Biometrics",
      subtitle: "Weight Analytics",
      desc: "Monitor inter-dialytic weight gain with precision. Track dry weight stability and compare morning vs session measurements.",
      icon: ICONS.Scale,
      color: "from-violet-500 to-purple-500",
      details: ["Dry weight goals", "Automated variance calculation", "Morning vs Session tracking", "7+ day trend charts", "Weight change alerts"]
    },
    {
      title: "Fluid Ledger",
      subtitle: "Hydration Control",
      desc: "Stay within clinical volume limits with a dynamic intake ledger. Visual progress indicators and smart remaining allowance tracking.",
      icon: ICONS.Droplet,
      color: "from-sky-500 to-blue-500",
      details: ["Custom daily limits", "Beverage classification", "Quick-add presets", "Visual progress bars", "Remaining allowance alerts"]
    },
    {
      title: "Med Adherence",
      subtitle: "Medication Protocol",
      desc: "Smart medication tracking designed for renal schedules. Distinguish between dialysis and off-day dosing with adherence metrics.",
      icon: ICONS.Pill,
      color: "from-amber-500 to-orange-500",
      details: ["Dialysis day logic", "Binder reminders", "Adherence metrics", "Medication cabinet", "Dose scheduling"]
    },
    {
      title: "Clinical Reports",
      subtitle: "Provider-Ready",
      desc: "Generate professional PDF summaries for your healthcare team. Customize date ranges and include all synchronized vitals and outcomes.",
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
      color: "from-slate-500 to-gray-600",
      details: ["PDF export", "JSON data export", "Custom date ranges", "Provider-ready layouts", "Saved report templates"]
    },
    {
      title: "Education Hub",
      subtitle: "Learning Center",
      desc: "Expert-reviewed educational content on diet, care guides, and mental wellness specifically for dialysis patients.",
      icon: ICONS.Book,
      color: "from-cyan-500 to-sky-500",
      details: ["Diet & nutrition guides", "Care best practices", "Mental wellness support", "Video tutorials", "Expert Q&A"]
    },
    {
      title: "Wellness Tracking",
      subtitle: "Mood & Energy",
      desc: "Log your daily mood and energy levels. Correlate wellness patterns with treatment outcomes for holistic health insights.",
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
      color: "from-green-500 to-emerald-500",
      details: ["Daily mood logging", "Energy level tracking", "Treatment correlation", "Wellness patterns", "Mental health insights"]
    }
  ];

  const securityFeatures = [
    { title: "256-bit Encryption", desc: "End-to-end encryption for all health data" },
    { title: "HIPAA Ready", desc: "Built with healthcare compliance in mind" },
    { title: "Local-First", desc: "Your data stays on your device first" },
    { title: "Secure Sync", desc: "Encrypted cloud backup with Firebase" }
  ];

  const integrations = [
    { name: "Google Gemini", desc: "AI-powered nutrition analysis", icon: "AI" },
    { name: "Firebase", desc: "Secure authentication & storage", icon: "DB" },
    { name: "PDF Export", desc: "Provider-ready report generation", icon: "PDF" },
    { name: "JSON Export", desc: "Full data portability", icon: "API" }
  ];

  return (
    <div className="bg-[#020617] min-h-screen selection:bg-sky-500/30 selection:text-white overflow-x-hidden text-white w-full">
      <SEO
        title="Features - Complete Dialysis Management Toolkit"
        description="Explore all features of dialysis.live: session tracking, AI nutrition scanning, vitals monitoring, fluid management, medication adherence, and clinical reports."
      />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[100vw] h-[100vw] bg-sky-900/20 rounded-full blur-[100px] md:blur-[160px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-pink-900/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-[40%] right-[20%] w-[50vw] h-[50vw] bg-emerald-900/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 md:h-24 border-b border-white/5 bg-[#020617]/40 backdrop-blur-3xl flex items-center justify-between px-6 md:px-20 z-[100] safe-pt">
        <Link to="/" className="flex items-center gap-3 md:gap-4 group">
          <Logo className="w-8 h-8 md:w-12 md:h-12" />
          <span className="font-black text-lg md:text-2xl tracking-tighter text-white">dialysis.live</span>
        </Link>
        <div className="flex items-center gap-4 md:gap-12">
          <Link to="/" className="hidden sm:block text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Home</Link>
          <Link to="/pricing" className="hidden sm:block text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Pricing</Link>
          <Link to="/login" className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Login</Link>
          <Link to="/register" className="px-5 md:px-10 py-3 md:py-4 bg-white text-slate-950 rounded-xl md:rounded-2xl font-black text-[9px] md:text-xs uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all">Join</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-40 md:pt-56 pb-20 md:pb-32 px-6 md:px-20 max-w-[1440px] mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] backdrop-blur-xl">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
          </span>
          Platform Capabilities
        </div>
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85]">
          Complete <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-pink-400 to-emerald-400">Feature Set.</span>
        </h1>
        <p className="text-white/40 text-lg md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
          Nine powerful modules designed specifically for dialysis patients. Everything you need to track, analyze, and optimize your renal health journey.
        </p>
      </header>

      {/* Features Grid */}
      <main className="max-w-[1440px] mx-auto px-6 md:px-20 pb-24 md:pb-40 space-y-32">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {coreFeatures.map((f, i) => (
            <div
              key={i}
              className="group bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 overflow-hidden hover:border-white/20 hover:bg-white/[0.08] transition-all duration-500 flex flex-col"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-5`}></div>
              </div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className={`bg-gradient-to-br ${f.color} w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    <f.icon className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                  <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/40">{f.subtitle}</span>
                </div>

                <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-3">{f.title}</h3>
                <p className="text-white/40 text-sm md:text-base font-medium leading-relaxed mb-8 flex-1">{f.desc}</p>

                <div className="space-y-3 pt-6 border-t border-white/5">
                  {f.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs font-bold text-white/30 group-hover:text-white/50 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-sky-400 transition-colors"></div>
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Security & Trust Section */}
        <section className="relative bg-white/5 backdrop-blur-xl rounded-[3rem] md:rounded-[4rem] p-12 md:p-20 border border-white/10 overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Security & Privacy</span>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">Built for Trust.<br/>Designed for Care.</h2>
              </div>
              <p className="text-white/40 text-lg md:text-xl font-medium leading-relaxed">
                Your health data deserves the highest level of protection. We've built dialysis.live with privacy-first architecture and clinical-grade security standards.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {securityFeatures.map((sf, i) => (
                  <div key={i} className="space-y-2">
                    <span className="text-xl md:text-2xl font-black text-white">{sf.title}</span>
                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest">{sf.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/50 backdrop-blur-3xl p-10 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <h4 className="font-black text-xl">Data Protection</h4>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Clinical Standards</p>
                </div>
              </div>
              <p className="text-white/50 font-medium leading-relaxed">
                All health records are encrypted at rest and in transit. Your data is stored locally first, with optional secure cloud sync. Only you and your authorized caregivers have access.
              </p>
              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Verified Compliant</span>
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500/20"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="text-center space-y-12">
          <div className="space-y-4">
            <span className="text-[10px] font-black text-pink-400 uppercase tracking-[0.4em]">Powered By</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Modern Technology Stack.</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {integrations.map((int, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 hover:border-white/20 transition-all group">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white/60 font-black text-sm mb-4 group-hover:bg-white/20 transition-all mx-auto">
                  {int.icon}
                </div>
                <h4 className="font-black text-lg mb-1">{int.name}</h4>
                <p className="text-white/30 text-xs font-medium">{int.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="relative bg-gradient-to-br from-sky-500/20 via-pink-500/10 to-emerald-500/20 rounded-[3rem] md:rounded-[5rem] p-12 md:p-24 border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-[#020617]/60 backdrop-blur-xl"></div>
          <div className="relative z-10 text-center space-y-8">
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter">
              Ready to Take Control?
            </h2>
            <p className="text-white/40 text-lg md:text-xl font-medium max-w-xl mx-auto">
              Join thousands of dialysis patients managing their health with clinical-grade tracking tools.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 pt-4">
              <Link to="/register" className="w-full sm:w-auto px-12 md:px-16 py-6 md:py-8 bg-white text-slate-950 rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all">Start Free Today</Link>
              <Link to="/pricing" className="w-full sm:w-auto px-12 md:px-16 py-6 md:py-8 bg-white/5 border border-white/10 text-white rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-[0.3em] hover:bg-white/10 transition-all">View Pricing</Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 md:py-24 px-6 md:px-20 border-t border-white/5 bg-black">
        <div className="max-w-[1440px] mx-auto space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <Logo className="w-8 h-8" />
              <span className="font-black text-lg tracking-tighter">dialysis.live</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-[10px] font-black text-white/40 uppercase tracking-widest">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link to="/edu" className="hover:text-white transition-colors">Education</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
          <div className="text-center space-y-4 pt-8 border-t border-white/5">
            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">© 2025 dialysis.live. All rights reserved.</p>
            <p className="text-white/20 text-[10px] font-bold max-w-3xl mx-auto uppercase tracking-widest leading-relaxed">
              Medical Disclaimer: This platform is for tracking purposes only and does not provide medical advice.
              Please consult your healthcare provider for all medical decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Features;
