import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { ICONS } from '../constants';
import { Link } from 'react-router-dom';
import { MoodType, VitalType, FluidIntake, VitalLog } from '../types';
import OnboardingModal from '../components/OnboardingModal';
import { getDashboard, getHealthOverview, DashboardStats, HealthOverview } from '../services/dashboard';
import {
  getDashboardAlerts,
  dismissAlert,
  refreshAlerts,
  Alert,
  AlertCounts,
  getSeverityColor,
  getSeverityIcon,
} from '../services/alerts';
import {
  getUpcomingReminders,
  Reminder,
  REMINDER_TYPE_ICONS,
  formatReminderTime,
  getScheduleDescription,
} from '../services/reminders';
import {
  getUpcomingAppointments,
  Appointment,
  APPOINTMENT_TYPE_ICONS,
  APPOINTMENT_TYPE_LABELS,
  formatAppointmentTime,
  getRelativeDate,
} from '../services/appointments';
import {
  getTodayMeals,
  TodayMealsResponse,
  DAILY_LIMITS,
} from '../services/nutrition';

const Dashboard: React.FC = () => {
  const { weights, fluids, profile, vitals, moods, addFluid, meals } = useStore();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [healthOverview, setHealthOverview] = useState<HealthOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeQuickAdd, setActiveQuickAdd] = useState<number | null>(null);
  const [apiAlerts, setApiAlerts] = useState<Alert[]>([]);
  const [alertCounts, setAlertCounts] = useState<AlertCounts | null>(null);
  const [hasUrgentAlerts, setHasUrgentAlerts] = useState(false);
  const [isDismissing, setIsDismissing] = useState<string | null>(null);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [nutritionData, setNutritionData] = useState<TodayMealsResponse | null>(null);
  const hasFetched = useRef(false);

  // Fetch dashboard data and alerts from API
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchDashboard = async () => {
      try {
        const [dashData, alertsData, healthData, remindersData, appointmentsData, nutriData] = await Promise.all([
          getDashboard(30),
          getDashboardAlerts().catch(() => null),
          getHealthOverview().catch(() => null),
          getUpcomingReminders(24).catch(() => []),
          getUpcomingAppointments(7).catch(() => []),
          getTodayMeals().catch(() => null),
        ]);

        setDashboardData(dashData);

        if (healthData) {
          setHealthOverview(healthData);
        }

        if (alertsData) {
          setApiAlerts(alertsData.alerts);
          setAlertCounts(alertsData.counts);
          setHasUrgentAlerts(alertsData.hasUrgent);
        }

        if (remindersData) {
          setUpcomingReminders(remindersData);
        }

        if (appointmentsData) {
          setUpcomingAppointments(appointmentsData);
        }

        if (nutriData) {
          setNutritionData(nutriData);
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        if (!error?.message?.includes('Session expired')) {
          console.error('Failed to load dashboard:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Handle dismiss alert
  const handleDismissAlert = async (alertId: string) => {
    setIsDismissing(alertId);
    try {
      await dismissAlert(alertId);
      setApiAlerts(prev => prev.filter(a => a._id !== alertId));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    } finally {
      setIsDismissing(null);
    }
  };

  // Current data - prefer API data over local store
  const currentWeight = dashboardData?.weight?.current || weights[0]?.value || profile.weightGoal;
  const dryWeight = dashboardData?.weight?.dryWeight || profile.weightGoal;
  const weightTrend = dashboardData?.weight?.trend || 'stable';

  const weightChange = useMemo(() => {
    if (dashboardData?.weight?.history && dashboardData.weight.history.length >= 2) {
      const recent = dashboardData.weight.history[0]?.weight;
      const prev = dashboardData.weight.history[1]?.weight;
      if (recent && prev) return recent - prev;
    }
    if (weights.length >= 2) return weights[0].value - weights[1].value;
    return 0;
  }, [dashboardData, weights]);

  // Fluid data
  const todayFluid = dashboardData?.fluid?.todayTotal || fluids.reduce((acc: number, f: FluidIntake) => acc + f.amount, 0);
  const dailyFluidLimit = dashboardData?.fluid?.dailyLimit || profile.dailyFluidLimit;
  const fluidPercentage = Math.min(Math.round((todayFluid / dailyFluidLimit) * 100), 100);
  const fluidRemaining = Math.max(dailyFluidLimit - todayFluid, 0);

  // Vitals
  const latestBP = useMemo(() => {
    if (dashboardData?.vitals?.latestBp) {
      return { systolic: dashboardData.vitals.latestBp.systolic, diastolic: dashboardData.vitals.latestBp.diastolic };
    }
    const bp = vitals.find((v: VitalLog) => v.type === VitalType.BLOOD_PRESSURE);
    return bp ? { systolic: bp.value1, diastolic: bp.value2 } : null;
  }, [dashboardData, vitals]);

  const latestHR = useMemo(() => {
    if (dashboardData?.vitals?.latestHeartRate) {
      return dashboardData.vitals.latestHeartRate.value;
    }
    const hr = vitals.find((v: VitalLog) => v.type === VitalType.HEART_RATE);
    return hr?.value1 || null;
  }, [dashboardData, vitals]);

  const latestTemp = useMemo(() => {
    const temp = vitals.find((v: VitalLog) => v.type === VitalType.TEMPERATURE);
    return temp?.value1 || 36.5;
  }, [vitals]);

  const latestO2 = useMemo(() => {
    const o2 = vitals.find((v: VitalLog) => v.type === VitalType.SPO2);
    return o2?.value1 || 98;
  }, [vitals]);

  // Session stats
  const sessionStats = dashboardData?.sessions;

  // Chart data - Weight (7 days)
  const weightData = useMemo(() => {
    if (dashboardData?.weight?.history && dashboardData.weight.history.length > 0) {
      return dashboardData.weight.history.slice(0, 7).reverse().map(w => ({
        date: new Date(w.date).toLocaleDateString(undefined, { weekday: 'short' }),
        weight: w.weight,
        goal: dryWeight
      }));
    }
    const data = [...weights].reverse().slice(-7).map(w => ({
      date: new Date(w.date).toLocaleDateString(undefined, { weekday: 'short' }),
      weight: w.value,
      goal: profile.weightGoal
    }));
    if (data.length === 0) {
      return [
        { date: 'Mon', weight: 72, goal: 70 },
        { date: 'Tue', weight: 71.5, goal: 70 },
        { date: 'Wed', weight: 71, goal: 70 },
        { date: 'Thu', weight: 70.5, goal: 70 },
        { date: 'Fri', weight: 70.2, goal: 70 },
        { date: 'Sat', weight: 70, goal: 70 },
        { date: 'Sun', weight: 70, goal: 70 },
      ];
    }
    return data;
  }, [dashboardData, weights, profile.weightGoal, dryWeight]);

  // Fluid hourly data
  const fluidHourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, amount: 0 }));
    fluids.forEach((f: FluidIntake) => {
      const hour = new Date(f.time).getHours();
      hours[hour].amount += f.amount;
    });
    return hours.slice(6, 22);
  }, [fluids]);

  // Nutrition totals - prefer API data over local store
  const nutritionTotals = useMemo(() => {
    // Use API data if available
    if (nutritionData?.totals) {
      return {
        sodium: nutritionData.totals.sodium || 0,
        potassium: nutritionData.totals.potassium || 0,
        phosphorus: nutritionData.totals.phosphorus || 0,
        protein: nutritionData.totals.protein || 0,
      };
    }

    // Fallback to local store
    const today = new Date().toDateString();
    const todayMeals = meals?.filter(m => new Date(m.time).toDateString() === today) || [];
    return todayMeals.reduce((acc, m) => ({
      sodium: acc.sodium + (m.nutrients?.sodium || 0),
      potassium: acc.potassium + (m.nutrients?.potassium || 0),
      phosphorus: acc.phosphorus + (m.nutrients?.phosphorus || 0),
      protein: acc.protein + (m.nutrients?.protein || 0),
    }), { sodium: 0, potassium: 0, phosphorus: 0, protein: 0 });
  }, [nutritionData, meals]);

  // Nutrition limits - use API data if available
  const nutritionLimits = useMemo(() => {
    if (nutritionData?.dailyLimits) {
      return nutritionData.dailyLimits;
    }
    return DAILY_LIMITS;
  }, [nutritionData]);

  // Total meals count today
  const todayMealCount = nutritionData?.totalMeals || 0;

  // Health Score calculation - prefer API data over local calculation
  const healthScore = useMemo(() => {
    // Use API health overview if available
    if (healthOverview?.score !== undefined) {
      return healthOverview.score;
    }

    // Fallback to client-side calculation
    let score = 92;
    const latestMood = moods[0]?.type || 'Good';

    // Fluid balance
    if (fluidPercentage > 100) score -= 15;
    else if (fluidPercentage > 90) score -= 5;

    // Mood factor
    if (latestMood === MoodType.UNWELL) score -= 10;

    // Weight deviation
    const weightDev = Math.abs(currentWeight - dryWeight);
    if (weightDev > 2) score -= 15;
    else if (weightDev > 1) score -= 8;

    // BP check
    if (latestBP) {
      if (latestBP.systolic > 140 || latestBP.diastolic > 90) score -= 10;
      else if (latestBP.systolic > 130 || latestBP.diastolic > 85) score -= 5;
    }

    return Math.max(Math.min(score, 100), 20);
  }, [healthOverview, fluidPercentage, moods, currentWeight, dryWeight, latestBP]);

  // Health status - prefer API data over local calculation
  const healthStatus = useMemo(() => {
    // Use API health overview if available
    if (healthOverview) {
      const statusMap: Record<string, { label: string; color: string }> = {
        excellent: { label: 'Excellent', color: 'emerald' },
        good: { label: 'Good', color: 'sky' },
        fair: { label: 'Fair', color: 'amber' },
        poor: { label: 'Needs Attention', color: 'rose' },
      };
      const status = statusMap[healthOverview.status] || statusMap.good;
      return { ...status, message: healthOverview.message };
    }

    // Fallback to local calculation
    if (healthScore >= 85) return { label: 'Excellent', color: 'emerald', message: 'You\'re doing great! Keep up the excellent work.' };
    if (healthScore >= 70) return { label: 'Good', color: 'sky', message: 'Looking good. Stay consistent with your routine.' };
    if (healthScore >= 55) return { label: 'Fair', color: 'amber', message: 'Some areas need attention. Review your logs.' };
    return { label: 'Needs Attention', color: 'rose', message: 'Please review your health metrics and consult your care team.' };
  }, [healthOverview, healthScore]);

  // Combine API alerts with local fallback alerts
  const displayAlerts = useMemo(() => {
    // If we have API alerts, use those
    if (apiAlerts.length > 0) {
      return apiAlerts.slice(0, 4).map(alert => ({
        id: alert._id,
        type: alert.severity === 'critical' || alert.severity === 'high' ? 'warning' as const :
              alert.severity === 'medium' ? 'info' as const : 'info' as const,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        category: alert.category,
        canDismiss: true,
      }));
    }

    // Fallback to local alerts if no API alerts
    const items: { id: string; type: 'warning' | 'info' | 'success'; severity?: string; title?: string; message: string; action?: string; canDismiss: boolean }[] = [];

    if (fluidPercentage > 95) {
      items.push({ id: 'fluid-limit', type: 'warning', message: 'Approaching daily fluid limit', action: 'View Hydration', canDismiss: false });
    }
    if (Math.abs(currentWeight - dryWeight) > 1.5) {
      items.push({ id: 'weight-range', type: 'warning', message: `Weight ${currentWeight > dryWeight ? 'above' : 'below'} target range`, action: 'View Weight', canDismiss: false });
    }
    if (sessionStats?.thisWeek === 0) {
      items.push({ id: 'no-sessions', type: 'info', message: 'No sessions logged this week', action: 'Log Session', canDismiss: false });
    }
    if (healthScore >= 85) {
      items.push({ id: 'health-good', type: 'success', message: 'Great job maintaining your health this week!', canDismiss: false });
    }

    return items.slice(0, 3);
  }, [apiAlerts, fluidPercentage, currentWeight, dryWeight, sessionStats, healthScore]);

  const handleQuickFluid = (amount: number) => {
    setActiveQuickAdd(amount);
    setTimeout(() => {
      addFluid({
        id: Date.now().toString(),
        time: new Date().toISOString(),
        amount,
        beverage: 'Water'
      });
      setActiveQuickAdd(null);
    }, 300);
  };

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // SVG chart path generation
  const weightChartPath = useMemo(() => {
    if (weightData.length < 2) return { line: '', area: '', points: [] };

    const width = 300;
    const height = 100;
    const padding = 10;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const weights = weightData.map(d => d.weight);
    const minW = Math.min(...weights) - 0.5;
    const maxW = Math.max(...weights) + 0.5;
    const range = maxW - minW || 1;
    const xStep = chartWidth / (weightData.length - 1);

    const points = weightData.map((d, i) => ({
      x: padding + i * xStep,
      y: padding + chartHeight - ((d.weight - minW) / range) * chartHeight,
      value: d.weight,
    }));

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const area = `${line} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

    return { line, area, points };
  }, [weightData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 relative mx-auto">
            <div className="absolute inset-0 border-4 border-sky-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-sky-500 rounded-full animate-spin" />
            <div className="absolute inset-4 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-full flex items-center justify-center">
              <ICONS.Activity className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-slate-400 font-medium">Loading your health data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-24 px-4 animate-in fade-in duration-700">
      <OnboardingModal />

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes wave {
          0% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-25%) translateY(-2px); }
          100% { transform: translateX(-50%) translateY(0); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(14, 165, 233, 0.3); }
          50% { box-shadow: 0 0 40px rgba(14, 165, 233, 0.5); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-pulse-soft { animation: pulse-soft 3s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .animate-wave { animation: wave 8s linear infinite; }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
        .glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); }
        .glass-light { background: rgba(255,255,255,0.8); backdrop-filter: blur(20px); }
        .dark .glass-light { background: rgba(30,41,59,0.8); }
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between pt-4">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{getGreeting()}</p>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {profile.name || 'Welcome back'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center hover:scale-105 transition-transform"
          >
            <span className="text-xl">👤</span>
          </Link>
        </div>
      </header>

      {/* Health Status Hero */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] opacity-30 bg-${healthStatus.color}-500`} />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/20 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
          {/* Health Score Ring */}
          <div className="relative">
            <div className="w-52 h-52 relative animate-glow rounded-full">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                {/* Background ring */}
                <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                {/* Progress ring */}
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke={`url(#healthGradient-${healthStatus.color})`}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${healthScore * 5.34} 534`}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id={`healthGradient-${healthStatus.color}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={healthStatus.color === 'emerald' ? '#10b981' : healthStatus.color === 'sky' ? '#0ea5e9' : healthStatus.color === 'amber' ? '#f59e0b' : '#f43f5e'} />
                    <stop offset="100%" stopColor={healthStatus.color === 'emerald' ? '#059669' : healthStatus.color === 'sky' ? '#0284c7' : healthStatus.color === 'amber' ? '#d97706' : '#e11d48'} />
                  </linearGradient>
                </defs>
              </svg>
              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="animate-float">
                  <span className="text-6xl font-black tabular-nums">{healthScore}</span>
                </div>
                <span className={`text-sm font-bold text-${healthStatus.color}-400 mt-1`}>{healthStatus.label}</span>
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
              Health Overview
            </h2>
            <p className="text-white/60 text-lg mb-6 max-w-md">
              {healthStatus.message}
            </p>

            {/* Quick Stats Pills */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                  <span className="text-xl">💧</span>
                </div>
                <div>
                  <p className="text-white/50 text-xs font-medium">Hydration</p>
                  <p className="text-white font-bold">{fluidPercentage}%</p>
                </div>
              </div>
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <span className="text-xl">⚖️</span>
                </div>
                <div>
                  <p className="text-white/50 text-xs font-medium">Weight</p>
                  <p className="text-white font-bold">{currentWeight} kg</p>
                </div>
              </div>
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                  <span className="text-xl">❤️</span>
                </div>
                <div>
                  <p className="text-white/50 text-xs font-medium">Sessions</p>
                  <p className="text-white font-bold">{sessionStats?.thisWeek || 0}/wk</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {displayAlerts.length > 0 && (
        <div className="space-y-3">
          {/* Alert counts badge */}
          {alertCounts && (alertCounts.critical > 0 || alertCounts.high > 0) && (
            <div className="flex items-center gap-2 mb-2">
              {alertCounts.critical > 0 && (
                <span className="px-3 py-1 bg-rose-500/10 text-rose-500 text-xs font-bold rounded-full">
                  {alertCounts.critical} Critical
                </span>
              )}
              {alertCounts.high > 0 && (
                <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-xs font-bold rounded-full">
                  {alertCounts.high} High Priority
                </span>
              )}
            </div>
          )}

          {displayAlerts.map((alert, i) => {
            const severityColors: Record<string, { bg: string; border: string; icon: string; text: string }> = {
              critical: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: 'bg-rose-500/20', text: 'text-rose-700 dark:text-rose-300' },
              high: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: 'bg-orange-500/20', text: 'text-orange-700 dark:text-orange-300' },
              medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300' },
              low: { bg: 'bg-sky-500/10', border: 'border-sky-500/20', icon: 'bg-sky-500/20', text: 'text-sky-700 dark:text-sky-300' },
              warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300' },
              success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300' },
              info: { bg: 'bg-sky-500/10', border: 'border-sky-500/20', icon: 'bg-sky-500/20', text: 'text-sky-700 dark:text-sky-300' },
            };

            const colorKey = alert.severity || alert.type;
            const colors = severityColors[colorKey] || severityColors.info;

            const getIcon = () => {
              if (alert.severity === 'critical') return '🚨';
              if (alert.severity === 'high') return '⚠️';
              if (alert.severity === 'medium') return '⚡';
              if (alert.type === 'warning') return '⚠️';
              if (alert.type === 'success') return '✨';
              return 'ℹ️';
            };

            return (
              <div
                key={alert.id}
                className={`rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top duration-500 ${colors.bg} border ${colors.border}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors.icon}`}>
                  <span className="text-xl">{getIcon()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {alert.title && (
                    <p className={`font-bold text-sm ${colors.text}`}>{alert.title}</p>
                  )}
                  <p className={`${alert.title ? 'text-sm opacity-80' : 'font-medium'} ${colors.text}`}>
                    {alert.message}
                  </p>
                </div>
                {alert.canDismiss && (
                  <button
                    onClick={() => handleDismissAlert(alert.id)}
                    disabled={isDismissing === alert.id}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors shrink-0"
                  >
                    {isDismissing === alert.id ? (
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    ) : (
                      <ICONS.X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming Reminders & Appointments */}
      {(upcomingReminders.length > 0 || upcomingAppointments.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reminders */}
          {upcomingReminders.length > 0 && (
            <div className="bg-white dark:bg-slate-800/50 glass-light rounded-[2rem] p-6 border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <ICONS.Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white">Upcoming Reminders</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Next 24 hours</p>
                  </div>
                </div>
                <Link to="/reminders" className="text-amber-500 text-sm font-bold hover:underline">View All</Link>
              </div>
              <div className="space-y-3">
                {upcomingReminders.slice(0, 4).map((reminder) => (
                  <div
                    key={reminder._id}
                    className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-2xl">{REMINDER_TYPE_ICONS[reminder.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{reminder.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatReminderTime(reminder.time)} • {getScheduleDescription(reminder)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appointments */}
          {upcomingAppointments.length > 0 && (
            <div className="bg-white dark:bg-slate-800/50 glass-light rounded-[2rem] p-6 border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center">
                    <ICONS.Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white">Upcoming Appointments</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Next 7 days</p>
                  </div>
                </div>
                <Link to="/appointments" className="text-sky-500 text-sm font-bold hover:underline">View All</Link>
              </div>
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 4).map((appointment) => (
                  <div
                    key={appointment._id}
                    className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-2xl">{APPOINTMENT_TYPE_ICONS[appointment.type] || '📅'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{appointment.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {getRelativeDate(appointment.date)} at {formatAppointmentTime(appointment.startTime)}
                      </p>
                      {appointment.location && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{appointment.location}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      appointment.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      appointment.status === 'scheduled' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' :
                      'bg-slate-100 dark:bg-slate-600 text-slate-500'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vitals Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blood Pressure */}
        <div className="bg-white dark:bg-slate-800/50 glass-light rounded-[1.5rem] p-5 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-rose-500/20">
              <ICONS.Activity className="w-6 h-6 text-white" />
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
              latestBP && (latestBP.systolic <= 120 && latestBP.diastolic <= 80)
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : latestBP && (latestBP.systolic <= 140 && latestBP.diastolic <= 90)
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}>
              {latestBP ? (latestBP.systolic <= 120 ? 'Normal' : 'Elevated') : 'No data'}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Blood Pressure</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
              {latestBP?.systolic || '--'}
            </span>
            <span className="text-slate-400 text-lg">/</span>
            <span className="text-xl font-bold text-slate-600 dark:text-slate-300 tabular-nums">
              {latestBP?.diastolic || '--'}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">mmHg</p>
        </div>

        {/* Heart Rate */}
        <div className="bg-white dark:bg-slate-800/50 glass-light rounded-[1.5rem] p-5 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 group-hover:animate-pulse transition-transform shadow-lg shadow-sky-500/20">
              <span className="text-xl">💓</span>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
              latestHR && latestHR >= 60 && latestHR <= 100
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}>
              {latestHR ? 'Normal' : 'No data'}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Heart Rate</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {latestHR || '--'}
          </p>
          <p className="text-slate-400 text-xs mt-1">bpm</p>
        </div>

        {/* Temperature */}
        <div className="bg-white dark:bg-slate-800/50 glass-light rounded-[1.5rem] p-5 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/20">
              <span className="text-xl">🌡️</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Normal
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Temperature</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {latestTemp}
          </p>
          <p className="text-slate-400 text-xs mt-1">°C</p>
        </div>

        {/* Oxygen */}
        <div className="bg-white dark:bg-slate-800/50 glass-light rounded-[1.5rem] p-5 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/20">
              <span className="text-xl">🫁</span>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
              latestO2 >= 95 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600'
            }`}>
              {latestO2 >= 95 ? 'Normal' : 'Low'}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Oxygen</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {latestO2}
          </p>
          <p className="text-slate-400 text-xs mt-1">% SpO2</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Hydration Card */}
        <div className="col-span-12 lg:col-span-5 bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 rounded-[2rem] p-6 relative overflow-hidden">
          {/* Wave Effect */}
          <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden">
            <svg className="absolute bottom-0 w-[200%] animate-wave" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.1)" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Today's Hydration</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black text-white tabular-nums">{todayFluid}</span>
                  <span className="text-white/60 font-medium">/ {dailyFluidLimit} ml</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-black tabular-nums ${
                  fluidPercentage >= 100 ? 'text-rose-200' : 'text-white'
                }`}>
                  {fluidPercentage}%
                </div>
                <p className="text-white/60 text-sm">{fluidRemaining} ml left</p>
              </div>
            </div>

            {/* Progress Ring */}
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="white"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${fluidPercentage * 3.14} 314`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl">💧</span>
                </div>
              </div>
            </div>

            {/* Hourly Mini Chart */}
            <div className="flex items-end justify-between gap-1 h-12 mb-6 px-2">
              {fluidHourlyData.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-white/30 rounded-t transition-all hover:bg-white/50"
                    style={{ height: `${Math.max(4, (h.amount / 500) * 40)}px` }}
                  />
                </div>
              ))}
            </div>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-5 gap-2">
              {[100, 150, 200, 250, 500].map(v => (
                <button
                  key={v}
                  onClick={() => handleQuickFluid(v)}
                  disabled={activeQuickAdd !== null}
                  className={`py-3 bg-white/20 backdrop-blur rounded-xl text-white font-bold text-sm hover:bg-white/30 active:scale-95 transition-all ${
                    activeQuickAdd === v ? 'bg-white/40 scale-95' : ''
                  }`}
                >
                  +{v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Weight & Session Column */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* Weight Card */}
          <div className="bg-white dark:bg-slate-800/50 glass-light rounded-[2rem] p-6 border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Weight Trend</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Last 7 days</p>
              </div>
              <Link to="/weight" className="text-purple-500 text-sm font-bold hover:underline">View All</Link>
            </div>

            <div className="flex items-center gap-8 mb-4">
              <div>
                <p className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">{currentWeight}</p>
                <p className="text-slate-400 text-sm">kg current</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  weightChange <= 0 ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                }`}>
                  <svg className={`w-5 h-5 ${weightChange <= 0 ? 'text-emerald-500' : 'text-amber-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d={weightChange <= 0 ? 'M19 14l-7 7m0 0l-7-7m7 7V3' : 'M5 10l7-7m0 0l7 7m-7-7v18'} />
                  </svg>
                </div>
                <div>
                  <p className={`font-bold ${weightChange <= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                  </p>
                  <p className="text-slate-400 text-xs">vs last</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <span className="text-lg">🎯</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{dryWeight} kg</p>
                  <p className="text-slate-400 text-xs">target</p>
                </div>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="h-28">
              <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="weightGradientDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={weightChartPath.area} fill="url(#weightGradientDash)" />
                <path d={weightChartPath.line} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
                {weightChartPath.points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="4" fill="#8b5cf6" stroke="white" strokeWidth="2" />
                ))}
              </svg>
            </div>
          </div>

          {/* Session Insights */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/20 rounded-full blur-[60px]" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">🩺</span>
                </div>
                <div>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Dialysis Sessions</p>
                  <p className="text-2xl font-black">{sessionStats?.totalCompleted || 0} Total</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'This Week', value: sessionStats?.thisWeek || 0, unit: 'sessions', icon: '📅' },
                  { label: 'This Month', value: sessionStats?.thisMonth || 0, unit: 'sessions', icon: '📆' },
                  { label: 'Avg Duration', value: sessionStats?.averageDuration ? `${Math.floor(sessionStats.averageDuration / 60)}h ${sessionStats.averageDuration % 60}m` : '--', icon: '⏱️' },
                  { label: 'Avg UF', value: sessionStats?.averageUf ? `${(sessionStats.averageUf / 1000).toFixed(1)}L` : '--', icon: '💧' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 backdrop-blur rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{stat.icon}</span>
                      <span className="text-white/50 text-xs font-medium">{stat.label}</span>
                    </div>
                    <p className="text-xl font-black">
                      {typeof stat.value === 'number' ? stat.value : stat.value}
                      {stat.unit && <span className="text-sm text-white/50 ml-1">{stat.unit}</span>}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                to="/sessions"
                className="mt-6 w-full py-3.5 bg-white/10 backdrop-blur rounded-xl font-bold text-center block hover:bg-white/20 transition-all"
              >
                View All Sessions
              </Link>
            </div>
          </div>
        </div>

        {/* Nutrition Summary */}
        <div className="col-span-12 bg-white dark:bg-slate-800/50 glass-light rounded-[2rem] p-6 border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-xl">🥗</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Today's Nutrition</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {todayMealCount > 0 ? `${todayMealCount} meal${todayMealCount > 1 ? 's' : ''} logged` : 'No meals logged yet'}
                </p>
              </div>
            </div>
            <Link to="/nutri-scan" className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors flex items-center gap-2">
              <span>+</span> Scan Food
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Sodium', value: nutritionTotals.sodium, limit: nutritionLimits.sodium, unit: 'mg', color: 'sky', icon: '🧂' },
              { label: 'Potassium', value: nutritionTotals.potassium, limit: nutritionLimits.potassium, unit: 'mg', color: 'orange', icon: '🍌' },
              { label: 'Phosphorus', value: nutritionTotals.phosphorus, limit: nutritionLimits.phosphorus, unit: 'mg', color: 'purple', icon: '🥩' },
              { label: 'Protein', value: nutritionTotals.protein, limit: nutritionLimits.protein, unit: 'g', color: 'emerald', icon: '🥚' },
            ].map((n, i) => {
              const percent = Math.min((n.value / n.limit) * 100, 100);
              const isOverLimit = n.value > n.limit;
              const isWarning = percent >= 80 && percent < 100;
              return (
                <div key={i} className={`bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-4 hover:shadow-lg transition-shadow ${isOverLimit ? 'ring-2 ring-rose-500/50' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{n.icon}</span>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{n.label}</span>
                    </div>
                    {isOverLimit && (
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[10px] font-bold rounded-full">OVER</span>
                    )}
                    {isWarning && !isOverLimit && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full">HIGH</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-2xl font-black tabular-nums ${isOverLimit ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                      {Math.round(n.value)}
                    </span>
                    <span className="text-slate-400 text-sm">/ {n.limit}{n.unit}</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isOverLimit ? 'bg-rose-500' :
                        isWarning ? 'bg-amber-500' :
                        n.color === 'sky' ? 'bg-sky-500' :
                        n.color === 'orange' ? 'bg-orange-500' :
                        n.color === 'purple' ? 'bg-purple-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 text-right">{Math.round(percent)}% of daily limit</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { to: '/fluid', icon: '💧', label: 'Fluid Log', desc: 'Track hydration', gradient: 'from-sky-500 to-cyan-500' },
            { to: '/weight', icon: '⚖️', label: 'Weight', desc: 'Log weight', gradient: 'from-purple-500 to-violet-500' },
            { to: '/vitals', icon: '❤️', label: 'Vitals', desc: 'BP & pulse', gradient: 'from-rose-500 to-pink-500' },
            { to: '/symptoms', icon: '🩺', label: 'Symptoms', desc: 'Track how you feel', gradient: 'from-amber-500 to-orange-500' },
          ].map((item, i) => (
            <Link
              key={i}
              to={item.to}
              className={`bg-gradient-to-br ${item.gradient} text-white rounded-2xl p-6 hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group`}
            >
              <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform">{item.icon}</span>
              <p className="font-bold text-lg">{item.label}</p>
              <p className="text-white/70 text-sm">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
