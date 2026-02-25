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
          <div className="w-16 h-16 relative mx-auto">
            <div className="absolute inset-0 border-[3px] border-teal-500/15 rounded-full" />
            <div className="absolute inset-0 border-[3px] border-transparent border-t-teal-500 rounded-full animate-spin" />
            <div className="absolute inset-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
              <ICONS.Activity className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Loading your health data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 sm:space-y-6 pb-24 px-4">
      <OnboardingModal />

      {/* System Announcements */}
      {visibleAnnouncements.map((announcement) => {
        const aColors = {
          info: { bg: 'bg-teal-500/8 border-teal-500/15', text: 'text-teal-700 dark:text-teal-400', sub: 'text-teal-600 dark:text-teal-500' },
          warning: { bg: 'bg-amber-500/8 border-amber-500/15', text: 'text-amber-700 dark:text-amber-400', sub: 'text-amber-600 dark:text-amber-500' },
          error: { bg: 'bg-rose-500/8 border-rose-500/15', text: 'text-rose-700 dark:text-rose-400', sub: 'text-rose-600 dark:text-rose-500' },
          success: { bg: 'bg-emerald-500/8 border-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', sub: 'text-emerald-600 dark:text-emerald-500' },
        }[announcement.type] || { bg: 'bg-teal-500/8 border-teal-500/15', text: 'text-teal-700 dark:text-teal-400', sub: 'text-teal-600 dark:text-teal-500' };
        return (
          <div key={announcement.id} className={`rounded-xl p-3.5 border ${aColors.bg}`}>
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0 mt-0.5">
                {announcement.type === 'info' ? '🔧' : announcement.type === 'warning' ? '⚠️' : announcement.type === 'error' ? '❌' : '✅'}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-xs ${aColors.text}`}>{announcement.title}</h3>
                <p className={`text-xs mt-0.5 leading-relaxed ${aColors.sub}`}>{announcement.message}</p>
                {announcement.linkUrl && (
                  <a href={announcement.linkUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 text-xs font-bold mt-1.5 hover:underline ${aColors.text}`}>
                    {announcement.linkText || 'Learn more'} →
                  </a>
                )}
              </div>
              {announcement.dismissible && (
                <button onClick={() => handleDismissAnnouncement(announcement.id)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <ICONS.X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* CSS Animations & Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
        .font-display { font-family: 'DM Sans', sans-serif; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes breathe { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes wave { 0% { transform: translateX(0) translateY(0); } 50% { transform: translateX(-25%) translateY(-2px); } 100% { transform: translateX(-50%) translateY(0); } }
        @keyframes orb-glow { 0%, 100% { box-shadow: 0 0 30px var(--orb-color, rgba(20,184,166,0.3)), 0 0 60px var(--orb-color, rgba(20,184,166,0.1)); } 50% { box-shadow: 0 0 50px var(--orb-color, rgba(20,184,166,0.5)), 0 0 80px var(--orb-color, rgba(20,184,166,0.2)); } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes count-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-breathe { animation: breathe 3s ease-in-out infinite; }
        .animate-wave { animation: wave 8s linear infinite; }
        .animate-orb-glow { animation: orb-glow 3s ease-in-out infinite; }
        .anim-fade-up { animation: fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .anim-count-in { animation: count-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); }
        .glass-light { background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); }
        .dark .glass-light { background: rgba(15,23,42,0.7); backdrop-filter: blur(24px); }
        .noise { position: relative; }
        .noise::before { content: ''; position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"); pointer-events: none; border-radius: inherit; z-index: 1; }
        .card-lift { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease; }
        .card-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
        .dark .card-lift:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between pt-2 sm:pt-4 anim-fade-up">
        <div className="min-w-0 flex-1">
          <p className="text-slate-400 dark:text-slate-500 text-xs font-medium tracking-wide uppercase">{getGreeting()}</p>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate mt-0.5">
            {profile.name || 'Welcome back'}
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 ml-3">
          <Link
            to="/alerts"
            className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          >
            <ICONS.Bell className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400" />
            {alertCounts && (alertCounts.critical + alertCounts.high + alertCounts.medium + alertCounts.low) > 0 && (
              <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${
                hasUrgentAlerts ? 'bg-rose-500 animate-pulse' : 'bg-teal-500'
              }`}>
                {alertCounts.critical + alertCounts.high + alertCounts.medium + alertCounts.low}
              </span>
            )}
          </Link>
          <Link
            to="/profile"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          >
            <span className="text-lg">👤</span>
          </Link>
        </div>
      </header>

      {/* Health Status Hero — Clinical Luxe */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 overflow-hidden noise anim-fade-up" style={{ animationDelay: '0.1s' }}>
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute -top-20 -right-20 w-64 sm:w-80 h-64 sm:h-80 rounded-full blur-[100px] opacity-25 ${
            healthStatus.color === 'emerald' ? 'bg-teal-500' : healthStatus.color === 'sky' ? 'bg-cyan-500' : healthStatus.color === 'amber' ? 'bg-amber-500' : healthStatus.color === 'slate' ? 'bg-slate-500' : 'bg-rose-500'
          }`} />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-teal-600/15 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 md:gap-10">
          {/* Health Score Orb */}
          <div className="relative shrink-0">
            <div
              className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full animate-orb-glow flex items-center justify-center"
              style={{
                '--orb-color': healthStatus.color === 'emerald' ? 'rgba(20,184,166,0.35)' : healthStatus.color === 'sky' ? 'rgba(6,182,212,0.35)' : healthStatus.color === 'amber' ? 'rgba(245,158,11,0.35)' : healthStatus.color === 'slate' ? 'rgba(100,116,139,0.3)' : 'rgba(244,63,94,0.35)',
              } as React.CSSProperties}
            >
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" strokeDasharray="4 8" />
                <circle
                  cx="100" cy="100" r="88" fill="none"
                  stroke={`url(#healthGrad)`}
                  strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={`${(healthScore ?? 0) * 5.53} 553`}
                  className="transition-all duration-[1.5s] ease-out"
                />
                <defs>
                  <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={healthStatus.color === 'emerald' ? '#14b8a6' : healthStatus.color === 'sky' ? '#06b6d4' : healthStatus.color === 'amber' ? '#f59e0b' : healthStatus.color === 'slate' ? '#64748b' : '#f43f5e'} />
                    <stop offset="100%" stopColor={healthStatus.color === 'emerald' ? '#0d9488' : healthStatus.color === 'sky' ? '#0891b2' : healthStatus.color === 'amber' ? '#d97706' : healthStatus.color === 'slate' ? '#475569' : '#e11d48'} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="relative flex flex-col items-center justify-center text-white">
                <span className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold tabular-nums anim-count-in" style={{ animationDelay: '0.4s' }}>
                  {healthScore ?? '--'}
                </span>
                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1 ${
                  healthStatus.color === 'emerald' ? 'text-teal-400' : healthStatus.color === 'sky' ? 'text-cyan-400' : healthStatus.color === 'amber' ? 'text-amber-400' : healthStatus.color === 'slate' ? 'text-slate-400' : 'text-rose-400'
                }`}>{healthStatus.label}</span>
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className="flex-1 text-center lg:text-left min-w-0">
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-2 tracking-tight">
              Health Overview
            </h2>
            <p className="text-white/50 text-sm sm:text-base md:text-lg mb-5 max-w-md mx-auto lg:mx-0 leading-relaxed">
              {healthStatus.message}
            </p>

            {/* Quick Stats — Horizontal Chips */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {[
                { emoji: '💧', label: 'Hydration', value: dailyFluidLimit > 0 ? `${fluidPercentage}%` : todayFluid > 0 ? displayFluid(todayFluid) : '--' },
                { emoji: '⚖️', label: 'Weight', value: currentWeight !== null ? displayWeight(currentWeight) : '--' },
                { emoji: '🩺', label: 'Sessions', value: `${sessionStats?.thisWeek || 0}/wk` },
              ].map(chip => (
                <div key={chip.label} className="glass rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                  <span className="text-lg">{chip.emoji}</span>
                  <div>
                    <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">{chip.label}</p>
                    <p className="text-white font-bold text-sm tabular-nums">{chip.value}</p>
                  </div>
                </div>
              ))}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 anim-fade-up" style={{ animationDelay: '0.15s' }}>
          {upcomingReminders.length > 0 && (
            <div className="noise bg-white dark:bg-slate-800/40 glass-light rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/[0.06]">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🔔</span>
                    <div>
                      <h3 className="font-display font-extrabold text-slate-900 dark:text-white text-sm">Upcoming Reminders</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Next 24 hours</p>
                    </div>
                  </div>
                  <Link to="/reminders" className="text-teal-600 dark:text-teal-400 text-xs font-bold hover:underline">View All</Link>
                </div>
                <div className="space-y-2">
                  {upcomingReminders.slice(0, 4).map((reminder) => (
                    <div key={reminder._id} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors">
                      <span className="text-xl">{REMINDER_TYPE_ICONS[reminder.type] || '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{reminder.title}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{formatReminderTime(reminder.time)} · {getScheduleDescription(reminder)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {upcomingAppointments.length > 0 && (
            <div className="noise bg-white dark:bg-slate-800/40 glass-light rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/[0.06]">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">📅</span>
                    <div>
                      <h3 className="font-display font-extrabold text-slate-900 dark:text-white text-sm">Upcoming Appointments</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Next 7 days</p>
                    </div>
                  </div>
                  <Link to="/appointments" className="text-teal-600 dark:text-teal-400 text-xs font-bold hover:underline">View All</Link>
                </div>
                <div className="space-y-2">
                  {upcomingAppointments.slice(0, 4).map((appointment) => (
                    <div key={appointment._id} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors">
                      <span className="text-xl">{APPOINTMENT_TYPE_ICONS[appointment.type] || '📅'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{appointment.title}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          {getRelativeDate(appointment.date)} at {formatAppointmentTime(appointment.startTime)}
                        </p>
                        {appointment.location && <p className="text-[10px] text-slate-400/60 dark:text-slate-500/60 truncate">{appointment.location}</p>}
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                        appointment.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        appointment.status === 'scheduled' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' :
                        'bg-slate-100 dark:bg-white/[0.04] text-slate-500'
                      }`}>{appointment.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialysis Intelligence */}
      {(currentWeight !== null && dryWeight !== null) || nutritionTotals.potassium > 0 || latestPotassium ? (
        <div className="anim-fade-up" style={{ animationDelay: '0.18s' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-xl">🧠</span>
            <div>
              <h2 className="font-display font-extrabold text-slate-900 dark:text-white text-base">Dialysis Intelligence</h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Clinical insights from your data</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {currentWeight !== null && dryWeight !== null && (
              <div>
                <DryWeightTracker
                  currentWeight={currentWeight}
                  dryWeight={dryWeight}
                  previousWeight={dashboardData?.weight?.history?.[1]?.weight}
                  trend={weightTrend as 'up' | 'down' | 'stable'}
                />
                {currentWeight - dryWeight > 2.5 && (
                  <div className="mt-3 p-3.5 bg-rose-500/8 border border-rose-500/15 rounded-xl">
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg">🚨</span>
                      <div>
                        <p className="font-bold text-rose-700 dark:text-rose-300 text-xs">Critical Fluid Overload</p>
                        <p className="text-rose-600 dark:text-rose-400 text-xs mt-1 leading-relaxed">
                          You are {(currentWeight - dryWeight).toFixed(1)}kg above your dry weight. Contact your dialysis team about increasing ultrafiltration or adjusting your fluid restriction.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(nutritionTotals.potassium > 0 || latestPotassium) && (
              <div className="noise bg-white dark:bg-slate-800/40 glass-light rounded-2xl sm:rounded-3xl p-5 border border-slate-100 dark:border-white/[0.06]">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🍌</span>
                      <div>
                        <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">Potassium Risk</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px]">Electrolyte monitoring</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
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

                  {nutritionTotals.potassium > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-400 dark:text-slate-500">Diet Intake</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                          {Math.round(nutritionTotals.potassium)} / {nutritionLimits.potassium || 2500} mg
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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

                  <div className="p-2.5 bg-slate-50 dark:bg-white/[0.03] rounded-lg mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">🔬</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">Latest Lab</span>
                      </div>
                      {latestPotassium ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-extrabold tabular-nums font-display ${
                            latestPotassium.latestValue > 5.5 ? 'text-rose-500' :
                            latestPotassium.latestValue >= 5.0 ? 'text-amber-500' :
                            latestPotassium.latestValue < 3.5 ? 'text-cyan-500' : 'text-emerald-500'
                          }`}>
                            {latestPotassium.latestValue.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-slate-400">{latestPotassium.unit}</span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                            latestPotassium.isAbnormal ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {latestPotassium.isAbnormal ? 'Abnormal' : 'Normal'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No recent labs</span>
                      )}
                    </div>
                    {latestPotassium && (
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        Normal: {latestPotassium.referenceRange.low}–{latestPotassium.referenceRange.high} {latestPotassium.unit}
                      </p>
                    )}
                  </div>

                  {dashboardData?.symptoms?.recentSymptoms?.some(
                    s => ['numbness', 'weakness', 'palpitations', 'muscle_weakness', 'tingling'].includes(s.symptomType?.toLowerCase() ?? '')
                  ) && (
                    <div className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-lg mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">🩺</span>
                        <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                          Related symptoms detected (numbness, weakness, or palpitations)
                        </span>
                      </div>
                    </div>
                  )}

                  <div className={`p-2.5 rounded-lg ${
                    potassiumRisk === 'high' || potassiumRisk === 'elevated' ? 'bg-rose-500/5' :
                    potassiumRisk === 'moderate' ? 'bg-amber-500/5' : 'bg-emerald-500/5'
                  }`}>
                    <p className={`text-xs leading-relaxed ${
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
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Vitals Grid — Refined Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 anim-fade-up" style={{ animationDelay: '0.2s' }}>
        {[
          {
            label: 'Blood Pressure', unit: 'mmHg', emoji: '❤️‍🔥',
            accent: 'rose',
            value: latestBP ? null : '--',
            customValue: latestBP ? (
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums font-display">{latestBP.systolic}</span>
                <span className="text-slate-300 dark:text-slate-600 text-lg">/</span>
                <span className="text-lg font-bold text-slate-500 dark:text-slate-400 tabular-nums">{latestBP.diastolic}</span>
              </div>
            ) : null,
            status: latestBP ? (latestBP.systolic <= 120 ? 'Normal' : latestBP.systolic <= 140 ? 'Elevated' : 'High') : null,
            statusColor: latestBP ? (latestBP.systolic <= 120 ? 'emerald' : latestBP.systolic <= 140 ? 'amber' : 'rose') : null,
          },
          {
            label: 'Heart Rate', unit: 'bpm', emoji: '💓',
            accent: 'cyan',
            value: latestHR || '--',
            status: latestHR ? (latestHR >= 60 && latestHR <= 100 ? 'Normal' : 'Abnormal') : null,
            statusColor: latestHR ? (latestHR >= 60 && latestHR <= 100 ? 'emerald' : 'amber') : null,
          },
          {
            label: 'Temperature', unit: '°C', emoji: '🌡️',
            accent: 'amber',
            value: latestTemp ?? '--',
            status: latestTemp !== null ? (latestTemp >= 36.1 && latestTemp <= 37.2 ? 'Normal' : 'Abnormal') : null,
            statusColor: latestTemp !== null ? (latestTemp >= 36.1 && latestTemp <= 37.2 ? 'emerald' : 'amber') : null,
          },
          {
            label: 'Oxygen', unit: '% SpO₂', emoji: '🫁',
            accent: 'violet',
            value: latestO2 ?? '--',
            status: latestO2 !== null ? (latestO2 >= 95 ? 'Normal' : 'Low') : null,
            statusColor: latestO2 !== null ? (latestO2 >= 95 ? 'emerald' : 'amber') : null,
          },
        ].map((vital, i) => (
          <div
            key={vital.label}
            className="noise bg-white dark:bg-slate-800/40 glass-light rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-white/[0.06] card-lift group"
            style={{ animationDelay: `${0.15 + i * 0.05}s` }}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl sm:text-2xl">{vital.emoji}</span>
                {vital.status && (
                  <span className={`px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wide ${
                    vital.statusColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    vital.statusColor === 'amber' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    'bg-rose-500/10 text-rose-500'
                  }`}>
                    {vital.status}
                  </span>
                )}
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">{vital.label}</p>
              {vital.customValue || (
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums font-display">{vital.value}</p>
              )}
              <p className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-xs mt-0.5">{vital.unit}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Trends Strip */}
      {sparklineCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 anim-fade-up" style={{ animationDelay: '0.25s' }}>
          {sparklineCards.map(card => {
            const spark = makeSparkline(card.values, card.color, card.asBars);
            const dir = card.trend;
            return (
              <div key={card.key} className="noise bg-white dark:bg-slate-800/40 glass-light rounded-2xl p-3 sm:p-4 border border-slate-100 dark:border-white/[0.06] card-lift">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: card.color }} />
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{card.label}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold ${trendColor(dir, card.invertTrend)}`}>
                      {trendIcon(dir)} {dir === 'up' ? 'Up' : dir === 'down' ? 'Down' : 'Stable'}
                    </span>
                  </div>
                  {spark && (
                    <svg viewBox="0 0 120 48" className="w-full h-10 sm:h-12 mb-2" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id={`sparkGrad-${card.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={card.color} stopOpacity="0.25" />
                          <stop offset="100%" stopColor={card.color} stopOpacity="0" />
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
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums font-display">{card.currentDisplay}</span>
                    <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium">{card.unit}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-4 sm:gap-5 anim-fade-up" style={{ animationDelay: '0.3s' }}>
        {/* Hydration Card */}
        <div className="col-span-12 lg:col-span-5 relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-6 noise" style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2, #0e7490)' }}>
          {/* Wave Effect */}
          <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden opacity-20 pointer-events-none">
            <svg className="absolute bottom-0 w-[200%] animate-wave" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.3)" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-white/50 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">Today's Hydration</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display text-4xl sm:text-5xl font-extrabold text-white tabular-nums">{formatFluid(todayFluid, false)}</span>
                  <span className="text-white/50 font-medium text-sm">{dailyFluidLimit > 0 ? `/ ${displayFluid(dailyFluidLimit)}` : fluidUnit}</span>
                </div>
              </div>
              <div className="text-right">
                {dailyFluidLimit > 0 ? (
                  <>
                    <div className={`font-display text-4xl font-extrabold tabular-nums ${fluidPercentage >= 100 ? 'text-rose-200' : 'text-white'}`}>
                      {fluidPercentage}%
                    </div>
                    <p className="text-white/50 text-xs">{displayFluid(fluidRemaining)} left</p>
                  </>
                ) : (
                  <p className="text-white/50 text-sm">No limit set</p>
                )}
              </div>
            </div>

            {/* Circular Progress Ring */}
            <div className="flex items-center justify-center mb-5">
              <div className="relative w-32 h-32 sm:w-36 sm:h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke="rgba(255,255,255,0.85)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${Math.min(fluidPercentage, 100) * 3.27} 327`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-display font-extrabold text-white drop-shadow-lg">
                    {dailyFluidLimit > 0 ? `${fluidPercentage}%` : '💧'}
                  </span>
                  {dailyFluidLimit > 0 && <span className="text-white/50 text-[10px] mt-0.5">of limit</span>}
                </div>
              </div>
            </div>

            {/* Quick Add */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {[100, 150, 200, 250, 500].map(v => (
                <button
                  key={v}
                  onClick={() => handleQuickFluid(v)}
                  disabled={activeQuickAdd !== null}
                  className={`py-2.5 sm:py-3 rounded-xl text-white font-bold text-xs sm:text-sm transition-all border border-white/15 ${
                    activeQuickAdd === v ? 'bg-white/30 scale-95' : 'bg-white/10 hover:bg-white/20 active:scale-95'
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
                  <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest">Recent</p>
                  <Link to="/fluid" className="text-white/70 text-xs font-bold hover:text-white transition-colors">View All</Link>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {recentFluidLogs.slice(0, 6).map((log) => {
                    const logTime = new Date(log.loggedAt);
                    const timeStr = displayTime(logTime);
                    const sourceIcons: Record<string, string> = { water: '💧', tea: '🍵', coffee: '☕', juice: '🧃', soup: '🍲', other: '🥤' };
                    return (
                      <div key={log._id} className="flex items-center justify-between bg-white/8 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{sourceIcons[log.source] || '💧'}</span>
                          <div>
                            <p className="text-white font-semibold text-sm capitalize">{log.source}</p>
                            <p className="text-white/40 text-[10px]">{timeStr}</p>
                          </div>
                        </div>
                        <p className="text-white font-bold text-sm tabular-nums">+{log.amountMl} ml</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weight & Session Column */}
        <div className="col-span-12 lg:col-span-7 space-y-5">
          {/* Weight Card */}
          <div className="noise bg-white dark:bg-slate-800/40 glass-light rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/[0.06]">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">Weight Trend</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Last 7 days</p>
                </div>
                <Link to="/weight" className="text-teal-600 dark:text-teal-400 text-xs font-bold hover:underline">View All</Link>
              </div>

              <div className="flex items-center gap-6 sm:gap-8 mb-4">
                <div>
                  <p className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums">{currentWeight !== null ? formatWeight(currentWeight, false) : '--'}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{weightUnit} current</p>
                </div>
                {weightData.length >= 2 && (
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${weightChange <= 0 ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                      <svg className={`w-4 h-4 ${weightChange <= 0 ? 'text-emerald-500' : 'text-amber-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d={weightChange <= 0 ? 'M19 14l-7 7m0 0l-7-7m7 7V3' : 'M5 10l7-7m0 0l7 7m-7-7v18'} />
                      </svg>
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${weightChange <= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {weightChange > 0 ? '+' : ''}{displayWeight(weightChange)}
                      </p>
                      <p className="text-slate-400 dark:text-slate-500 text-[10px]">vs last</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center">
                    <span className="text-sm">🎯</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{dryWeight !== null ? displayWeight(dryWeight) : '--'}</p>
                    <p className="text-slate-400 dark:text-slate-500 text-[10px]">target</p>
                  </div>
                </div>
              </div>

              <div className="h-28">
                {weightData.length >= 2 ? (
                  <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="weightGradientDash" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={weightChartPath.area} fill="url(#weightGradientDash)" />
                    <path d={weightChartPath.line} fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" />
                    {weightChartPath.points.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#14b8a6" stroke="white" strokeWidth="2" className="dark:stroke-slate-900" />
                    ))}
                  </svg>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
                    <p className="text-sm">{weightData.length === 1 ? 'Need 2+ readings for trend' : 'No weight data'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Session Insights */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white noise" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b, #0f172a)' }}>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/15 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 bg-white/8 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🩺</span>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">Dialysis Sessions</p>
                  <p className="font-display text-xl font-extrabold">{sessionStats?.totalCompleted || 0} Total</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'This Week', value: sessionStats?.thisWeek || 0, unit: 'sessions', icon: '📅' },
                  { label: 'This Month', value: sessionStats?.thisMonth || 0, unit: 'sessions', icon: '📆' },
                  { label: 'Avg Duration', value: sessionStats?.averageDuration ? `${Math.floor(sessionStats.averageDuration / 60)}h ${sessionStats.averageDuration % 60}m` : '--', icon: '⏱️' },
                  { label: 'Avg UF', value: sessionStats?.averageUf ? `${(sessionStats.averageUf / 1000).toFixed(1)}L` : '--', icon: '💧' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base">{stat.icon}</span>
                      <span className="text-white/40 text-[10px] font-medium uppercase tracking-wider">{stat.label}</span>
                    </div>
                    <p className="font-display text-lg font-extrabold">
                      {typeof stat.value === 'number' ? stat.value : stat.value}
                      {stat.unit && <span className="text-xs text-white/30 ml-1 font-normal">{stat.unit}</span>}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                to="/sessions"
                className="mt-5 w-full py-3 bg-white/[0.06] border border-white/[0.08] rounded-xl font-bold text-sm text-center block hover:bg-white/10 transition-all"
              >
                View All Sessions
              </Link>
            </div>
          </div>
        </div>

        {/* Nutrition Summary */}
        <div className="col-span-12 noise bg-white dark:bg-slate-800/40 glass-light rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/[0.06]">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🥗</span>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">Today's Nutrition</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">
                    {todayMealCount > 0 ? `${todayMealCount} meal${todayMealCount > 1 ? 's' : ''} logged` : 'No meals logged yet'}
                  </p>
                </div>
              </div>
              <Link to="/nutri-scan" className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5">
                <span className="text-base">+</span> Scan Food
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Sodium', value: nutritionTotals.sodium, limit: nutritionLimits.sodium, unit: 'mg', barColor: '#0d9488', icon: '🧂' },
                { label: 'Potassium', value: nutritionTotals.potassium, limit: nutritionLimits.potassium, unit: 'mg', barColor: '#f59e0b', icon: '🍌' },
                { label: 'Phosphorus', value: nutritionTotals.phosphorus, limit: nutritionLimits.phosphorus, unit: 'mg', barColor: '#8b5cf6', icon: '🥩' },
                { label: 'Protein', value: nutritionTotals.protein, limit: nutritionLimits.protein, unit: 'g', barColor: '#10b981', icon: '🥚' },
              ].map((n, i) => {
                const percent = Math.min((n.value / n.limit) * 100, 100);
                const isOverLimit = n.value > n.limit;
                const isWarning = percent >= 80 && percent < 100;
                return (
                  <div key={i} className={`bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3.5 border ${isOverLimit ? 'border-rose-200 dark:border-rose-500/20' : 'border-transparent'} transition-all`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{n.icon}</span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{n.label}</span>
                      </div>
                      {isOverLimit && <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 text-[9px] font-bold rounded-md">OVER</span>}
                      {isWarning && !isOverLimit && <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold rounded-md">HIGH</span>}
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className={`text-xl font-extrabold tabular-nums font-display ${isOverLimit ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                        {Math.round(n.value)}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs">/ {n.limit}{n.unit}</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${percent}%`, backgroundColor: isOverLimit ? '#f43f5e' : isWarning ? '#f59e0b' : n.barColor }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 text-right tabular-nums">{Math.round(percent)}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Achievements Card */}
        {achievementsData && (
          <Link
            to="/achievements"
            className="col-span-12 noise bg-white dark:bg-slate-800/40 glass-light rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-white/[0.06] card-lift group"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Achievements</p>
                <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="7" className="text-slate-100 dark:text-white/[0.06]" />
                    <circle cx="50" cy="50" r="42" fill="none" strokeWidth="7" strokeLinecap="round"
                      stroke={achievementsData.recoveryScore >= 70 ? '#14b8a6' : '#f59e0b'}
                      strokeDasharray={`${achievementsData.recoveryScore * 2.64} 264`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white font-display">{achievementsData.recoveryScore}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">Recovery Score</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {achievementsData.achievements.filter(a => a.earned).length} badge{achievementsData.achievements.filter(a => a.earned).length !== 1 ? 's' : ''} earned
                  </p>
                </div>
                <div className="hidden sm:flex gap-1.5">
                  {achievementsData.achievements.slice(0, 3).map(a => (
                    <span key={a.id} className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${
                      a.earned ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'bg-slate-50 dark:bg-white/[0.03] text-slate-400 dark:text-slate-500'
                    }`}>
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Exercise Activity Card */}
        {dashboardData?.exercise && (dashboardData.exercise.todaySteps > 0 || dashboardData.exercise.todayActiveMinutes > 0) && (
          <Link to="/exercise" className="col-span-12 noise bg-white dark:bg-slate-800/40 glass-light rounded-2xl p-5 border border-slate-100 dark:border-white/[0.06] card-lift block">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 text-lg">🏃</span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Today's Activity</span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">View all →</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">{dashboardData.exercise.todaySteps.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">Steps</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">{dashboardData.exercise.todayActiveMinutes}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">Active Min</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">{dashboardData.exercise.todayCalories}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">Calories</div>
              </div>
            </div>
          </Link>
        )}

        {/* Quick Actions */}
        <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/fluid', icon: '💧', label: 'Fluid Log', desc: 'Track hydration', bg: 'bg-gradient-to-br from-teal-600 to-cyan-700' },
            { to: '/weight', icon: '⚖️', label: 'Weight', desc: 'Log weight', bg: 'bg-gradient-to-br from-violet-600 to-purple-700' },
            { to: '/vitals', icon: '❤️', label: 'Vitals', desc: 'BP & pulse', bg: 'bg-gradient-to-br from-rose-600 to-pink-700' },
            { to: '/symptoms', icon: '🩺', label: 'Symptoms', desc: 'Track how you feel', bg: 'bg-gradient-to-br from-amber-600 to-orange-700' },
          ].map((item, i) => (
            <Link
              key={i}
              to={item.to}
              className={`${item.bg} text-white rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-xl hover:brightness-110 active:scale-[0.97] transition-all duration-300 group noise`}
            >
              <div className="relative z-10">
                <span className="text-2xl sm:text-3xl block mb-2 group-hover:scale-110 transition-transform">{item.icon}</span>
                <p className="font-display font-bold text-sm sm:text-base">{item.label}</p>
                <p className="text-white/60 text-[10px] sm:text-xs hidden sm:block mt-0.5">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
