import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { VitalType } from '../types';
import { ICONS } from '../constants';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine, CartesianGrid
} from 'recharts';
import { createVitalRecord, getVitalRecords, deleteVitalRecord, VitalRecord } from '../services/vitals';
import { SubscriptionLimitError } from '../services/auth';
import { Link } from 'react-router-dom';

type ViewTab = 'overview' | 'blood_pressure' | 'heart_rate' | 'temperature' | 'spo2';

const Vitals: React.FC = () => {
  const { profile } = useStore();
  const [selectedType, setSelectedType] = useState<VitalType>(VitalType.BLOOD_PRESSURE);
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [val1, setVal1] = useState<string>('120');
  const [val2, setVal2] = useState<string>('80');
  const [isLogging, setIsLogging] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [records, setRecords] = useState<VitalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalRecord, setDeleteModalRecord] = useState<VitalRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [limitError, setLimitError] = useState<{ message: string; limit?: number } | null>(null);
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
      const response = await getVitalRecords({ limit: 100 });
      // Ensure records is always an array
      setRecords(response.records || []);
    } catch (err: any) {
      if (!err?.message?.includes('Session expired')) {
        console.error('Failed to fetch vitals:', err);
        setError('Failed to load vitals');
      }
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVital = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    setError(null);

    try {
      // Build the request based on vital type using new consolidated API
      const recordData: any = {
        loggedAt: new Date().toISOString(),
      };

      switch (selectedType) {
        case VitalType.BLOOD_PRESSURE:
          recordData.bloodPressure = {
            systolic: parseFloat(val1),
            diastolic: parseFloat(val2),
          };
          break;
        case VitalType.HEART_RATE:
          recordData.heartRate = parseFloat(val1);
          break;
        case VitalType.TEMPERATURE:
          recordData.temperature = {
            value: parseFloat(val1),
            unit: profile.settings.units === 'metric' ? 'celsius' : 'fahrenheit',
          };
          break;
        case VitalType.SPO2:
          recordData.spo2 = parseFloat(val1);
          break;
      }

      const newRecord = await createVitalRecord(recordData);
      setRecords(prev => [newRecord, ...prev]);
      setShowForm(false);
      setLimitError(null);

      // Reset to defaults for next entry
      const config = vitalConfig[selectedType];
      setVal1(config.defaultVal1 || '');
      setVal2(config.defaultVal2 || '80');
    } catch (err) {
      console.error('Failed to add vital:', err);

      // Handle subscription limit error
      if (err instanceof SubscriptionLimitError) {
        setLimitError({
          message: err.message,
          limit: err.limit,
        });
        setShowForm(false);
      } else {
        setError('Failed to add vital');
      }
    } finally {
      setIsLogging(false);
    }
  };

  // Helper to get display label for a record
  const getRecordLabel = (record: VitalRecord): string => {
    if (record.bloodPressure) return 'Blood Pressure';
    if (record.heartRate) return 'Heart Rate';
    if (record.temperature) return 'Temperature';
    if (record.spo2) return 'SpO2';
    if (record.bloodSugar) return 'Blood Sugar';
    if (record.weight) return 'Weight';
    return 'Vital';
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalRecord) return;

    const vitalLabel = getRecordLabel(deleteModalRecord);

    setIsDeleting(true);
    try {
      await deleteVitalRecord(deleteModalRecord._id);
      setRecords(prev => prev.filter(r => r._id !== deleteModalRecord._id));
      setDeleteModalRecord(null);
      setNotification({ message: `${vitalLabel} entry deleted`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Failed to delete vital:', err);
      setError('Failed to delete vital');
    } finally {
      setIsDeleting(false);
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

  // Get latest vitals from records
  const latestVitals = useMemo(() => {
    const latest: {
      bloodPressure?: { systolic: number; diastolic: number; loggedAt: string };
      heartRate?: { value: number; loggedAt: string };
      temperature?: { value: number; unit: string; loggedAt: string };
      spo2?: { value: number; loggedAt: string };
    } = {};

    if (!records || !Array.isArray(records)) return latest;

    for (const r of records) {
      if (!r) continue;
      if (r.bloodPressure && !latest.bloodPressure) {
        latest.bloodPressure = { ...r.bloodPressure, loggedAt: r.loggedAt };
      }
      if (r.heartRate && !latest.heartRate) {
        latest.heartRate = { value: r.heartRate, loggedAt: r.loggedAt };
      }
      if (r.temperature && !latest.temperature) {
        latest.temperature = { value: r.temperature.value, unit: r.temperature.unit, loggedAt: r.loggedAt };
      }
      if (r.spo2 && !latest.spo2) {
        latest.spo2 = { value: r.spo2, loggedAt: r.loggedAt };
      }
    }
    return latest;
  }, [records]);

  // Get records filtered by vital type
  const recordsByType = useMemo(() => {
    const safeRecords = records || [];
    return {
      blood_pressure: safeRecords.filter(r => r && r.bloodPressure),
      heart_rate: safeRecords.filter(r => r && r.heartRate),
      temperature: safeRecords.filter(r => r && r.temperature),
      spo2: safeRecords.filter(r => r && r.spo2),
    };
  }, [records]);

  // Chart data by type
  const chartData = useMemo(() => {
    return {
      blood_pressure: recordsByType.blood_pressure
        .slice(0, 14)
        .reverse()
        .map(r => ({
          date: new Date(r.loggedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          systolic: r.bloodPressure!.systolic,
          diastolic: r.bloodPressure!.diastolic,
        })),
      heart_rate: recordsByType.heart_rate
        .slice(0, 14)
        .reverse()
        .map(r => ({
          date: new Date(r.loggedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          bpm: r.heartRate!,
        })),
      temperature: recordsByType.temperature
        .slice(0, 14)
        .reverse()
        .map(r => ({
          date: new Date(r.loggedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          temp: r.temperature!.value,
        })),
      spo2: recordsByType.spo2
        .slice(0, 14)
        .reverse()
        .map(r => ({
          date: new Date(r.loggedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          spo2: r.spo2!,
        })),
    };
  }, [recordsByType]);

  // Calculate trends
  const trends = useMemo(() => {
    const calcTrend = (data: number[]) => {
      if (data.length < 2) return null;
      const recent = data.slice(0, 3);
      const older = data.slice(3, 6);
      if (older.length === 0) return null;

      const recentAvg = recent.reduce((acc, v) => acc + v, 0) / recent.length;
      const olderAvg = older.reduce((acc, v) => acc + v, 0) / older.length;
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
      blood_pressure: calcTrend(recordsByType.blood_pressure.map(r => r.bloodPressure!.systolic)),
      heart_rate: calcTrend(recordsByType.heart_rate.map(r => r.heartRate!)),
      temperature: calcTrend(recordsByType.temperature.map(r => r.temperature!.value)),
      spo2: calcTrend(recordsByType.spo2.map(r => r.spo2!)),
    };
  }, [recordsByType]);

  // Filter records for history based on active tab
  const filteredRecords = useMemo(() => {
    const safeRecords = (records || []).filter(r => r != null);
    if (activeTab === 'overview') return safeRecords;
    if (activeTab === 'blood_pressure') return safeRecords.filter(r => r.bloodPressure);
    if (activeTab === 'heart_rate') return safeRecords.filter(r => r.heartRate);
    if (activeTab === 'temperature') return safeRecords.filter(r => r.temperature);
    if (activeTab === 'spo2') return safeRecords.filter(r => r.spo2);
    return safeRecords;
  }, [records, activeTab]);

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
            {records.length} readings logged
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

      {/* Subscription Limit Banner */}
      {limitError && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5 animate-in slide-in-from-top">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-700 dark:text-amber-400 text-lg">Plan Limit Reached</h3>
              <p className="text-amber-600 dark:text-amber-300/80 mt-1">
                {limitError.message}
              </p>
              <div className="flex items-center gap-3 mt-4">
                <Link
                  to="/pricing"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Upgrade Plan
                </Link>
                <button
                  onClick={() => setLimitError(null)}
                  className="px-4 py-2.5 text-amber-600 dark:text-amber-400 font-medium text-sm hover:bg-amber-500/10 rounded-xl transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Vital Form - Redesigned for Easy Entry */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top duration-300 shadow-xl overflow-hidden">
          {/* Type Selection Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-700">
            {Object.entries(vitalConfig).map(([type, config]) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type as VitalType)}
                className={`flex-1 py-4 px-2 text-center transition-all relative ${
                  selectedType === type
                    ? 'bg-white dark:bg-slate-800'
                    : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-2xl block mb-1">{config.emoji}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  selectedType === type ? config.textColor : 'text-slate-400'
                }`}>
                  {config.shortLabel}
                </span>
                {selectedType === type && (
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleAddVital} className="p-6 space-y-6">
            {/* Live Status Indicator */}
            {(() => {
              const v1 = parseFloat(val1);
              const v2 = parseFloat(val2);
              if (!v1 || isNaN(v1)) return null;

              const status = getVitalStatus(selectedType, v1, selectedType === VitalType.BLOOD_PRESSURE ? v2 : undefined);
              const statusConfig: Record<string, { bg: string; text: string; icon: string; message: string }> = {
                'Normal': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: '✓', message: 'This reading is within normal range' },
                'Elevated': { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: '⚠', message: 'This reading is slightly elevated' },
                'High': { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', icon: '⚠', message: 'This reading is high - consult your doctor if persistent' },
                'Low': { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', icon: 'ℹ', message: 'This reading is below normal range' },
                'Fever': { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', icon: '🌡', message: 'Temperature indicates fever' },
                'Critical': { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', icon: '🚨', message: 'Critical level - seek immediate medical attention' },
              };
              const sc = statusConfig[status.label] || statusConfig['Normal'];

              return (
                <div className={`${sc.bg} rounded-2xl p-4 flex items-center gap-3 animate-in fade-in duration-300`}>
                  <span className="text-xl">{sc.icon}</span>
                  <div className="flex-1">
                    <p className={`font-bold ${sc.text}`}>{status.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{sc.message}</p>
                  </div>
                </div>
              );
            })()}

            {/* Main Input Area */}
            <div className="space-y-4">
              {selectedType === VitalType.BLOOD_PRESSURE ? (
                /* Blood Pressure: Two Values */
                <div className="grid grid-cols-2 gap-4">
                  {/* Systolic */}
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3 text-center">
                      Systolic (Top)
                    </label>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setVal1(String(Math.max(60, parseInt(val1) - 5)))}
                        className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-500 transition-all active:scale-95"
                      >
                        <span className="text-2xl font-bold">−</span>
                      </button>
                      <input
                        type="number"
                        value={val1}
                        onChange={e => setVal1(e.target.value)}
                        className="w-24 h-16 bg-white dark:bg-slate-800 text-4xl font-black text-slate-900 dark:text-white text-center outline-none rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-rose-500 transition-colors"
                        min="60"
                        max="250"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setVal1(String(Math.min(250, parseInt(val1) + 5)))}
                        className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-500 transition-all active:scale-95"
                      >
                        <span className="text-2xl font-bold">+</span>
                      </button>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-2">Normal: 90-120</p>
                  </div>

                  {/* Diastolic */}
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3 text-center">
                      Diastolic (Bottom)
                    </label>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setVal2(String(Math.max(40, parseInt(val2) - 5)))}
                        className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-pink-500 hover:border-pink-500 transition-all active:scale-95"
                      >
                        <span className="text-2xl font-bold">−</span>
                      </button>
                      <input
                        type="number"
                        value={val2}
                        onChange={e => setVal2(e.target.value)}
                        className="w-24 h-16 bg-white dark:bg-slate-800 text-4xl font-black text-slate-900 dark:text-white text-center outline-none rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-pink-500 transition-colors"
                        min="40"
                        max="150"
                      />
                      <button
                        type="button"
                        onClick={() => setVal2(String(Math.min(150, parseInt(val2) + 5)))}
                        className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-pink-500 hover:border-pink-500 transition-all active:scale-95"
                      >
                        <span className="text-2xl font-bold">+</span>
                      </button>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-2">Normal: 60-80</p>
                  </div>
                </div>
              ) : (
                /* Single Value Vitals */
                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4 text-center">
                    {vitalConfig[selectedType].label}
                  </label>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const step = selectedType === VitalType.TEMPERATURE ? 0.1 : 1;
                        const min = selectedType === VitalType.TEMPERATURE ? 35 : selectedType === VitalType.HEART_RATE ? 40 : 80;
                        setVal1(String(Math.max(min, parseFloat(val1) - step).toFixed(selectedType === VitalType.TEMPERATURE ? 1 : 0)));
                      }}
                      className={`w-14 h-14 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:${vitalConfig[selectedType].textColor} hover:border-current transition-all active:scale-95`}
                    >
                      <span className="text-3xl font-bold">−</span>
                    </button>
                    <div className="text-center">
                      <input
                        type="number"
                        value={val1}
                        onChange={e => setVal1(e.target.value)}
                        className={`w-32 h-20 bg-white dark:bg-slate-800 text-5xl font-black text-slate-900 dark:text-white text-center outline-none rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-current transition-colors ${vitalConfig[selectedType].textColor.replace('text-', 'focus:border-')}`}
                        step={selectedType === VitalType.TEMPERATURE ? 0.1 : 1}
                        autoFocus
                      />
                      <p className="text-slate-400 text-sm font-medium mt-2">{vitalConfig[selectedType].unit}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const step = selectedType === VitalType.TEMPERATURE ? 0.1 : 1;
                        const max = selectedType === VitalType.TEMPERATURE ? 42 : selectedType === VitalType.HEART_RATE ? 200 : 100;
                        setVal1(String(Math.min(max, parseFloat(val1) + step).toFixed(selectedType === VitalType.TEMPERATURE ? 1 : 0)));
                      }}
                      className={`w-14 h-14 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:${vitalConfig[selectedType].textColor} hover:border-current transition-all active:scale-95`}
                    >
                      <span className="text-3xl font-bold">+</span>
                    </button>
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-3">
                    Normal: {vitalConfig[selectedType].normalRange.min}-{vitalConfig[selectedType].normalRange.max} {vitalConfig[selectedType].unit}
                  </p>
                </div>
              )}

              {/* Quick Presets */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Select</p>
                <div className="flex flex-wrap gap-2">
                  {selectedType === VitalType.BLOOD_PRESSURE && (
                    <>
                      {[
                        { label: 'Normal', v1: '120', v2: '80' },
                        { label: 'Elevated', v1: '130', v2: '85' },
                        { label: 'High', v1: '140', v2: '90' },
                        { label: 'Low', v1: '100', v2: '65' },
                      ].map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => { setVal1(preset.v1); setVal2(preset.v2); }}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl text-sm font-bold transition-all"
                        >
                          {preset.label} ({preset.v1}/{preset.v2})
                        </button>
                      ))}
                    </>
                  )}
                  {selectedType === VitalType.HEART_RATE && (
                    <>
                      {[
                        { label: 'Resting', v1: '65' },
                        { label: 'Normal', v1: '75' },
                        { label: 'Active', v1: '90' },
                        { label: 'Exercise', v1: '120' },
                      ].map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setVal1(preset.v1)}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-orange-500/10 hover:text-orange-500 rounded-xl text-sm font-bold transition-all"
                        >
                          {preset.label} ({preset.v1})
                        </button>
                      ))}
                    </>
                  )}
                  {selectedType === VitalType.TEMPERATURE && (
                    <>
                      {[
                        { label: 'Normal', v1: profile.settings.units === 'metric' ? '36.6' : '98.6' },
                        { label: 'Low Fever', v1: profile.settings.units === 'metric' ? '37.5' : '99.5' },
                        { label: 'Fever', v1: profile.settings.units === 'metric' ? '38.5' : '101.3' },
                        { label: 'High Fever', v1: profile.settings.units === 'metric' ? '39.5' : '103.1' },
                      ].map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setVal1(preset.v1)}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-purple-500/10 hover:text-purple-500 rounded-xl text-sm font-bold transition-all"
                        >
                          {preset.label} ({preset.v1})
                        </button>
                      ))}
                    </>
                  )}
                  {selectedType === VitalType.SPO2 && (
                    <>
                      {[
                        { label: 'Excellent', v1: '99' },
                        { label: 'Normal', v1: '97' },
                        { label: 'Borderline', v1: '94' },
                        { label: 'Low', v1: '90' },
                      ].map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setVal1(preset.v1)}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-500/10 hover:text-emerald-500 rounded-xl text-sm font-bold transition-all"
                        >
                          {preset.label} ({preset.v1}%)
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Validation Messages */}
              {(() => {
                const v1 = parseFloat(val1);
                const v2 = parseFloat(val2);
                const errors: string[] = [];

                if (selectedType === VitalType.BLOOD_PRESSURE) {
                  if (v1 && (v1 < 60 || v1 > 250)) errors.push('Systolic should be between 60-250 mmHg');
                  if (v2 && (v2 < 40 || v2 > 150)) errors.push('Diastolic should be between 40-150 mmHg');
                  if (v1 && v2 && v2 >= v1) errors.push('Diastolic should be lower than systolic');
                }
                if (selectedType === VitalType.HEART_RATE) {
                  if (v1 && (v1 < 30 || v1 > 220)) errors.push('Heart rate should be between 30-220 bpm');
                }
                if (selectedType === VitalType.TEMPERATURE) {
                  const min = profile.settings.units === 'metric' ? 34 : 93;
                  const max = profile.settings.units === 'metric' ? 43 : 109;
                  if (v1 && (v1 < min || v1 > max)) errors.push(`Temperature should be between ${min}-${max}${vitalConfig[selectedType].unit}`);
                }
                if (selectedType === VitalType.SPO2) {
                  if (v1 && (v1 < 70 || v1 > 100)) errors.push('SpO2 should be between 70-100%');
                }

                if (errors.length === 0) return null;

                return (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 space-y-1">
                    {errors.map((err, i) => (
                      <p key={i} className="text-rose-500 text-sm flex items-center gap-2">
                        <span>⚠</span> {err}
                      </p>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLogging || !val1 || (selectedType === VitalType.BLOOD_PRESSURE && !val2)}
              className={`w-full py-4 rounded-2xl font-bold text-white transition-all bg-gradient-to-r ${vitalConfig[selectedType].gradient} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-${vitalConfig[selectedType].color}-500/20`}
            >
              {isLogging ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-xl">{vitalConfig[selectedType].emoji}</span>
                  Save {vitalConfig[selectedType].label}
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
                  // Map VitalType to latestVitals keys
                  const latestKey = type === VitalType.BLOOD_PRESSURE ? 'bloodPressure' :
                                   type === VitalType.HEART_RATE ? 'heartRate' :
                                   type === VitalType.TEMPERATURE ? 'temperature' : 'spo2';
                  const vital = latestVitals[latestKey as keyof typeof latestVitals];

                  let value: string = '--';
                  let val1: number | undefined;
                  let val2: number | undefined;

                  if (vital) {
                    if (latestKey === 'bloodPressure' && 'systolic' in vital) {
                      value = `${vital.systolic}/${vital.diastolic}`;
                      val1 = vital.systolic;
                      val2 = vital.diastolic;
                    } else if ('value' in vital) {
                      value = String(vital.value);
                      val1 = vital.value;
                    }
                  }

                  const status = val1 ? getVitalStatus(type as VitalType, val1, val2) : null;
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
              {recordsByType[activeTab as keyof typeof recordsByType]?.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    const data = recordsByType[activeTab as keyof typeof recordsByType];
                    // Extract primary value based on vital type
                    const values = data.map((r: VitalRecord) => {
                      if (activeTab === 'blood_pressure' && r.bloodPressure) return r.bloodPressure.systolic;
                      if (activeTab === 'heart_rate' && r.heartRate) return r.heartRate;
                      if (activeTab === 'temperature' && r.temperature) return r.temperature.value;
                      if (activeTab === 'spo2' && r.spo2) return r.spo2;
                      return 0;
                    }).filter((v: number) => v > 0);

                    if (values.length === 0) return null;

                    const avg = (values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(1);
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    const latest = values[0];

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
              <span className="text-sm text-slate-400 tabular-nums">{filteredRecords.length} entries</span>
            </div>

            {filteredRecords.length > 0 ? (
              <div className="space-y-3">
                {filteredRecords.slice(0, 30).map((record: VitalRecord) => {
                  // Determine vital type and values from VitalRecord
                  let frontendType: VitalType = VitalType.BLOOD_PRESSURE;
                  let value: string = '--';
                  let unit: string = '';
                  let val1: number | undefined;
                  let val2: number | undefined;

                  if (record.bloodPressure) {
                    frontendType = VitalType.BLOOD_PRESSURE;
                    val1 = record.bloodPressure.systolic;
                    val2 = record.bloodPressure.diastolic;
                    value = `${val1}/${val2}`;
                    unit = 'mmHg';
                  } else if (record.heartRate) {
                    frontendType = VitalType.HEART_RATE;
                    val1 = record.heartRate;
                    value = String(val1);
                    unit = 'bpm';
                  } else if (record.temperature) {
                    frontendType = VitalType.TEMPERATURE;
                    val1 = record.temperature.value;
                    value = String(val1);
                    unit = record.temperature.unit === 'celsius' ? '°C' : '°F';
                  } else if (record.spo2) {
                    frontendType = VitalType.SPO2;
                    val1 = record.spo2;
                    value = String(val1);
                    unit = '%';
                  }

                  const config = vitalConfig[frontendType];
                  const status = val1 ? getVitalStatus(frontendType, val1, val2) : { label: 'Unknown', color: 'slate' };
                  const Icon = config.icon;

                  const statusColors: Record<string, string> = {
                    emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                    amber: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
                    rose: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
                    sky: 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400',
                    slate: 'bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400',
                  };

                  return (
                    <div
                      key={record._id}
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
                          {new Date(record.loggedAt).toLocaleDateString([], {
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
                        <span className="text-sm text-slate-400 ml-1">{unit}</span>
                      </div>

                      <button
                        onClick={() => setDeleteModalRecord(record)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <ICONS.X className="w-5 h-5" />
                      </button>
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

      {/* Success Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg ${
            notification.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-rose-500 text-white'
          }`}>
            {notification.type === 'success' ? (
              <ICONS.Check className="w-5 h-5" />
            ) : (
              <ICONS.X className="w-5 h-5" />
            )}
            <span className="font-bold">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ICONS.X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isDeleting && setDeleteModalRecord(null)}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                <ICONS.X className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Delete Entry
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to delete this {getRecordLabel(deleteModalRecord).toLowerCase()} reading of <span className="font-bold text-slate-900 dark:text-white">
                  {deleteModalRecord.bloodPressure
                    ? `${deleteModalRecord.bloodPressure.systolic}/${deleteModalRecord.bloodPressure.diastolic} mmHg`
                    : deleteModalRecord.heartRate
                    ? `${deleteModalRecord.heartRate} bpm`
                    : deleteModalRecord.temperature
                    ? `${deleteModalRecord.temperature.value}${deleteModalRecord.temperature.unit === 'celsius' ? '°C' : '°F'}`
                    : deleteModalRecord.spo2
                    ? `${deleteModalRecord.spo2}%`
                    : '--'}
                </span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModalRecord(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vitals;
