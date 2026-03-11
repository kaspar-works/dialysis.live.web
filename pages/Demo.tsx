import React, { useState } from 'react';
import { Link } from 'react-router';
import { ICONS } from '../constants';
import SEO from '../components/SEO';
import PublicNav from '../components/PublicNav';
import PublicFooter from '../components/PublicFooter';

interface DemoScreen {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  icon: (props: any) => React.ReactElement;
  tag: string;
  mockup: React.ReactNode;
}

const Demo: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const screens: DemoScreen[] = [
    {
      id: 'dashboard',
      title: 'Clinical Dashboard',
      subtitle: 'Your health command center. See stability scores, active alerts, upcoming sessions, and quick stats at a glance.',
      color: 'from-sky-500 to-blue-600',
      icon: ICONS.Dashboard,
      tag: 'Home',
      mockup: (
        <div className="space-y-4">
          {/* Top Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Stability</p>
              <p className="text-2xl font-black text-emerald-400">87<span className="text-sm text-white/30">%</span></p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Fluid</p>
              <p className="text-2xl font-black text-sky-400">850<span className="text-sm text-white/30">ml</span></p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Weight</p>
              <p className="text-2xl font-black text-violet-400">74.2<span className="text-sm text-white/30">kg</span></p>
            </div>
          </div>
          {/* Alert Banner */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <ICONS.Bell className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-400">Upcoming Session</p>
              <p className="text-[11px] text-white/40">Today at 2:00 PM - In-center HD</p>
            </div>
          </div>
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: ICONS.Activity, label: 'Session', c: 'text-orange-400 bg-orange-500/10' },
              { icon: ICONS.Vitals, label: 'Vitals', c: 'text-pink-400 bg-pink-500/10' },
              { icon: ICONS.Droplet, label: 'Fluids', c: 'text-sky-400 bg-sky-500/10' },
              { icon: ICONS.Pill, label: 'Meds', c: 'text-amber-400 bg-amber-500/10' },
            ].map((a, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className={`w-8 h-8 rounded-lg ${a.c} flex items-center justify-center`}>
                  <a.icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold text-white/50">{a.label}</span>
              </div>
            ))}
          </div>
          {/* BP Trend Mini Chart */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-3">Blood Pressure Trend</p>
            <div className="flex items-end gap-1.5 h-16">
              {[65, 72, 58, 80, 68, 75, 70, 82, 74, 78, 72, 76].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-sky-500/60 to-pink-500/60" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[8px] text-white/20">Mar 1</span>
              <span className="text-[8px] text-white/20">Mar 10</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'sessions',
      title: 'Dialysis Sessions',
      subtitle: 'Track treatments in real-time. Log pre/post vitals, monitor duration, UFR, and rate each session.',
      color: 'from-orange-500 to-red-500',
      icon: ICONS.Activity,
      tag: 'Cycle Sync',
      mockup: (
        <div className="space-y-4">
          {/* Active Session */}
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl p-4 border border-orange-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Active Session</span>
              </div>
              <span className="text-xs text-white/40">In-Center HD</span>
            </div>
            <div className="text-center py-4">
              <p className="text-4xl font-black tabular-nums">02:48:32</p>
              <p className="text-xs text-white/30 mt-1">of 4:00:00</p>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-[70%] bg-gradient-to-r from-orange-500 to-red-400 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-center">
                <p className="text-lg font-black">128/82</p>
                <p className="text-[8px] text-white/30 uppercase tracking-widest">BP</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-sky-400">2.1L</p>
                <p className="text-[8px] text-white/30 uppercase tracking-widest">UF Target</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-emerald-400">76</p>
                <p className="text-[8px] text-white/30 uppercase tracking-widest">Heart Rate</p>
              </div>
            </div>
          </div>
          {/* Past Sessions */}
          {[
            { date: 'Mar 8', dur: '3h 55m', rating: 4, uf: '1.8L' },
            { date: 'Mar 6', dur: '4h 00m', rating: 5, uf: '2.2L' },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{s.date}</p>
                <p className="text-xs text-white/30">{s.dur} - UF {s.uf}</p>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} className={`w-3 h-3 rounded-full ${n <= s.rating ? 'bg-amber-400' : 'bg-white/10'}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'vitals',
      title: 'Vitals Hub',
      subtitle: 'Monitor blood pressure, heart rate, temperature, and SpO2. See trends over time with interactive charts.',
      color: 'from-pink-500 to-rose-500',
      icon: ICONS.Vitals,
      tag: 'Monitoring',
      mockup: (
        <div className="space-y-4">
          {/* Latest Vitals Cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Blood Pressure', value: '128/82', unit: 'mmHg', color: 'text-pink-400', trend: '+2' },
              { label: 'Heart Rate', value: '76', unit: 'bpm', color: 'text-red-400', trend: '-1' },
              { label: 'Temperature', value: '36.7', unit: '°C', color: 'text-amber-400', trend: '0' },
              { label: 'SpO2', value: '98', unit: '%', color: 'text-emerald-400', trend: '+1' },
            ].map((v, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2">{v.label}</p>
                <p className={`text-2xl font-black ${v.color}`}>{v.value}<span className="text-xs text-white/30 ml-1">{v.unit}</span></p>
                <p className="text-[10px] text-white/20 mt-1">{v.trend === '0' ? 'Stable' : `${v.trend} from last`}</p>
              </div>
            ))}
          </div>
          {/* Heart Rate Chart */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-3">Heart Rate - 7 Days</p>
            <svg viewBox="0 0 300 80" className="w-full">
              <defs>
                <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,50 L43,45 L86,55 L129,40 L172,48 L215,35 L258,42 L300,38 L300,80 L0,80Z" fill="url(#hrGrad)" />
              <polyline points="0,50 43,45 86,55 129,40 172,48 215,35 258,42 300,38" fill="none" stroke="#f43f5e" strokeWidth="2" />
              {[0, 43, 86, 129, 172, 215, 258, 300].map((x, i) => (
                <circle key={i} cx={x} cy={[50, 45, 55, 40, 48, 35, 42, 38][i]} r="3" fill="#f43f5e" />
              ))}
            </svg>
          </div>
          {/* Log Button */}
          <div className="bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-2xl p-4 border border-pink-500/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <ICONS.Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">Log New Vitals</p>
              <p className="text-xs text-white/30">Add BP, HR, temp, or SpO2</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'fluids',
      title: 'Fluid Ledger',
      subtitle: 'Precision hydration management. Set daily limits, use quick-add presets, and track remaining allowance.',
      color: 'from-sky-500 to-blue-500',
      icon: ICONS.Droplet,
      tag: 'Hydration',
      mockup: (
        <div className="space-y-4">
          {/* Circular Progress */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5 flex flex-col items-center">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="60" cy="60" r="54" fill="none" stroke="url(#fluidGrad)" strokeWidth="8" strokeDasharray={`${0.57 * 339} ${339}`} strokeLinecap="round" />
                <defs>
                  <linearGradient id="fluidGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-black text-sky-400">850</p>
                <p className="text-[10px] text-white/30">of 1500 ml</p>
              </div>
            </div>
            <p className="text-xs text-white/40 mt-3">650 ml remaining today</p>
          </div>
          {/* Quick Add */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { emoji: '💧', label: 'Water', ml: '200ml' },
              { emoji: '☕', label: 'Tea', ml: '150ml' },
              { emoji: '🥤', label: 'Juice', ml: '250ml' },
              { emoji: '🍲', label: 'Soup', ml: '200ml' },
            ].map((p, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5 text-center hover:bg-white/10 transition-all cursor-pointer">
                <span className="text-xl">{p.emoji}</span>
                <p className="text-[9px] font-bold text-white/50 mt-1">{p.label}</p>
                <p className="text-[8px] text-white/30">{p.ml}</p>
              </div>
            ))}
          </div>
          {/* Today's Log */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Today's Intake</p>
            {[
              { time: '08:30', type: 'Water', amount: '200ml' },
              { time: '10:15', type: 'Tea', amount: '150ml' },
              { time: '12:40', type: 'Water', amount: '250ml' },
              { time: '14:00', type: 'Juice', amount: '250ml' },
            ].map((e, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/20 tabular-nums w-10">{e.time}</span>
                  <span className="text-xs">{e.type}</span>
                </div>
                <span className="text-xs font-bold text-sky-400">{e.amount}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'meds',
      title: 'Medication Adherence',
      subtitle: 'Smart medication tracking that differentiates between dialysis-day and off-dialysis dosing schedules.',
      color: 'from-amber-500 to-orange-500',
      icon: ICONS.Pill,
      tag: 'Medications',
      mockup: (
        <div className="space-y-4">
          {/* Adherence Score */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Weekly Adherence</p>
              <p className="text-3xl font-black text-emerald-400">94<span className="text-sm text-white/30">%</span></p>
            </div>
            <div className="flex gap-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`w-5 h-5 rounded-md ${i === 3 ? 'bg-amber-500/20 border border-amber-500/30' : i < 6 ? 'bg-emerald-500/20' : 'bg-white/5'} flex items-center justify-center`}>
                    {i < 6 && i !== 3 && <ICONS.Check className="w-3 h-3 text-emerald-400" />}
                    {i === 3 && <span className="text-[8px] text-amber-400">!</span>}
                  </div>
                  <span className="text-[7px] text-white/20">{d}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Today's Meds */}
          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Today's Schedule</p>
          {[
            { name: 'Epoetin Alfa', dose: '4000 IU', time: '08:00', taken: true, type: 'Dialysis Day' },
            { name: 'Calcium Acetate', dose: '667mg x2', time: '12:00', taken: true, type: 'Daily' },
            { name: 'Sevelamer', dose: '800mg', time: '18:00', taken: false, type: 'Daily' },
            { name: 'Calcitriol', dose: '0.25mcg', time: '20:00', taken: false, type: 'Daily' },
          ].map((m, i) => (
            <div key={i} className={`bg-white/5 rounded-2xl p-4 border ${m.taken ? 'border-emerald-500/20' : 'border-white/5'} flex items-center gap-3`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.taken ? 'bg-emerald-500/20' : 'bg-amber-500/10'}`}>
                {m.taken ? <ICONS.Check className="w-5 h-5 text-emerald-400" /> : <ICONS.Clock className="w-5 h-5 text-amber-400" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">{m.name}</p>
                  <span className="px-1.5 py-0.5 bg-white/5 rounded text-[7px] font-bold text-white/30">{m.type}</span>
                </div>
                <p className="text-xs text-white/30">{m.dose} at {m.time}</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 ${m.taken ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`} />
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'nutriscan',
      title: 'Nutri-Scan AI',
      subtitle: 'Snap a photo of any meal. AI analyzes sodium, potassium, and phosphorus levels for kidney safety.',
      color: 'from-emerald-500 to-teal-500',
      icon: ICONS.Camera,
      tag: 'AI Vision',
      mockup: (
        <div className="space-y-4">
          {/* Camera Preview */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-white/5 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-emerald-500/30 flex items-center justify-center mb-4">
              <ICONS.Camera className="w-10 h-10 text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-white/60">Tap to scan your meal</p>
            <p className="text-xs text-white/30 mt-1">AI analyzes in seconds</p>
          </div>
          {/* Analysis Result */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <ICONS.Sparkles className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-bold text-emerald-400">Last Scan: Grilled Chicken Salad</p>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Sodium', value: 420, max: 2000, unit: 'mg', status: 'safe', color: 'bg-emerald-500' },
                { label: 'Potassium', value: 680, max: 2000, unit: 'mg', status: 'moderate', color: 'bg-amber-500' },
                { label: 'Phosphorus', value: 190, max: 1000, unit: 'mg', status: 'safe', color: 'bg-emerald-500' },
              ].map((n, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-white/50">{n.label}</span>
                    <span className="text-xs font-bold">{n.value}<span className="text-white/30">{n.unit}</span></span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${n.color} rounded-full`} style={{ width: `${(n.value / n.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* AI Verdict */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
            <ICONS.CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-400">Kidney-Friendly</p>
              <p className="text-[11px] text-white/40 mt-1">This meal is within recommended renal diet limits. Good choice for potassium-conscious eating.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'weight',
      title: 'Weight Analytics',
      subtitle: 'Track inter-dialytic weight gain. Monitor dry weight stability with morning vs session comparisons.',
      color: 'from-violet-500 to-purple-500',
      icon: ICONS.Scale,
      tag: 'Biometrics',
      mockup: (
        <div className="space-y-4">
          {/* Current Weight */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Current Weight</p>
                <p className="text-4xl font-black">74.2<span className="text-lg text-white/30 ml-1">kg</span></p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Dry Weight</p>
                <p className="text-xl font-black text-violet-400">72.0<span className="text-sm text-white/30 ml-1">kg</span></p>
              </div>
            </div>
            <div className="mt-3 bg-amber-500/10 rounded-xl px-3 py-2 flex items-center gap-2">
              <ICONS.TrendingUp className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-400 font-bold">+2.2 kg above dry weight</span>
            </div>
          </div>
          {/* Weight Chart */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-3">14-Day Trend</p>
            <svg viewBox="0 0 300 80" className="w-full">
              <defs>
                <linearGradient id="wtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Dry weight line */}
              <line x1="0" y1="60" x2="300" y2="60" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
              <text x="260" y="57" fill="#8b5cf6" fontSize="8" opacity="0.5">72.0 dry</text>
              <path d="M0,30 L21,35 L43,20 L64,38 L86,15 L107,40 L129,18 L150,42 L172,22 L193,45 L215,25 L236,40 L258,20 L300,28 L300,80 L0,80Z" fill="url(#wtGrad)" />
              <polyline points="0,30 21,35 43,20 64,38 86,15 107,40 129,18 150,42 172,22 193,45 215,25 236,40 258,20 300,28" fill="none" stroke="#8b5cf6" strokeWidth="2" />
            </svg>
          </div>
          {/* IDWG Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Avg IDWG</p>
              <p className="text-xl font-black text-amber-400">2.1<span className="text-sm text-white/30">kg</span></p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Max IDWG</p>
              <p className="text-xl font-black text-red-400">3.4<span className="text-sm text-white/30">kg</span></p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'labs',
      title: 'Lab Reports',
      subtitle: 'Track lab results over time. Scan paper reports with your camera or enter manually. Trend analysis included.',
      color: 'from-indigo-500 to-violet-500',
      icon: ICONS.FileText,
      tag: 'Labs',
      mockup: (
        <div className="space-y-4">
          {/* Latest Results */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold">Latest Results - Mar 5</p>
              <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[8px] font-bold text-emerald-400">4 Normal</span>
            </div>
            {[
              { name: 'Hemoglobin', val: '11.2 g/dL', range: '11-13', status: 'normal' },
              { name: 'Creatinine', val: '8.4 mg/dL', range: '2-15', status: 'normal' },
              { name: 'Potassium', val: '5.8 mEq/L', range: '3.5-5.5', status: 'high' },
              { name: 'Phosphorus', val: '4.2 mg/dL', range: '2.5-4.5', status: 'normal' },
              { name: 'Calcium', val: '9.1 mg/dL', range: '8.5-10.5', status: 'normal' },
            ].map((l, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-xs text-white/60">{l.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">{l.val}</span>
                  <div className={`w-2 h-2 rounded-full ${l.status === 'normal' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                </div>
              </div>
            ))}
          </div>
          {/* Scan Button */}
          <div className="bg-gradient-to-r from-indigo-500/20 to-violet-500/20 rounded-2xl p-4 border border-indigo-500/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <ICONS.Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">Scan Lab Report</p>
              <p className="text-xs text-white/30">Take a photo to auto-digitize</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'aichat',
      title: 'AI Health Assistant',
      subtitle: 'Chat with an AI trained on dialysis care. Ask about symptoms, diet, medications, or treatment questions.',
      color: 'from-purple-500 to-fuchsia-500',
      icon: ICONS.Sparkles,
      tag: 'AI Chat',
      mockup: (
        <div className="space-y-3">
          {/* Chat Messages */}
          <div className="space-y-3 max-h-[320px]">
            {/* User */}
            <div className="flex justify-end">
              <div className="bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%] border border-purple-500/20">
                <p className="text-xs">Is it normal to feel tired after dialysis?</p>
              </div>
            </div>
            {/* AI */}
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                <ICONS.Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/5 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%] border border-white/5">
                <p className="text-xs text-white/70 leading-relaxed">Yes, post-dialysis fatigue is very common and affects up to <span className="text-white font-bold">70-80%</span> of patients. Here are common causes:</p>
                <ul className="mt-2 space-y-1">
                  <li className="text-xs text-white/50 flex items-start gap-2"><span className="text-purple-400 mt-0.5">-</span> Fluid and electrolyte shifts</li>
                  <li className="text-xs text-white/50 flex items-start gap-2"><span className="text-purple-400 mt-0.5">-</span> Blood pressure changes</li>
                  <li className="text-xs text-white/50 flex items-start gap-2"><span className="text-purple-400 mt-0.5">-</span> Anemia-related tiredness</li>
                </ul>
              </div>
            </div>
            {/* User */}
            <div className="flex justify-end">
              <div className="bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%] border border-purple-500/20">
                <p className="text-xs">What can I do to feel less tired?</p>
              </div>
            </div>
            {/* AI */}
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                <ICONS.Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/5 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%] border border-white/5">
                <p className="text-xs text-white/70 leading-relaxed">Great question! Some strategies that help:</p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 bg-emerald-500/10 rounded-lg px-2 py-1.5">
                    <span className="text-emerald-400 text-xs">1.</span>
                    <span className="text-xs text-white/60">Light exercise on non-dialysis days</span>
                  </div>
                  <div className="flex items-center gap-2 bg-sky-500/10 rounded-lg px-2 py-1.5">
                    <span className="text-sky-400 text-xs">2.</span>
                    <span className="text-xs text-white/60">Stay within fluid limits</span>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-500/10 rounded-lg px-2 py-1.5">
                    <span className="text-amber-400 text-xs">3.</span>
                    <span className="text-xs text-white/60">Iron-rich foods for anemia</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Input */}
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex items-center gap-3">
            <div className="flex-1 text-xs text-white/20">Ask about your health...</div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
              <ICONS.Send className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'reports',
      title: 'Clinical Reports',
      subtitle: 'Generate provider-ready clinical reports. Export to PDF or JSON with customizable date ranges for your care team.',
      color: 'from-slate-500 to-gray-600',
      icon: ICONS.FileText,
      tag: 'Reports',
      mockup: (
        <div className="space-y-4">
          {/* Report Preview */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <ICONS.FileText className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <p className="text-xs font-bold">Monthly Clinical Report</p>
                  <p className="text-[10px] text-white/30">Feb 10 - Mar 10, 2026</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-emerald-500/10 rounded text-[8px] font-bold text-emerald-400">Ready</span>
            </div>
            <div className="space-y-2 border-t border-white/5 pt-3">
              {[
                { label: 'Sessions Tracked', val: '12' },
                { label: 'Vitals Recorded', val: '48' },
                { label: 'Avg Blood Pressure', val: '132/84 mmHg' },
                { label: 'Avg IDWG', val: '2.1 kg' },
                { label: 'Med Adherence', val: '94%' },
              ].map((r, i) => (
                <div key={i} className="flex justify-between py-1">
                  <span className="text-xs text-white/40">{r.label}</span>
                  <span className="text-xs font-bold">{r.val}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Export Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col items-center gap-2 hover:bg-white/10 transition-all cursor-pointer">
              <ICONS.Download className="w-6 h-6 text-red-400" />
              <span className="text-xs font-bold">Export PDF</span>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col items-center gap-2 hover:bg-white/10 transition-all cursor-pointer">
              <ICONS.Code className="w-6 h-6 text-emerald-400" />
              <span className="text-xs font-bold">Export JSON</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'community',
      title: 'Community & Forums',
      subtitle: 'Connect with fellow patients. Share experiences, ask questions, and read success stories from the community.',
      color: 'from-teal-500 to-cyan-500',
      icon: ICONS.MessageSquare,
      tag: 'Community',
      mockup: (
        <div className="space-y-4">
          {/* Forum Categories */}
          {[
            { name: 'General Discussion', posts: 234, color: 'bg-sky-500/10 text-sky-400' },
            { name: 'Diet & Nutrition', posts: 187, color: 'bg-emerald-500/10 text-emerald-400' },
            { name: 'Treatment Tips', posts: 156, color: 'bg-amber-500/10 text-amber-400' },
          ].map((c, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${c.color.split(' ')[0]} flex items-center justify-center`}>
                  <ICONS.MessageSquare className={`w-5 h-5 ${c.color.split(' ')[1]}`} />
                </div>
                <div>
                  <p className="text-sm font-bold">{c.name}</p>
                  <p className="text-xs text-white/30">{c.posts} posts</p>
                </div>
              </div>
              <ICONS.ChevronRight className="w-4 h-4 text-white/20" />
            </div>
          ))}
          {/* Success Story */}
          <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-2xl p-4 border border-teal-500/20">
            <p className="text-[8px] font-black text-teal-400 uppercase tracking-widest mb-2">Success Story</p>
            <p className="text-sm font-bold mb-1">"How I Improved My Lab Results"</p>
            <p className="text-xs text-white/40 line-clamp-2">After 6 months of consistent tracking with dialysis.live, my phosphorus levels went from 6.8 to 4.2...</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-6 h-6 rounded-full bg-teal-500/20" />
              <span className="text-xs text-white/50">Sarah M. - Home HD</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleScreenChange = (index: number) => {
    if (index === activeScreen) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveScreen(index);
      setIsTransitioning(false);
    }, 200);
  };

  return (
    <div className="bg-[#020617] min-h-screen selection:bg-sky-500/30 selection:text-white overflow-x-hidden text-white w-full">
      <SEO
        title="Interactive Demo - See How It Works"
        description="Explore every feature of dialysis.live with our interactive demo. See the dashboard, session tracking, vitals monitoring, AI nutrition scanning, and more."
      />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[100vw] h-[100vw] bg-sky-900/20 rounded-full blur-[100px] md:blur-[160px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-pink-900/10 rounded-full blur-[140px]"></div>
      </div>

      <PublicNav />

      {/* Hero */}
      <section className="pt-28 sm:pt-36 md:pt-40 pb-10 sm:pb-16 px-4 sm:px-6 md:px-20 max-w-[1440px] mx-auto text-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] backdrop-blur-xl mb-6 sm:mb-8">
          <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></div>
          Interactive Demo
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]">
          See How<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-pink-400 to-emerald-400">It Works.</span>
        </h1>
        <p className="text-white/40 text-base sm:text-lg md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed mt-6 sm:mt-8">
          Explore every screen. Click through features to see how dialysis.live helps you manage your renal health journey.
        </p>
      </section>

      {/* Demo Section */}
      <section className="pb-20 sm:pb-32 md:pb-40 px-4 sm:px-6 md:px-20 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
          {/* Screen Navigator */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-28 space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pb-4">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-4 px-2">All Screens</p>
              {screens.map((screen, i) => (
                <button
                  key={screen.id}
                  onClick={() => handleScreenChange(i)}
                  className={`w-full text-left px-4 py-3 rounded-2xl border transition-all duration-300 group flex items-center gap-3 ${
                    activeScreen === i
                      ? 'bg-white/10 border-white/20 shadow-lg'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${screen.color} flex items-center justify-center flex-shrink-0 ${activeScreen === i ? 'scale-110' : 'group-hover:scale-105'} transition-transform`}>
                    <screen.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${activeScreen === i ? 'text-white' : 'text-white/60'}`}>{screen.title}</p>
                    <p className="text-[10px] text-white/30 truncate">{screen.tag}</p>
                  </div>
                  {activeScreen === i && (
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 ml-auto flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Mockup + Description */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
              {/* Phone */}
              <div className="flex justify-center">
                <div className="relative group">
                  {/* Phone glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${screens[activeScreen].color} rounded-[3rem] blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity duration-700`}></div>

                  {/* Phone frame */}
                  <div className="relative w-[300px] sm:w-[340px]">
                    <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-2 border border-white/10 shadow-2xl">
                      <div className="bg-slate-950 rounded-[2.2rem] border border-white/5 overflow-hidden">
                        {/* Status bar */}
                        <div className="flex items-center justify-between px-6 pt-3 pb-2">
                          <span className="text-[10px] font-bold text-white/40">9:41</span>
                          <div className="w-24 h-5 bg-white/10 rounded-full"></div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-2.5 border border-white/30 rounded-sm relative"><div className="absolute inset-0.5 bg-white/40 rounded-[1px]" style={{ width: '70%' }}></div></div>
                          </div>
                        </div>

                        {/* Screen header */}
                        <div className="px-5 pb-3 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${screens[activeScreen].color} flex items-center justify-center`}>
                            {React.createElement(screens[activeScreen].icon, { className: 'w-4 h-4 text-white' })}
                          </div>
                          <div>
                            <p className="text-sm font-black">{screens[activeScreen].title}</p>
                            <p className="text-[9px] text-white/30">{screens[activeScreen].tag}</p>
                          </div>
                        </div>

                        {/* Screen content */}
                        <div className={`px-4 pb-6 transition-all duration-200 ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                          {screens[activeScreen].mockup}
                        </div>

                        {/* Bottom nav */}
                        <div className="border-t border-white/5 px-4 py-3 flex items-center justify-around">
                          {[
                            { icon: ICONS.Dashboard, label: 'Home' },
                            { icon: ICONS.Activity, label: 'Sessions' },
                            { icon: ICONS.Vitals, label: 'Vitals' },
                            { icon: ICONS.Droplet, label: 'Fluids' },
                            { icon: ICONS.Pill, label: 'Meds' },
                          ].map((tab, i) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                              <tab.icon className={`w-4 h-4 ${i === 0 ? 'text-sky-400' : 'text-white/20'}`} />
                              <span className={`text-[7px] ${i === 0 ? 'text-sky-400' : 'text-white/20'}`}>{tab.label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Home indicator */}
                        <div className="flex justify-center pb-2">
                          <div className="w-28 h-1 bg-white/20 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Panel */}
              <div className={`space-y-6 transition-all duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                <div>
                  <span className={`inline-block px-3 py-1 bg-gradient-to-r ${screens[activeScreen].color} rounded-lg text-[9px] font-black uppercase tracking-widest mb-4`}>
                    {screens[activeScreen].tag}
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
                    {screens[activeScreen].title}
                  </h2>
                  <p className="text-white/40 text-base md:text-lg font-medium leading-relaxed mt-4">
                    {screens[activeScreen].subtitle}
                  </p>
                </div>

                {/* Feature highlights per screen */}
                <div className="space-y-3">
                  {getFeatureHighlights(screens[activeScreen].id).map((f, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/5">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${screens[activeScreen].color} flex items-center justify-center flex-shrink-0`}>
                        <ICONS.Check className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{f.title}</p>
                        <p className="text-xs text-white/40 mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation Arrows */}
                <div className="flex items-center gap-4 pt-4">
                  <button
                    onClick={() => handleScreenChange(Math.max(0, activeScreen - 1))}
                    disabled={activeScreen === 0}
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ICONS.ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs text-white/30 tabular-nums">{activeScreen + 1} / {screens.length}</span>
                  <button
                    onClick={() => handleScreenChange(Math.min(screens.length - 1, activeScreen + 1))}
                    disabled={activeScreen === screens.length - 1}
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ICONS.ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-20">
        <div className="max-w-[1440px] mx-auto">
          <div className="relative bg-gradient-to-br from-sky-500/20 via-pink-500/10 to-emerald-500/20 rounded-2xl sm:rounded-[3rem] md:rounded-[5rem] p-6 sm:p-12 md:p-24 border border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-[#020617]/60 backdrop-blur-xl"></div>
            <div className="relative z-10 text-center space-y-8">
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter">
                Ready to<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">Get Started?</span>
              </h2>
              <p className="text-white/40 text-lg md:text-xl font-medium max-w-xl mx-auto">
                Join dialysis patients taking control of their health. Free to start, no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 pt-4">
                <Link to="/register" className="w-full sm:w-auto px-8 sm:px-12 md:px-16 py-4 sm:py-6 md:py-8 bg-white text-slate-950 rounded-2xl sm:rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:scale-105 active:scale-95 transition-all text-center">Create Free Account</Link>
                <Link to="/features" className="w-full sm:w-auto px-8 sm:px-12 md:px-16 py-4 sm:py-6 md:py-8 bg-white/5 border border-white/10 text-white rounded-2xl sm:rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:bg-white/10 transition-all text-center">View All Features</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

function getFeatureHighlights(screenId: string): { title: string; desc: string }[] {
  const highlights: Record<string, { title: string; desc: string }[]> = {
    dashboard: [
      { title: 'Stability Score', desc: 'AI-calculated health stability based on your recent sessions, vitals, and adherence.' },
      { title: 'Smart Alerts', desc: 'Proactive notifications for upcoming sessions, missed meds, and abnormal readings.' },
      { title: 'Quick Actions', desc: 'One-tap access to log sessions, vitals, fluids, and medications.' },
    ],
    sessions: [
      { title: 'Real-Time Tracking', desc: 'Live session timer with pre/post vitals and UF rate monitoring.' },
      { title: 'Session Rating', desc: 'Rate each treatment to track quality and identify patterns over time.' },
      { title: 'Complete History', desc: 'Browse all past sessions with duration, UF volume, and vital trends.' },
    ],
    vitals: [
      { title: 'Four Key Metrics', desc: 'Blood pressure, heart rate, temperature, and oxygen saturation.' },
      { title: 'Trend Charts', desc: 'Interactive 7-day, 30-day, and 90-day trend visualization.' },
      { title: 'Apple Health Sync', desc: 'Auto-import vitals from Apple Watch and connected devices.' },
    ],
    fluids: [
      { title: 'Visual Progress', desc: 'See exactly how much of your daily allowance you have remaining.' },
      { title: 'Quick Add Presets', desc: 'One-tap to log common beverages with pre-set volumes.' },
      { title: 'Daily History', desc: 'Full timeline of every fluid intake entry throughout the day.' },
    ],
    meds: [
      { title: 'Dialysis-Day Logic', desc: 'Different schedules for dialysis vs non-dialysis days.' },
      { title: 'Adherence Scoring', desc: 'Weekly and monthly medication adherence percentage tracking.' },
      { title: 'Smart Reminders', desc: 'Push notifications when it is time to take each medication.' },
    ],
    nutriscan: [
      { title: 'AI-Powered Analysis', desc: 'Computer vision identifies food items and estimates nutrient content.' },
      { title: 'Renal Safety Rating', desc: 'Instant kidney-friendly verdict for every scanned meal.' },
      { title: 'Nutrient Breakdown', desc: 'Sodium, potassium, and phosphorus levels with daily limit context.' },
    ],
    weight: [
      { title: 'Dry Weight Tracking', desc: 'Compare current weight against your target dry weight.' },
      { title: 'IDWG Analysis', desc: 'Inter-dialytic weight gain monitoring with averages and trends.' },
      { title: 'Multi-Source Input', desc: 'Manual entry, Apple Watch, or smart scale auto-import.' },
    ],
    labs: [
      { title: 'Photo Scanning', desc: 'Point your camera at a paper lab report to auto-digitize results.' },
      { title: 'Reference Ranges', desc: 'Color-coded indicators for normal, high, and low values.' },
      { title: 'Historical Trends', desc: 'Track how key markers change across multiple lab draws.' },
    ],
    aichat: [
      { title: 'Dialysis Expertise', desc: 'AI trained on dialysis care guidelines and renal nutrition.' },
      { title: 'Personalized Answers', desc: 'Responses consider your tracked data for relevant advice.' },
      { title: 'Always Available', desc: 'Ask health questions anytime, day or night.' },
    ],
    reports: [
      { title: 'Provider-Ready', desc: 'Professional clinical reports formatted for your nephrologist.' },
      { title: 'Flexible Exports', desc: 'Download as PDF for appointments or JSON for data portability.' },
      { title: 'Custom Date Ranges', desc: 'Generate reports for any time period you choose.' },
    ],
    community: [
      { title: 'Patient Forums', desc: 'Ask questions and share tips with fellow dialysis patients.' },
      { title: 'Success Stories', desc: 'Read inspiring stories from patients who improved their outcomes.' },
      { title: 'HCP Verified', desc: 'Healthcare professionals can get verified badges for credibility.' },
    ],
  };
  return highlights[screenId] || [];
}

export default Demo;
