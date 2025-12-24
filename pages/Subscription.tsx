
import React, { useState } from 'react';
import { useStore } from '../store';
import { SubscriptionPlan, BillingInterval } from '../types';
import { useNavigate } from 'react-router-dom';

const Subscription: React.FC = () => {
  const { profile, setProfile } = useStore();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<BillingInterval>(BillingInterval.MONTH);

  const plans = [
    {
      tier: SubscriptionPlan.BASIC,
      price: billingCycle === BillingInterval.MONTH ? 5.99 : 4.99,
      description: "Essential tools for dialysis patients.",
      features: [
        "Session Tracking",
        "Weight Monitoring",
        "Fluid Intake Logs",
        "Basic Reports",
        "Unlimited Session History"
      ],
      color: "slate",
      buttonText: profile.subscription.plan === SubscriptionPlan.BASIC ? "Current Plan" : "Select Basic"
    },
    {
      tier: SubscriptionPlan.PREMIUM,
      price: billingCycle === BillingInterval.MONTH ? 9.99 : 7.99,
      description: "Full clinical insight and control.",
      features: [
        "Everything in Basic",
        "Medication Tracker",
        "Symptoms & Vitals Hub",
        "Advanced AI Analysis",
        "Data Export (PDF/CSV)",
        "Priority Support Line"
      ],
      color: "sky",
      highlight: true,
      buttonText: profile.subscription.plan === SubscriptionPlan.PREMIUM ? "Current Plan" : "Get Premium"
    },
    {
      tier: SubscriptionPlan.FAMILY,
      price: billingCycle === BillingInterval.MONTH ? 14.99 : 12.49,
      description: "Comprehensive care for households.",
      features: [
        "Up to 4 Patient Profiles",
        "Shared Caregiver Access",
        "Consolidated Dashboard",
        "Full History for All",
        "Priority Support Line",
        "All Premium Features"
      ],
      color: "indigo",
      buttonText: profile.subscription.plan === SubscriptionPlan.FAMILY ? "Current Plan" : "Join Family"
    }
  ];

  const handleUpgrade = (tier: SubscriptionPlan) => {
    const limits = {
        [SubscriptionPlan.FREE]: { s: 10, m: 5, r: 1 },
        [SubscriptionPlan.BASIC]: { s: null, m: 5, r: 5 },
        [SubscriptionPlan.PREMIUM]: { s: null, m: null, r: null },
        [SubscriptionPlan.FAMILY]: { s: null, m: null, r: null }
    }[tier];

    setProfile({
      ...profile,
      subscription: {
        ...profile.subscription,
        plan: tier,
        maxSessions: limits.s as any,
        maxMedications: limits.m as any,
        maxReports: limits.r as any,
        billingInterval: billingCycle,
        features: {
            ...profile.subscription.features,
            advancedAnalytics: tier === SubscriptionPlan.PREMIUM || tier === SubscriptionPlan.FAMILY,
            exportData: tier === SubscriptionPlan.PREMIUM || tier === SubscriptionPlan.FAMILY,
            multipleProfiles: tier === SubscriptionPlan.FAMILY,
            prioritySupport: tier === SubscriptionPlan.PREMIUM || tier === SubscriptionPlan.FAMILY,
            customReminders: true,
            familySharing: tier === SubscriptionPlan.FAMILY,
        }
      }
    });
    navigate('/subscription');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header */}
      <section className="text-center space-y-6">
        <div className="flex justify-center">
          <span className="px-4 py-1.5 bg-white text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-slate-100 shadow-sm">Plan Selector</span>
        </div>
        <h2 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">Dialysis Tracker Plans</h2>
        <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
          Upgrade to unlock advanced medication tracking, clinical exports, and multi-patient caregiver tools.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <span className={`text-xs font-black uppercase tracking-widest ${billingCycle === BillingInterval.MONTH ? 'text-slate-900' : 'text-slate-300'}`}>Monthly</span>
          <button 
            onClick={() => setBillingCycle(prev => prev === BillingInterval.MONTH ? BillingInterval.YEAR : BillingInterval.MONTH)}
            className="w-16 h-8 bg-slate-100 rounded-full relative p-1 transition-colors hover:bg-slate-200"
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 transform ${billingCycle === BillingInterval.YEAR ? 'translate-x-8' : 'translate-x-0'}`} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black uppercase tracking-widest ${billingCycle === BillingInterval.YEAR ? 'text-slate-900' : 'text-slate-300'}`}>Yearly</span>
            <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg shadow-emerald-100">2 Months Free</span>
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.tier}
            className={`relative p-10 lg:p-12 bg-white rounded-[4rem] border transition-all duration-500 flex flex-col group ${plan.highlight ? 'border-sky-500 shadow-3xl shadow-sky-100 scale-105 z-10' : 'border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200'}`}
          >
            {plan.highlight && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-sky-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-sky-200">
                Most Popular
              </div>
            )}

            <div className="mb-10">
              <h3 className={`text-2xl font-black tracking-tight mb-2 ${plan.highlight ? 'text-sky-600' : 'text-slate-900'}`}>{plan.tier}</h3>
              <p className="text-slate-400 text-sm font-medium">{plan.description}</p>
            </div>

            <div className="mb-10 flex items-baseline gap-1">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">${plan.price}</span>
              <span className="text-slate-300 font-bold uppercase text-xs tracking-widest">/ {billingCycle === BillingInterval.MONTH ? 'mo' : 'yr'}</span>
            </div>

            <div className="space-y-4 mb-12 flex-1">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Includes</p>
              {plan.features.map(feature => (
                <div key={feature} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-sky-50 text-sky-500' : 'bg-slate-50 text-slate-400'}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span className="text-sm font-bold text-slate-600">{feature}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleUpgrade(plan.tier)}
              disabled={profile.subscription.plan === plan.tier}
              className={`w-full py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest transition-all transform active:scale-95 ${
                profile.subscription.plan === plan.tier 
                  ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-default' 
                  : plan.highlight 
                    ? 'bg-sky-500 text-white shadow-2xl shadow-sky-200 hover:bg-sky-600' 
                    : 'bg-slate-900 text-white shadow-xl hover:bg-slate-800'
              }`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </section>

      <div className="text-center pt-10">
         <button onClick={() => navigate('/subscription')} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-sky-500 transition-colors">Return to Management Dashboard</button>
      </div>
    </div>
  );
};

export default Subscription;
