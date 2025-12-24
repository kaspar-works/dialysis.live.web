
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ICONS } from '../constants';
import { createFluidLog, getTodayFluidIntake, getFluidLogs, deleteFluidLog, FluidLog as FluidLogType, FluidSource } from '../services/fluid';
import { isAuthenticated as checkAuth } from '../services/auth';
import { useNavigate } from 'react-router-dom';

// Map UI beverage names to API source types
const beverageToSource: Record<string, FluidSource> = {
  'Water': 'water',
  'Tea': 'tea',
  'Coffee': 'coffee',
  'Juice': 'juice',
  'Soup': 'soup',
  'Other': 'other',
};

const FluidLog: React.FC = () => {
  const { profile } = useStore();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [beverage, setBeverage] = useState('Water');
  const [isAdding, setIsAdding] = useState(false);
  const [logs, setLogs] = useState<FluidLogType[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Check auth and fetch fluid data from API on mount
  useEffect(() => {
    if (!checkAuth()) {
      navigate('/login');
      return;
    }

    fetchFluidData();
  }, [navigate]);

  const fetchFluidData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [todayData, logsData] = await Promise.all([
        getTodayFluidIntake(),
        getFluidLogs({ limit: 50 })
      ]);

      setTotalToday(todayData.totalMl);
      setLogs(logsData.logs);
    } catch (err) {
      console.error('Failed to fetch fluid data:', err);
      setError('Failed to load fluid data');
    } finally {
      setIsLoading(false);
    }
  };

  const remaining = Math.max(profile.dailyFluidLimit - totalToday, 0);
  const percent = Math.min((totalToday / profile.dailyFluidLimit) * 100, 100);
  const isOverLimit = totalToday > profile.dailyFluidLimit;

  const beveragePresets = [
    { name: 'Water', icon: '💧', color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { name: 'Tea', icon: '🍵', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Coffee', icon: '☕', color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { name: 'Juice', icon: '🧃', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { name: 'Soup', icon: '🥣', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!amount || isAdding) return;

    setIsAdding(true);
    setError(null);
    const amountMl = parseInt(amount);
    const source = beverageToSource[beverage] || 'other';

    try {
      const newLog = await createFluidLog({ amountMl, source });
      setLogs(prev => [newLog, ...prev]);
      setTotalToday(prev => prev + amountMl);
      setAmount('');
    } catch (err) {
      console.error('Failed to add fluid log:', err);
      setError('Failed to add entry');
    } finally {
      setIsAdding(false);
    }
  };

  const quickAdd = async (val: number) => {
    if (isAdding) return;
    setIsAdding(true);
    setError(null);

    const source = beverageToSource[beverage] || 'water';

    try {
      const newLog = await createFluidLog({ amountMl: val, source });
      setLogs(prev => [newLog, ...prev]);
      setTotalToday(prev => prev + val);
    } catch (err) {
      console.error('Failed to add quick fluid log:', err);
      setError('Failed to add entry');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Delete this entry?')) return;

    try {
      const logToDelete = logs.find(l => l._id === logId);
      await deleteFluidLog(logId);
      setLogs(prev => prev.filter(l => l._id !== logId));
      if (logToDelete) {
        const today = new Date().toISOString().split('T')[0];
        if (logToDelete.loggedAt.startsWith(today)) {
          setTotalToday(prev => Math.max(prev - logToDelete.amountMl, 0));
        }
      }
    } catch (err) {
      console.error('Failed to delete fluid log:', err);
      setError('Failed to delete entry');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all entries from today?')) return;

    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.loggedAt.startsWith(today));

    try {
      await Promise.all(todayLogs.map(l => deleteFluidLog(l._id)));
      setLogs(prev => prev.filter(l => !l.loggedAt.startsWith(today)));
      setTotalToday(0);
    } catch (err) {
      console.error('Failed to clear logs:', err);
      setError('Failed to clear entries');
    }
  };

  const displayLogs = logs.slice(0, 12).map(log => ({
    id: log._id,
    time: log.loggedAt,
    amount: log.amountMl,
    beverage: log.source.charAt(0).toUpperCase() + log.source.slice(1),
  }));

  // Progress ring calculations
  const size = 200;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-24 px-4">

      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-sky-500/10 text-sky-500 text-[10px] font-bold uppercase tracking-wider rounded-full">Hydration</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Fluid Tracker</h1>
      </header>

      {/* Error Display */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-rose-500 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-600">
            <ICONS.X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Progress Ring Card */}
        <div className="lg:col-span-1 bg-slate-900 rounded-3xl p-8 flex flex-col items-center justify-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={isOverLimit ? '#F43F5E' : percent > 85 ? '#F97316' : '#0EA5E9'}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-white tabular-nums">{Math.round(percent)}</span>
              <span className="text-white/40 text-sm font-bold uppercase tracking-wider">percent</span>
            </div>
          </div>
          <p className="mt-4 text-white/40 text-xs font-bold uppercase tracking-wider">Daily Progress</p>
        </div>

        {/* Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">

          {/* Today's Intake */}
          <div className="col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Today's Intake</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tabular-nums">{totalToday}</span>
              <span className="text-slate-400 text-xl font-bold">ml</span>
            </div>
          </div>

          {/* Balance */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Remaining</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl md:text-4xl font-black tabular-nums ${isOverLimit ? 'text-rose-500' : 'text-emerald-500'}`}>
                {isOverLimit ? '-' : ''}{Math.abs(remaining)}
              </span>
              <span className="text-slate-400 text-sm font-bold">ml</span>
            </div>
          </div>

          {/* Limit */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Daily Limit</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tabular-nums">{profile.dailyFluidLimit}</span>
              <span className="text-slate-400 text-sm font-bold">ml</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add & Manual Entry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Quick Add */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Add</h3>

          {/* Beverage Selection */}
          <div className="flex gap-2 mb-4">
            {beveragePresets.map(preset => (
              <button
                key={preset.name}
                onClick={() => setBeverage(preset.name)}
                className={`flex-1 p-3 rounded-2xl transition-all ${
                  beverage === preset.name
                    ? 'bg-sky-500 text-white shadow-lg scale-105'
                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <span className="text-xl block text-center">{preset.icon}</span>
              </button>
            ))}
          </div>

          {/* Quick Amounts */}
          <div className="grid grid-cols-4 gap-2">
            {[100, 150, 250, 500].map(val => (
              <button
                key={val}
                onClick={() => quickAdd(val)}
                disabled={isAdding}
                className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl hover:bg-sky-500 hover:text-white transition-all font-bold text-lg disabled:opacity-50"
              >
                +{val}
              </button>
            ))}
          </div>
        </div>

        {/* Manual Entry */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Custom Amount</h3>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-2xl px-5 py-4 text-2xl font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-sky-500/20 transition-all"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">ml</span>
            </div>

            <button
              type="submit"
              disabled={!amount || isAdding}
              className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold text-lg hover:bg-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ICONS.Plus className="w-5 h-5" />
                  Add Entry
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Today's Log</h3>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  viewMode === 'card'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Table
              </button>
            </div>
            <button
              onClick={handleClearAll}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 uppercase tracking-wider transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : displayLogs.length > 0 ? (
          viewMode === 'card' ? (
            /* Card View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayLogs.map(f => {
                const preset = beveragePresets.find(p => p.name === f.beverage) || beveragePresets[0];
                return (
                  <div
                    key={f.id}
                    className="group bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-lg transition-all"
                  >
                    <div className={`w-12 h-12 ${preset.bg} rounded-xl flex items-center justify-center text-2xl shrink-0`}>
                      {preset.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white">{f.beverage}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(f.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{f.amount}</span>
                      <span className="text-xs text-slate-400">ml</span>
                      <button
                        onClick={() => handleDeleteLog(f.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all"
                      >
                        <ICONS.X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Time</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayLogs.map((f, idx) => {
                    const preset = beveragePresets.find(p => p.name === f.beverage) || beveragePresets[0];
                    return (
                      <tr
                        key={f.id}
                        className={`group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                          idx !== displayLogs.length - 1 ? 'border-b border-slate-50 dark:border-slate-700/50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{preset.icon}</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{f.beverage}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {new Date(f.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-slate-900 dark:text-white tabular-nums">{f.amount}</span>
                          <span className="text-slate-400 text-sm ml-1">ml</span>
                        </td>
                        <td className="px-2 py-3">
                          <button
                            onClick={() => handleDeleteLog(f.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          >
                            <ICONS.X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="py-12 text-center text-slate-400">
            <ICONS.Droplet className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-bold">No entries yet</p>
            <p className="text-sm">Add your first fluid intake above</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FluidLog;
