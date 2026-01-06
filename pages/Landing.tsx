import React from 'react';
import { Link } from 'react-router';
import { ICONS, COLORS } from '../constants';
import Logo from '../components/Logo';
import SEO from '../components/SEO';

const Landing: React.FC = () => {
  const allFeatures = [
    {
      title: 'Cycle Sync',
      desc: 'Real-time dialysis session tracking with clinical telemetry. Log pre/post vitals, track duration, and rate your treatments.',
      icon: ICONS.Activity,
      color: 'from-orange-500 to-red-500',
      tag: 'Sessions',
      highlight: true
    },
    {
      title: 'Nutri-Scan AI',
      desc: 'Snap a photo of any meal. Our AI analyzes sodium, potassium, and phosphorus levels for kidney safety.',
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
      color: 'from-emerald-500 to-teal-500',
      tag: 'AI Vision',
      highlight: true
    },
    {
      title: 'Vitals Hub',
      desc: 'Track blood pressure, heart rate, temperature, and oxygen saturation. Visualize trends over time.',
      icon: ICONS.Vitals,
      color: 'from-pink-500 to-rose-500',
      tag: 'Monitoring'
    },
    {
      title: 'Biometrics',
      desc: 'Monitor inter-dialytic weight gain. Track dry weight stability with morning vs session comparisons.',
      icon: ICONS.Scale,
      color: 'from-violet-500 to-purple-500',
      tag: 'Weight'
    },
    {
      title: 'Fluid Ledger',
      desc: 'Precision hydration management with daily limits. Quick-add presets and remaining allowance tracking.',
      icon: ICONS.Droplet,
      color: 'from-sky-500 to-blue-500',
      tag: 'Hydration'
    },
    {
      title: 'Med Adherence',
      desc: 'Smart medication tracking for dialysis schedules. Differentiate on-dialysis vs off-dialysis dosing.',
      icon: ICONS.Pill,
      color: 'from-amber-500 to-orange-500',
      tag: 'Medications'
    },
    {
      title: 'Clinical Reports',
      desc: 'Generate provider-ready reports. Export to PDF or JSON with customizable date ranges.',
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
      color: 'from-slate-500 to-gray-600',
      tag: 'Reports'
    },
    {
      title: 'Education Hub',
      desc: 'Expert-reviewed articles on diet, care guides, and mental wellness for dialysis patients.',
      icon: ICONS.Book,
      color: 'from-cyan-500 to-sky-500',
      tag: 'Learning'
    },
    {
      title: 'Wellness Tracking',
      desc: 'Log your daily mood and energy levels. Correlate wellness with treatment outcomes.',
      icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
      color: 'from-green-500 to-emerald-500',
      tag: 'Wellness'
    }
  ];

  const stats = [
    { value: '9+', label: 'Core Features' },
    { value: '256-bit', label: 'Encryption' },
    { value: '24/7', label: 'Access' },
    { value: '100%', label: 'Private' }
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Create Your Profile',
      desc: 'Set up your dialysis type, treatment schedule, and health goals in minutes.'
    },
    {
      step: '02',
      title: 'Track Everything',
      desc: 'Log sessions, vitals, fluids, and meals. Our AI helps analyze your nutrition.'
    },
    {
      step: '03',
      title: 'Gain Insights',
      desc: 'View trends, stability scores, and generate reports for your care team.'
    }
  ];

  const testimonials = [
    {
      quote: "Finally, an app that understands the dialysis lifestyle. The fluid tracking alone has helped me stay within my limits.",
      author: "Sarah M.",
      role: "Home HD Patient"
    },
    {
      quote: "The Nutri-Scan feature is incredible. I can check if a food is kidney-safe before eating it.",
      author: "James T.",
      role: "In-Center Patient"
    },
    {
      quote: "Being able to generate reports for my nephrologist saves so much time during appointments.",
      author: "Maria L.",
      role: "PD Patient"
    }
  ];

  return (
    <div className="bg-[#020617] min-h-screen selection:bg-sky-500/30 selection:text-white overflow-x-hidden text-white w-full">
      <SEO
        title="The Modern Standard for Renal Care"
        description="Unified dialysis tracking, AI nutrition scanning, and clinical biometric monitoring. Track sessions, vitals, fluids, medications, and more."
      />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[100vw] h-[100vw] bg-sky-900/20 rounded-full blur-[100px] md:blur-[160px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-pink-900/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-[50%] left-[50%] w-[60vw] h-[60vw] bg-emerald-900/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 md:h-24 border-b border-white/5 bg-[#020617]/40 backdrop-blur-3xl flex items-center justify-between px-6 md:px-20 z-[100] safe-pt">
        <Link to="/" className="flex items-center gap-3 md:gap-4 group">
          <Logo className="w-8 h-8 md:w-12 md:h-12" />
          <span className="font-black text-lg md:text-2xl tracking-tighter text-white">dialysis.live</span>
        </Link>
        <div className="flex items-center gap-4 md:gap-12">
          <Link to="/features" className="hidden sm:block text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Features</Link>
          <Link to="/pricing" className="hidden sm:block text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Pricing</Link>
          <Link to="/login" className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Login</Link>
          <Link to="/register" className="px-5 md:px-10 py-3 md:py-4 bg-white text-slate-950 rounded-xl md:rounded-2xl font-black text-[9px] md:text-xs uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all">Join</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-32 md:pt-32 pb-24 md:pb-40 px-6 md:px-20 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <div className="lg:col-span-7 space-y-8 md:space-y-12 text-center lg:text-left animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] backdrop-blur-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
              All-in-One Dialysis Management
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-[0.9] text-white">
              Your<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-pink-400 to-orange-400">Renal</span><br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Companion.</span>
            </h1>
            <p className="text-white/40 text-lg md:text-2xl lg:text-3xl font-medium max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Track treatments, vitals, nutrition, and medications in one clinical-grade platform. AI-powered insights for better outcomes.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 pt-6 md:pt-8 justify-center lg:justify-start">
              <Link to="/register" className="w-full sm:w-auto px-10 md:px-16 py-6 md:py-8 bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-[2rem] md:rounded-[2.5rem] font-black text-xs md:text-sm uppercase tracking-[0.4em] shadow-[0_20px_80px_-20px_rgba(14,165,233,0.5)] hover:shadow-[0_30px_100px_-20px_rgba(14,165,233,0.7)] hover:-translate-y-2 transition-all active:scale-95 text-center">Start Free</Link>
              <Link to="/features" className="w-full sm:w-auto flex items-center justify-center gap-4 text-white font-black text-xs md:text-sm uppercase tracking-[0.3em] group px-10 py-6 md:py-8 rounded-[2rem] md:rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                Explore Features
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-2 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>

          {/* Hero Card - Dashboard Preview */}
          <div className="lg:col-span-5 relative group animate-in fade-in zoom-in-95 duration-1000 delay-300 px-4 sm:px-0">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-pink-500 to-emerald-500 rounded-[3rem] md:rounded-[5rem] blur-[60px] md:blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
            <div className="relative z-10 bg-white/5 backdrop-blur-3xl p-4 md:p-6 rounded-[3rem] md:rounded-[5rem] border border-white/10 shadow-2xl">
              <div className="bg-slate-950 p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border border-white/5 space-y-6 md:space-y-8">
                {/* Stability Score */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[8px] md:text-[10px] font-black text-white/30 uppercase tracking-widest">Stability Score</p>
                    <h4 className="text-4xl md:text-5xl font-black text-emerald-400 tabular-nums">87<span className="text-lg text-white/30 ml-1">%</span></h4>
                  </div>
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" style={{ animationDuration: '3s' }}></div>
                    <ICONS.Activity className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" />
                  </div>
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2">Blood Pressure</p>
                    <p className="text-xl font-black">128/82</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2">Fluid Today</p>
                    <p className="text-xl font-black text-sky-400">850<span className="text-sm text-white/30 ml-1">ml</span></p>
                  </div>
                </div>

                {/* Treatment Progress */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[8px] md:text-[10px] font-black text-white/30 uppercase tracking-widest">Session Progress</span>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
                  </div>
                  <div className="h-3 md:h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                    <div className="h-full w-[72%] bg-gradient-to-r from-sky-500 via-pink-500 to-orange-400 rounded-full shadow-[0_0_20px_rgba(14,165,233,0.4)]"></div>
                  </div>
                  <p className="text-[10px] text-white/30 text-right">2h 52m / 4h 00m</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 md:py-20 px-6 md:px-20 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
          {stats.map((stat, i) => (
            <div key={i} className="text-center space-y-2">
              <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">{stat.value}</h3>
              <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/30">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* All Features Section */}
      <section className="py-24 md:py-40 px-6 md:px-20 max-w-[1440px] mx-auto relative">
        <div className="text-center space-y-6 mb-16 md:mb-24">
          <span className="text-[9px] md:text-[10px] font-black text-sky-400 uppercase tracking-[0.3em] md:tracking-[0.5em]">Complete Toolkit</span>
          <h2 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-none">
            Everything You Need.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/60 to-white/20">Nothing You Don't.</span>
          </h2>
          <p className="text-white/40 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Nine powerful modules designed specifically for dialysis patients. Track, analyze, and optimize your renal health journey. <Link to="/features" className="text-sky-400 hover:text-sky-300 underline underline-offset-4">Explore all features</Link>.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {allFeatures.map((f, i) => (
            <div
              key={i}
              className={`group relative bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 overflow-hidden hover:border-white/20 hover:bg-white/[0.08] transition-all duration-500 ${f.highlight ? 'lg:col-span-1 ring-1 ring-white/10' : ''}`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-5`}></div>
              </div>

              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className={`bg-gradient-to-br ${f.color} w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    <f.icon className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                  <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/40">{f.tag}</span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight">{f.title}</h3>
                  <p className="text-white/40 text-sm md:text-base font-medium leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 md:py-40 px-6 md:px-20 bg-gradient-to-b from-transparent via-sky-950/20 to-transparent">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center space-y-6 mb-16 md:mb-24">
            <span className="text-[9px] md:text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] md:tracking-[0.5em]">Simple Process</span>
            <h2 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-none">How It Works.</h2>
            <p className="text-white/40 text-lg md:text-xl font-medium max-w-xl mx-auto">
              Get started in minutes. <Link to="/register" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">Create your free account</Link> today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {howItWorks.map((item, i) => (
              <div key={i} className="relative group">
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-full h-[2px] bg-gradient-to-r from-white/10 to-transparent"></div>
                )}
                <div className="space-y-6">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                    <span className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-sky-400 to-emerald-400">{item.step}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight">{item.title}</h3>
                  <p className="text-white/40 text-base md:text-lg font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 md:py-40 px-6 md:px-20 max-w-[1440px] mx-auto">
        <div className="text-center space-y-6 mb-16 md:mb-24">
          <span className="text-[9px] md:text-[10px] font-black text-pink-400 uppercase tracking-[0.3em] md:tracking-[0.5em]">Patient Stories</span>
          <h2 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-none">Trusted by<br/>Patients.</h2>
          <p className="text-white/40 text-lg md:text-xl font-medium max-w-xl mx-auto">
            See what patients are saying about their experience. <Link to="/pricing" className="text-pink-400 hover:text-pink-300 underline underline-offset-4">View our plans</Link>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all space-y-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-white/10">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>
              <p className="text-white/60 text-base md:text-lg font-medium leading-relaxed">{t.quote}</p>
              <div className="pt-4 border-t border-white/5">
                <p className="font-black text-white">{t.author}</p>
                <p className="text-sm text-white/30">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-40 px-6 md:px-20">
        <div className="max-w-[1440px] mx-auto">
          <div className="relative bg-gradient-to-br from-sky-500/20 via-pink-500/10 to-emerald-500/20 rounded-[3rem] md:rounded-[5rem] p-12 md:p-24 border border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-[#020617]/60 backdrop-blur-xl"></div>
            <div className="relative z-10 text-center space-y-8">
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter">
                Start Your Journey<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">Today.</span>
              </h2>
              <p className="text-white/40 text-lg md:text-xl font-medium max-w-xl mx-auto">
                Join thousands of dialysis patients taking control of their health with clinical-grade tracking. Read our <Link to="/privacy" className="text-sky-400 hover:text-sky-300 underline underline-offset-4">privacy policy</Link> and <Link to="/terms" className="text-sky-400 hover:text-sky-300 underline underline-offset-4">terms of service</Link>.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 pt-4">
                <Link to="/register" className="w-full sm:w-auto px-12 md:px-16 py-6 md:py-8 bg-white text-slate-950 rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all">Create Free Account</Link>
                <Link to="/edu" className="w-full sm:w-auto px-12 md:px-16 py-6 md:py-8 bg-white/5 border border-white/10 text-white rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-[0.3em] hover:bg-white/10 transition-all">Learn More</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative pt-20 pb-12 px-6 md:px-20 overflow-hidden">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent"></div>

        <div className="max-w-[1440px] mx-auto">
          {/* Main footer content */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-12 pb-16">
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
            <p className="text-xs text-white/30">© 2025 dialysis.live</p>
            <p className="text-xs text-white/30">Made with care for the dialysis community</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
