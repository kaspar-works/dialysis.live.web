
import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { ICONS } from '../constants';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { Link } from 'react-router-dom';
import { MoodType, VitalType, FluidIntake, VitalLog } from '../types';
import OnboardingModal from '../components/OnboardingModal';

const Dashboard: React.FC = () => {
  const { weights, fluids, profile, vitals, moods, addFluid, meals } = useStore();
  const [showAllVitals, setShowAllVitals] = useState(false);

  // Current data
  const currentWeight = weights[0]?.value || profile.weightGoal;
  const weightChange = weights.length >= 2 ? (weights[0].value - weights[1].value).toFixed(1) : '0.0';
  const todayFluid = fluids.reduce((acc: number, f: FluidIntake) => acc + f.amount, 0);
  const fluidPercentage = Math.min(Math.round((todayFluid / profile.dailyFluidLimit) * 100), 100);
  const fluidRemaining = Math.max(profile.dailyFluidLimit - todayFluid, 0);
  const latestMood = moods[0]?.type || 'Good';

  // Vitals
  const latestBP = useMemo(() => vitals.find((v: VitalLog) => v.type === VitalType.BLOOD_PRESSURE), [vitals]);
  const latestHR = useMemo(() => vitals.find((v: VitalLog) => v.type === VitalType.HEART_RATE), [vitals]);
  const latestTemp = useMemo(() => vitals.find((v: VitalLog) => v.type === VitalType.TEMPERATURE), [vitals]);
  const latestO2 = useMemo(() => vitals.find((v: VitalLog) => v.type === VitalType.SPO2), [vitals]);

  // Chart data - Weight (7 days)
  const weightData = useMemo(() => {
    const data = [...weights].reverse().slice(-7).map(w => ({
      date: new Date(w.date).toLocaleDateString(undefined, { weekday: 'short' }),
      weight: w.value,
      goal: profile.weightGoal
    }));
    return data.length > 0 ? data : [
      { date: 'Mon', weight: 72, goal: 70 },
      { date: 'Tue', weight: 71.5, goal: 70 },
      { date: 'Wed', weight: 71.2, goal: 70 },
      { date: 'Thu', weight: 70.8, goal: 70 },
      { date: 'Fri', weight: 70.5, goal: 70 },
      { date: 'Sat', weight: 70.2, goal: 70 },
      { date: 'Sun', weight: 70, goal: 70 },
    ];
  }, [weights, profile.weightGoal]);

  // Fluid intake by hour (today)
  const fluidHourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: i === 0 ? '12am' : i === 12 ? '12pm' : i < 12 ? `${i}am` : `${i - 12}pm`,
      amount: 0
    }));
    fluids.forEach((f: FluidIntake) => {
      const hour = new Date(f.time).getHours();
      hours[hour].amount += f.amount;
    });
    return hours;
  }, [fluids]);

  // Nutrition totals
  const nutritionTotals = useMemo(() => {
    const today = new Date().toDateString();
    const todayMeals = meals?.filter(m => new Date(m.time).toDateString() === today) || [];
    return todayMeals.reduce((acc, m) => ({
      sodium: acc.sodium + (m.nutrients?.sodium || 0),
      potassium: acc.potassium + (m.nutrients?.potassium || 0),
      phosphorus: acc.phosphorus + (m.nutrients?.phosphorus || 0),
      protein: acc.protein + (m.nutrients?.protein || 0),
    }), { sodium: 0, potassium: 0, phosphorus: 0, protein: 0 });
  }, [meals]);

  // Stability Score
  const stabilityScore = useMemo(() => {
    let score = 92;
    if (fluidPercentage > 100) score -= 15;
    if (latestMood === MoodType.UNWELL) score -= 10;
    if (parseFloat(weightChange) > 2) score -= 10;
    return Math.max(Math.min(score, 100), 40);
  }, [fluidPercentage, latestMood, weightChange]);

  const handleQuickFluid = (amount: number) => {
    addFluid({
      id: Date.now().toString(),
      time: new Date().toISOString(),
      amount,
      beverage: 'Water'
    });
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Score ring
  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (stabilityScore / 100) * ringCircumference;

  return (
    <div className="w-full space-y-6 pb-24 px-4 animate-in fade-in duration-500">
      <OnboardingModal />

      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <p className="text-slate-400 text-sm font-medium">{getGreeting()},</p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{profile.name || 'Patient'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
            stabilityScore >= 80
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : stabilityScore >= 60
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              stabilityScore >= 80 ? 'bg-emerald-500' : stabilityScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
            }`}></span>
            {stabilityScore >= 80 ? 'Stable' : stabilityScore >= 60 ? 'Monitor' : 'Alert'}
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-4">

        {/* Stability Score Card */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="relative">
            <svg width="140" height="140" className="-rotate-90">
              <circle cx="70" cy="70" r={ringRadius} stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
              <circle
                cx="70" cy="70" r={ringRadius}
                stroke={stabilityScore >= 80 ? '#10B981' : stabilityScore >= 60 ? '#F59E0B' : '#EF4444'}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-white tabular-nums animate-in zoom-in duration-700">{stabilityScore}</span>
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Score</span>
            </div>
          </div>
          <p className="text-white/60 text-xs font-bold uppercase tracking-wider mt-4">Health Stability</p>
        </div>

        {/* Vitals Grid */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 grid grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Blood Pressure */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:border-rose-200 dark:hover:border-rose-500/30 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ICONS.Vitals className="w-5 h-5 text-rose-500" />
              </div>
              <span className={`text-[10px] font-bold uppercase ${latestBP ? 'text-emerald-500' : 'text-slate-300'}`}>
                {latestBP ? 'Normal' : 'No data'}
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Blood Pressure</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-1">
              {latestBP ? `${latestBP.value1}/${latestBP.value2}` : '--/--'}
            </p>
            <p className="text-slate-400 text-xs">mmHg</p>
          </div>

          {/* Heart Rate */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:border-sky-200 dark:hover:border-sky-500/30 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:animate-pulse transition-transform">
                <ICONS.Activity className="w-5 h-5 text-sky-500" />
              </div>
              <span className={`text-[10px] font-bold uppercase ${latestHR ? 'text-emerald-500' : 'text-slate-300'}`}>
                {latestHR ? 'Normal' : 'No data'}
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Heart Rate</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-1">
              {latestHR?.value1 || '--'}
            </p>
            <p className="text-slate-400 text-xs">bpm</p>
          </div>

          {/* Weight */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-500/30 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ICONS.Scale className="w-5 h-5 text-purple-500" />
              </div>
              <span className={`text-[10px] font-bold tabular-nums ${
                parseFloat(weightChange) > 1 ? 'text-amber-500' : parseFloat(weightChange) < -1 ? 'text-sky-500' : 'text-emerald-500'
              }`}>
                {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Weight</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-1">{currentWeight}</p>
            <p className="text-slate-400 text-xs">kg</p>
          </div>

          {/* Temperature / O2 */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-500/30 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ICONS.Vitals className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-[10px] font-bold uppercase text-emerald-500">Normal</span>
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Temperature</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-1">
              {latestTemp?.value1 || '36.5'}
            </p>
            <p className="text-slate-400 text-xs">°C</p>
          </div>
        </div>

        {/* Fluid Tracker */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Today's Hydration</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">{todayFluid}</span>
                <span className="text-slate-400 font-medium">/ {profile.dailyFluidLimit} ml</span>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-black tabular-nums ${
                fluidPercentage >= 100 ? 'text-rose-500' : fluidPercentage > 80 ? 'text-amber-500' : 'text-emerald-500'
              }`}>
                {fluidPercentage}%
              </p>
              <p className="text-slate-400 text-sm">{fluidRemaining} ml remaining</p>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-6">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${
                fluidPercentage >= 100 ? 'bg-rose-500' : fluidPercentage > 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-sky-400 to-sky-500'
              }`}
              style={{ width: `${Math.min(fluidPercentage, 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* Hourly Chart */}
          <div className="h-32 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fluidHourlyData.slice(6, 22)} barSize={12}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  interval={2}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                  formatter={(value: number) => [`${value} ml`, 'Intake']}
                />
                <Bar dataKey="amount" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Add */}
          <div className="flex gap-2">
            {[100, 150, 200, 250, 500].map(v => (
              <button
                key={v}
                onClick={() => handleQuickFluid(v)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-sky-500 hover:text-white active:scale-95 transition-all"
              >
                +{v}
              </button>
            ))}
          </div>
        </div>

        {/* Next Session */}
        <div className="col-span-12 lg:col-span-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
                <ICONS.Activity className="w-7 h-7 text-sky-400" />
              </div>
              <div>
                <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Next Session</p>
                <p className="text-2xl font-black">Tomorrow</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Time', value: '08:00 AM', icon: '🕐' },
                { label: 'Type', value: 'Home HD', icon: '🏠' },
                { label: 'Duration', value: '4 hours', icon: '⏱️' },
                { label: 'Target UF', value: '2.5 L', icon: '💧' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0">
                  <span className="text-white/50 text-sm flex items-center gap-2">
                    <span>{item.icon}</span> {item.label}
                  </span>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>

            <Link
              to="/sessions"
              className="mt-6 w-full py-3 bg-white/10 backdrop-blur rounded-xl font-bold text-sm text-center block hover:bg-white/20 transition-all"
            >
              View All Sessions
            </Link>
          </div>
        </div>

        {/* Weight Trend Chart */}
        <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Weight Trend</h3>
              <p className="text-slate-400 text-sm">Last 7 days</p>
            </div>
            <Link to="/weight" className="text-sky-500 text-sm font-bold hover:underline">View All</Link>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} domain={['dataMin - 1', 'dataMax + 1']} width={35} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} />
                <Line type="monotone" dataKey="goal" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="weight" stroke="#8B5CF6" strokeWidth={3} fill="url(#weightGradient)" dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#8B5CF6' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Nutrition Summary */}
        <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nutrition Today</h3>
              <p className="text-slate-400 text-sm">Key nutrients tracked</p>
            </div>
            <Link to="/nutriscan" className="text-emerald-500 text-sm font-bold hover:underline">Add Meal</Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Sodium', value: nutritionTotals.sodium, limit: 2000, unit: 'mg', color: 'sky', icon: '🧂' },
              { label: 'Potassium', value: nutritionTotals.potassium, limit: 3000, unit: 'mg', color: 'orange', icon: '🍌' },
              { label: 'Phosphorus', value: nutritionTotals.phosphorus, limit: 1000, unit: 'mg', color: 'purple', icon: '🥩' },
              { label: 'Protein', value: nutritionTotals.protein, limit: 60, unit: 'g', color: 'emerald', icon: '🥚' },
            ].map((n, i) => {
              const percent = Math.min((n.value / n.limit) * 100, 100);
              return (
                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{n.icon}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">/{n.limit}{n.unit}</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{n.value}<span className="text-sm text-slate-400 ml-1">{n.unit}</span></p>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full mt-2 overflow-hidden">
                    <div className={`h-full rounded-full bg-${n.color}-500 transition-all duration-700`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/fluid', icon: ICONS.Droplet, label: 'Fluid Log', desc: 'Track intake', color: 'from-sky-500 to-sky-600' },
            { to: '/weight', icon: ICONS.Scale, label: 'Weight', desc: 'Log weight', color: 'from-purple-500 to-purple-600' },
            { to: '/vitals', icon: ICONS.Vitals, label: 'Vitals', desc: 'BP & pulse', color: 'from-rose-500 to-rose-600' },
            { to: '/nutriscan', icon: ICONS.Camera, label: 'NutriScan', desc: 'Scan food', color: 'from-emerald-500 to-emerald-600' },
          ].map((item, i) => (
            <Link
              key={i}
              to={item.to}
              className={`bg-gradient-to-br ${item.color} text-white rounded-2xl p-5 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group`}
            >
              <item.icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-bold">{item.label}</p>
              <p className="text-white/70 text-sm">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
