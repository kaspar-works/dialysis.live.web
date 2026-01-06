import React from 'react';
import { Link } from 'react-router';
import Logo from '../components/Logo';
import SEO from '../components/SEO';

const Privacy: React.FC = () => {
  const sections = [
    {
      id: 'collection',
      title: '1. Information We Collect',
      content: [
        { subtitle: 'Personal Information', items: ['Name', 'Email address', 'Account credentials', 'Time zone and preferences'] },
        { subtitle: 'Health & Dialysis Information', items: ['Dialysis session details (start time, duration, type)', 'Weight records', 'Fluid intake logs', 'Medication information', 'Symptoms and notes', 'Optional vitals (e.g., blood pressure)'] },
        { subtitle: 'Technical Information', items: ['Browser type and version', 'Device type', 'IP address', 'Log data for security and performance'] }
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
    },
    {
      id: 'retention',
      title: '5. Data Retention',
      text: 'We retain your personal and health information for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting us.'
    },
    {
      id: 'sharing',
      title: '6. Information Sharing',
      text: 'We do not sell, rent, or trade your personal information. We may share data only with service providers who assist in platform operations, and only under strict confidentiality agreements.'
    },
    {
      id: 'rights',
      title: '7. Your Rights',
      text: 'You have the right to access, correct, or delete your personal data. You may also request a copy of your data in a portable format. Contact us to exercise these rights.'
    },
    {
      id: 'cookies',
      title: '8. Cookies & Tracking',
      text: 'We use essential cookies to maintain your session and preferences. We do not use third-party advertising cookies or tracking pixels.'
    },
    {
      id: 'children',
      title: '9. Children\'s Privacy',
      text: 'Our Platform is not intended for children under 13. We do not knowingly collect personal information from children under 13 years of age.'
    },
    {
      id: 'changes',
      title: '10. Changes to This Policy',
      text: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date.'
    }
  ];

  return (
    <div className="bg-[#020617] min-h-screen selection:bg-sky-500/30 selection:text-white overflow-x-hidden text-white w-full">
      <SEO
        title="Privacy Policy - dialysis.live"
        description="Learn how dialysis.live collects, uses, and protects your personal and health information. Your privacy matters to us."
      />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[100vw] h-[100vw] bg-sky-900/20 rounded-full blur-[100px] md:blur-[160px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-pink-900/10 rounded-full blur-[140px]"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 md:h-24 border-b border-white/5 bg-[#020617]/40 backdrop-blur-3xl flex items-center justify-between px-6 md:px-20 z-[100] safe-pt">
        <Link to="/" className="flex items-center gap-3 md:gap-4 group">
          <Logo className="w-8 h-8 md:w-12 md:h-12" />
          <span className="font-black text-lg md:text-2xl tracking-tighter text-white">dialysis.live</span>
        </Link>
        <div className="flex items-center gap-4 md:gap-12">
          <Link to="/" className="hidden sm:block text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Home</Link>
          <Link to="/login" className="px-5 md:px-10 py-3 md:py-4 bg-white text-slate-950 rounded-xl md:rounded-2xl font-black text-[9px] md:text-xs uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all">Login</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-40 md:pt-56 pb-16 md:pb-24 px-6 md:px-20 max-w-4xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] backdrop-blur-xl">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Data Protection Protocol
        </div>
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.85]">
          Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">Policy.</span>
        </h1>
        <p className="text-white/40 text-lg md:text-xl font-medium">Effective Date: May 20, 2024</p>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 md:px-20 pb-24 md:pb-40 space-y-16">
        {/* Intro Card */}
        <section className="bg-white/5 backdrop-blur-xl p-10 md:p-14 rounded-[2.5rem] border border-white/10">
          <p className="text-white/60 text-lg md:text-xl leading-relaxed font-medium italic text-center">
            "Your privacy matters to dialysis.live. This Privacy Policy explains how we collect, use, store, and protect your information when you use our management platform."
          </p>
        </section>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((s) => (
            <section key={s.id} className="bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all space-y-6">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">{s.title}</h2>
              {s.text && (
                <p className="text-white/50 text-base md:text-lg leading-relaxed">{s.text}</p>
              )}
              {s.content && (
                <div className="space-y-8 pt-2">
                  {s.content.map((c, i) => (
                    <div key={i} className="space-y-4">
                      <h3 className="text-lg font-black text-white/80">{c.subtitle}</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {c.items.map((item, j) => (
                          <li key={j} className="flex items-center gap-3 text-white/40 font-medium text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"></div>
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

        {/* Contact Section */}
        <section className="relative bg-gradient-to-br from-sky-500/20 via-emerald-500/10 to-pink-500/20 rounded-[3rem] md:rounded-[4rem] p-12 md:p-16 border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-[#020617]/60 backdrop-blur-xl"></div>
          <div className="relative z-10 text-center space-y-8">
            <h3 className="text-3xl md:text-4xl font-black tracking-tight">11. Contact Us</h3>
            <p className="text-white/40 text-lg md:text-xl font-medium max-w-xl mx-auto">Questions about your data or our privacy practices?</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-4">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Support Email</span>
                <p className="text-xl md:text-2xl font-black">privacy@dialysis.live</p>
              </div>
              <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Platform Hub</span>
                <p className="text-xl md:text-2xl font-black">dialysis.live</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 md:py-24 px-6 md:px-20 border-t border-white/5 bg-black">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <Logo className="w-8 h-8" />
              <span className="font-black text-lg tracking-tighter">dialysis.live</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-[10px] font-black text-white/40 uppercase tracking-widest">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/features" className="hover:text-white transition-colors">Features</Link>
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

export default Privacy;
