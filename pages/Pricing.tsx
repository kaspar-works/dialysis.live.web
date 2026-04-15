import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import SEO from '../components/SEO';
import PublicNav from '../components/PublicNav';
import PublicFooter from '../components/PublicFooter';
import { THEME, ensureWellnessFont, WELLNESS_FONT_FAMILY } from '../theme';

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
        { text: "Session & vitals tracking", included: true },
        { text: "Medication reminders", included: true },
        { text: "Community forums", included: true },
        { text: "Education hub", included: true },
        { text: "Emergency card", included: true },
        { text: "90 days data retention", included: true },
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
        { text: "Unlimited sessions & vitals", included: true },
        { text: "Unlimited medications & fluids", included: true },
        { text: "Advanced analytics & trends", included: true },
        { text: "Symptom & exercise tracking", included: true },
        { text: "Appointment scheduling", included: true },
        { text: "Apple Watch companion", included: true },
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
        { text: "AI Health Assistant (30/month)", included: true },
        { text: "Nutri-Scan AI food analysis", included: true },
        { text: "AI Lab Report interpretation", included: true },
        { text: "AI Symptom analysis", included: true },
        { text: "PDF Reports & data export", included: true },
        { text: "Buy additional AI credits", included: true },
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
    },
    {
      q: "What AI features are included?",
      a: "Premium includes AI Health Chat, Nutri-Scan food analysis, Lab Report interpretation, Symptom analysis, and medication interaction checks. You get 30 AI requests per month with the option to purchase more."
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

  useEffect(() => {
    ensureWellnessFont();
  }, []);

  const planTiles = [
    { tile: THEME.sky, chip: THEME.skyInk },
    { tile: THEME.mint, chip: THEME.mintInk },
    { tile: THEME.lavender, chip: THEME.lavenderInk },
  ];

  const trustBadges = [
    { icon: '🔒', title: '256-bit Encryption', desc: 'Bank-level security', tile: THEME.sky, chip: THEME.skyInk },
    { icon: '🚫', title: 'No Credit Card', desc: 'For free plan', tile: THEME.mint, chip: THEME.mintInk },
    { icon: '💸', title: '14-Day Refund', desc: 'Money-back guarantee', tile: THEME.peach, chip: THEME.peachInk },
    { icon: '🔄', title: 'Cancel Anytime', desc: 'No commitments', tile: THEME.butter, chip: THEME.butterInk },
  ];

  const displayPlans = plans.length > 0 ? plans : defaultPlans;

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundColor: THEME.bg,
        color: THEME.ink,
        fontFamily: WELLNESS_FONT_FAMILY,
      }}
    >
      <SEO
        title="Pricing — dialysis.live plans"
        description="Choose the plan that fits your tracking needs. Start free, upgrade anytime."
      />

      <PublicNav />

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: THEME.calmGradient }}
      >
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl"
          style={{ background: THEME.teal }}
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-24 w-[400px] h-[400px] rounded-full opacity-25 blur-3xl"
          style={{ background: THEME.green }}
        />

        <div className="relative max-w-[1100px] mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-14 md:pb-20 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-7"
            style={{
              backgroundColor: THEME.card,
              color: THEME.tealDark,
              border: `1px solid ${THEME.border}`,
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: THEME.green }} />
            Simple, transparent pricing
          </div>

          <h1
            className="font-bold tracking-tight mx-auto"
            style={{
              fontSize: 'clamp(2.25rem, 5.5vw, 4.25rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: THEME.ink,
              maxWidth: '16ch',
            }}
          >
            Start free,{' '}
            <span
              style={{
                background: THEME.heroGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              upgrade anytime.
            </span>
          </h1>

          <p className="mt-6 max-w-xl mx-auto text-lg leading-relaxed" style={{ color: THEME.muted }}>
            Try every feature free with 5 entries per category. No credit card required.
          </p>
          <p className="mt-3 text-sm font-semibold" style={{ color: THEME.tealDark }}>
            Simple pricing for patients, caregivers, and care teams.
          </p>

          {/* Billing Toggle */}
          <div
            className="inline-flex items-center gap-1 p-1.5 rounded-full mt-9"
            style={{
              backgroundColor: THEME.card,
              border: `1px solid ${THEME.border}`,
            }}
          >
            <button
              onClick={() => setIsYearly(false)}
              className="px-6 py-2.5 rounded-full text-sm font-bold transition-all"
              style={{
                background: !isYearly ? THEME.heroGradient : 'transparent',
                color: !isYearly ? '#fff' : THEME.muted,
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className="px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2"
              style={{
                background: isYearly ? THEME.heroGradient : 'transparent',
                color: isYearly ? '#fff' : THEME.muted,
              }}
            >
              Yearly
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: isYearly ? 'rgba(255,255,255,0.25)' : THEME.mint,
                  color: isYearly ? '#fff' : THEME.mintInk,
                }}
              >
                Save 17%
              </span>
            </button>
          </div>

          {isYearly && (
            <p className="mt-4 text-xs font-semibold" style={{ color: THEME.mintInk }}>
              ✓ You're saving ~17% with yearly billing
            </p>
          )}

          <p className="mt-5 text-xs font-medium flex items-center justify-center gap-2" style={{ color: THEME.muted }}>
            <span style={{ color: THEME.mintInk }}>✓</span>
            No hidden fees · Cancel anytime · 14-day refund
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 md:px-10 py-16 md:py-24">
        <div className="max-w-[1100px] mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div
                className="w-12 h-12 rounded-full animate-spin"
                style={{
                  border: `4px solid ${THEME.border}`,
                  borderTopColor: THEME.teal,
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {displayPlans.map((plan, i) => {
                const tile = planTiles[i % planTiles.length];
                const popular = plan.popular;
                return (
                  <div
                    key={i}
                    className={`relative rounded-3xl p-8 transition-all hover:-translate-y-1 ${
                      popular ? 'md:-my-4 md:py-12 shadow-xl' : ''
                    }`}
                    style={{
                      backgroundColor: popular ? THEME.card : tile.tile,
                      border: popular ? `2px solid ${THEME.teal}` : `1px solid ${tile.chip}22`,
                      boxShadow: popular
                        ? `0 30px 80px -30px ${THEME.tealDark}55`
                        : `0 4px 18px -8px ${tile.chip}33`,
                    }}
                  >
                    {popular && (
                      <div
                        className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[11px] font-bold text-white shadow-md"
                        style={{ background: THEME.heroGradient }}
                      >
                        ⭐ Most popular
                      </div>
                    )}

                    {/* Header */}
                    <div className="mb-7">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-sm"
                        style={{
                          background: popular
                            ? THEME.heroGradient
                            : `linear-gradient(135deg, ${tile.chip}e6 0%, ${tile.chip} 100%)`,
                          color: '#fff',
                        }}
                      >
                        {plan.icon}
                      </div>
                      <h3 className="text-2xl font-bold mb-1" style={{ color: THEME.ink }}>
                        {plan.name}
                      </h3>
                      <p className="text-sm font-medium" style={{ color: popular ? THEME.muted : '#2B3A37' }}>
                        {plan.description}
                      </p>
                      {popular && (
                        <div
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
                          style={{ backgroundColor: THEME.mint, color: THEME.mintInk }}
                        >
                          ✨ Full care + AI insights · Best for active dialysis patients
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-7">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold" style={{ color: THEME.ink }}>
                          ${isYearly ? plan.yearlyPrice : plan.price}
                        </span>
                        {plan.price > 0 && (
                          <span className="font-medium" style={{ color: THEME.muted }}>
                            /{isYearly ? 'yr' : 'mo'}
                          </span>
                        )}
                      </div>
                      {isYearly && plan.price > 0 && (
                        <p className="text-sm font-semibold mt-2" style={{ color: THEME.mintInk }}>
                          Save ${((plan.price * 12) - plan.yearlyPrice).toFixed(0)}/year
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                              backgroundColor: feature.included ? THEME.mintInk : THEME.border,
                              color: '#fff',
                            }}
                          >
                            {feature.included ? (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </div>
                          <span
                            className="text-sm leading-relaxed"
                            style={{
                              color: feature.included ? (popular ? THEME.ink : '#2B3A37') : THEME.muted,
                              textDecoration: feature.included ? 'none' : 'line-through',
                              fontWeight: feature.included ? 500 : 400,
                            }}
                          >
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Link
                      to="/register"
                      className="block w-full py-4 rounded-full font-bold text-center transition-all hover:-translate-y-0.5 hover:shadow-lg"
                      style={
                        popular
                          ? {
                              background: THEME.heroGradient,
                              color: '#fff',
                              boxShadow: `0 8px 24px -8px ${THEME.teal}80`,
                            }
                          : {
                              backgroundColor: THEME.card,
                              color: THEME.ink,
                              border: `1px solid ${tile.chip}33`,
                            }
                      }
                    >
                      {plan.cta}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="px-6 md:px-10 pb-16 md:pb-24">
        <div className="max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {trustBadges.map((badge, i) => (
            <div
              key={i}
              className="p-6 rounded-3xl transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: badge.tile,
                border: `1px solid ${badge.chip}22`,
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${badge.chip}e6 0%, ${badge.chip} 100%)`,
                  color: '#fff',
                }}
              >
                {badge.icon}
              </div>
              <h4 className="font-bold text-sm mb-1" style={{ color: THEME.ink }}>
                {badge.title}
              </h4>
              <p className="text-xs font-medium" style={{ color: '#2B3A37' }}>
                {badge.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section
        className="px-6 md:px-10 py-20 md:py-28"
        style={{ backgroundColor: THEME.bgSoft }}
      >
        <div className="max-w-[800px] mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <div
              className="inline-block text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4"
              style={{ backgroundColor: THEME.card, color: THEME.tealDark }}
            >
              FAQ
            </div>
            <h2
              className="font-bold tracking-tight"
              style={{
                fontSize: 'clamp(2rem, 4.5vw, 3rem)',
                lineHeight: 1.1,
                letterSpacing: '-0.015em',
                color: THEME.ink,
              }}
            >
              Questions? Answers.
            </h2>
            <p className="mt-4 text-lg" style={{ color: THEME.muted }}>
              Everything you need to know about our plans.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden transition-all"
                  style={{
                    backgroundColor: THEME.card,
                    border: `1px solid ${isOpen ? THEME.teal + '66' : THEME.border}`,
                    boxShadow: isOpen ? `0 4px 20px -8px ${THEME.tealDark}22` : 'none',
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                  >
                    <span className="font-bold" style={{ color: THEME.ink }}>
                      {faq.q}
                    </span>
                    <svg
                      className={`w-5 h-5 transition-transform flex-shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke={isOpen ? THEME.tealDark : THEME.muted}
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 leading-relaxed" style={{ color: THEME.muted }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 md:px-10 py-20 md:py-24">
        <div className="max-w-[1100px] mx-auto">
          <div
            className="rounded-[2.5rem] px-8 md:px-16 py-16 md:py-20 text-center relative overflow-hidden"
            style={{ background: THEME.heroGradient }}
          >
            <div
              aria-hidden
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20"
              style={{ backgroundColor: '#fff' }}
            />
            <div
              aria-hidden
              className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full opacity-10"
              style={{ backgroundColor: '#fff' }}
            />

            <div className="relative">
              <h2
                className="text-white font-bold tracking-tight max-w-3xl mx-auto"
                style={{
                  fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.015em',
                }}
              >
                Ready to take control?
              </h2>
              <p className="mt-5 text-white/90 text-lg max-w-xl mx-auto leading-relaxed">
                Join thousands of patients managing their dialysis journey. Start free today.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                  style={{ backgroundColor: THEME.card, color: THEME.tealDark }}
                >
                  Start your care journey →
                </Link>
                <Link
                  to="/features"
                  className="px-8 py-4 rounded-full font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{ border: '1px solid rgba(255,255,255,0.6)' }}
                >
                  See all features
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Pricing;
