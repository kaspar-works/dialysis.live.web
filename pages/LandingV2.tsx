import React, { useEffect } from 'react';
import { Link } from 'react-router';
import SEO from '../components/SEO';
import PublicNav from '../components/PublicNav';
import PublicFooter from '../components/PublicFooter';
import { THEME, ensureWellnessFont, WELLNESS_FONT_FAMILY } from '../theme';

/**
 * Landing V2 — Wellness & Calm aesthetic.
 * Pastel tiles, breathable spacing, gentle gradients.
 * Palette lives in /theme.ts — edit once, updates everywhere.
 */

const LandingV2: React.FC = () => {
  useEffect(() => {
    ensureWellnessFont();
    const id = 'lv2-keyframes';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id;
      s.textContent = `
        @keyframes lv2-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes lv2-soft-pulse {
          0%, 100% { box-shadow: 0 0 0 0 ${THEME.coral}55; }
          50% { box-shadow: 0 0 0 6px ${THEME.coral}00; }
        }
        .lv2-shimmer {
          background-size: 200% 100%;
          animation: lv2-shimmer 2.8s linear infinite;
        }
        .lv2-live-glow { animation: lv2-soft-pulse 2s ease-in-out infinite; }
      `;
      document.head.appendChild(s);
    }
  }, []);

  const highlights = [
    {
      icon: '🌊',
      tile: THEME.sky,
      chip: THEME.skyInk,
      title: 'Cycle Sync',
      desc: 'Track every dialysis session with pre/post vitals, UF removal, and a simple rating.',
    },
    {
      icon: '🥗',
      tile: THEME.mint,
      chip: THEME.mintInk,
      title: 'Nutri-Scan AI',
      desc: 'Photograph a meal. See sodium, potassium, phosphorus before you eat.',
    },
    {
      icon: '💧',
      tile: THEME.peach,
      chip: THEME.peachInk,
      title: 'Fluid Ledger',
      desc: 'Stay within your daily allowance with quick-add presets and live totals.',
    },
    {
      icon: '💊',
      tile: THEME.butter,
      chip: THEME.butterInk,
      title: 'Med Adherence',
      desc: 'Reminders built around on-dialysis and off-dialysis dosing schedules.',
    },
    {
      icon: '💗',
      tile: THEME.lavender,
      chip: THEME.lavenderInk,
      title: 'Vitals Hub',
      desc: 'Blood pressure, heart rate, temperature, SpO₂ — trended over weeks.',
    },
    {
      icon: '✨',
      tile: THEME.sky,
      chip: THEME.lavenderInk,
      title: 'AI Assistant',
      desc: 'Chat about symptoms, interpret labs, and get gentle, personalized insights.',
    },
  ];

  const steps = [
    {
      n: '1',
      title: 'Set up in 2 minutes',
      desc: 'Tell us your modality, schedule, and a few goals. Skip anything you don\'t want to answer.',
    },
    {
      n: '2',
      title: 'Track what matters',
      desc: 'Log sessions, vitals, fluids and meals. Everything syncs quietly in the background.',
    },
    {
      n: '3',
      title: 'Share with your team',
      desc: 'Export a clean, readable report for your nephrologist in one tap.',
    },
  ];

  return (
    <div
      style={{
        ['--teal' as any]: THEME.teal,
        ['--teal-dark' as any]: THEME.tealDark,
        ['--green' as any]: THEME.green,
        ['--sky' as any]: THEME.sky,
        ['--coral' as any]: THEME.coral,
        ['--lavender' as any]: THEME.lavender,
        ['--bg' as any]: THEME.bg,
        ['--bg-soft' as any]: THEME.bgSoft,
        ['--card' as any]: THEME.card,
        ['--border' as any]: THEME.border,
        ['--ink' as any]: THEME.ink,
        ['--muted' as any]: THEME.muted,
        backgroundColor: THEME.bg,
        color: THEME.ink,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        minHeight: '100vh',
      }}
      className="w-full"
    >
      <SEO
        title="A calm companion for dialysis."
        description="Soft, clear tracking for dialysis sessions, vitals, nutrition, and medications. Wellness-first design for patients and their care teams."
      />

      <PublicNav />

      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ background: THEME.calmGradient }}
      >
        {/* Soft blobs */}
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full opacity-40 blur-3xl"
          style={{ background: THEME.teal }}
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-24 w-[400px] h-[400px] rounded-full opacity-30 blur-3xl"
          style={{ background: THEME.green }}
        />

        <div className="relative max-w-[1200px] mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-20 md:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
              style={{
                backgroundColor: THEME.card,
                color: THEME.tealDark,
                border: `1px solid ${THEME.border}`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: THEME.green }}
              />
              Built with nephrologist guidance · for dialysis patients & care teams
            </div>

            <h1
              className="font-bold tracking-tight"
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4.75rem)',
                lineHeight: 1.05,
                color: THEME.ink,
                letterSpacing: '-0.02em',
              }}
            >
              A{' '}
              <span
                style={{
                  background: THEME.heroGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                calm companion
              </span>
              <br />
              for your dialysis days.
            </h1>

            <p
              className="mt-7 max-w-xl text-lg md:text-xl leading-relaxed"
              style={{ color: THEME.muted }}
            >
              Track sessions, vitals, meals, and medications — gently. Everything your
              nephrologist needs, nothing that gets in your way.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="px-8 py-4 rounded-full text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                style={{
                  background: THEME.heroGradient,
                  boxShadow: `0 10px 30px -10px ${THEME.teal}80`,
                }}
              >
                Start your care journey →
              </Link>
              <Link
                to="/demo"
                className="px-8 py-4 rounded-full font-semibold text-base transition-all hover:-translate-y-0.5"
                style={{
                  backgroundColor: THEME.card,
                  color: THEME.ink,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                See a live demo
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm" style={{ color: THEME.muted }}>
              <Span icon="✓" color={THEME.green}>No credit card</Span>
              <Span icon="✓" color={THEME.green}>Private by default</Span>
              <Span icon="✓" color={THEME.green}>Works on iPhone, Watch & web</Span>
            </div>
          </div>

          {/* Hero preview card — dialysis-specific */}
          <div className="lg:col-span-5 relative">
            <div
              className="relative rounded-[2rem] p-6 md:p-7"
              style={{
                backgroundColor: THEME.card,
                border: `1px solid ${THEME.border}`,
                boxShadow: `0 30px 80px -30px ${THEME.tealDark}33`,
              }}
            >
              {/* Active session header with glow pulse */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider lv2-live-glow"
                    style={{ color: THEME.tealDark, backgroundColor: THEME.mint }}
                  >
                    <span className="relative flex w-2 h-2">
                      <span
                        className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                        style={{ backgroundColor: THEME.coral }}
                      />
                      <span
                        className="relative inline-flex rounded-full h-2 w-2"
                        style={{ backgroundColor: THEME.coral }}
                      />
                    </span>
                    Live · Session 142
                  </div>
                  <div className="mt-2 text-lg font-bold" style={{ color: THEME.ink }}>
                    Hemodialysis in progress
                  </div>
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: THEME.heroGradient }}
                >
                  <span className="text-white text-2xl">🩺</span>
                </div>
              </div>

              {/* Session progress bar */}
              <div
                className="rounded-2xl p-4 mb-4"
                style={{ backgroundColor: THEME.bgSoft }}
              >
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-semibold" style={{ color: THEME.muted }}>Session progress</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: THEME.tealDark }}>2h 52m / 4h 00m</span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: THEME.border }}
                >
                  <div
                    className="h-full rounded-full lv2-shimmer"
                    style={{
                      width: '72%',
                      backgroundImage: `linear-gradient(90deg, ${THEME.teal} 0%, ${THEME.green} 40%, #fff7 50%, ${THEME.teal} 60%, ${THEME.green} 100%)`,
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px]" style={{ color: THEME.muted }}>
                  <span>UF goal · 2.4 L</span>
                  <span>1.7 L removed</span>
                </div>
              </div>

              {/* Weight + fluid tiles */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatTile
                  label="Pre / Post weight"
                  value="74.2 → 71.8"
                  unit="kg"
                  tile={THEME.peach}
                  chip={THEME.peachInk}
                  icon="⚖️"
                />
                <StatTile
                  label="Fluid today"
                  value="850 / 1000"
                  unit="ml"
                  tile={THEME.sky}
                  chip={THEME.skyInk}
                  icon="💧"
                />
              </div>

              {/* Next session reminder */}
              <div
                className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: THEME.mint }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: THEME.mintInk + '33' }}
                >
                  <span className="text-base">📅</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: THEME.ink, opacity: 0.6 }}>
                    Next session
                  </div>
                  <div className="text-sm font-semibold truncate" style={{ color: THEME.ink }}>
                    Wed · 10:00 AM · Center A
                  </div>
                </div>
              </div>

              {/* Floating AI chip */}
              <div
                className="absolute -bottom-6 -left-6 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg"
                style={{
                  background: THEME.aiGradient,
                  border: `2px solid ${THEME.card}`,
                }}
              >
                <span className="text-xl">✨</span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: THEME.ink }}>
                    AI insight
                  </div>
                  <div className="text-sm font-semibold" style={{ color: THEME.ink }}>
                    IDWG on target this week
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section
        className="py-6 md:py-8"
        style={{ borderTop: `1px solid ${THEME.border}`, borderBottom: `1px solid ${THEME.border}` }}
      >
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ['10+', 'Dialysis tracking tools'],
            ['256-bit', 'Encryption'],
            ['24/7', 'Access'],
            ['100%', 'Private'],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="text-2xl md:text-3xl font-bold" style={{ color: THEME.tealDark }}>
                {v}
              </div>
              <div className="text-xs md:text-sm mt-1" style={{ color: THEME.muted }}>
                {l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOR WHO — audience strip */}
      <section className="py-14 md:py-16">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10">
          <div className="text-center mb-10">
            <div
              className="inline-block text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-3"
              style={{ backgroundColor: THEME.bgSoft, color: THEME.tealDark }}
            >
              For everyone in the circle of care
            </div>
            <h2
              className="font-bold tracking-tight"
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                color: THEME.ink,
              }}
            >
              One app. Three people who benefit.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                icon: '👤',
                tile: THEME.sky,
                chip: THEME.skyInk,
                title: 'Patients',
                desc: 'Track sessions, meals, fluids, and medications without the spreadsheet.',
              },
              {
                icon: '👨‍⚕️',
                tile: THEME.mint,
                chip: THEME.mintInk,
                title: 'Nephrologists',
                desc: 'Receive clean, clinical reports — not a wall of screenshots.',
              },
              {
                icon: '👨‍👩‍👧',
                tile: THEME.peach,
                chip: THEME.peachInk,
                title: 'Caregivers',
                desc: 'Stay in the loop on treatments, reminders, and emergencies.',
              },
            ].map((a) => (
              <div
                key={a.title}
                className="flex items-start gap-4 p-6 rounded-3xl transition-all hover:-translate-y-0.5"
                style={{
                  backgroundColor: a.tile,
                  border: `1px solid ${a.chip}22`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: THEME.card }}
                >
                  {a.icon}
                </div>
                <div>
                  <div className="text-base font-bold mb-1" style={{ color: THEME.ink }}>
                    {a.title}
                  </div>
                  <div className="text-sm font-medium leading-relaxed" style={{ color: '#2B3A37' }}>
                    {a.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 md:py-28">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
            <div
              className="inline-block text-xs font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4"
              style={{ backgroundColor: THEME.bgSoft, color: THEME.tealDark }}
            >
              Everything you need
            </div>
            <h2
              className="font-bold tracking-tight"
              style={{
                fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
                lineHeight: 1.1,
                letterSpacing: '-0.015em',
                color: THEME.ink,
              }}
            >
              Gentle tools for a demanding routine.
            </h2>
            <p className="mt-5 text-lg leading-relaxed" style={{ color: THEME.muted }}>
              Six everyday essentials below.{' '}
              <Link to="/features" style={{ color: THEME.tealDark, fontWeight: 600 }}>
                See all fifteen →
              </Link>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {highlights.map((h) => (
              <div
                key={h.title}
                className="group rounded-3xl p-7 transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{
                  backgroundColor: h.tile,
                  boxShadow: `0 4px 18px -8px ${h.chip}33`,
                  border: `1px solid ${h.chip}22`,
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 transition-transform group-hover:scale-110 shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${h.chip}e6 0%, ${h.chip} 100%)`,
                    color: '#fff',
                  }}
                >
                  {h.icon}
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: THEME.ink }}>
                  {h.title}
                </h3>
                <p className="leading-relaxed font-medium" style={{ color: '#2B3A37' }}>
                  {h.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HUMAN TOUCH — emotional anchor */}
      <section className="py-20 md:py-28">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10">
          <div
            className="rounded-[2.5rem] overflow-hidden grid grid-cols-1 md:grid-cols-12"
            style={{
              background: `linear-gradient(135deg, ${THEME.peach} 0%, ${THEME.butter} 100%)`,
            }}
          >
            <div className="md:col-span-7 p-10 md:p-16">
              <div
                className="text-xs font-bold uppercase tracking-[0.2em] mb-5"
                style={{ color: THEME.peachInk }}
              >
                For real dialysis lives
              </div>
              <h2
                className="font-bold tracking-tight mb-6"
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.015em',
                  color: THEME.ink,
                }}
              >
                Dialysis isn't just numbers.<br />
                It's daily decisions, discipline, and strength.
              </h2>
              <p
                className="text-lg leading-relaxed"
                style={{ color: THEME.ink, opacity: 0.75, maxWidth: '38ch' }}
              >
                We built dialysis.live alongside patients and nephrologists who live this reality —
                the weight of fluid limits, the quiet wins of a good session, the weekends that feel
                long. It's designed to support you through all of it.
              </p>
            </div>

            <div className="md:col-span-5 relative min-h-[280px] md:min-h-0 flex items-center justify-center p-8">
              {/* Decorative illustration built from layered shapes */}
              <div className="relative w-full max-w-[280px] aspect-square">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: THEME.card, opacity: 0.4 }}
                />
                <div
                  className="absolute inset-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: THEME.card, opacity: 0.7 }}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center text-7xl md:text-8xl"
                  aria-hidden
                >
                  💗
                </div>
                <div
                  className="absolute top-4 right-2 rounded-2xl px-3 py-2 shadow-md flex items-center gap-2"
                  style={{ backgroundColor: THEME.card }}
                >
                  <span className="text-lg">🌱</span>
                  <span className="text-xs font-bold" style={{ color: THEME.mintInk }}>
                    Day 142
                  </span>
                </div>
                <div
                  className="absolute bottom-6 left-0 rounded-2xl px-3 py-2 shadow-md"
                  style={{ backgroundColor: THEME.card }}
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: THEME.muted }}>
                    You're doing great
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        className="py-20 md:py-28"
        style={{ backgroundColor: THEME.bgSoft }}
      >
        <div className="max-w-[1200px] mx-auto px-6 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
            <div
              className="inline-block text-xs font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4"
              style={{ backgroundColor: THEME.card, color: THEME.tealDark }}
            >
              How it works
            </div>
            <h2
              className="font-bold tracking-tight"
              style={{
                fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
                lineHeight: 1.1,
                letterSpacing: '-0.015em',
                color: THEME.ink,
              }}
            >
              Three small steps. No learning curve.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {steps.map((s) => (
              <div
                key={s.n}
                className="rounded-3xl p-8"
                style={{
                  backgroundColor: THEME.card,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-5"
                  style={{ background: THEME.heroGradient }}
                >
                  {s.n}
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: THEME.ink }}>
                  {s.title}
                </h3>
                <p className="leading-relaxed" style={{ color: THEME.muted }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="py-20 md:py-28">
        <div className="max-w-[900px] mx-auto px-6 md:px-10 text-center">
          <div
            className="inline-flex w-14 h-14 rounded-2xl items-center justify-center text-2xl mb-7"
            style={{ backgroundColor: THEME.coral + '22' }}
          >
            💬
          </div>
          <blockquote
            className="font-semibold tracking-tight"
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              lineHeight: 1.3,
              color: THEME.ink,
              letterSpacing: '-0.01em',
            }}
          >
            "Finally, an app that understands the dialysis lifestyle. The fluid tracking alone
            has changed the way I get through the weekend."
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div
              className="w-10 h-10 rounded-full"
              style={{ background: THEME.heroGradient }}
            />
            <div className="text-left">
              <div className="font-bold" style={{ color: THEME.ink }}>Sarah M.</div>
              <div className="text-sm" style={{ color: THEME.muted }}>Home HD patient</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10">
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
                Take five minutes.<br />See what changes.
              </h2>
              <p className="mt-5 text-white/90 text-lg max-w-xl mx-auto leading-relaxed">
                Free to start. No credit card. Cancel any time.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                  style={{ backgroundColor: THEME.card, color: THEME.tealDark }}
                >
                  Create free account →
                </Link>
                <Link
                  to="/edu"
                  className="px-8 py-4 rounded-full font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{ border: '1px solid rgba(255,255,255,0.6)' }}
                >
                  Read the guide
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

const StatTile: React.FC<{
  label: string;
  value: string;
  unit: string;
  tile: string;
  chip: string;
  icon: string;
}> = ({ label, value, unit, tile, chip, icon }) => (
  <div className="rounded-2xl p-4" style={{ backgroundColor: tile }}>
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center text-base mb-3"
      style={{ backgroundColor: chip + '33' }}
    >
      {icon}
    </div>
    <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: THEME.ink, opacity: 0.6 }}>
      {label}
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-bold" style={{ color: THEME.ink }}>
        {value}
      </span>
      <span className="text-xs" style={{ color: THEME.ink, opacity: 0.6 }}>
        {unit}
      </span>
    </div>
  </div>
);

const Span: React.FC<{ icon: string; color: string; children: React.ReactNode }> = ({
  icon,
  color,
  children,
}) => (
  <span className="inline-flex items-center gap-1.5">
    <span
      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
      style={{ backgroundColor: color }}
    >
      {icon}
    </span>
    {children}
  </span>
);

export default LandingV2;
