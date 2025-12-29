import { authFetch } from './auth';

// Types matching backend response
export interface OverviewStats {
  totalSessions: number;
  activeDays: number;
  currentStreak: number;
  subscriptionPlan: string;
  daysUntilRenewal: number | null;
}

export interface SessionStats {
  totalCompleted: number;
  thisWeek: number;
  thisMonth: number;
  averageDuration: number | null;
  averageUf: number | null;
  ratingBreakdown: {
    good: number;
    ok: number;
    bad: number;
  };
  recentSessions: Array<{
    _id: string;
    mode: string;
    type: string;
    status: string;
    startedAt: string;
    endedAt?: string;
    actualDurationMin?: number;
    sessionRating?: string;
  }>;
}

export interface WeightStats {
  current: number | null;
  dryWeight: number | null;
  trend: 'up' | 'down' | 'stable' | null;
  averagePreDialysis: number | null;
  averagePostDialysis: number | null;
  history: Array<{
    date: string;
    weight: number;
    context: string;
  }>;
}

export interface FluidStats {
  todayTotal: number;
  dailyLimit: number | null;
  weeklyAverage: number;
  history: Array<{
    date: string;
    total: number;
  }>;
}

export interface MedicationStats {
  totalActive: number;
  todayDoses: number;
  takenToday: number;
  adherenceRate: number;
  upcomingDoses: Array<{
    _id: string;
    scheduledAt: string;
    status: string;
    medicationId: {
      name: string;
      dosage: string;
    };
  }>;
}

export interface SymptomStats {
  totalLogged: number;
  thisWeek: number;
  mostCommon: Array<{
    type: string;
    count: number;
  }>;
  recentSymptoms: Array<{
    _id: string;
    symptomType: string;
    severity: string;
    loggedAt: string;
    notes?: string;
  }>;
}

export interface VitalStats {
  latestBp: {
    systolic: number;
    diastolic: number;
    date: string;
  } | null;
  latestHeartRate: {
    value: number;
    date: string;
  } | null;
  averageBp: {
    systolic: number;
    diastolic: number;
  } | null;
  history: Array<{
    _id: string;
    type: string;
    value1: number;
    value2?: number;
    unit: string;
    loggedAt: string;
  }>;
}

export interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface DashboardStats {
  overview: OverviewStats;
  sessions: SessionStats;
  weight: WeightStats;
  fluid: FluidStats;
  medications: MedicationStats;
  symptoms: SymptomStats;
  vitals: VitalStats;
  recentActivity: RecentActivity[];
}

// Get full dashboard data
export async function getDashboard(days: number = 30): Promise<DashboardStats> {
  const result = await authFetch(`/dashboard?days=${days}`);
  return result.data;
}

// Get overview stats only
export async function getOverview(): Promise<OverviewStats> {
  const result = await authFetch('/dashboard/overview');
  return result.data;
}

// Get session statistics
export async function getSessionStats(days: number = 30): Promise<SessionStats> {
  const result = await authFetch(`/dashboard/sessions?days=${days}`);
  return result.data;
}

// Get weight statistics
export async function getWeightStats(days: number = 30): Promise<WeightStats> {
  const result = await authFetch(`/dashboard/weight?days=${days}`);
  return result.data;
}

// Get fluid statistics
export async function getFluidStats(): Promise<FluidStats> {
  const result = await authFetch('/dashboard/fluid');
  return result.data;
}

// Get medication statistics
export async function getMedicationStats(): Promise<MedicationStats> {
  const result = await authFetch('/dashboard/medications');
  return result.data;
}

// Get symptom statistics
export async function getSymptomStats(days: number = 30): Promise<SymptomStats> {
  const result = await authFetch(`/dashboard/symptoms?days=${days}`);
  return result.data;
}

// Get vital statistics
export async function getVitalStats(days: number = 30): Promise<VitalStats> {
  const result = await authFetch(`/dashboard/vitals?days=${days}`);
  return result.data;
}

// Get recent activity
export async function getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
  const result = await authFetch(`/dashboard/activity?limit=${limit}`);
  return result.data;
}
