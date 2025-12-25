import React, { useMemo } from 'react';
import { useStore } from '../store';
import { ICONS } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { MoodType, VitalType, FluidEntry, WeightEntry, VitalEntry } from '../types';
import OnboardingModal from '../components/OnboardingModal';
import ComingSoon from '../components/ComingSoon';

const Dashboard: React.FC = () => {
  const { weights, fluids, profile, vitals, moods, addFluid } = useStore();

  const currentWeight = weights[0]?.value || profile.weightGoal;
  const weightChange = weights.length >= 2 ? (weights[0].value - weights[1].value).toFixed(1) : '0.0';
  const todayFluid = fluids.reduce((acc: number, f: FluidEntry) => acc + f.amount, 0);
  const fluidPercentage = Math.min(Math.round((todayFluid / profile.dailyFluidLimit) * 100), 100);
  const fluidRemaining = Math.max(profile.dailyFluidLimit - todayFluid, 0);
  const latestMood = moods[0]?.type || 'Standard';

  const latestBP = useMemo(() => vitals.find((v: VitalEntry) => v.type === VitalType.BLOOD_PRESSURE), [vitals]);
  const latestHR = useMemo(() => vitals.find((v: VitalEntry) => v.type === VitalType.HEART_RATE), [vitals]);

  const weightData = [...weights].reverse().slice(-7).map(w => ({
    date: new Date(w.date).toLocaleDateString(undefined, { weekday: 'short' }),
    weight: w.value
  }));

  const stabilityScore = useMemo(() => {
    let score = 90;
    if (fluidPercentage > 100) score -= 15;
    if (latestMood === MoodType.UNWELL) score -= 10;
    return Math.max(score, 45);
  }, [fluidPercentage, latestMood]);

  const handleQuickFluid = (amount: number) => {
    addFluid({
      id: Date.now().toString(),
      time: new Date().toISOString(),
      amount,
      beverage: 'Water'
    });
  };

  // Progress ring calculations
  const ringSize = 160;
  const strokeWidth = 12;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (stabilityScore / 100) * circumference;

  return (
    <ComingSoon page="dashboard" title="Dashboard">
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 pb-24 px-4">

      {!profile.isOnboarded && <OnboardingModal />}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-slate-400 text-sm font-medium">Welcome back,</p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{profile.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            System Stable
          </span>
        </div>
      </header>

      {/* Main Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Stability Score */}
        <div className="col-span-2 lg:col-span-1 bg-slate-900 rounded-3xl p-6 flex flex-col items-center justify-center">
          <div className="relative" style={{ width: ringSize, height: ringSize }}>
            <svg width={ringSize} height={ringSize} className="-rotate-90">
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={stabilityScore >= 80 ? '#10B981' : stabilityScore >= 60 ? '#F59E0B' : '#EF4444'}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white tabular-nums">{stabilityScore}</span>
              <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Score</span>
            </div>
          </div>
          <p className="mt-2 text-white/40 text-xs font-bold uppercase tracking-wider">Stability</p>
        </div>

        {/* Blood Pressure */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
              <ICONS.Vitals className="w-5 h-5 text-rose-500" />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase">Normal</span>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Blood Pressure</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {latestBP ? `${latestBP.value1}/${latestBP.value2}` : '--/--'}
          </p>
          <p className="text-slate-400 text-xs">mmHg</p>
        </div>

        {/* Weight */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <ICONS.Scale className="w-5 h-5 text-purple-500" />
            </div>
            <span className={`text-[10px] font-bold tabular-nums ${parseFloat(weightChange) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg
            </span>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Weight</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tabular-nums">{currentWeight}</p>
          <p className="text-slate-400 text-xs">kg</p>
        </div>

        {/* Heart Rate */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
              <ICONS.Activity className="w-5 h-5 text-sky-500" />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase">Normal</span>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Heart Rate</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {latestHR ? latestHR.value1 : '72'}
          </p>
          <p className="text-slate-400 text-xs">bpm</p>
        </div>
      </div>

      {/* Fluid & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Fluid Status */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Today's Fluid Intake</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">{todayFluid}</span>
                <span className="text-slate-400 font-bold">/ {profile.dailyFluidLimit} ml</span>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-black tabular-nums ${fluidPercentage >= 100 ? 'text-rose-500' : fluidPercentage > 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {fluidPercentage}%
              </p>
              <p className="text-slate-400 text-xs">{fluidRemaining} ml left</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                fluidPercentage >= 100 ? 'bg-rose-500' : fluidPercentage > 80 ? 'bg-amber-500' : 'bg-sky-500'
              }`}
              style={{ width: `${Math.min(fluidPercentage, 100)}%` }}
            />
          </div>

          {/* Quick Add Buttons */}
          <div className="flex gap-2 mt-4">
            {[100, 150, 250, 500].map(v => (
              <button
                key={v}
                onClick={() => handleQuickFluid(v)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm font-bold hover:bg-sky-500 hover:text-white transition-all"
              >
                +{v}
              </button>
            ))}
          </div>
        </div>

        {/* Next Session */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <ICONS.Activity className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Next Session</p>
              <p className="text-xl font-bold">Tomorrow</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/60 text-sm">Time</span>
              <span className="font-bold">08:00 AM</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/60 text-sm">Type</span>
              <span className="font-bold">Home HD</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-white/60 text-sm">Duration</span>
              <span className="font-bold">4 hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weight Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Weight Trend</h3>
            <p className="text-slate-400 text-sm">Last 7 days</p>
          </div>
          <Link to="/weight" className="text-sky-500 text-sm font-bold hover:underline">View All</Link>
        </div>

        <div className="h-64">
          {weightData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-700" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                  cursor={{ stroke: '#8B5CF6', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#weightGradient)"
                  dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#8B5CF6' }}
                  activeDot={{ r: 6, fill: '#8B5CF6', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ICONS.Scale className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-bold">No weight data yet</p>
              <p className="text-sm">Log your weight to see trends</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/fluid" className="bg-sky-500 text-white rounded-2xl p-5 hover:bg-sky-600 transition-all group">
          <ICONS.Droplet className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-bold">Fluid Log</p>
          <p className="text-sky-200 text-sm">Track intake</p>
        </Link>

        <Link to="/weight" className="bg-purple-500 text-white rounded-2xl p-5 hover:bg-purple-600 transition-all group">
          <ICONS.Scale className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-bold">Weight</p>
          <p className="text-purple-200 text-sm">Log weight</p>
        </Link>

        <Link to="/vitals" className="bg-rose-500 text-white rounded-2xl p-5 hover:bg-rose-600 transition-all group">
          <ICONS.Vitals className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-bold">Vitals</p>
          <p className="text-rose-200 text-sm">BP & pulse</p>
        </Link>

        <Link to="/sessions" className="bg-emerald-500 text-white rounded-2xl p-5 hover:bg-emerald-600 transition-all group">
          <ICONS.Activity className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
          <p className="font-bold">Sessions</p>
          <p className="text-emerald-200 text-sm">Dialysis logs</p>
        </Link>
      </div>
    </div>
    </ComingSoon>
  );
};

export default Dashboard;
