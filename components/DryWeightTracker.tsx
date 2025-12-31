import React from 'react';
import { ICONS } from '../constants';

interface DryWeightTrackerProps {
  currentWeight: number;
  dryWeight: number;
  previousWeight?: number;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
  compact?: boolean;
}

/**
 * Dry Weight Tracker Component
 *
 * Helps patients understand fluid overload risk instantly by showing:
 * - Target dry weight vs current weight
 * - Visual indicator: Above / At / Below dry weight
 * - Trend arrow showing weight direction
 */
const DryWeightTracker: React.FC<DryWeightTrackerProps> = ({
  currentWeight,
  dryWeight,
  previousWeight,
  trend,
  className = '',
  compact = false,
}) => {
  // Calculate difference from dry weight
  const difference = currentWeight - dryWeight;
  const differencePercent = Math.abs((difference / dryWeight) * 100);

  // Determine status based on difference
  const getStatus = () => {
    if (difference > 2) return 'critical'; // > 2kg above
    if (difference > 1) return 'warning';  // 1-2kg above
    if (difference > 0.5) return 'above';  // 0.5-1kg above
    if (difference >= -0.5) return 'at';   // Within 0.5kg
    if (difference >= -1) return 'below';  // 0.5-1kg below
    return 'low';                          // > 1kg below (rare)
  };

  const status = getStatus();

  // Determine trend arrow
  const getTrendArrow = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    if (previousWeight !== undefined) {
      const change = currentWeight - previousWeight;
      if (change > 0.1) return '↑';
      if (change < -0.1) return '↓';
    }
    return '→';
  };

  const trendArrow = getTrendArrow();
  const trendDirection = trendArrow === '↑' ? 'up' : trendArrow === '↓' ? 'down' : 'stable';

  // Status colors and labels
  const statusConfig = {
    critical: {
      bg: 'bg-rose-500',
      bgLight: 'bg-rose-500/10',
      text: 'text-rose-500',
      border: 'border-rose-200 dark:border-rose-500/30',
      label: 'Critical',
      description: 'Significant fluid overload',
      icon: '⚠️',
    },
    warning: {
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-500/10',
      text: 'text-amber-500',
      border: 'border-amber-200 dark:border-amber-500/30',
      label: 'Above',
      description: 'Monitor fluid intake',
      icon: '🔼',
    },
    above: {
      bg: 'bg-yellow-500',
      bgLight: 'bg-yellow-500/10',
      text: 'text-yellow-500',
      border: 'border-yellow-200 dark:border-yellow-500/30',
      label: 'Slightly Above',
      description: 'Close to target',
      icon: '📈',
    },
    at: {
      bg: 'bg-emerald-500',
      bgLight: 'bg-emerald-500/10',
      text: 'text-emerald-500',
      border: 'border-emerald-200 dark:border-emerald-500/30',
      label: 'At Target',
      description: 'Excellent control!',
      icon: '✓',
    },
    below: {
      bg: 'bg-sky-500',
      bgLight: 'bg-sky-500/10',
      text: 'text-sky-500',
      border: 'border-sky-200 dark:border-sky-500/30',
      label: 'Below Target',
      description: 'Ensure adequate nutrition',
      icon: '📉',
    },
    low: {
      bg: 'bg-purple-500',
      bgLight: 'bg-purple-500/10',
      text: 'text-purple-500',
      border: 'border-purple-200 dark:border-purple-500/30',
      label: 'Low',
      description: 'Consult your care team',
      icon: '🔽',
    },
  };

  const config = statusConfig[status];

  // Calculate visual position on scale (0-100%)
  // Range: dry weight - 3kg to dry weight + 3kg
  const scaleMin = dryWeight - 3;
  const scaleMax = dryWeight + 3;
  const position = Math.max(0, Math.min(100, ((currentWeight - scaleMin) / (scaleMax - scaleMin)) * 100));
  const targetPosition = 50; // Dry weight is at center

  if (compact) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-2xl p-4 border ${config.border} transition-all hover:shadow-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${config.bgLight} rounded-xl flex items-center justify-center`}>
              <ICONS.Scale className={`w-5 h-5 ${config.text}`} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Dry Weight</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {currentWeight.toFixed(1)}
                </span>
                <span className="text-slate-400 text-sm">/ {dryWeight.toFixed(1)} kg</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${config.bgLight} ${config.text}`}>
              {config.icon} {config.label}
              <span className={`ml-1 ${
                trendDirection === 'up' ? 'text-rose-500' :
                trendDirection === 'down' ? 'text-emerald-500' : 'text-slate-400'
              }`}>
                {trendArrow}
              </span>
            </span>
            <p className={`text-sm font-bold tabular-nums mt-1 ${config.text}`}>
              {difference > 0 ? '+' : ''}{difference.toFixed(1)} kg
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-3xl p-6 border ${config.border} transition-all hover:shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${config.bgLight} rounded-2xl flex items-center justify-center`}>
            <ICONS.Scale className={`w-6 h-6 ${config.text}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dry Weight Tracker</h3>
            <p className="text-slate-400 text-sm">Fluid balance status</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${config.bgLight} ${config.text}`}>
          <span className="text-base">{config.icon}</span>
          {config.label}
        </span>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Current</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {currentWeight.toFixed(1)}
            <span className="text-sm text-slate-400 ml-1">kg</span>
          </p>
        </div>
        <div className={`text-center p-3 rounded-2xl ${config.bgLight}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${config.text}`}>Difference</p>
          <p className={`text-2xl font-black tabular-nums ${config.text}`}>
            {difference > 0 ? '+' : ''}{difference.toFixed(1)}
            <span className="text-sm ml-1">kg</span>
          </p>
        </div>
        <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Target</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {dryWeight.toFixed(1)}
            <span className="text-sm text-slate-400 ml-1">kg</span>
          </p>
        </div>
      </div>

      {/* Visual Scale */}
      <div className="mb-4">
        <div className="relative h-8 bg-gradient-to-r from-purple-100 via-emerald-100 to-rose-100 dark:from-purple-900/30 dark:via-emerald-900/30 dark:to-rose-900/30 rounded-full overflow-hidden">
          {/* Scale markers */}
          <div className="absolute inset-0 flex justify-between px-2 items-center">
            <span className="text-[9px] font-bold text-purple-400">-3kg</span>
            <span className="text-[9px] font-bold text-emerald-500">Target</span>
            <span className="text-[9px] font-bold text-rose-400">+3kg</span>
          </div>

          {/* Target line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-emerald-500"
            style={{ left: `${targetPosition}%` }}
          />

          {/* Current position indicator */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-500 ${config.bg}`}
            style={{ left: `calc(${position}% - 8px)` }}
          >
            {/* Trend arrow inside indicator */}
            <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
              {trendArrow}
            </span>
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className={`p-4 rounded-2xl ${config.bgLight}`}>
        <div className="flex items-start gap-3">
          <span className="text-xl">{config.icon}</span>
          <div>
            <p className={`font-bold ${config.text}`}>{config.description}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {status === 'critical' && 'Consider contacting your dialysis team about fluid removal.'}
              {status === 'warning' && 'Limit fluid intake and watch sodium consumption.'}
              {status === 'above' && 'You\'re doing well! Keep monitoring your intake.'}
              {status === 'at' && 'Great job maintaining your target weight!'}
              {status === 'below' && 'Make sure you\'re eating and drinking enough.'}
              {status === 'low' && 'Your weight is significantly below target. Please consult your team.'}
            </p>
          </div>
        </div>
      </div>

      {/* Trend indicator */}
      {previousWeight !== undefined && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-400">Since last measurement:</span>
          <span className={`font-bold flex items-center gap-1 ${
            trendDirection === 'up' ? 'text-rose-500' :
            trendDirection === 'down' ? 'text-emerald-500' : 'text-slate-400'
          }`}>
            <span className="text-lg">{trendArrow}</span>
            {Math.abs(currentWeight - previousWeight).toFixed(1)} kg
          </span>
        </div>
      )}
    </div>
  );
};

export default DryWeightTracker;
