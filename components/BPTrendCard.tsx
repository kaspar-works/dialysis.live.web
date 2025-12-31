import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { ICONS } from '../constants';

export type BPType = 'pre_dialysis' | 'post_dialysis' | 'home' | 'unknown';

export interface BPReading {
  systolic: number;
  diastolic: number;
  timestamp: string;
  type?: BPType;
}

interface BPTrendCardProps {
  /** Current/latest BP reading */
  currentBP?: { systolic: number; diastolic: number };
  /** Historical BP readings for sparkline */
  readings?: BPReading[];
  /** Pre-dialysis readings from sessions */
  preDialysisBP?: { systolic: number; diastolic: number; date: string }[];
  /** Post-dialysis readings from sessions */
  postDialysisBP?: { systolic: number; diastolic: number; date: string }[];
  /** Home BP readings */
  homeBP?: { systolic: number; diastolic: number; date: string }[];
  /** Show expanded view with all BP types */
  expanded?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// BP classification thresholds
const BP_THRESHOLDS = {
  normal: { systolic: 120, diastolic: 80 },
  elevated: { systolic: 129, diastolic: 80 },
  high1: { systolic: 139, diastolic: 89 },
  high2: { systolic: 180, diastolic: 120 },
};

/**
 * Get BP classification
 */
function classifyBP(systolic: number, diastolic: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (systolic < 90 || diastolic < 60) {
    return { label: 'Low', color: 'text-sky-500', bgColor: 'bg-sky-500' };
  }
  if (systolic < BP_THRESHOLDS.normal.systolic && diastolic < BP_THRESHOLDS.normal.diastolic) {
    return { label: 'Normal', color: 'text-emerald-500', bgColor: 'bg-emerald-500' };
  }
  if (systolic <= BP_THRESHOLDS.elevated.systolic && diastolic < BP_THRESHOLDS.elevated.diastolic) {
    return { label: 'Elevated', color: 'text-yellow-500', bgColor: 'bg-yellow-500' };
  }
  if (systolic <= BP_THRESHOLDS.high1.systolic || diastolic <= BP_THRESHOLDS.high1.diastolic) {
    return { label: 'High', color: 'text-amber-500', bgColor: 'bg-amber-500' };
  }
  if (systolic >= BP_THRESHOLDS.high2.systolic || diastolic >= BP_THRESHOLDS.high2.diastolic) {
    return { label: 'Crisis', color: 'text-rose-500', bgColor: 'bg-rose-500' };
  }
  return { label: 'High', color: 'text-rose-500', bgColor: 'bg-rose-500' };
}

/**
 * BP Trend Card Component
 *
 * Shows blood pressure with clinical context:
 * - Current reading with classification
 * - Mini sparkline showing trend
 * - Breakdown by type: Pre-dialysis, Post-dialysis, Home
 */
const BPTrendCard: React.FC<BPTrendCardProps> = ({
  currentBP,
  readings = [],
  preDialysisBP = [],
  postDialysisBP = [],
  homeBP = [],
  expanded = false,
  className = '',
}) => {
  // Prepare sparkline data
  const sparklineData = useMemo(() => {
    // Combine all readings and sort by date
    const allReadings: { date: string; systolic: number; diastolic: number; type: string }[] = [];

    readings.forEach(r => {
      allReadings.push({
        date: r.timestamp,
        systolic: r.systolic,
        diastolic: r.diastolic,
        type: r.type || 'unknown',
      });
    });

    preDialysisBP.forEach(r => {
      allReadings.push({
        date: r.date,
        systolic: r.systolic,
        diastolic: r.diastolic,
        type: 'pre_dialysis',
      });
    });

    postDialysisBP.forEach(r => {
      allReadings.push({
        date: r.date,
        systolic: r.systolic,
        diastolic: r.diastolic,
        type: 'post_dialysis',
      });
    });

    homeBP.forEach(r => {
      allReadings.push({
        date: r.date,
        systolic: r.systolic,
        diastolic: r.diastolic,
        type: 'home',
      });
    });

    // Sort by date and take last 10
    return allReadings
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10);
  }, [readings, preDialysisBP, postDialysisBP, homeBP]);

