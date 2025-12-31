import React, { useState } from 'react';
import { ICONS } from '../constants';

interface UFSafetyIndicatorProps {
  /** Total ultrafiltration volume in ml */
  ufVolumeMl: number;
  /** Patient weight in kg */
  weightKg: number;
  /** Session duration in minutes */
  durationMin: number;
  /** Target UF (optional, for comparison) */
  targetUfMl?: number;
  /** Show as compact card */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// UF Rate thresholds (ml/kg/hr)
const UF_THRESHOLDS = {
  SAFE: 10,      // < 10 ml/kg/hr is generally safe
  CAUTION: 13,   // 10-13 ml/kg/hr requires monitoring
  // > 13 ml/kg/hr is high risk
} as const;

type SafetyLevel = 'safe' | 'caution' | 'risk';

/**
 * UF Safety Indicator Component
 *
 * Displays UF rate with color-coded safety level to help prevent
 * complications like cramping, hypotension, and cardiovascular stress.
 *
 * Clinical guidelines suggest keeping UF rate < 10-13 ml/kg/hr
 */
const UFSafetyIndicator: React.FC<UFSafetyIndicatorProps> = ({
  ufVolumeMl,
  weightKg,
  durationMin,
  targetUfMl,
  compact = false,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Calculate UF rate in ml/kg/hr
  const durationHours = durationMin / 60;
  const ufRate = durationHours > 0 && weightKg > 0
    ? ufVolumeMl / weightKg / durationHours
    : 0;

  // Determine safety level
  const getSafetyLevel = (rate: number): SafetyLevel => {
    if (rate < UF_THRESHOLDS.SAFE) return 'safe';
    if (rate < UF_THRESHOLDS.CAUTION) return 'caution';
    return 'risk';
  };

  const safetyLevel = getSafetyLevel(ufRate);

  // Safety level configuration
  const safetyConfig = {
    safe: {
      bg: 'bg-emerald-500',
      bgLight: 'bg-emerald-500/10',
      text: 'text-emerald-500',
      border: 'border-emerald-200 dark:border-emerald-500/30',
      label: 'Safe',
      icon: '✓',
      description: 'UF rate is within safe limits',
      advice: 'Continue monitoring vitals as usual.',
    },
    caution: {
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-500/10',
      text: 'text-amber-500',
      border: 'border-amber-200 dark:border-amber-500/30',
      label: 'Caution',
      icon: '⚠️',
      description: 'UF rate is elevated',
      advice: 'Monitor for cramping, dizziness, or BP drops. Consider extending session time.',
    },
    risk: {
      bg: 'bg-rose-500',
      bgLight: 'bg-rose-500/10',
      text: 'text-rose-500',
      border: 'border-rose-200 dark:border-rose-500/30',
      label: 'Risk',
      icon: '🚨',
      description: 'High UF rate detected',
      advice: 'High UF rate may cause cramps, hypotension, or cardiac stress. Consider reducing UF or extending session.',
    },
  };

  const config = safetyConfig[safetyLevel];

  // Calculate percentage achieved if target provided
  const percentOfTarget = targetUfMl ? Math.round((ufVolumeMl / targetUfMl) * 100) : null;

  // Calculate what rate would be at different durations
  const getAlternativeRate = (newDurationMin: number) => {
    const newDurationHours = newDurationMin / 60;
    return newDurationHours > 0 && weightKg > 0
      ? (ufVolumeMl / weightKg / newDurationHours).toFixed(1)
      : '0';
  };

  if (compact) {
    return (
      <div
        className={`relative bg-white dark:bg-slate-800 rounded-2xl p-4 border ${config.border} transition-all hover:shadow-lg ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${config.bgLight} rounded-xl flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${config.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">UF Rate</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {ufRate.toFixed(1)}
                <span className="text-sm text-slate-400 ml-1">ml/kg/hr</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${config.bgLight} ${config.text}`}>
              {config.icon} {config.label}
            </span>
            <p className="text-slate-400 text-xs mt-1">{ufVolumeMl} ml total</p>
          </div>
        </div>

        {/* Tooltip */}
        {showTooltip && safetyLevel !== 'safe' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-50 w-64 animate-in fade-in zoom-in-95 duration-200">
            <p className="font-bold mb-1">{config.description}</p>
            <p className="text-slate-300">{config.advice}</p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-3xl p-6 border ${config.border} transition-all hover:shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${config.bgLight} rounded-2xl flex items-center justify-center`}>
            <svg className={`w-6 h-6 ${config.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">UF Safety</h3>
            <p className="text-slate-400 text-sm">Ultrafiltration rate</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${config.bgLight} ${config.text}`}>
          <span className="text-base">{config.icon}</span>
          {config.label}
        </span>
      </div>

      {/* Main UF Rate Display */}
      <div className="text-center py-6">
        <div className="inline-flex items-baseline gap-2">
          <span className={`text-5xl font-black tabular-nums ${config.text}`}>
            {ufRate.toFixed(1)}
          </span>
          <span className="text-slate-400 text-lg font-medium">ml/kg/hr</span>
        </div>
      </div>

      {/* Safety Scale */}
      <div className="mb-6">
        <div className="relative h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          {/* Gradient scale */}
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-emerald-400" />
            <div className="flex-1 bg-amber-400" />
            <div className="flex-1 bg-rose-400" />
          </div>

          {/* Current position indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-900 rounded-full shadow-lg transition-all duration-500"
            style={{
              left: `calc(${Math.min((ufRate / 20) * 100, 100)}% - 8px)`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] font-bold text-slate-400">
          <span>0</span>
          <span className="text-emerald-500">&lt;10 Safe</span>
          <span className="text-amber-500">10-13</span>
          <span className="text-rose-500">&gt;13 Risk</span>
          <span>20+</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Volume</p>
          <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
            {ufVolumeMl}
            <span className="text-xs text-slate-400 ml-0.5">ml</span>
          </p>
        </div>
        <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Weight</p>
          <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
            {weightKg}
            <span className="text-xs text-slate-400 ml-0.5">kg</span>
          </p>
        </div>
        <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Duration</p>
          <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
            {Math.floor(durationMin / 60)}h {durationMin % 60}m
          </p>
        </div>
      </div>

      {/* Target progress if provided */}
      {targetUfMl && (
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-xs font-bold uppercase">Target Progress</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {ufVolumeMl} / {targetUfMl} ml
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentOfTarget! >= 100 ? 'bg-emerald-500' : 'bg-sky-500'
              }`}
              style={{ width: `${Math.min(percentOfTarget!, 100)}%` }}
            />
          </div>
          <p className="text-right text-xs text-slate-400 mt-1">{percentOfTarget}% achieved</p>
        </div>
      )}

      {/* Status Message */}
      <div className={`p-4 rounded-2xl ${config.bgLight}`}>
        <div className="flex items-start gap-3">
          <span className="text-xl">{config.icon}</span>
          <div>
            <p className={`font-bold ${config.text}`}>{config.description}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{config.advice}</p>
          </div>
        </div>
      </div>

      {/* Alternative durations suggestion for high rates */}
      {safetyLevel !== 'safe' && (
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Rate at different durations:
          </p>
          <div className="flex gap-2">
            {[240, 270, 300, 330].map(mins => {
              const altRate = parseFloat(getAlternativeRate(mins));
              const altLevel = getSafetyLevel(altRate);
              return (
                <div
                  key={mins}
                  className={`flex-1 text-center p-2 rounded-lg ${
                    altLevel === 'safe'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : altLevel === 'caution'
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-rose-100 dark:bg-rose-900/30'
                  }`}
                >
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{Math.floor(mins / 60)}h {mins % 60}m</p>
                  <p className={`text-sm font-bold ${safetyConfig[altLevel].text}`}>
                    {altRate}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UFSafetyIndicator;

/**
 * Calculate UF rate utility function
 */
export function calculateUFRate(ufVolumeMl: number, weightKg: number, durationMin: number): number {
  const durationHours = durationMin / 60;
  if (durationHours <= 0 || weightKg <= 0) return 0;
  return ufVolumeMl / weightKg / durationHours;
}

/**
 * Get safety level for a UF rate
 */
export function getUFSafetyLevel(rate: number): SafetyLevel {
  if (rate < UF_THRESHOLDS.SAFE) return 'safe';
  if (rate < UF_THRESHOLDS.CAUTION) return 'caution';
  return 'risk';
}

/**
 * Check if UF rate is safe
 */
export function isUFRateSafe(ufVolumeMl: number, weightKg: number, durationMin: number): boolean {
  const rate = calculateUFRate(ufVolumeMl, weightKg, durationMin);
  return rate < UF_THRESHOLDS.SAFE;
}
