import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import SEO from '../components/SEO';

const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: "Free",
      price: 0,
      yearlyPrice: 0,
      description: "Get started with essential tracking tools.",
      features: [
        "10 Session Tracking",
        "Weight Monitoring",
        "Fluid Intake Logs",
        "5 Medications",
        "1 Report Export",
        "Basic Dashboard"
      ],
      cta: "Start Free",
      highlight: false,
      color: "from-slate-500 to-gray-600"
    },
    {
      name: "Basic",
      price: 5.99,
      yearlyPrice: 59.99,
      description: "Essential tools for active dialysis patients.",
      features: [
        "Unlimited Sessions",
        "Weight Monitoring",
        "Fluid Intake Logs",
        "5 Medications",
        "5 Report Exports",
        "Custom Reminders",
        "Data Export (JSON)"
      ],
      cta: "Get Basic",
      highlight: false,
      color: "from-sky-500 to-blue-500"
    },
    {
      name: "Premium",
      price: 9.99,
      yearlyPrice: 99.99,
      description: "Full clinical insight and AI-powered analysis.",
      features: [
        "Everything in Basic",
        "Unlimited Medications",
        "Nutri-Scan AI",
        "Advanced AI Analysis",
        "Unlimited Reports",
        "PDF Export",
        "Priority Support",
        "Vitals & Wellness Hub"
      ],
      cta: "Get Premium",
      highlight: true,
      popular: true,
      color: "from-emerald-500 to-teal-500"
    },
    {
      name: "Family",
      price: 14.99,
      yearlyPrice: 149.99,
      description: "Comprehensive care for the whole household.",
      features: [
        "Everything in Premium",
        "Up to 4 Patient Profiles",
        "Shared Caregiver Access",
        "Consolidated Dashboard",
        "Family Analytics",
        "Dedicated Support Line"
      ],
      cta: "Get Family",
      highlight: false,
      color: "from-pink-500 to-rose-500"
    }
  ];

  const faqs = [
    {
      q: "Can I cancel anytime?",
      a: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period."
    },
    {
      q: "Is my health data secure?",
      a: "Absolutely. We use 256-bit encryption for all data, and your information is stored locally first with optional secure cloud sync."
    },
    {
      q: "Can I switch plans?",
      a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately with prorated billing."
    },
    {
      q: "Do you offer refunds?",
      a: "We offer a 14-day money-back guarantee for all paid plans if you're not satisfied with the service."
    }
  ];

  const comparisonFeatures = [
    { name: "Session Tracking", free: "10 sessions", basic: "Unlimited", premium: "Unlimited", family: "Unlimited" },
    { name: "Weight Monitoring", free: true, basic: true, premium: true, family: true },
    { name: "Fluid Tracking", free: true, basic: true, premium: true, family: true },
    { name: "Medications", free: "5", basic: "5", premium: "Unlimited", family: "Unlimited" },
    { name: "Vitals Hub", free: false, basic: true, premium: true, family: true },
    { name: "Nutri-Scan AI", free: false, basic: false, premium: true, family: true },
    { name: "Report Exports", free: "1", basic: "5", premium: "Unlimited", family: "Unlimited" },
    { name: "PDF Export", free: false, basic: false, premium: true, family: true },
    { name: "Advanced Analytics", free: false, basic: false, premium: true, family: true },
    { name: "Multiple Profiles", free: false, basic: false, premium: false, family: "Up to 4" },
    { name: "Caregiver Access", free: false, basic: false, premium: false, family: true },
    { name: "Priority Support", free: false, basic: false, premium: true, family: true }
  ];

  return (
    <div className="bg-[#020617] min-h-screen selection:bg-sky-500/30 selection:text-white overflow-x-hidden text-white w-full">
      <SEO
        title="Pricing - Dialysis Management Plans"
        description="Choose the perfect plan for your dialysis tracking needs. From free basic tracking to comprehensive family plans with AI-powered insights."
      />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[100vw] h-[100vw] bg-sky-900/20 rounded-full blur-[100px] md:blur-[160px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-pink-900/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-[50%] left-[30%] w-[40vw] h-[40vw] bg-emerald-900/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 md:h-24 border-b border-white/5 bg-[#020617]/40 backdrop-blur-3xl flex items-center justify-between px-6 md:px-20 z-[100] safe-pt">
        <Link to="/" className="flex items-center gap-3 md:gap-4 group">
          <Logo className="w-8 h-8 md:w-12 md:h-12" />
          <span className="font-black text-lg md:text-2xl tracking-tighter text-white">dialysis.live</span>
        </Link>
        <div className="flex items-center gap-4 md:gap-12">
          <Link to="/" className="hidden sm:block text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Home</Link>
          <Link to="/features" className="hidden sm:block text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Features</Link>
          <Link to="/login" className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">Login</Link>
          <Link to="/register" className="px-5 md:px-10 py-3 md:py-4 bg-white text-slate-950 rounded-xl md:rounded-2xl font-black text-[9px] md:text-xs uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all">Join</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-40 md:pt-56 pb-16 md:pb-24 px-6 md:px-20 max-w-[1440px] mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] backdrop-blur-xl">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Simple Pricing
        </div>
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85]">
          Choose Your <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-400 to-pink-400">Plan.</span>
        </h1>
        <p className="text-white/40 text-lg md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
          Start free and upgrade as you need. All plans include core tracking features with no hidden fees.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 pt-6">
          <span className={`text-sm font-black uppercase tracking-widest transition-colors ${!isYearly ? 'text-white' : 'text-white/30'}`}>Monthly</span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className="w-16 h-8 bg-white/10 rounded-full relative p-1 transition-colors hover:bg-white/20 border border-white/10"
          >
            <div className={`w-6 h-6 bg-gradient-to-br from-emerald-400 to-sky-400 rounded-full shadow-lg transition-all duration-300 transform ${isYearly ? 'translate-x-8' : 'translate-x-0'}`} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-black uppercase tracking-widest transition-colors ${isYearly ? 'text-white' : 'text-white/30'}`}>Yearly</span>
            <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-emerald-500/20">Save 17%</span>
          </div>
        </div>
      </header>

      {/* Pricing Cards */}
      <main className="max-w-[1440px] mx-auto px-6 md:px-20 pb-24 md:pb-40 space-y-32">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative group bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border overflow-hidden transition-all duration-500 flex flex-col ${
                plan.highlight
                  ? 'border-emerald-500/50 bg-white/[0.08] scale-105 z-10 shadow-[0_0_60px_-15px_rgba(16,185,129,0.3)]'
                  : 'border-white/5 hover:border-white/20 hover:bg-white/[0.08]'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/30">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <div className={`inline-flex px-3 py-1.5 bg-gradient-to-r ${plan.color} rounded-lg text-[8px] font-black uppercase tracking-widest text-white mb-4`}>
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl md:text-6xl font-black tracking-tighter">
                    ${isYearly ? plan.yearlyPrice : plan.price}
                  </span>
                  <span className="text-white/30 font-bold text-sm">/{isYearly ? 'year' : 'mo'}</span>
                </div>
                <p className="text-white/40 text-sm font-medium">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/60'}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span className="text-sm font-medium text-white/70">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/register"
                className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all text-center block ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </section>

        {/* Comparison Table */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <span className="text-[10px] font-black text-sky-400 uppercase tracking-[0.4em]">Compare Plans</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Feature Comparison.</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-6 px-4 text-sm font-black text-white/60 uppercase tracking-widest">Feature</th>
                  <th className="py-6 px-4 text-sm font-black text-white/60 uppercase tracking-widest">Free</th>
                  <th className="py-6 px-4 text-sm font-black text-white/60 uppercase tracking-widest">Basic</th>
                  <th className="py-6 px-4 text-sm font-black text-emerald-400 uppercase tracking-widest">Premium</th>
                  <th className="py-6 px-4 text-sm font-black text-white/60 uppercase tracking-widest">Family</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-5 px-4 text-sm font-bold text-white">{feature.name}</td>
                    <td className="py-5 px-4 text-center">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <span className="text-emerald-400">
                            <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )
                      ) : (
                        <span className="text-sm font-medium text-white/60">{feature.free}</span>
                      )}
                    </td>
                    <td className="py-5 px-4 text-center">
                      {typeof feature.basic === 'boolean' ? (
                        feature.basic ? (
                          <span className="text-emerald-400">
                            <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )
                      ) : (
                        <span className="text-sm font-medium text-white/60">{feature.basic}</span>
                      )}
                    </td>
                    <td className="py-5 px-4 text-center bg-emerald-500/5">
                      {typeof feature.premium === 'boolean' ? (
                        feature.premium ? (
                          <span className="text-emerald-400">
                            <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )
                      ) : (
                        <span className="text-sm font-medium text-emerald-400">{feature.premium}</span>
                      )}
                    </td>
                    <td className="py-5 px-4 text-center">
                      {typeof feature.family === 'boolean' ? (
                        feature.family ? (
                          <span className="text-emerald-400">
                            <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )
                      ) : (
                        <span className="text-sm font-medium text-white/60">{feature.family}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQs */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <span className="text-[10px] font-black text-pink-400 uppercase tracking-[0.4em]">Questions?</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Frequently Asked.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all">
                <h4 className="font-black text-lg mb-3">{faq.q}</h4>
                <p className="text-white/40 font-medium leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="relative bg-gradient-to-br from-emerald-500/20 via-sky-500/10 to-pink-500/20 rounded-[3rem] md:rounded-[5rem] p-12 md:p-24 border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-[#020617]/60 backdrop-blur-xl"></div>
          <div className="relative z-10 text-center space-y-8">
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter">
              Start Your Journey<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Today.</span>
            </h2>
            <p className="text-white/40 text-lg md:text-xl font-medium max-w-xl mx-auto">
              Join thousands of dialysis patients taking control of their health. Start with our free plan.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 pt-4">
              <Link to="/register" className="w-full sm:w-auto px-12 md:px-16 py-6 md:py-8 bg-white text-slate-950 rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all">Create Free Account</Link>
              <Link to="/features" className="w-full sm:w-auto px-12 md:px-16 py-6 md:py-8 bg-white/5 border border-white/10 text-white rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-[0.3em] hover:bg-white/10 transition-all">View All Features</Link>
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
              <Link to="/features" className="hover:text-white transition-colors">Features</Link>
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

export default Pricing;