  // Get latest readings by type
  const latestByType = useMemo(() => {
    const latest = {
      pre_dialysis: preDialysisBP[0] || null,
      post_dialysis: postDialysisBP[0] || null,
      home: homeBP[0] || null,
    };
    return latest;
  }, [preDialysisBP, postDialysisBP, homeBP]);

  // Calculate averages
  const averages = useMemo(() => {
    const calcAvg = (arr: { systolic: number; diastolic: number }[]) => {
      if (arr.length === 0) return null;
      const sum = arr.reduce((acc, r) => ({
        systolic: acc.systolic + r.systolic,
        diastolic: acc.diastolic + r.diastolic,
      }), { systolic: 0, diastolic: 0 });
      return {
        systolic: Math.round(sum.systolic / arr.length),
        diastolic: Math.round(sum.diastolic / arr.length),
      };
    };

    return {
      pre_dialysis: calcAvg(preDialysisBP),
      post_dialysis: calcAvg(postDialysisBP),
      home: calcAvg(homeBP),
      overall: calcAvg([...preDialysisBP, ...postDialysisBP, ...homeBP]),
    };
  }, [preDialysisBP, postDialysisBP, homeBP]);

  // Current BP classification
  const classification = currentBP ? classifyBP(currentBP.systolic, currentBP.diastolic) : null;

  // Trend direction
  const trend = useMemo(() => {
    if (sparklineData.length < 2) return null;
    const recent = sparklineData.slice(-3);
    const older = sparklineData.slice(-6, -3);
    if (recent.length === 0 || older.length === 0) return null;

    const recentAvg = recent.reduce((acc, r) => acc + r.systolic, 0) / recent.length;
    const olderAvg = older.reduce((acc, r) => acc + r.systolic, 0) / older.length;
    const diff = recentAvg - olderAvg;

    if (diff > 5) return { direction: 'up', label: 'Rising' };
    if (diff < -5) return { direction: 'down', label: 'Falling' };
    return { direction: 'stable', label: 'Stable' };
  }, [sparklineData]);

  // BP type config
  const typeConfig = {
    pre_dialysis: { label: 'Pre-Dialysis', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: '🔼' },
    post_dialysis: { label: 'Post-Dialysis', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: '🔽' },
    home: { label: 'Home', color: 'text-sky-500', bg: 'bg-sky-500/10', icon: '🏠' },
  };

  if (!expanded) {
    // Compact view for dashboard
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:border-rose-200 dark:hover:border-rose-500/30 transition-all duration-300 group ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ICONS.Vitals className="w-5 h-5 text-rose-500" />
          </div>
          {classification && (
            <span className={`text-[10px] font-bold uppercase ${classification.color}`}>
              {classification.label}
            </span>
          )}
        </div>

        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Blood Pressure</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-1">
          {currentBP ? `${currentBP.systolic}/${currentBP.diastolic}` : '--/--'}
        </p>
        <p className="text-slate-400 text-xs">mmHg</p>

        {/* Mini Sparkline */}
        {sparklineData.length > 1 && (
          <div className="mt-3 h-12 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="systolic"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="3 3"
                />
                <ReferenceLine y={120} stroke="#10b981" strokeDasharray="2 2" strokeWidth={1} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '11px',
                    padding: '6px 10px',
                  }}
                  labelStyle={{ display: 'none' }}
                  formatter={(value: number, name: string) => [
                    `${value} mmHg`,
                    name === 'systolic' ? 'Sys' : 'Dia',
                  ]}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Trend indicator */}
        {trend && (
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">Trend:</span>
            <span className={`font-bold flex items-center gap-1 ${
              trend.direction === 'up' ? 'text-rose-500' :
              trend.direction === 'down' ? 'text-emerald-500' : 'text-slate-400'
            }`}>
              {trend.direction === 'up' && '↑'}
              {trend.direction === 'down' && '↓'}
              {trend.direction === 'stable' && '→'}
              {trend.label}
            </span>
          </div>
        )}

