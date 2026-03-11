import React, { useEffect } from 'react';
import { Link } from 'react-router';
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
      details: ["Visual food recognition", "Renal safety scoring", "Nutrient breakdown", "Meal history logging", "Kidney-friendly food database"]
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
      title: "AI Health Assistant",
      subtitle: "Chat & Insights",
      desc: "Ask health questions, get personalized insights, and receive AI-powered recommendations tailored to your dialysis journey.",
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
      color: "from-indigo-500 to-violet-500",
      details: ["AI health chat", "Symptom analysis", "Lab report interpretation", "Medication interaction checks", "Personalized recommendations"]
    },
    {
      title: "Lab Reports",
      subtitle: "Diagnostics",
      desc: "Store, track, and analyze your lab results over time. AI-powered interpretation highlights trends and flags results outside reference ranges.",
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/></svg>,
      color: "from-fuchsia-500 to-pink-500",
      details: ["Lab result logging", "Reference range alerts", "AI-powered interpretation", "Trend visualization", "Dialysis-specific markers"]
    },
    {
      title: "Symptom Tracker",
      subtitle: "Health Logging",
      desc: "Log symptoms with severity levels, link them to dialysis sessions, and identify patterns with your care team.",
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
      color: "from-red-500 to-rose-500",
      details: ["Severity scale (1-5)", "Common dialysis symptoms", "Session-linked logging", "Trigger tracking", "Pattern identification"]
    },
    {
      title: "Clinical Reports",
      subtitle: "Provider-Ready",
      desc: "Generate professional PDF summaries for your healthcare team. Customize date ranges and include all synchronized vitals and outcomes.",
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
      color: "from-slate-500 to-gray-600",
      details: ["PDF export", "JSON data export", "Custom date ranges", "Provider-ready layouts", "Comprehensive health summaries"]
    },
    {
      title: "Appointments",
      subtitle: "Scheduling",
      desc: "Manage dialysis appointments, doctor visits, and lab work schedules. Calendar view with reminders and status tracking.",
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      color: "from-teal-500 to-cyan-500",
      details: ["Calendar view", "Appointment reminders", "Status tracking", "Multiple appointment types", "Upcoming & history views"]
    },
    {
      title: "Community & Forums",
      subtitle: "Patient Network",
      desc: "Connect with other dialysis patients, share experiences, and learn from the community. Healthcare provider verified badges.",
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      color: "from-blue-500 to-indigo-500",
      details: ["Discussion forums", "Success stories", "HCP verified badges", "Topic categories", "Helpful reply system"]
    },
    {
      title: "Emergency Card",
      subtitle: "Safety First",
      desc: "Digital emergency card with your dialysis type, access site, allergies, and emergency contacts. One-tap emergency calling.",
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
      color: "from-red-600 to-red-500",
      details: ["Medical ID card", "One-tap emergency call", "Access site info", "Allergy list", "Emergency contacts"]
    },
    {
      title: "Apple Watch",
      subtitle: "Companion App",
      desc: "Full companion app for Apple Watch. Track sessions, log vitals, monitor fluids, and manage medications right from your wrist.",
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><rect x="5" y="2" width="14" height="20" rx="7"/><rect x="7" y="6" width="10" height="12" rx="2"/></svg>,
      color: "from-gray-500 to-zinc-600",
      details: ["Session timer & tracking", "Vitals monitoring", "Fluid intake logging", "Medication reminders", "HealthKit integration"]
    },
    {
      title: "Education Hub",
      subtitle: "Learning Center",
      desc: "Expert-reviewed educational content on diet, care guides, and mental wellness specifically for dialysis patients.",
      icon: ICONS.Book,
      color: "from-cyan-500 to-sky-500",
      details: ["Diet & nutrition guides", "Care best practices", "Mental wellness support", "Searchable articles", "Bookmark favorites"]
    },
  ];

  const securityFeatures = [
    { title: "256-bit Encryption", desc: "End-to-end encryption for all health data" },
    { title: "Privacy First", desc: "Your data stays private and secure" },
    { title: "JWT Auth", desc: "Secure token-based authentication" },
    { title: "Secure Sync", desc: "Encrypted cloud sync via HTTPS" }
  ];

  const integrations = [
    { name: "Google Gemini", desc: "AI-powered nutrition & health analysis", icon: "AI" },
    { name: "Apple HealthKit", desc: "Sync vitals, weight & activity", icon: "HK" },
    { name: "PDF Export", desc: "Provider-ready report generation", icon: "PDF" },
    { name: "REST API", desc: "Full data portability & export", icon: "API" }
  ];

  // Inject Breadcrumb structured data
  useEffect(() => {
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://dialysis.live"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Features",
          "item": "https://dialysis.live/features"
        }
      ]
    };

    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.id = 'breadcrumb-schema';
    breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);

    // Remove existing script if any (for hot reload)
    const existing = document.getElementById('breadcrumb-schema');
    if (existing) existing.remove();

    document.head.appendChild(breadcrumbScript);

    return () => {
      const el = document.getElementById('breadcrumb-schema');
      if (el) el.remove();
    };
  }, []);

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
      <nav className="fixed top-0 left-0 right-0 h-16 sm:h-20 md:h-24 border-b border-white/5 bg-[#020617]/40 backdrop-blur-3xl flex items-center justify-between px-4 sm:px-6 md:px-20 z-[100] safe-pt">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 md:gap-4 group">
          <Logo className="w-8 h-8 md:w-12 md:h-12" />
          <span className="font-black text-base sm:text-lg md:text-2xl tracking-tighter text-white">dialysis.live</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4 md:gap-12">
          <Link to="/" className="hidden sm:block text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Home</Link>
          <Link to="/pricing" className="hidden sm:block text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Pricing</Link>
          <Link to="/login" className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Login</Link>
          <Link to="/register" className="px-4 sm:px-5 md:px-10 py-2.5 sm:py-3 md:py-4 bg-white text-slate-950 rounded-xl md:rounded-2xl font-black text-[9px] md:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all">Join</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-28 sm:pt-40 md:pt-56 pb-12 sm:pb-20 md:pb-32 px-4 sm:px-6 md:px-20 max-w-[1440px] mx-auto text-center space-y-6 sm:space-y-8">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] backdrop-blur-xl">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
          </span>
          Platform Capabilities
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85]">
          Complete <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-pink-400 to-emerald-400">Feature Set.</span>
        </h1>
        <p className="text-white/40 text-lg md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
          Fifteen powerful modules designed specifically for dialysis patients. Everything you need to track, analyze, and optimize your renal health journey.
        </p>
      </header>

      {/* Features Grid */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-20 pb-16 sm:pb-24 md:pb-40 space-y-16 sm:space-y-24 md:space-y-32">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {coreFeatures.map((f, i) => (
            <div
              key={i}
              className="group bg-white/5 backdrop-blur-xl p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] border border-white/5 overflow-hidden hover:border-white/20 hover:bg-white/[0.08] transition-all duration-500 flex flex-col"
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
        <section className="relative bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-[3rem] md:rounded-[4rem] p-6 sm:p-10 md:p-20 border border-white/10 overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Security & Privacy</span>
                <h2 className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tighter leading-none">Built for Trust.<br/>Designed for Care.</h2>
              </div>
              <p className="text-white/40 text-lg md:text-xl font-medium leading-relaxed">
                Your health data deserves the highest level of protection. We've built dialysis.live with privacy-first architecture and clinical-grade security standards.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {securityFeatures.map((sf, i) => (
                  <div key={i} className="space-y-2">
                    <span className="text-xl md:text-2xl font-black text-white">{sf.title}</span>
                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest">{sf.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/50 backdrop-blur-3xl p-6 sm:p-10 md:p-12 rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] border border-white/10 space-y-6 sm:space-y-8">
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
            <h2 className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tighter">Modern Technology Stack.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {integrations.map((int, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-white/5 hover:border-white/20 transition-all group">
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
        <section className="relative bg-gradient-to-br from-sky-500/20 via-pink-500/10 to-emerald-500/20 rounded-2xl sm:rounded-[3rem] md:rounded-[5rem] p-6 sm:p-12 md:p-24 border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-[#020617]/60 backdrop-blur-xl"></div>
          <div className="relative z-10 text-center space-y-8">
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter">
              Ready to Take Control?
            </h2>
            <p className="text-white/40 text-lg md:text-xl font-medium max-w-xl mx-auto">
              Join thousands of dialysis patients managing their health with clinical-grade tracking tools.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 pt-4">
              <Link to="/register" className="w-full sm:w-auto px-8 sm:px-12 md:px-16 py-4 sm:py-6 md:py-8 bg-white text-slate-950 rounded-2xl sm:rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:scale-105 active:scale-95 transition-all text-center">Start Free Today</Link>
              <Link to="/pricing" className="w-full sm:w-auto px-8 sm:px-12 md:px-16 py-4 sm:py-6 md:py-8 bg-white/5 border border-white/10 text-white rounded-2xl sm:rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:bg-white/10 transition-all text-center">View Pricing</Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 sm:py-20 md:py-24 px-4 sm:px-6 md:px-20 border-t border-white/5 bg-black">
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
            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">© 2026 dialysis.live. All rights reserved.</p>
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
