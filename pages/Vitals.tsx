import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { VitalType } from '../types';
import { ICONS } from '../constants';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine, CartesianGrid
} from 'recharts';
import { createVitalLog, getVitalLogs, VitalLog as VitalLogApi } from '../services/vitals';

// Map frontend VitalType enum to backend API values
const typeToApi: Record<VitalType, string> = {
  [VitalType.BLOOD_PRESSURE]: 'blood_pressure',
  [VitalType.HEART_RATE]: 'heart_rate',
  [VitalType.TEMPERATURE]: 'temperature',
  [VitalType.SPO2]: 'spo2',
};

// Map backend API values to frontend VitalType enum
const apiToType: Record<string, VitalType> = {
  'blood_pressure': VitalType.BLOOD_PRESSURE,
  'heart_rate': VitalType.HEART_RATE,
  'temperature': VitalType.TEMPERATURE,
  'spo2': VitalType.SPO2,
};

type ViewTab = 'overview' | 'blood_pressure' | 'heart_rate' | 'temperature' | 'spo2';

const Vitals: React.FC = () => {
  const { profile } = useStore();
  const [selectedType, setSelectedType] = useState<VitalType>(VitalType.BLOOD_PRESSURE);
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [val1, setVal1] = useState<string>('120');
  const [val2, setVal2] = useState<string>('80');
  const [isLogging, setIsLogging] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [vitals, setVitals] = useState<VitalLogApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const vitalConfig = {
    [VitalType.BLOOD_PRESSURE]: {
      label: 'Blood Pressure',
      shortLabel: 'BP',
      unit: 'mmHg',
      icon: ICONS.Vitals,
      emoji: '🫀',
      color: 'rose',
      bgColor: 'bg-rose-500',
      bgLight: 'bg-rose-500/10',
      textColor: 'text-rose-500',
      gradient: 'from-rose-500 to-pink-500',
      defaultVal1: '120',
      defaultVal2: '80',
      normalRange: { min: 90, max: 120 },
      normalRange2: { min: 60, max: 80 },
    },
    [VitalType.HEART_RATE]: {
      label: 'Heart Rate',
      shortLabel: 'HR',
      unit: 'bpm',
      icon: ICONS.Activity,
      emoji: '💓',
      color: 'orange',
      bgColor: 'bg-orange-500',
      bgLight: 'bg-orange-500/10',
      textColor: 'text-orange-500',
      gradient: 'from-orange-500 to-amber-500',
      defaultVal1: '72',
      normalRange: { min: 60, max: 100 },
    },
    [VitalType.TEMPERATURE]: {
      label: 'Temperature',
      shortLabel: 'Temp',
      unit: profile.settings.units === 'metric' ? '°C' : '°F',
      icon: ICONS.Vitals,
      emoji: '🌡️',
      color: 'purple',
      bgColor: 'bg-purple-500',
      bgLight: 'bg-purple-500/10',
      textColor: 'text-purple-500',
      gradient: 'from-purple-500 to-violet-500',
      defaultVal1: profile.settings.units === 'metric' ? '36.6' : '98.6',
      normalRange: profile.settings.units === 'metric' ? { min: 36.1, max: 37.2 } : { min: 97, max: 99 },
    },
    [VitalType.SPO2]: {
      label: 'Oxygen Saturation',
      shortLabel: 'SpO2',
      unit: '%',
      icon: ICONS.Droplet,
      emoji: '🩸',
      color: 'emerald',
      bgColor: 'bg-emerald-500',
      bgLight: 'bg-emerald-500/10',
      textColor: 'text-emerald-500',
      gradient: 'from-emerald-500 to-teal-500',
      defaultVal1: '98',
      normalRange: { min: 95, max: 100 },
    },
  };

  // Fetch vitals on mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchVitals();
  }, []);

  const fetchVitals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getVitalLogs({ limit: 100 });
      setVitals(response.logs);
    } catch (err: any) {
      if (!err?.message?.includes('Session expired')) {
        console.error('Failed to fetch vitals:', err);
        setError('Failed to load vitals');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVital = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    setError(null);

    try {
      const newVital = await createVitalLog({
        type: typeToApi[selectedType] as any,
        value1: parseFloat(val1),
        value2: selectedType === VitalType.BLOOD_PRESSURE ? parseFloat(val2) : undefined,
        unit: vitalConfig[selectedType].unit,
        loggedAt: new Date().toISOString(),
      });

      setVitals(prev => [newVital, ...prev]);
      setShowForm(false);

      // Reset to defaults for next entry
      const config = vitalConfig[selectedType];
      setVal1(config.defaultVal1 || '');
      setVal2(config.defaultVal2 || '80');
    } catch (err) {
      console.error('Failed to add vital:', err);
      setError('Failed to add vital');
    } finally {
      setIsLogging(false);
    }
  };

  // Update default values when type changes
  useEffect(() => {
    const config = vitalConfig[selectedType];
    setVal1(config.defaultVal1 || '');
    setVal2(config.defaultVal2 || '80');
  }, [selectedType]);

  // Get status for a vital reading
  const getVitalStatus = (type: VitalType, value1: number, value2?: number) => {
    const config = vitalConfig[type];

    if (type === VitalType.BLOOD_PRESSURE) {
      const t = profile.settings.bpThresholds;
      if (value1 >= t.stage2Sys || (value2 && value2 >= t.stage2Dia)) {
        return { label: 'High', color: 'rose', severity: 3 };
      }
      if (value1 >= t.stage1Sys || (value2 && value2 >= t.stage1Dia)) {
        return { label: 'Elevated', color: 'amber', severity: 2 };
      }
      if (value1 < 90 || (value2 && value2 < 60)) {
        return { label: 'Low', color: 'sky', severity: 1 };
      }
      return { label: 'Normal', color: 'emerald', severity: 0 };
    }

    if (type === VitalType.HEART_RATE) {
      if (value1 > 100) return { label: 'High', color: 'amber', severity: 2 };
      if (value1 < 60) return { label: 'Low', color: 'sky', severity: 1 };
      return { label: 'Normal', color: 'emerald', severity: 0 };
    }

    if (type === VitalType.TEMPERATURE) {
      const isMetric = profile.settings.units === 'metric';
      const highThreshold = isMetric ? 37.5 : 99.5;
      const lowThreshold = isMetric ? 36 : 96.8;
      if (value1 > highThreshold) return { label: 'Fever', color: 'rose', severity: 3 };
      if (value1 < lowThreshold) return { label: 'Low', color: 'sky', severity: 1 };
      return { label: 'Normal', color: 'emerald', severity: 0 };
    }

    if (type === VitalType.SPO2) {
      if (value1 < 90) return { label: 'Critical', color: 'rose', severity: 3 };
      if (value1 < 95) return { label: 'Low', color: 'amber', severity: 2 };
      return { label: 'Normal', color: 'emerald', severity: 0 };
    }

    return { label: 'Normal', color: 'emerald', severity: 0 };
  };

  // Get latest vitals by type
  const latestVitals = useMemo(() => {
    const latest: Partial<Record<VitalType, VitalLogApi>> = {};
    vitals.forEach(v => {
      const frontendType = apiToType[v.type];
      if (frontendType && !latest[frontendType]) {
        latest[frontendType] = v;
      }
    });
    return latest;
  }, [vitals]);

  // Get vitals by type
  const vitalsByType = useMemo(() => {
    const grouped: Record<string, VitalLogApi[]> = {
      blood_pressure: [],
      heart_rate: [],
      temperature: [],
      spo2: [],
    };
    vitals.forEach(v => {
      if (grouped[v.type]) {
        grouped[v.type].push(v);
      }
    });
    return grouped;
  }, [vitals]);

  // Chart data by type
  const chartData = useMemo(() => {
    const createChartData = (type: string, key1: string, key2?: string) => {
      return vitalsByType[type]
        .slice(0, 14)
        .reverse()
        .map(v => ({
          date: new Date(v.loggedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          [key1]: v.value1,
          ...(key2 && v.value2 ? { [key2]: v.value2 } : {}),
        }));
    };

    return {
      blood_pressure: createChartData('blood_pressure', 'systolic', 'diastolic'),
      heart_rate: createChartData('heart_rate', 'bpm'),
      temperature: createChartData('temperature', 'temp'),
      spo2: createChartData('spo2', 'spo2'),
    };
  }, [vitalsByType]);

  // Calculate trends
  const trends = useMemo(() => {
    const calcTrend = (data: VitalLogApi[], key: 'value1') => {
      if (data.length < 2) return null;
      const recent = data.slice(0, 3);
      const older = data.slice(3, 6);
      if (older.length === 0) return null;

      const recentAvg = recent.reduce((acc, v) => acc + v[key], 0) / recent.length;
      const olderAvg = older.reduce((acc, v) => acc + v[key], 0) / older.length;
      const diff = recentAvg - olderAvg;
      const percentChange = ((diff / olderAvg) * 100).toFixed(1);

      if (Math.abs(diff) < 1) return { direction: 'stable', value: '0', label: 'Stable' };
      return {
        direction: diff > 0 ? 'up' : 'down',
        value: Math.abs(parseFloat(percentChange)).toFixed(1),
        label: diff > 0 ? 'Rising' : 'Falling',
      };
    };

    return {
      blood_pressure: calcTrend(vitalsByType.blood_pressure, 'value1'),
      heart_rate: calcTrend(vitalsByType.heart_rate, 'value1'),
      temperature: calcTrend(vitalsByType.temperature, 'value1'),
      spo2: calcTrend(vitalsByType.spo2, 'value1'),
    };
  }, [vitalsByType]);

  // Filter vitals for history based on active tab
  const filteredVitals = useMemo(() => {
    if (activeTab === 'overview') return vitals;
    return vitals.filter(v => v.type === activeTab);
  }, [vitals, activeTab]);

  const tabs: { id: ViewTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'blood_pressure', label: 'BP', icon: '🫀' },
    { id: 'heart_rate', label: 'Heart Rate', icon: '💓' },
    { id: 'temperature', label: 'Temp', icon: '🌡️' },
    { id: 'spo2', label: 'SpO2', icon: '🩸' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24 px-4">

      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <span className="px-3 py-1 bg-rose-500/10 text-rose-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
            Health Tracking
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            Vitals
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {vitals.length} readings logged
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
            showForm
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
          }`}
        >
          <ICONS.Plus className={`w-4 h-4 transition-transform ${showForm ? 'rotate-45' : ''}`} />
          <span className="hidden sm:inline">{showForm ? 'Cancel' : 'Log Vital'}</span>
        </button>
      </header>

      {/* Error Display */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top">
          <p className="text-rose-500 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-600">
            <ICONS.X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Add Vital Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top duration-300 shadow-xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Log New Reading</h3>
          <form onSubmit={handleAddVital} className="space-y-5">
            {/* Type Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(vitalConfig).map(([type, config]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type as VitalType)}
                  className={`p-4 rounded-2xl text-center transition-all ${
                    selectedType === type
                      ? `bg-gradient-to-br ${config.gradient} text-white shadow-lg scale-[1.02]`
                      : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-3xl block mb-2">{config.emoji}</span>
                  <span className={`text-xs font-bold ${selectedType === type ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                    {config.shortLabel}
                  </span>
                </button>
              ))}
            </div>

            {/* Value Input */}
            <div className={`rounded-2xl p-6 text-center bg-gradient-to-br ${vitalConfig[selectedType].gradient}/10`}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                {vitalConfig[selectedType].label}
              </p>
              <div className="flex items-center justify-center gap-3">
                <input
                  type="number"
                  value={val1}
                  onChange={e => setVal1(e.target.value)}
                  className="w-28 bg-white dark:bg-slate-800 text-5xl font-black text-slate-900 dark:text-white text-center outline-none rounded-xl p-2"
                  step="0.1"
                  autoFocus
                />
                {selectedType === VitalType.BLOOD_PRESSURE && (
                  <>
                    <span className="text-4xl font-bold text-slate-300 dark:text-slate-600">/</span>
                    <input
                      type="number"
                      value={val2}
                      onChange={e => setVal2(e.target.value)}
                      className="w-28 bg-white dark:bg-slate-800 text-5xl font-black text-slate-900 dark:text-white text-center outline-none rounded-xl p-2"
                    />
                  </>
                )}
              </div>
              <p className="text-slate-400 text-sm font-medium mt-3">{vitalConfig[selectedType].unit}</p>

              {/* Normal range hint */}
              <p className="text-xs text-slate-400 mt-2">
                Normal range: {vitalConfig[selectedType].normalRange.min}-{vitalConfig[selectedType].normalRange.max}
                {vitalConfig[selectedType].normalRange2 && ` / ${vitalConfig[selectedType].normalRange2.min}-${vitalConfig[selectedType].normalRange2.max}`}
                {' '}{vitalConfig[selectedType].unit}
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLogging || !val1}
              className={`w-full py-4 rounded-2xl font-bold text-white transition-all bg-gradient-to-r ${vitalConfig[selectedType].gradient} hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg`}
            >
              {isLogging ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ICONS.Plus className="w-5 h-5" />
                  Log {vitalConfig[selectedType].shortLabel}
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Loading vitals...</p>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(vitalConfig).map(([type, config]) => {
                  const vital = latestVitals[type as VitalType];
                  const value = vital
                    ? (type === String(VitalType.BLOOD_PRESSURE) ? `${vital.value1}/${vital.value2}` : vital.value1)
                    : '--';
                  const status = vital ? getVitalStatus(type as VitalType, vital.value1, vital.value2) : null;
                  const trend = trends[type as keyof typeof trends];
                  const Icon = config.icon;

                  const statusColors: Record<string, string> = {
                    emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                    amber: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
                    rose: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
                    sky: 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400',
                  };

                  return (
                    <div
                      key={type}
                      onClick={() => setActiveTab(type as ViewTab)}
                      className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-600 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 ${config.bgLight} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-5 h-5 ${config.textColor}`} />
                        </div>
                        {status && (
                          <span className={`px-2 py-1 text-[9px] font-bold uppercase rounded-lg ${statusColors[status.color]}`}>
                            {status.label}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{config.shortLabel}</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{value}</span>
                        <span className="text-xs text-slate-400">{config.unit}</span>
                      </div>
                      {trend && (
                        <div className={`mt-2 flex items-center gap-1 text-xs font-bold ${
                          trend.direction === 'up' ? 'text-rose-500' :
                          trend.direction === 'down' ? 'text-emerald-500' : 'text-slate-400'
                        }`}>
                          {trend.direction === 'up' && '↑'}
                          {trend.direction === 'down' && '↓'}
                          {trend.direction === 'stable' && '→'}
                          <span>{trend.label}</span>
                        </div>
                      )}
                      {vital && (
                        <p className="text-[10px] text-slate-400 mt-2">
                          {new Date(vital.loggedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* BP Chart */}
              {chartData.blood_pressure.length > 1 && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Blood Pressure Trend</h3>
                      <p className="text-slate-400 text-sm">Last {chartData.blood_pressure.length} readings</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                        Systolic
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-pink-400"></span>
                        Diastolic
                      </span>
                    </div>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData.blood_pressure} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="sysGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3}/>
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="diaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f472b6" stopOpacity={0.2}/>
                            <stop offset="100%" stopColor="#f472b6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis domain={[50, 180]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={35} />
                        <ReferenceLine y={120} stroke="#10b981" strokeDasharray="5 5" strokeWidth={1} label={{ value: '120', position: 'right', fill: '#10b981', fontSize: 10 }} />
                        <ReferenceLine y={80} stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1} label={{ value: '80', position: 'right', fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                          formatter={(value: number, name: string) => [
                            `${value} mmHg`,
                            name === 'systolic' ? 'Systolic' : 'Diastolic'
                          ]}
                        />
                        <Area type="monotone" dataKey="systolic" stroke="#f43f5e" strokeWidth={3} fill="url(#sysGradient)" dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#f43f5e' }} />
                        <Area type="monotone" dataKey="diastolic" stroke="#f472b6" strokeWidth={2} fill="url(#diaGradient)" dot={{ r: 3, fill: '#fff', strokeWidth: 2, stroke: '#f472b6' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Other Vitals Mini Charts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Heart Rate */}
                {chartData.heart_rate.length > 1 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">💓</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Heart Rate</span>
                      </div>
                      <span className="text-xs text-slate-400">{chartData.heart_rate.length} readings</span>
                    </div>
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData.heart_rate}>
                          <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1} />
                          <ReferenceLine y={60} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1} />
                          <Line type="monotone" dataKey="bpm" stroke="#f97316" strokeWidth={2} dot={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff', fontSize: '11px' }}
                            formatter={(value: number) => [`${value} bpm`, 'Heart Rate']}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Temperature */}
                {chartData.temperature.length > 1 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🌡️</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Temperature</span>
                      </div>
                      <span className="text-xs text-slate-400">{chartData.temperature.length} readings</span>
                    </div>
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData.temperature}>
                          <ReferenceLine y={profile.settings.units === 'metric' ? 37.5 : 99.5} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1} />
                          <Line type="monotone" dataKey="temp" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff', fontSize: '11px' }}
                            formatter={(value: number) => [`${value}${profile.settings.units === 'metric' ? '°C' : '°F'}`, 'Temp']}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* SpO2 */}
                {chartData.spo2.length > 1 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🩸</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Oxygen</span>
                      </div>
                      <span className="text-xs text-slate-400">{chartData.spo2.length} readings</span>
                    </div>
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData.spo2}>
                          <defs>
                            <linearGradient id="spo2Gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <ReferenceLine y={95} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1} />
                          <Area type="monotone" dataKey="spo2" stroke="#10b981" strokeWidth={2} fill="url(#spo2Gradient)" dot={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff', fontSize: '11px' }}
                            formatter={(value: number) => [`${value}%`, 'SpO2']}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Single Vital Type Detail View */}
          {activeTab !== 'overview' && (
            <>
              {/* Detail Chart */}
              {chartData[activeTab as keyof typeof chartData].length > 1 && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {tabs.find(t => t.id === activeTab)?.icon}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {activeTab === 'blood_pressure' ? 'Blood Pressure' :
                           activeTab === 'heart_rate' ? 'Heart Rate' :
                           activeTab === 'temperature' ? 'Temperature' : 'Oxygen Saturation'}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          {chartData[activeTab as keyof typeof chartData].length} readings
                        </p>
                      </div>
                    </div>
                    {trends[activeTab as keyof typeof trends] && (
                      <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                        trends[activeTab as keyof typeof trends]?.direction === 'up' ? 'bg-rose-500/10 text-rose-500' :
                        trends[activeTab as keyof typeof trends]?.direction === 'down' ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {trends[activeTab as keyof typeof trends]?.direction === 'up' && '↑ '}
                        {trends[activeTab as keyof typeof trends]?.direction === 'down' && '↓ '}
                        {trends[activeTab as keyof typeof trends]?.direction === 'stable' && '→ '}
                        {trends[activeTab as keyof typeof trends]?.label}
                      </div>
                    )}
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {activeTab === 'blood_pressure' ? (
                        <AreaChart data={chartData.blood_pressure} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="sysGradient2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3}/>
                              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <YAxis domain={[50, 180]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={35} />
                          <ReferenceLine y={120} stroke="#10b981" strokeDasharray="5 5" strokeWidth={1} />
                          <ReferenceLine y={80} stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1} />
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                            formatter={(value: number, name: string) => [`${value} mmHg`, name === 'systolic' ? 'Systolic' : 'Diastolic']}
                          />
                          <Area type="monotone" dataKey="systolic" stroke="#f43f5e" strokeWidth={3} fill="url(#sysGradient2)" dot={{ r: 5, fill: '#fff', strokeWidth: 2, stroke: '#f43f5e' }} />
                          <Line type="monotone" dataKey="diastolic" stroke="#f472b6" strokeWidth={2} dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#f472b6' }} />
                        </AreaChart>
                      ) : (
                        <AreaChart data={chartData[activeTab as keyof typeof chartData]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="vitalGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={
                                activeTab === 'heart_rate' ? '#f97316' :
                                activeTab === 'temperature' ? '#8b5cf6' : '#10b981'
                              } stopOpacity={0.3}/>
                              <stop offset="100%" stopColor={
                                activeTab === 'heart_rate' ? '#f97316' :
                                activeTab === 'temperature' ? '#8b5cf6' : '#10b981'
                              } stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={35} />
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                          />
                          <Area
                            type="monotone"
                            dataKey={activeTab === 'heart_rate' ? 'bpm' : activeTab === 'temperature' ? 'temp' : 'spo2'}
                            stroke={
                              activeTab === 'heart_rate' ? '#f97316' :
                              activeTab === 'temperature' ? '#8b5cf6' : '#10b981'
                            }
                            strokeWidth={3}
                            fill="url(#vitalGradient)"
                            dot={{ r: 5, fill: '#fff', strokeWidth: 2, stroke: activeTab === 'heart_rate' ? '#f97316' : activeTab === 'temperature' ? '#8b5cf6' : '#10b981' }}
                          />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Statistics Summary */}
              {vitalsByType[activeTab].length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    const data = vitalsByType[activeTab];
                    const values = data.map(v => v.value1);
                    const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    const latest = data[0]?.value1;

                    return [
                      { label: 'Latest', value: latest, icon: '📍' },
                      { label: 'Average', value: avg, icon: '📊' },
                      { label: 'Lowest', value: min, icon: '📉' },
                      { label: 'Highest', value: max, icon: '📈' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 text-center">
                        <span className="text-2xl">{stat.icon}</span>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2">{stat.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">{stat.value}</p>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </>
          )}

          {/* History List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {activeTab === 'overview' ? 'Recent History' : 'All Readings'}
              </h3>
              <span className="text-sm text-slate-400 tabular-nums">{filteredVitals.length} entries</span>
            </div>

            {filteredVitals.length > 0 ? (
              <div className="space-y-3">
                {filteredVitals.slice(0, 30).map((entry) => {
                  const frontendType = apiToType[entry.type] || VitalType.BLOOD_PRESSURE;
                  const config = vitalConfig[frontendType];
                  const value = entry.type === 'blood_pressure'
                    ? `${entry.value1}/${entry.value2}`
                    : entry.value1;
                  const status = getVitalStatus(frontendType, entry.value1, entry.value2);
                  const Icon = config.icon;

                  const statusColors: Record<string, string> = {
                    emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                    amber: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
                    rose: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
                    sky: 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400',
                  };

                  return (
                    <div
                      key={entry._id}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600 transition-all group"
                    >
                      <div className={`w-12 h-12 rounded-xl ${config.bgLight} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon className={`w-6 h-6 ${config.textColor}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900 dark:text-white">{config.label}</p>
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-lg ${statusColors[status.color]}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(entry.loggedAt).toLocaleDateString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{value}</span>
                        <span className="text-sm text-slate-400 ml-1">{entry.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl">
                <div className="text-6xl mb-4">🩺</div>
                <p className="text-slate-600 dark:text-slate-300 font-bold text-lg">No vitals recorded yet</p>
                <p className="text-slate-400 text-sm mt-1">Tap "Log Vital" to add your first reading</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-6 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-all"
                >
                  Log Your First Vital
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Vitals;