        {/* Quick type labels */}
        <div className="mt-3 flex gap-1">
          {latestByType.pre_dialysis && (
            <span className="flex-1 px-1.5 py-1 bg-purple-500/10 rounded text-[9px] font-bold text-purple-500 text-center truncate">
              Pre: {latestByType.pre_dialysis.systolic}/{latestByType.pre_dialysis.diastolic}
            </span>
          )}
          {latestByType.post_dialysis && (
            <span className="flex-1 px-1.5 py-1 bg-emerald-500/10 rounded text-[9px] font-bold text-emerald-500 text-center truncate">
              Post: {latestByType.post_dialysis.systolic}/{latestByType.post_dialysis.diastolic}
            </span>
          )}
          {latestByType.home && (
            <span className="flex-1 px-1.5 py-1 bg-sky-500/10 rounded text-[9px] font-bold text-sky-500 text-center truncate">
              Home: {latestByType.home.systolic}/{latestByType.home.diastolic}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center">
            <ICONS.Vitals className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Blood Pressure</h3>
            <p className="text-slate-400 text-sm">Trend analysis</p>
          </div>
        </div>
        {classification && (
          <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${classification.color} ${classification.bgColor}/10`}>
            {classification.label}
          </span>
        )}
      </div>

      {/* Current Reading */}
      <div className="text-center mb-6">
        <p className="text-5xl font-black text-slate-900 dark:text-white tabular-nums">
          {currentBP ? `${currentBP.systolic}/${currentBP.diastolic}` : '--/--'}
        </p>
        <p className="text-slate-400 mt-1">mmHg</p>
        {trend && (
          <p className={`mt-2 text-sm font-bold ${
            trend.direction === 'up' ? 'text-rose-500' :
            trend.direction === 'down' ? 'text-emerald-500' : 'text-slate-400'
          }`}>
            {trend.direction === 'up' && '↑ '}
            {trend.direction === 'down' && '↓ '}
            {trend.direction === 'stable' && '→ '}
            {trend.label} trend
          </p>
        )}
      </div>

      {/* Sparkline Chart */}
      {sparklineData.length > 1 && (
        <div className="h-32 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <ReferenceLine y={120} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} />
              <ReferenceLine y={80} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1} />
              <Line
                type="monotone"
                dataKey="systolic"
                stroke="#f43f5e"
                strokeWidth={3}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const colors: Record<string, string> = {
                    pre_dialysis: '#a855f7',
                    post_dialysis: '#10b981',
                    home: '#0ea5e9',
                    unknown: '#f43f5e',
                  };
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={colors[payload.type] || '#f43f5e'}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="diastolic"
                stroke="#94a3b8"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 4"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px 12px',
                }}
                labelFormatter={(_, payload) => {
                  if (payload?.[0]?.payload) {
                    const type = payload[0].payload.type;
                    const config = typeConfig[type as keyof typeof typeConfig];
                    return config ? config.label : 'Reading';
                  }
                  return 'Reading';
                }}
                formatter={(value: number, name: string) => [
                  `${value} mmHg`,
                  name === 'systolic' ? 'Systolic' : 'Diastolic',
                ]}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* BP by Type */}
      <div className="grid grid-cols-3 gap-3">
        {(['pre_dialysis', 'post_dialysis', 'home'] as const).map(type => {
          const config = typeConfig[type];
          const latest = latestByType[type];
          const avg = averages[type];

          return (
            <div key={type} className={`p-4 rounded-2xl ${config.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span>{config.icon}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                  {config.label}
                </span>
              </div>
              {latest ? (
                <>
                  <p className={`text-xl font-black ${config.color} tabular-nums`}>
                    {latest.systolic}/{latest.diastolic}
                  </p>
                  {avg && (
                    <p className="text-slate-400 text-xs mt-1">
                      Avg: {avg.systolic}/{avg.diastolic}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-slate-400 text-sm">No data</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-rose-500 rounded" /> Systolic
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-slate-400 rounded" style={{ borderStyle: 'dashed' }} /> Diastolic
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-emerald-500 rounded" style={{ borderStyle: 'dashed' }} /> Target (120)
        </span>
      </div>
    </div>
  );
};

export default BPTrendCard;

/**
 * Get BP classification utility
 */
export { classifyBP };
