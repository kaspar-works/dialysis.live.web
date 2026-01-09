import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Logo from '../components/Logo';
import SEO from '../components/SEO';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  features: PlanFeature[];
  cta: string;
  icon: string;
  popular?: boolean;
}

const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default plans (fallback if API fails) - matches backend config
  const defaultPlans: Plan[] = [
    {
      name: "Free",
      price: 0,
      yearlyPrice: 0,
      description: "Limited tracking to get started",
      features: [
        { text: "5 entries per category", included: true },
        { text: "Basic vitals monitoring", included: true },
        { text: "Session tracking", included: true },
        { text: "Medication reminders", included: true },
        { text: "90 days data retention", included: true },
        { text: "Community support", included: true },
        { text: "AI Features", included: false },
        { text: "Data Export", included: false },
      ],
      cta: "Start Free",
      icon: "🎯",
    },
    {
      name: "Basic",
      price: 4.99,
      yearlyPrice: 49.99,
      description: "Unlimited tracking for all health data",
      features: [
        { text: "Unlimited sessions", included: true },
        { text: "Unlimited medications", included: true },
        { text: "Unlimited vitals & weight", included: true },
        { text: "Unlimited fluid logs", included: true },
        { text: "Advanced analytics", included: true },
        { text: "1 year data retention", included: true },
        { text: "Email support", included: true },
        { text: "AI Features", included: false },
        { text: "Data Export", included: false },
      ],
      cta: "Get Basic",
      icon: "⚡",
    },
    {
      name: "Premium",
      price: 9.99,
      yearlyPrice: 99.99,
      description: "Full features with AI & exports",
      features: [
        { text: "Everything in Basic", included: true },
        { text: "30 AI requests/month", included: true },
        { text: "Nutri-Scan AI", included: true },
        { text: "Lab Analysis AI", included: true },
        { text: "PDF Reports & Export", included: true },
        { text: "Buy more AI credits", included: true },
        { text: "Priority support", included: true },
        { text: "Unlimited data retention", included: true },
      ],
      cta: "Get Premium",
      icon: "👑",
      popular: true,
    },
  ];

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/v1/subscriptions/plans');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.plans) {
          // Transform API plans to our format
          const transformedPlans = data.data.plans.map((p: any) => ({
            name: p.name,
            price: p.price?.monthly || 0,
            yearlyPrice: p.price?.yearly || 0,
            description: p.description || '',
            features: transformFeatures(p),
            cta: p.id === 'free' ? 'Start Free' : `Get ${p.name}`,
            icon: getIcon(p.id),
            popular: p.highlighted || p.id === 'premium',
          }));
          setPlans(transformedPlans);
        } else {
          setPlans(defaultPlans);
        }
      } else {
        setPlans(defaultPlans);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      setPlans(defaultPlans);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (planId: string): string => {
    const icons: Record<string, string> = {
      free: '🎯',
      basic: '⚡',
      premium: '👑',
    };
    return icons[planId] || '📦';
  };

  const transformFeatures = (plan: any): PlanFeature[] => {
    // Use the includes array from API if available
    if (plan.includes && Array.isArray(plan.includes)) {
      return plan.includes.map((item: string) => ({
        text: item,
        included: true,
      }));
    }

    // Fallback for old format
    const features: PlanFeature[] = [];
    const planFeatures = Array.isArray(plan.features) ? plan.features : [];

    const hasAIChat = planFeatures.includes('ai_chat');
    const hasExport = planFeatures.includes('export_data');

    features.push({ text: plan.limits?.maxSessions === null ? 'Unlimited Sessions' : `${plan.limits?.maxSessions || 10} Sessions`, included: true });
    features.push({ text: plan.limits?.maxMedications === null ? 'Unlimited Medications' : `${plan.limits?.maxMedications || 5} Medications`, included: true });
    features.push({ text: 'AI Features', included: hasAIChat });
    features.push({ text: 'Data Export', included: hasExport });

    return features;
  };

  const faqs = [
    {
      q: "Can I cancel anytime?",
      a: "Yes, cancel anytime. Access continues until your billing period ends. No questions asked."
    },
    {
      q: "Is my health data secure?",
      a: "Absolutely. We use 256-bit encryption and your data is stored securely with optional cloud sync."
    },
    {
      q: "Can I switch plans?",
      a: "Yes, upgrade or downgrade anytime. Changes take effect immediately with prorated billing."
    },
    {
      q: "Do you offer refunds?",
      a: "We offer a 14-day money-back guarantee for all paid plans. No questions asked."
    }
  ];

  // Inject FAQ and Breadcrumb structured data
  useEffect(() => {
    // FAQ Schema
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    };

    // Breadcrumb Schema
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
          "name": "Pricing",
          "item": "https://dialysis.live/pricing"
        }
      ]
    };

    // Create and append FAQ schema script
    const faqScript = document.createElement('script');
    faqScript.type = 'application/ld+json';
    faqScript.id = 'faq-schema';
    faqScript.textContent = JSON.stringify(faqSchema);

    // Create and append Breadcrumb schema script
    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.id = 'breadcrumb-schema';
    breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);

    // Remove existing scripts if any (for hot reload)
    const existingFaq = document.getElementById('faq-schema');
    const existingBreadcrumb = document.getElementById('breadcrumb-schema');
    if (existingFaq) existingFaq.remove();
    if (existingBreadcrumb) existingBreadcrumb.remove();

    document.head.appendChild(faqScript);
    document.head.appendChild(breadcrumbScript);

    // Cleanup on unmount
    return () => {
      const faqEl = document.getElementById('faq-schema');
      const breadcrumbEl = document.getElementById('breadcrumb-schema');
      if (faqEl) faqEl.remove();
      if (breadcrumbEl) breadcrumbEl.remove();
    };
  }, []);

  return (
    <div className="bg-slate-950 min-h-screen text-white overflow-x-hidden">
      <SEO
        title="Pricing - Dialysis Management Plans"
        description="Choose the perfect plan for your dialysis tracking needs. Start free, upgrade anytime."
      />

      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/5 rounded-full blur-[200px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <span className="font-black text-xl tracking-tight">dialysis.live</span>
          </Link>
          <div className="flex items-center gap-8">
            <Link to="/" className="hidden md:block text-sm font-semibold text-white/50 hover:text-white transition-colors">Home</Link>
            <Link to="/features" className="hidden md:block text-sm font-semibold text-white/50 hover:text-white transition-colors">Features</Link>
            <Link to="/login" className="text-sm font-semibold text-white/50 hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="px-6 py-3 bg-white text-slate-950 rounded-2xl font-bold text-sm hover:scale-105 transition-transform">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-sm font-semibold">Simple, transparent pricing</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            Start free,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400">
              upgrade anytime
            </span>
          </h1>

          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            Try all features free with 5 entries. No credit card required.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-2 bg-white/5 rounded-full border border-white/10">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
                !isYearly ? 'bg-white text-slate-950' : 'text-white/50 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                isYearly ? 'bg-white text-slate-950' : 'text-white/50 hover:text-white'
              }`}
            >
              Yearly
              <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">-17%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 pb-32">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {(plans.length > 0 ? plans : defaultPlans).map((plan, i) => (
              <div
                key={i}
                className={`relative group rounded-3xl p-8 transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border-2 border-emerald-500/50 scale-105 z-10'
                    : 'bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-emerald-500 rounded-full text-xs font-bold text-white shadow-lg shadow-emerald-500/30">
                    Most Popular
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-8">
                  <div className="text-4xl mb-4">{plan.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-white/40">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black">
                      ${isYearly ? plan.yearlyPrice : plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-white/40 font-medium">/{isYearly ? 'yr' : 'mo'}</span>
                    )}
                  </div>
                  {isYearly && plan.price > 0 && (
                    <p className="text-emerald-400 text-sm mt-2">
                      Save ${((plan.price * 12) - plan.yearlyPrice).toFixed(0)}/year
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        feature.included
                          ? plan.popular ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white'
                          : 'bg-white/5 text-white/20'
                      }`}>
                        {feature.included ? (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${feature.included ? 'text-white/70' : 'text-white/30 line-through'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  to="/register"
                  className={`block w-full py-4 rounded-2xl font-bold text-center transition-all ${
                    plan.popular
                      ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/25'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="px-6 pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🔒', title: '256-bit Encryption', desc: 'Bank-level security' },
              { icon: '🚫', title: 'No Credit Card', desc: 'For free plan' },
              { icon: '💸', title: '14-Day Refund', desc: 'Money-back guarantee' },
              { icon: '🔄', title: 'Cancel Anytime', desc: 'No commitments' },
            ].map((badge, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-3xl mb-3">{badge.icon}</div>
                <h4 className="font-bold text-sm mb-1">{badge.title}</h4>
                <p className="text-xs text-white/40">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="px-6 pb-32">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Questions? Answers.
            </h2>
            <p className="text-white/50">Everything you need to know about our plans</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className="font-bold">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-white/40 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-white/50">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-emerald-500/20 via-sky-500/10 to-violet-500/20 border border-white/10 p-12 md:p-20">
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xl" />
            <div className="relative z-10 text-center space-y-8">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                Ready to take control?
              </h2>
              <p className="text-xl text-white/50 max-w-xl mx-auto">
                Join thousands of patients managing their dialysis journey. Start free today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-bold text-lg hover:scale-105 transition-transform"
                >
                  Start Free Now
                </Link>
                <Link
                  to="/features"
                  className="px-10 py-5 bg-white/10 border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 transition-colors"
                >
                  See All Features
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <Logo className="w-8 h-8" />
              <span className="font-bold">dialysis.live</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-white/40">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/features" className="hover:text-white transition-colors">Features</Link>
              <Link to="/edu" className="hover:text-white transition-colors">Education</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-white/30 text-sm">© 2025 dialysis.live. All rights reserved.</p>
            <p className="text-white/20 text-xs mt-2 max-w-2xl mx-auto">
              Medical Disclaimer: This platform is for tracking purposes only and does not provide medical advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
