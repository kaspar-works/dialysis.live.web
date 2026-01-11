
import React from 'react';
import { Link } from 'react-router';
import SEO from '../components/SEO';

const Terms: React.FC = () => {
  const sections = [
    {
      id: 'purpose',
      title: '1. Purpose of the Platform',
      text: 'The dialysis.live Platform is designed to help users track dialysis sessions, manage personal health information, and access educational content related to kidney care. It is a support and tracking tool and does not provide medical advice, diagnosis, or treatment.'
    },
    {
      id: 'eligibility',
      title: '2. Eligibility',
      text: 'By using the Platform, you confirm that you are at least 18 years old, or are using the Platform under the supervision of a parent, guardian, or caregiver, and are legally able to enter into these Terms.'
    },
    {
      id: 'accounts',
      title: '3. User Accounts',
      text: 'To access certain features, you must create an account. You agree to provide accurate information, keep your credentials secure, and notify us of any unauthorized access. You are responsible for all activity under your account.'
    },
    {
      id: 'disclaimer',
      title: '4. Health Information Disclaimer',
      text: 'All information provided on the Platform is based on user-entered data and is for informational purposes only. It should not be relied upon for medical decisions. Always consult your nephrologist regarding treatment decisions.'
    },
    {
      id: 'responsibilities',
      title: '5. User Responsibilities',
      items: [
        'Do not use the Platform for unlawful purposes.',
        'Do not submit false or misleading information.',
        'Do not attempt to access another user’s data.',
        'Do not interfere with the Platform’s security or functionality.'
      ]
    },
    {
      id: 'privacy',
      title: '6. Data & Privacy',
      text: 'Your use of the Platform is also governed by our Privacy Policy. By using the Platform, you consent to the collection and use of information as described therein.'
    },
    {
      id: 'content',
      title: '7. Educational Content & Blogs',
      text: 'Educational materials provided are for general purposes only and do not constitute medical advice. They should not replace professional medical guidance.'
    },
    {
      id: 'availability',
      title: '8. Platform Availability',
      text: 'We strive for reliability but do not guarantee continuous or uninterrupted access. Maintenance or technical issues may temporarily limit access.'
    }
  ];

  return (
    <div className="bg-white min-h-screen selection:bg-sky-100 selection:text-sky-900">
      <SEO
        title="Terms & Conditions - Dialysis Management Platform"
        description="Read the terms and conditions for using dialysis.live, the clinical-grade dialysis tracking platform for renal patients and caregivers."
      />
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
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
           Legal Governance Hub
        </div>
        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-none">Terms & Conditions</h1>
        <p className="text-slate-500 text-lg font-medium">Effective Date: May 20, 2024</p>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 pb-40 space-y-20">
        <section className="p-12 bg-slate-50 rounded-[3.5rem] border border-slate-100">
          <p className="text-slate-600 text-lg leading-relaxed font-medium italic text-center">
            "Welcome to dialysis.live. By accessing or using this Platform, you agree to be bound by these Terms & Conditions."
          </p>
        </section>

        <div className="space-y-20">
          {/* Loop through sections array to render content */}
          {sections.map((s) => (
            <section key={s.id} className="space-y-6">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{s.title}</h2>
              {s.text && (
                <p className="text-slate-600 text-lg leading-relaxed">{s.text}</p>
              )}
              {s.items && (
                <ul className="space-y-4 pl-6">
                  {s.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-4 text-slate-600 font-medium">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Contact Footer */}
        <section className="bg-slate-900 p-16 rounded-[4rem] text-white space-y-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="space-y-4 relative">
             <h3 className="text-4xl font-black tracking-tight">15. Contact Us</h3>
             <p className="text-white/50 text-xl font-medium max-w-xl mx-auto">Have questions about these legal terms?</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 relative">
             <div className="space-y-1">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Contact</span>
                <p className="text-2xl font-bold">kaspar@kaspar.works</p>
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
              <Link to="/privacy" className="text-sky-500 font-black text-xs uppercase tracking-widest hover:text-sky-700 transition-colors">Privacy Policy</Link>
              <Link to="/" className="text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-colors">Back to Home</Link>
           </div>
        </div>
      </main>
    </div>
  );
};

export default Terms;
