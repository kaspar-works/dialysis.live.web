import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { VitalType } from '../types';
import { ICONS } from '../constants';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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

const Vitals: React.FC = () => {
  const { profile } = useStore();
  const [selectedType, setSelectedType] = useState<VitalType>(VitalType.BLOOD_PRESSURE);
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
      unit: 'mmHg',
      icon: '🫀',
      color: 'rose',
      gradient: 'from-rose-500 to-pink-500',
      defaultVal1: '120',
      defaultVal2: '80',
    },
    [VitalType.HEART_RATE]: {
      label: 'Heart Rate',
      unit: 'bpm',
      icon: '💓',
      color: 'orange',
      gradient: 'from-orange-500 to-amber-500',
      defaultVal1: '72',
    },
    [VitalType.TEMPERATURE]: {
      label: 'Temperature',
      unit: profile.settings.units === 'metric' ? '°C' : '°F',
      icon: '🌡️',
      color: 'purple',
      gradient: 'from-purple-500 to-violet-500',
      defaultVal1: profile.settings.units === 'metric' ? '36.6' : '98.6',
    },
    [VitalType.SPO2]: {
      label: 'Oxygen',
      unit: '%',
      icon: '🩸',
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-500',
      defaultVal1: '98',
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
      const response = await getVitalLogs({ limit: 50 });
      setVitals(response.logs);
    } catch (err) {
      console.error('Failed to fetch vitals:', err);
      setError('Failed to load vitals');
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

  const getBPStatus = (sys: number, dia: number) => {
    const t = profile.settings.bpThresholds;
    if (sys >= t.stage2Sys || dia >= t.stage2Dia) return { label: 'High', color: 'rose' };
    if (sys >= t.stage1Sys || dia >= t.stage1Dia) return { label: 'Elevated', color: 'orange' };
    if (sys >= t.elevatedSys) return { label: 'Slightly High', color: 'amber' };
    return { label: 'Normal', color: 'emerald' };
  };

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

  const chartData = useMemo(() => {
    return vitals
      .filter(v => v.type === 'blood_pressure')
      .slice(0, 10)
      .reverse()
      .map(v => ({
        time: new Date(v.loggedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        sys: v.value1,
        dia: v.value2,
      }));
  }, [vitals]);

  const latestBP = latestVitals[VitalType.BLOOD_PRESSURE];
  const bpStatus = latestBP ? getBPStatus(latestBP.value1, latestBP.value2 || 0) : null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24 px-4">

      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <span className="px-3 py-1 bg-rose-500/10 text-rose-500 text-[10px] font-bold uppercase tracking-wider rounded-full">Health</span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mt-2">Vitals</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
            showForm
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rotate-45'
              : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-rose-500 dark:hover:bg-rose-500 dark:hover:text-white'
          }`}
        >
          <ICONS.Plus className="w-6 h-6" />
        </button>
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

      {/* Add Vital Form - Slide down */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top duration-300 shadow-xl">
          <form onSubmit={handleAddVital} className="space-y-5">
            {/* Type Selection */}
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(vitalConfig).map(([type, config]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type as VitalType)}
                  className={`p-3 rounded-2xl text-center transition-all ${
                    selectedType === type
                      ? `bg-gradient-to-br ${config.gradient} text-white shadow-lg scale-105`
                      : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <span className="text-2xl block mb-1">{config.icon}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wide">{config.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Value Input */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-3">
                <input
                  type="number"
                  value={val1}
                  onChange={e => setVal1(e.target.value)}
                  className="w-28 bg-transparent text-5xl font-black text-slate-900 dark:text-white text-center outline-none"
                  step="0.1"
                />
                {selectedType === VitalType.BLOOD_PRESSURE && (
                  <>
                    <span className="text-4xl font-bold text-slate-300 dark:text-slate-600">/</span>
                    <input
                      type="number"
                      value={val2}
                      onChange={e => setVal2(e.target.value)}
                      className="w-28 bg-transparent text-5xl font-black text-slate-900 dark:text-white text-center outline-none"
                    />
                  </>
                )}
              </div>
              <p className="text-slate-400 text-sm font-medium mt-2">{vitalConfig[selectedType].unit}</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLogging || !val1}
              className={`w-full py-4 rounded-2xl font-bold text-white transition-all bg-gradient-to-r ${vitalConfig[selectedType].gradient} hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {isLogging ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ICONS.Plus className="w-5 h-5" />
                  Add {vitalConfig[selectedType].label}
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {/* Latest Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(vitalConfig).map(([type, config]) => {
              const vital = latestVitals[type as VitalType];
              const value = vital
                ? (type === VitalType.BLOOD_PRESSURE ? `${vital.value1}/${vital.value2}` : vital.value1)
                : '--';

              return (
                <div
                  key={type}
                  className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">{config.icon}</span>
                    {type === VitalType.BLOOD_PRESSURE && bpStatus && (
                      <span className={`px-2 py-1 text-[9px] font-bold uppercase rounded-lg bg-${bpStatus.color}-100 dark:bg-${bpStatus.color}-500/20 text-${bpStatus.color}-600 dark:text-${bpStatus.color}-400`}>
                        {bpStatus.label}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs font-medium mb-1">{config.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{value}</span>
                    <span className="text-xs text-slate-400">{config.unit}</span>
                  </div>
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
          {chartData.length > 1 && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Blood Pressure</h3>
                  <p className="text-slate-400 text-sm">Recent readings</p>
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
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <YAxis
                      domain={[60, 180]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: '#1e293b',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sys"
                      stroke="#f43f5e"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#f43f5e' }}
                      name="Systolic"
                    />
                    <Line
                      type="monotone"
                      dataKey="dia"
                      stroke="#f472b6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#f472b6' }}
                      name="Diastolic"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">History</h3>
              <span className="text-sm text-slate-400">{vitals.length} entries</span>
            </div>

            {vitals.length > 0 ? (
              <div className="space-y-3">
                {vitals.slice(0, 20).map((entry) => {
                  const frontendType = apiToType[entry.type] || VitalType.BLOOD_PRESSURE;
                  const config = vitalConfig[frontendType];
                  const value = entry.type === 'blood_pressure'
                    ? `${entry.value1}/${entry.value2}`
                    : entry.value1;
                  const status = entry.type === 'blood_pressure'
                    ? getBPStatus(entry.value1, entry.value2 || 0)
                    : null;

                  return (
                    <div
                      key={entry._id}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-all group"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shrink-0`}>
                        {config.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white">{config.label}</p>
                          {status && (
                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-${status.color}-100 dark:bg-${status.color}-500/20 text-${status.color}-600 dark:text-${status.color}-400`}>
                              {status.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
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
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{value}</span>
                        <span className="text-sm text-slate-400 ml-1">{entry.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="text-6xl mb-4">🩺</div>
                <p className="text-slate-400 font-medium">No vitals recorded yet</p>
                <p className="text-slate-400 text-sm">Tap + to add your first reading</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Vitals;
