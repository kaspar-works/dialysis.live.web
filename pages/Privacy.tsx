
import React from 'react';
import { Link } from 'react-router-dom';

const Privacy: React.FC = () => {
  const sections = [
    {
      id: 'collection',
      title: '1. Information We Collect',
      content: [
        { subtitle: 'a. Personal Information', items: ['Name', 'Email address', 'Account credentials', 'Time zone and preferences'] },
        { subtitle: 'b. Health & Dialysis Information', items: ['Dialysis session details (start time, duration, type)', 'Weight records', 'Fluid intake logs', 'Medication information', 'Symptoms and notes', 'Optional vitals (e.g., blood pressure)'] },
        { subtitle: 'c. Technical Information', items: ['Browser type and version', 'Device type', 'IP address', 'Log data for security and performance'] }
      ]
    },
    {
      id: 'usage',
      title: '2. How We Use Your Information',
      text: 'We use your information to provide and maintain the Platform, enable dialysis session tracking, generate clinical summaries, and improve platform reliability. We do not use your data for advertising or sell it to third parties.'
    },
    {
      id: 'disclaimer',
      title: '3. Health Information Disclaimer',
      text: 'The Platform is a support and tracking tool only. It does not provide medical advice, diagnosis, or treatment. All health decisions should be made with a qualified healthcare professional.'
    },
    {
      id: 'security',
      title: '4. Data Storage & Security',
      text: 'We utilize secure database storage, encryption in transit, and multi-factor authentication protocols. While we strive to protect your information, no system can be guaranteed 100% secure.'
    }
  ];

  return (
    <div className="bg-white min-h-screen selection:bg-sky-100 selection:text-sky-900">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 h-24 bg-white/70 backdrop-blur-2xl border-b border-slate-100 flex items-center justify-between px-10 lg:px-20 z-50">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:rotate-6 transition-transform">D</div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">dialysis.live</span>
        </Link>
        <Link to="/login" className="px-8 py-3 bg-slate-50 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Dashboard Login</Link>
      </nav>

      {/* Hero Section */}
      <header className="pt-48 pb-20 px-8 max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-sky-50 text-sky-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-sky-100">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
           Data Protection Protocol
        </div>
        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-none">Privacy Policy</h1>
        <p className="text-slate-500 text-lg font-medium">Effective Date: May 20, 2024</p>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 pb-40 space-y-20">
        <section className="p-12 bg-slate-50 rounded-[3.5rem] border border-slate-100">
          <p className="text-slate-600 text-lg leading-relaxed font-medium italic text-center">
            "Your privacy matters to dialysis.live. This Privacy Policy explains how we collect, use, store, and protect your information when you use our management platform."
          </p>
        </section>

        <div className="space-y-24">
          {/* Loop through sections array to render content */}
          {sections.map((s) => (
            <section key={s.id} className="space-y-8">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{s.title}</h2>
              {s.text && (
                <p className="text-slate-600 text-lg leading-relaxed">{s.text}</p>
              )}
              {s.content && (
                <div className="space-y-10 pl-4">
                  {s.content.map((c, i) => (
                    <div key={i} className="space-y-4">
                      <h3 className="text-xl font-bold text-slate-800">{c.subtitle}</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {c.items.map((item, j) => (
                          <li key={j} className="flex items-center gap-3 text-slate-500 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Contact Footer */}
        <section className="bg-slate-900 p-16 rounded-[4rem] text-white space-y-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="space-y-4 relative">
             <h3 className="text-4xl font-black tracking-tight">11. Contact Us</h3>
             <p className="text-white/50 text-xl font-medium max-w-xl mx-auto">Questions about your data or our privacy practices?</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 relative">
             <div className="space-y-1">
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Support Email</span>
                <p className="text-2xl font-bold">privacy@dialysis.live</p>
             </div>
             <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
             <div className="space-y-1">
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Platform Hub</span>
                <p className="text-2xl font-bold">dialysis.live</p>
             </div>
          </div>
        </section>

        <div className="pt-20 text-center space-y-6">
           <p className="text-slate-400 font-black text-xs uppercase tracking-[0.4em]">2025 dialysis.live • Bio-Vibrant Architecture</p>
           <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Website developed by <a href="https://kaspar.works/" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-pink-500 transition-colors">kaspar.works</a></p>
           <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest max-w-3xl mx-auto leading-relaxed">
             Important Medical Disclaimer: This platform is for tracking only and does not provide medical advice. 
             Please consult your doctor for all medical decisions. This platform is intended for tracking and informational purposes only.
           </p>
           <div className="flex justify-center gap-8 pt-10">
              <Link to="/terms" className="text-indigo-500 font-black text-xs uppercase tracking-widest hover:text-indigo-700 transition-colors">Terms & Conditions</Link>
              <Link to="/" className="text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-colors">Back to Home</Link>
           </div>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
