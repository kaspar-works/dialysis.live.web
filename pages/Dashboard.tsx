import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { useSettings } from '../contexts/SettingsContext';
import { ICONS } from '../constants';
import { Link } from 'react-router';
import OnboardingModal from '../components/OnboardingModal';
import { getDashboard, getHealthOverview, getAchievements, DashboardStats, HealthOverview, AchievementsResponse } from '../services/dashboard';
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
import { createFluidLog, getTodayFluidIntake, FluidLog } from '../services/fluid';
import { getActiveAnnouncements, PublicAnnouncement } from '../services/admin';
import { getLatestResults, LatestResult } from '../services/labReports';
import DryWeightTracker from '../components/DryWeightTracker';

const Dashboard: React.FC = () => {
  const { profile, addFluid } = useStore();
  const { weightUnit, fluidUnit, displayWeight, displayFluid, formatWeight, formatFluid, convertWeightFromKg, convertFluidFromMl, displayWeekday, displayTime, timezone } = useSettings();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [healthOverview, setHealthOverview] = useState<HealthOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeQuickAdd, setActiveQuickAdd] = useState<number | null>(null);
  const [apiAlerts, setApiAlerts] = useState<Alert[]>([]);
  const [alertCounts, setAlertCounts] = useState<AlertCounts | null>(null);
  const [hasUrgentAlerts, setHasUrgentAlerts] = useState(false);
  const [hasAlertsFetched, setHasAlertsFetched] = useState(false);
  const [isDismissing, setIsDismissing] = useState<string | null>(null);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [nutritionData, setNutritionData] = useState<TodayMealsResponse | null>(null);
  const [recentFluidLogs, setRecentFluidLogs] = useState<FluidLog[]>([]);
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [achievementsData, setAchievementsData] = useState<AchievementsResponse | null>(null);
  const [latestLabResults, setLatestLabResults] = useState<LatestResult[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>(() => {
    const saved = localStorage.getItem('dismissedAnnouncements');
    return saved ? JSON.parse(saved) : [];
  });
  const hasFetched = useRef(false);

  // Function to fetch/refresh alerts - can be called anytime
  const fetchAlerts = async () => {
    try {
      const alertsData = await getDashboardAlerts();
      if (alertsData) {
        setApiAlerts(alertsData.alerts);
        setAlertCounts(alertsData.counts);
        setHasUrgentAlerts(alertsData.hasUrgent);
        setHasAlertsFetched(true);
      }
    } catch (err) {
      // Silently fail for alert refresh
    }
  };

  // Fetch dashboard data on initial mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchDashboard = async () => {
      try {
        const [dashData, alertsData, healthData, remindersData, appointmentsData, nutriData, fluidData, achieveData, labResults] = await Promise.all([
          getDashboard(30),
          getDashboardAlerts().catch(() => null),
          getHealthOverview().catch(() => null),
          getUpcomingReminders(24).catch(() => []),
          getUpcomingAppointments(7).catch(() => []),
          getTodayMeals().catch(() => null),
          getTodayFluidIntake(timezone).catch(() => null),
          getAchievements().catch(() => null),
          getLatestResults().catch(() => []),
        ]);

        setDashboardData(dashData);

        if (healthData) {
          setHealthOverview(healthData);
        }

        if (alertsData) {
          setApiAlerts(alertsData.alerts);
          setAlertCounts(alertsData.counts);
          setHasUrgentAlerts(alertsData.hasUrgent);
          setHasAlertsFetched(true);
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

        if (fluidData?.logs) {
          setRecentFluidLogs(fluidData.logs);
        }

        if (achieveData) {
          setAchievementsData(achieveData);
        }

        if (labResults) {
          setLatestLabResults(labResults);
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

  // Fetch system announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await getActiveAnnouncements();
        if (data?.announcements) {
          setAnnouncements(data.announcements);
        }
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      }
    };
    fetchAnnouncements();
  }, []);

  // Handle announcement dismissal
  const handleDismissAnnouncement = (announcementId: string) => {
    const newDismissed = [...dismissedAnnouncements, announcementId];
    setDismissedAnnouncements(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
  };

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements.filter(a => !dismissedAnnouncements.includes(a.id));

  // Refresh alerts when page becomes visible (user returns to tab/page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasFetched.current) {
        fetchAlerts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Refresh alerts periodically (every 60 seconds) when dashboard is visible
  useEffect(() => {
    if (!hasFetched.current) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAlerts();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Refresh alerts when window gains focus (user navigates back from another page)
  useEffect(() => {
    const handleFocus = () => {
      if (hasFetched.current) {
        fetchAlerts();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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
  const currentWeight = dashboardData?.weight?.current ?? null;
  const dryWeight = dashboardData?.weight?.dryWeight ?? null;
  const weightTrend = dashboardData?.weight?.trend || 'stable';

  const weightChange = useMemo(() => {
    if (dashboardData?.weight?.history && dashboardData.weight.history.length >= 2) {
      const recent = dashboardData.weight.history[0]?.weight;
      const prev = dashboardData.weight.history[1]?.weight;
      if (recent && prev) return recent - prev;
    }
    return 0;
  }, [dashboardData]);

  // Fluid data - use ?? to handle 0 as valid value, only fallback on null/undefined
  const todayFluid = dashboardData?.fluid?.todayTotal ?? 0;
  const dailyFluidLimit = dashboardData?.fluid?.dailyLimit ?? 0;
  const fluidPercentage = dailyFluidLimit > 0 ? Math.min(Math.round((todayFluid / dailyFluidLimit) * 100), 100) : 0;
  const fluidRemaining = dailyFluidLimit > 0 ? Math.max(dailyFluidLimit - todayFluid, 0) : 0;

  // Vitals - API only
  const latestBP = useMemo(() => {
    if (dashboardData?.vitals?.latestBp) {
      return { systolic: dashboardData.vitals.latestBp.systolic, diastolic: dashboardData.vitals.latestBp.diastolic };
    }
    return null;
  }, [dashboardData]);

  const latestHR = useMemo(() => {
    return dashboardData?.vitals?.latestHeartRate?.value ?? null;
  }, [dashboardData]);

  const latestTemp = useMemo(() => {
    return dashboardData?.vitals?.latestTemp?.value ?? null;
  }, [dashboardData]);

  const latestO2 = useMemo(() => {
    return dashboardData?.vitals?.latestSpo2?.value ?? null;
  }, [dashboardData]);

  // Session stats
  const sessionStats = dashboardData?.sessions;

  // Chart data - Weight (7 days) - only from API
  const weightData = useMemo(() => {
    if (dashboardData?.weight?.history && dashboardData.weight.history.length > 0) {
      return dashboardData.weight.history.slice(0, 7).reverse().map(w => ({
        date: displayWeekday(w.date),
        weight: w.weight,
        goal: dryWeight ?? 0
      }));
    }
    // Return empty array if no API data (no fallback to fake data)
    return [];
  }, [dashboardData, dryWeight]);

  // Fluid hourly data - only show if there's actual fluid data from API
  const fluidHourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, amount: 0 }));
    // Only populate if we have fluid data from API
    if (todayFluid > 0 && dashboardData?.fluid?.history) {
      dashboardData.fluid.history.forEach((entry: { date: string; total: number }) => {
        const hour = new Date(entry.date).getHours();
        if (hour >= 0 && hour < 24) {
          hours[hour].amount += entry.total;
        }
      });
    }
    return hours.slice(6, 22);
  }, [todayFluid, dashboardData]);

  // Nutrition totals - prefer API data over local store
  const nutritionTotals = useMemo(() => {
    // Use API data only
    if (nutritionData?.totals) {
      return {
        sodium: nutritionData.totals.sodium || 0,
        potassium: nutritionData.totals.potassium || 0,
        phosphorus: nutritionData.totals.phosphorus || 0,
        protein: nutritionData.totals.protein || 0,
      };
    }
    // No fallback - return zeros if no API data
    return { sodium: 0, potassium: 0, phosphorus: 0, protein: 0 };
  }, [nutritionData]);

  // Nutrition limits - API only, fallback to default limits constant
  const nutritionLimits = useMemo(() => {
    return nutritionData?.dailyLimits || DAILY_LIMITS;
  }, [nutritionData]);

  // Total meals count today
  const todayMealCount = nutritionData?.totalMeals || 0;

  // Health Score calculation - API only
  const healthScore = useMemo((): number | null => {
    // Use API health overview if available
    if (healthOverview?.score !== undefined) {
      return healthOverview.score;
    }

    // Check if we have enough data to calculate a score
    const hasWeightData = currentWeight !== null;
    const hasFluidData = dailyFluidLimit > 0;
    const hasVitalData = latestBP !== null;
    const hasAnyData = hasWeightData || hasFluidData || hasVitalData;

    // If no data at all, return null (will show "No Data")
    if (!hasAnyData) {
      return null;
    }

    // Fallback to client-side calculation based on API data only
    let score = 92;

    // Fluid balance (only if limit is set)
    if (dailyFluidLimit > 0) {
      if (fluidPercentage > 100) score -= 15;
      else if (fluidPercentage > 90) score -= 5;
    }

    // Weight deviation (only if both weights exist)
    if (currentWeight !== null && dryWeight !== null) {
      const weightDev = Math.abs(currentWeight - dryWeight);
      if (weightDev > 2) score -= 15;
      else if (weightDev > 1) score -= 8;
    }

    // BP check
    if (latestBP) {
      if (latestBP.systolic > 140 || latestBP.diastolic > 90) score -= 10;
      else if (latestBP.systolic > 130 || latestBP.diastolic > 85) score -= 5;
    }

    return Math.max(Math.min(score, 100), 20);
  }, [healthOverview, fluidPercentage, dailyFluidLimit, currentWeight, dryWeight, latestBP]);

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

    // No data available
    if (healthScore === null) {
      return { label: 'No Data', color: 'slate', message: 'Start logging your health data to see your score.' };
    }

    // Fallback to local calculation
    if (healthScore >= 85) return { label: 'Excellent', color: 'emerald', message: 'You\'re doing great! Keep up the excellent work.' };
    if (healthScore >= 70) return { label: 'Good', color: 'sky', message: 'Looking good. Stay consistent with your routine.' };
    if (healthScore >= 55) return { label: 'Fair', color: 'amber', message: 'Some areas need attention. Review your logs.' };
    return { label: 'Needs Attention', color: 'rose', message: 'Please review your health metrics and consult your care team.' };
  }, [healthOverview, healthScore]);

  // Latest potassium lab result
  const latestPotassium = useMemo(() => {
    return latestLabResults.find(r => r.testCode === 'POTASSIUM') ?? null;
  }, [latestLabResults]);

  // Potassium risk level
  const potassiumRisk = useMemo(() => {
    const intake = nutritionTotals.potassium;
    const limit = nutritionLimits.potassium || 2500;
    const dietRatio = limit > 0 ? intake / limit : 0;
    const labValue = latestPotassium?.latestValue ?? null;
    const hasHighPotassiumSymptoms = dashboardData?.symptoms?.recentSymptoms?.some(
      s => ['numbness', 'weakness', 'palpitations', 'muscle_weakness', 'tingling'].includes(s.symptomType?.toLowerCase() ?? '')
    ) ?? false;

    // High: over limit AND (lab > 5.5 OR relevant symptoms)
    if (dietRatio > 1 && (labValue !== null && labValue > 5.5 || hasHighPotassiumSymptoms)) return 'high';
    // Elevated: diet > 90% OR lab > 5.5
    if (dietRatio > 0.9 || (labValue !== null && labValue > 5.5)) return 'elevated';
    // Moderate: diet 60-90% OR lab 5.0-5.5
    if (dietRatio > 0.6 || (labValue !== null && labValue >= 5.0 && labValue <= 5.5)) return 'moderate';
    // Low: diet < 60% AND (no lab or lab 3.5-5.0)
    return 'low';
  }, [nutritionTotals.potassium, nutritionLimits.potassium, latestPotassium, dashboardData?.symptoms]);

  // Display alerts from API only (no local fallback)
  const displayAlerts = useMemo(() => {
    // If we've fetched from API, use API alerts only (even if empty)
    if (hasAlertsFetched) {
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

    // Return empty while loading (no local fallback alerts)
    return [];
  }, [hasAlertsFetched, apiAlerts]);

  const handleQuickFluid = async (amount: number) => {
    setActiveQuickAdd(amount);
    try {
      // Call API to save fluid log
      await createFluidLog({ amountMl: amount, source: 'water' });

      // Update local store for immediate UI feedback
      addFluid({
        id: Date.now().toString(),
        time: new Date().toISOString(),
        amount,
        beverage: 'Water'
      });

      // Refresh dashboard data and fluid logs to get updated totals
      const [data, fluidData] = await Promise.all([
        getDashboard(),
        getTodayFluidIntake(timezone),
      ]);
      setDashboardData(data);
      if (fluidData?.logs) {
        setRecentFluidLogs(fluidData.logs);
      }
    } catch (err) {
      console.error('Failed to add fluid:', err);
    } finally {
      setActiveQuickAdd(null);
    }
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

  // Weekly Trend Sparkline Data
  const bpSparkline = useMemo(() => {
    const history = dashboardData?.vitals?.history;
    if (!history) return [];
    return history
      .filter(v => v.type === 'blood_pressure')
      .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime())
      .slice(-7)
      .map(v => v.value1);
  }, [dashboardData]);

  const weightSparkline = useMemo(() => {
    return weightData.map(d => d.weight);
  }, [weightData]);

  const sessionSparkline = useMemo(() => {
    const sessions = dashboardData?.sessions?.recentSessions;
    if (!sessions || sessions.length === 0) return [];
    const now = new Date();
    const days: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const count = sessions.filter(s => s.startedAt.slice(0, 10) === dayStr).length;
      days.push(count);
    }
    return days;
  }, [dashboardData]);

  const fluidSparkline = useMemo(() => {
    const history = dashboardData?.fluid?.history;
    if (!history || history.length === 0) return [];
    return history
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7)
      .map(h => h.total);
  }, [dashboardData]);

  // Sparkline SVG path generator
  const makeSparkline = (values: number[], color: string, asBars?: boolean) => {
    if (values.length < 2 && !asBars) return null;
    if (values.length === 0) return null;
    const w = 120, h = 48, pad = 4;
    const cw = w - pad * 2, ch = h - pad * 2;

    if (asBars) {
      const barW = cw / values.length - 2;
      const maxV = Math.max(...values, 1);
      const bars = values.map((v, i) => {
        const barH = Math.max((v / maxV) * ch, 2);
        const x = pad + i * (cw / values.length) + 1;
        const y = pad + ch - barH;
        return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="2" fill="${color}" opacity="${i === values.length - 1 ? 1 : 0.5}" />`;
      });
      return { svg: bars.join(''), type: 'bars' as const };
    }

    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;
    const xStep = cw / (values.length - 1);
    const pts = values.map((v, i) => ({
      x: pad + i * xStep,
      y: pad + ch - ((v - minV) / range) * ch,
    }));
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${h - pad} L ${pad} ${h - pad} Z`;
    return { line, area, type: 'line' as const };
  };

  // Trend direction helpers
  const getTrend = (values: number[]): 'up' | 'down' | 'stable' => {
    if (values.length < 2) return 'stable';
    const last = values[values.length - 1];
    const prev = values[values.length - 2];
    const diff = last - prev;
    const pct = Math.abs(diff) / (prev || 1);
    if (pct < 0.02) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const trendIcon = (dir: 'up' | 'down' | 'stable') =>
    dir === 'up' ? '↑' : dir === 'down' ? '↓' : '→';
  const trendColor = (dir: 'up' | 'down' | 'stable', invert?: boolean) => {
    if (dir === 'stable') return 'text-slate-500 bg-slate-100 dark:bg-slate-700/50';
    const good = invert ? dir === 'down' : dir === 'up';
    return good
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
      : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10';
  };

  // Build sparkline cards data
  const sparklineCards = useMemo(() => {
    const cards: Array<{
      key: string;
      label: string;
      color: string;
      gradientFrom: string;
      gradientTo: string;
      values: number[];
      asBars?: boolean;
      currentDisplay: string;
      unit: string;
      trend: 'up' | 'down' | 'stable';
      invertTrend?: boolean;
    }> = [];

    if (bpSparkline.length >= 2) {
      const bpTrend = getTrend(bpSparkline);
      cards.push({
        key: 'bp',
        label: 'Blood Pressure',
        color: '#f43f5e',
        gradientFrom: 'from-rose-500',
        gradientTo: 'to-pink-500',
        values: bpSparkline,
        currentDisplay: latestBP ? `${latestBP.systolic}/${latestBP.diastolic}` : '--',
        unit: 'mmHg',
        trend: bpTrend,
        invertTrend: true,
      });
    }

    if (weightSparkline.length >= 2) {
      cards.push({
        key: 'weight',
        label: 'Weight',
        color: '#8b5cf6',
        gradientFrom: 'from-violet-500',
        gradientTo: 'to-purple-500',
        values: weightSparkline,
        currentDisplay: currentWeight !== null ? formatWeight(currentWeight) : '--',
        unit: weightUnit,
        trend: weightTrend as 'up' | 'down' | 'stable',
      });
    }

    if (sessionSparkline.some(v => v > 0)) {
      const thisWeekCount = sessionStats?.thisWeek ?? 0;
      cards.push({
        key: 'sessions',
        label: 'Sessions',
        color: '#10b981',
        gradientFrom: 'from-emerald-500',
        gradientTo: 'to-teal-500',
        values: sessionSparkline,
        asBars: true,
        currentDisplay: `${thisWeekCount}`,
        unit: '/wk',
        trend: getTrend(sessionSparkline),
      });
    }

    if (fluidSparkline.length >= 2) {
      const avg = fluidSparkline.reduce((a, b) => a + b, 0) / fluidSparkline.length;
      const todayVal = fluidSparkline[fluidSparkline.length - 1];
      const fluidTrend: 'up' | 'down' | 'stable' = todayVal > avg * 1.1 ? 'up' : todayVal < avg * 0.9 ? 'down' : 'stable';
      cards.push({
        key: 'hydration',
        label: 'Hydration',
        color: '#0ea5e9',
        gradientFrom: 'from-sky-500',
        gradientTo: 'to-cyan-500',
        values: fluidSparkline,
        currentDisplay: dailyFluidLimit > 0 ? `${fluidPercentage}` : formatFluid(todayFluid),
        unit: dailyFluidLimit > 0 ? '%' : fluidUnit,
        trend: fluidTrend,
        invertTrend: true,
      });
    }

    return cards;
  }, [bpSparkline, weightSparkline, sessionSparkline, fluidSparkline, latestBP, currentWeight, formatWeight, weightUnit, weightTrend, sessionStats, dailyFluidLimit, fluidPercentage, todayFluid, formatFluid, fluidUnit]);

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

      {/* System Announcements */}
      {visibleAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className={`relative overflow-hidden rounded-2xl p-4 ${
            announcement.type === 'info'
              ? 'bg-gradient-to-r from-sky-500/10 to-cyan-500/10 border border-sky-500/20'
              : announcement.type === 'warning'
              ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20'
              : announcement.type === 'error'
              ? 'bg-gradient-to-r from-rose-500/10 to-red-500/10 border border-rose-500/20'
              : 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                announcement.type === 'info'
                  ? 'bg-sky-500/20'
                  : announcement.type === 'warning'
                  ? 'bg-amber-500/20'
                  : announcement.type === 'error'
                  ? 'bg-rose-500/20'
                  : 'bg-emerald-500/20'
              }`}
            >
              <span className="text-xl">
                {announcement.type === 'info' ? '🔧' : announcement.type === 'warning' ? '⚠️' : announcement.type === 'error' ? '❌' : '✅'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className={`font-bold text-sm ${
                  announcement.type === 'info'
                    ? 'text-sky-700 dark:text-sky-400'
                    : announcement.type === 'warning'
                    ? 'text-amber-700 dark:text-amber-400'
                    : announcement.type === 'error'
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {announcement.title}
              </h3>
              <p
                className={`text-sm mt-1 ${
                  announcement.type === 'info'
                    ? 'text-sky-600 dark:text-sky-500'
                    : announcement.type === 'warning'
                    ? 'text-amber-600 dark:text-amber-500'
                    : announcement.type === 'error'
                    ? 'text-rose-600 dark:text-rose-500'
                    : 'text-emerald-600 dark:text-emerald-500'
                }`}
              >
                {announcement.message}
              </p>
              {announcement.linkUrl && (
                <a
                  href={announcement.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-sm font-medium mt-2 hover:underline ${
                    announcement.type === 'info'
                      ? 'text-sky-700 dark:text-sky-400'
                      : announcement.type === 'warning'
                      ? 'text-amber-700 dark:text-amber-400'
                      : announcement.type === 'error'
                      ? 'text-rose-700 dark:text-rose-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {announcement.linkText || 'Learn more'} →
                </a>
              )}
            </div>
            {announcement.dismissible && (
              <button
                onClick={() => handleDismissAnnouncement(announcement.id)}
                className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
                  announcement.type === 'info'
                    ? 'text-sky-500 hover:bg-sky-500/10'
                    : announcement.type === 'warning'
                    ? 'text-amber-500 hover:bg-amber-500/10'
                    : announcement.type === 'error'
                    ? 'text-rose-500 hover:bg-rose-500/10'
                    : 'text-emerald-500 hover:bg-emerald-500/10'
                }`}
              >
                <ICONS.X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}

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
      <header className="flex items-center justify-between pt-2 sm:pt-4">
        <div className="min-w-0 flex-1">
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">{getGreeting()}</p>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">
            {profile.name || 'Welcome back'}
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 ml-3">
          {/* Alert Bell Icon */}
          <Link
            to="/alerts"
            className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <ICONS.Bell className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-300" />
            {alertCounts && (alertCounts.critical + alertCounts.high + alertCounts.medium + alertCounts.low) > 0 && (
              <span className={`absolute -top-1 -right-1 min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-5 px-1 sm:px-1.5 rounded-full text-[9px] sm:text-[10px] font-bold text-white flex items-center justify-center ${
                hasUrgentAlerts ? 'bg-rose-500 animate-pulse' : 'bg-sky-500'
              }`}>
                {alertCounts.critical + alertCounts.high + alertCounts.medium + alertCounts.low}
              </span>
            )}
          </Link>
          <Link
            to="/profile"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <span className="text-lg sm:text-xl">👤</span>
          </Link>
        </div>
      </header>

      {/* Health Status Hero */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] p-5 sm:p-6 md:p-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-0 right-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 rounded-full blur-[60px] sm:blur-[80px] md:blur-[100px] opacity-30 bg-${healthStatus.color}-500`} />
          <div className="absolute bottom-0 left-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-sky-500/20 rounded-full blur-[40px] sm:blur-[60px] md:blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-5 sm:gap-6 md:gap-8">
          {/* Health Score Ring */}
          <div className="relative">
            <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 relative animate-glow rounded-full">
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
                  strokeDasharray={`${(healthScore ?? 0) * 5.34} 534`}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id={`healthGradient-${healthStatus.color}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={healthStatus.color === 'emerald' ? '#10b981' : healthStatus.color === 'sky' ? '#0ea5e9' : healthStatus.color === 'amber' ? '#f59e0b' : healthStatus.color === 'slate' ? '#64748b' : '#f43f5e'} />
                    <stop offset="100%" stopColor={healthStatus.color === 'emerald' ? '#059669' : healthStatus.color === 'sky' ? '#0284c7' : healthStatus.color === 'amber' ? '#d97706' : healthStatus.color === 'slate' ? '#475569' : '#e11d48'} />
                  </linearGradient>
                </defs>
              </svg>
              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="animate-float">
                  <span className="text-4xl sm:text-5xl md:text-6xl font-black tabular-nums">{healthScore ?? '--'}</span>
                </div>
                <span className={`text-xs sm:text-sm font-bold text-${healthStatus.color}-400 mt-1`}>{healthStatus.label}</span>
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-2 sm:mb-3">
              Health Overview
            </h2>
            <p className="text-white/60 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 max-w-md mx-auto lg:mx-0">
              {healthStatus.message}
            </p>

            {/* Quick Stats Pills */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              <div className="glass rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-sky-500/20 flex items-center justify-center">
                  <span className="text-base sm:text-xl">💧</span>
                </div>
                <div>
                  <p className="text-white/50 text-[10px] sm:text-xs font-medium">Hydration</p>
                  <p className="text-white font-bold text-sm sm:text-base">
                    {dailyFluidLimit > 0 ? `${fluidPercentage}%` : todayFluid > 0 ? displayFluid(todayFluid) : '--'}
                  </p>
                </div>
              </div>
              <div className="glass rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <span className="text-base sm:text-xl">⚖️</span>
                </div>
                <div>
                  <p className="text-white/50 text-[10px] sm:text-xs font-medium">Weight</p>
                  <p className="text-white font-bold text-sm sm:text-base">{currentWeight !== null ? displayWeight(currentWeight) : '--'}</p>
                </div>
              </div>
              <div className="glass rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-rose-500/20 flex items-center justify-center">
                  <span className="text-base sm:text-xl">❤️</span>
                </div>
                <div>
                  <p className="text-white/50 text-[10px] sm:text-xs font-medium">Sessions</p>
                  <p className="text-white font-bold text-sm sm:text-base">{sessionStats?.thisWeek || 0}/wk</p>
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
              if ((alert.type as string) === 'warning') return '⚠️';
              if ((alert.type as string) === 'success') return '✨';
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

      {/* Dialysis Intelligence */}
      {(currentWeight !== null && dryWeight !== null) || nutritionTotals.potassium > 0 || latestPotassium ? (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <span className="text-lg">🧠</span>
            </div>
            <div>
              <h2 className="font-black text-slate-900 dark:text-white text-lg">Dialysis Intelligence</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Clinical insights from your data</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fluid Retention Tracker */}
            {currentWeight !== null && dryWeight !== null && (
              <div>
                <DryWeightTracker
                  currentWeight={currentWeight}
                  dryWeight={dryWeight}
                  previousWeight={dashboardData?.weight?.history?.[1]?.weight}
                  trend={weightTrend as 'up' | 'down' | 'stable'}
                />
                {currentWeight - dryWeight > 2.5 && (
                  <div className="mt-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🚨</span>
                      <div>
                        <p className="font-bold text-rose-700 dark:text-rose-300 text-sm">Critical Fluid Overload</p>
                        <p className="text-rose-600 dark:text-rose-400 text-sm mt-1">
                          You are {(currentWeight - dryWeight).toFixed(1)}kg above your dry weight. Contact your dialysis team about increasing ultrafiltration or adjusting your fluid restriction.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Potassium Risk Monitor */}
            {(nutritionTotals.potassium > 0 || latestPotassium) && (
              <div className="bg-white dark:bg-slate-800/50 glass-light rounded-[2rem] p-6 border border-slate-200/50 dark:border-slate-700/50">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      potassiumRisk === 'high' ? 'bg-rose-500/10' :
                      potassiumRisk === 'elevated' ? 'bg-orange-500/10' :
                      potassiumRisk === 'moderate' ? 'bg-amber-500/10' : 'bg-emerald-500/10'
                    }`}>
                      <span className="text-2xl">🍌</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Potassium Risk</h3>
                      <p className="text-slate-400 text-sm">Electrolyte monitoring</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                    potassiumRisk === 'high' ? 'bg-rose-500/10 text-rose-500' :
                    potassiumRisk === 'elevated' ? 'bg-orange-500/10 text-orange-500' :
                    potassiumRisk === 'moderate' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {potassiumRisk === 'high' ? '⚠️ High' :
                     potassiumRisk === 'elevated' ? '🔼 Elevated' :
                     potassiumRisk === 'moderate' ? '📊 Moderate' : '✓ Low'}
                  </span>
                </div>

                {/* Diet intake */}
                {nutritionTotals.potassium > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Diet Intake</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                        {Math.round(nutritionTotals.potassium)} / {nutritionLimits.potassium || 2500} mg
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          nutritionTotals.potassium / (nutritionLimits.potassium || 2500) > 0.9 ? 'bg-rose-500' :
                          nutritionTotals.potassium / (nutritionLimits.potassium || 2500) > 0.6 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (nutritionTotals.potassium / (nutritionLimits.potassium || 2500)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Lab value */}
                <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🔬</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">Latest Lab</span>
                    </div>
                    {latestPotassium ? (
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-black tabular-nums ${
                          latestPotassium.latestValue > 5.5 ? 'text-rose-500' :
                          latestPotassium.latestValue >= 5.0 ? 'text-amber-500' :
                          latestPotassium.latestValue < 3.5 ? 'text-sky-500' : 'text-emerald-500'
                        }`}>
                          {latestPotassium.latestValue.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-400">{latestPotassium.unit}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          latestPotassium.isAbnormal ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {latestPotassium.isAbnormal ? 'Abnormal' : 'Normal'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">No recent labs</span>
                    )}
                  </div>
                  {latestPotassium && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Normal range: {latestPotassium.referenceRange.low}–{latestPotassium.referenceRange.high} {latestPotassium.unit}
                    </p>
                  )}
                </div>

                {/* Symptom indicators */}
                {dashboardData?.symptoms?.recentSymptoms?.some(
                  s => ['numbness', 'weakness', 'palpitations', 'muscle_weakness', 'tingling'].includes(s.symptomType?.toLowerCase() ?? '')
                ) && (
                  <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🩺</span>
                      <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                        Related symptoms detected (numbness, weakness, or palpitations)
                      </span>
                    </div>
                  </div>
                )}

                {/* Risk-based tip */}
                <div className={`p-3 rounded-xl ${
                  potassiumRisk === 'high' || potassiumRisk === 'elevated' ? 'bg-rose-500/5' :
                  potassiumRisk === 'moderate' ? 'bg-amber-500/5' : 'bg-emerald-500/5'
                }`}>
                  <p className={`text-sm ${
                    potassiumRisk === 'high' || potassiumRisk === 'elevated' ? 'text-rose-600 dark:text-rose-400' :
                    potassiumRisk === 'moderate' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {potassiumRisk === 'high' && 'Limit high-potassium foods (bananas, oranges, potatoes, tomatoes). Contact your care team.'}
                    {potassiumRisk === 'elevated' && 'Watch your potassium intake closely. Avoid high-potassium foods for the rest of the day.'}
                    {potassiumRisk === 'moderate' && 'On track — keep balancing your meals. Choose lower-potassium alternatives when possible.'}
                    {potassiumRisk === 'low' && 'Great potassium management! Keep following your renal diet plan.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Vitals Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Blood Pressure */}
        <div className="bg-white dark:bg-slate-800/50 glass-light rounded-xl sm:rounded-[1.5rem] p-4 sm:p-5 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-rose-500/20">
              <ICONS.Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold uppercase ${
              latestBP && (latestBP.systolic <= 120 && latestBP.diastolic <= 80)
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : latestBP && (latestBP.systolic <= 140 && latestBP.diastolic <= 90)
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}>
              {latestBP ? (latestBP.systolic <= 120 ? 'Normal' : 'Elevated') : 'No data'}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Blood Pressure</p>
          <div className="flex items-baseline gap-0.5 sm:gap-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
              {latestBP?.systolic || '--'}
            </span>
            <span className="text-slate-400 text-base sm:text-lg">/</span>
            <span className="text-lg sm:text-xl font-bold text-slate-600 dark:text-slate-300 tabular-nums">
              {latestBP?.diastolic || '--'}
            </span>
          </div>
          <p className="text-slate-400 text-[10px] sm:text-xs mt-1">mmHg</p>
        </div>

        {/* Heart Rate */}
        <div className="bg-white dark:bg-slate-800/50 glass-light rounded-xl sm:rounded-[1.5rem] p-4 sm:p-5 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 group-hover:animate-pulse transition-transform shadow-lg shadow-sky-500/20">
              <span className="text-base sm:text-xl">💓</span>
            </div>
            <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold uppercase ${
              latestHR && latestHR >= 60 && latestHR <= 100
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}>
              {latestHR ? 'Normal' : 'No data'}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Heart Rate</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {latestHR || '--'}
          </p>
          <p className="text-slate-400 text-[10px] sm:text-xs mt-1">bpm</p>
        </div>

        {/* Temperature */}
        <div className="bg-white dark:bg-slate-800/50 glass-light rounded-xl sm:rounded-[1.5rem] p-4 sm:p-5 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/20">
              <span className="text-base sm:text-xl">🌡️</span>
            </div>
            <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold uppercase ${
              latestTemp !== null
                ? (latestTemp >= 36.1 && latestTemp <= 37.2 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600')
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}>
              {latestTemp !== null ? (latestTemp >= 36.1 && latestTemp <= 37.2 ? 'Normal' : 'Abnormal') : 'No data'}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Temperature</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {latestTemp ?? '--'}
          </p>
          <p className="text-slate-400 text-[10px] sm:text-xs mt-1">°C</p>
        </div>

        {/* Oxygen */}
        <div className="bg-white dark:bg-slate-800/50 glass-light rounded-xl sm:rounded-[1.5rem] p-4 sm:p-5 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/20">
              <span className="text-base sm:text-xl">🫁</span>
            </div>
            <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold uppercase ${
              latestO2 !== null
                ? (latestO2 >= 95 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600')
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}>
              {latestO2 !== null ? (latestO2 >= 95 ? 'Normal' : 'Low') : 'No data'}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Oxygen</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {latestO2 ?? '--'}
          </p>
          <p className="text-slate-400 text-[10px] sm:text-xs mt-1">% SpO2</p>
        </div>
      </div>

      {/* Weekly Trends */}
      {sparklineCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {sparklineCards.map(card => {
            const spark = makeSparkline(card.values, card.color, card.asBars);
            const dir = card.trend;
            return (
              <div key={card.key} className="bg-white dark:bg-slate-800/50 glass-light rounded-xl sm:rounded-[1.5rem] p-3 sm:p-4 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
                {/* Top row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${card.gradientFrom} ${card.gradientTo}`} />
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.label}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold ${trendColor(dir, card.invertTrend)}`}>
                    {trendIcon(dir)} {dir === 'up' ? 'Up' : dir === 'down' ? 'Down' : 'Stable'}
                  </span>
                </div>
                {/* Sparkline */}
                {spark && (
                  <svg viewBox="0 0 120 48" className="w-full h-10 sm:h-12 mb-2" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={`sparkGrad-${card.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={card.color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={card.color} stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    {spark.type === 'line' ? (
                      <>
                        <path d={spark.area} fill={`url(#sparkGrad-${card.key})`} />
                        <path d={spark.line} fill="none" stroke={card.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </>
                    ) : (
                      <g dangerouslySetInnerHTML={{ __html: spark.svg! }} />
                    )}
                  </svg>
                )}
                {/* Bottom value */}
                <div className="flex items-baseline gap-1">
                  <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums">{card.currentDisplay}</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium">{card.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* Hydration Card */}
        <div className="col-span-12 lg:col-span-5 bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 relative overflow-hidden">
          {/* Background Wave Effect */}
          <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden opacity-30">
            <svg className="absolute bottom-0 w-[200%] animate-wave" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.2)" />
            </svg>
          </div>

          <div className="relative z-10">
            {/* Header row with stats */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Today's Hydration</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black text-white tabular-nums">{formatFluid(todayFluid, false)}</span>
                  <span className="text-white/60 font-medium">{dailyFluidLimit > 0 ? `/ ${displayFluid(dailyFluidLimit)}` : fluidUnit}</span>
                </div>
              </div>
              <div className="text-right">
                {dailyFluidLimit > 0 ? (
                  <>
                    <div className={`text-4xl font-black tabular-nums ${
                      fluidPercentage >= 100 ? 'text-rose-200' : 'text-white'
                    }`}>
                      {fluidPercentage}%
                    </div>
                    <p className="text-white/60 text-sm">{displayFluid(fluidRemaining)} left</p>
                  </>
                ) : (
                  <p className="text-white/60 text-sm">No limit set</p>
                )}
              </div>
            </div>

            {/* Glass and Progress Bar Container */}
            <div className="flex items-center justify-center gap-6 mb-4">
              {/* Water Glass Animation */}
              <div className="relative w-28 h-36 flex-shrink-0">
                {/* Glass Container */}
                <svg className="w-full h-full" viewBox="0 0 100 130">
                  {/* Glass outline */}
                  <defs>
                    <clipPath id="glassClip">
                      <path d="M15,10 L20,120 Q20,125 25,125 L75,125 Q80,125 80,120 L85,10 Q85,5 80,5 L20,5 Q15,5 15,10 Z" />
                    </clipPath>
                    <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.5)" />
                    </linearGradient>
                  </defs>

                  {/* Glass background */}
                  <path
                    d="M15,10 L20,120 Q20,125 25,125 L75,125 Q80,125 80,120 L85,10 Q85,5 80,5 L20,5 Q15,5 15,10 Z"
                    fill="rgba(255,255,255,0.15)"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2"
                  />

                  {/* Water fill with animation */}
                  <g clipPath="url(#glassClip)">
                    {/* Water body */}
                    <rect
                      x="15"
                      y={125 - Math.min(fluidPercentage, 100) * 1.15}
                      width="70"
                      height={Math.min(fluidPercentage, 100) * 1.15 + 5}
                      fill="url(#waterGradient)"
                      className="transition-all duration-1000 ease-out"
                    />

                    {/* Animated wave on water surface */}
                    <g style={{ transform: `translateY(${125 - Math.min(fluidPercentage, 100) * 1.15 - 8}px)` }} className="transition-all duration-1000">
                      <path
                        d="M15,8 Q27,0 40,8 T65,8 T90,8 L90,20 L15,20 Z"
                        fill="url(#waterGradient)"
                        className="animate-pulse"
                      >
                        <animate
                          attributeName="d"
                          dur="2s"
                          repeatCount="indefinite"
                          values="M15,8 Q27,0 40,8 T65,8 T90,8 L90,20 L15,20 Z;
                                  M15,8 Q27,16 40,8 T65,8 T90,8 L90,20 L15,20 Z;
                                  M15,8 Q27,0 40,8 T65,8 T90,8 L90,20 L15,20 Z"
                        />
                      </path>
                    </g>

                    {/* Bubbles */}
                    {fluidPercentage > 0 && (
                      <>
                        <circle cx="35" cy="100" r="3" fill="rgba(255,255,255,0.6)">
                          <animate attributeName="cy" dur="2s" repeatCount="indefinite" values="115;70;115" />
                          <animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.6;0;0.6" />
                        </circle>
                        <circle cx="55" cy="90" r="2" fill="rgba(255,255,255,0.5)">
                          <animate attributeName="cy" dur="2.5s" repeatCount="indefinite" values="110;60;110" />
                          <animate attributeName="opacity" dur="2.5s" repeatCount="indefinite" values="0.5;0;0.5" />
                        </circle>
                        <circle cx="65" cy="105" r="2.5" fill="rgba(255,255,255,0.4)">
                          <animate attributeName="cy" dur="3s" repeatCount="indefinite" values="120;65;120" />
                          <animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.4;0;0.4" />
                        </circle>
                      </>
                    )}
                  </g>

                  {/* Glass shine effect */}
                  <path
                    d="M22,15 L24,110 Q24,112 26,112 L28,112 Q30,112 30,110 L32,15"
                    fill="rgba(255,255,255,0.2)"
                  />
                </svg>

                {/* Percentage label in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-white drop-shadow-lg">
                    {dailyFluidLimit > 0 ? `${fluidPercentage}%` : '💧'}
                  </span>
                </div>
              </div>

              {/* Vertical Progress Bar */}
              {dailyFluidLimit > 0 && (
                <div className="w-3 h-36 bg-white/20 rounded-full overflow-hidden flex-shrink-0">
                  <div
                    className="w-full bg-white/70 rounded-full transition-all duration-1000"
                    style={{
                      height: `${Math.min(fluidPercentage, 100)}%`,
                      marginTop: `${100 - Math.min(fluidPercentage, 100)}%`
                    }}
                  />
                </div>
              )}
            </div>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {[100, 150, 200, 250, 500].map(v => (
                <button
                  key={v}
                  onClick={() => handleQuickFluid(v)}
                  disabled={activeQuickAdd !== null}
                  className={`py-2.5 sm:py-3 bg-white/20 backdrop-blur rounded-lg sm:rounded-xl text-white font-bold text-xs sm:text-sm hover:bg-white/30 active:scale-95 transition-all ${
                    activeQuickAdd === v ? 'bg-white/40 scale-95' : ''
                  }`}
                >
                  +{v}
                </button>
              ))}
            </div>

            {/* Recent Fluid Logs */}
            {recentFluidLogs.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Recent Intake</p>
                  <Link to="/fluid" className="text-white/80 text-xs font-bold hover:text-white">View All</Link>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {recentFluidLogs.slice(0, 8).map((log) => {
                    const logTime = new Date(log.loggedAt);
                    const timeStr = displayTime(logTime);
                    const sourceIcons: Record<string, string> = {
                      water: '💧',
                      tea: '🍵',
                      coffee: '☕',
                      juice: '🧃',
                      soup: '🍲',
                      other: '🥤',
                    };
                    return (
                      <div
                        key={log._id}
                        className="flex items-center justify-between bg-white/10 backdrop-blur rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{sourceIcons[log.source] || '💧'}</span>
                          <div>
                            <p className="text-white font-semibold text-sm capitalize">{log.source}</p>
                            <p className="text-white/50 text-xs">{timeStr}</p>
                          </div>
                        </div>
                        <p className="text-white font-bold text-sm">+{log.amountMl} ml</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                <p className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">{currentWeight !== null ? formatWeight(currentWeight, false) : '--'}</p>
                <p className="text-slate-400 text-sm">{weightUnit} current</p>
              </div>
              {weightData.length >= 2 && (
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
                      {weightChange > 0 ? '+' : ''}{displayWeight(weightChange)}
                    </p>
                    <p className="text-slate-400 text-xs">vs last</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <span className="text-lg">🎯</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{dryWeight !== null ? displayWeight(dryWeight) : '--'}</p>
                  <p className="text-slate-400 text-xs">target</p>
                </div>
              </div>
            </div>

            {/* SVG Chart or No Data */}
            <div className="h-28">
              {weightData.length >= 2 ? (
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
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p className="text-sm">{weightData.length === 1 ? 'Need 2+ readings for trend' : 'No weight data'}</p>
                </div>
              )}
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

        {/* Achievements Card */}
        {achievementsData && (
          <Link
            to="/achievements"
            className="col-span-12 bg-white dark:bg-white/5 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Achievements</p>
              <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
            <div className="flex items-center gap-5">
              {/* Mini Recovery Score */}
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                    className="text-slate-100 dark:text-white/10" />
                  <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
                    stroke={achievementsData.recoveryScore >= 70 ? '#22c55e' : '#f59e0b'}
                    strokeDasharray={`${achievementsData.recoveryScore * 2.64} 264`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-slate-900 dark:text-white">{achievementsData.recoveryScore}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 dark:text-white">Recovery Score</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {achievementsData.achievements.filter(a => a.earned).length} badge{achievementsData.achievements.filter(a => a.earned).length !== 1 ? 's' : ''} earned
                </p>
              </div>

              {/* Badge chips */}
              <div className="hidden sm:flex gap-2">
                {achievementsData.achievements.slice(0, 3).map(a => (
                  <span
                    key={a.id}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      a.earned
                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        )}

        {/* Quick Actions */}
        <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { to: '/fluid', icon: '💧', label: 'Fluid Log', desc: 'Track hydration', gradient: 'from-sky-500 to-cyan-500' },
            { to: '/weight', icon: '⚖️', label: 'Weight', desc: 'Log weight', gradient: 'from-purple-500 to-violet-500' },
            { to: '/vitals', icon: '❤️', label: 'Vitals', desc: 'BP & pulse', gradient: 'from-rose-500 to-pink-500' },
            { to: '/symptoms', icon: '🩺', label: 'Symptoms', desc: 'Track how you feel', gradient: 'from-amber-500 to-orange-500' },
          ].map((item, i) => (
            <Link
              key={i}
              to={item.to}
              className={`bg-gradient-to-br ${item.gradient} text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group`}
            >
              <span className="text-2xl sm:text-4xl block mb-2 sm:mb-3 group-hover:scale-110 transition-transform">{item.icon}</span>
              <p className="font-bold text-sm sm:text-lg">{item.label}</p>
              <p className="text-white/70 text-xs sm:text-sm hidden sm:block">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
