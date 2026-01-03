
import { authFetch } from './auth';
import { VitalRecord } from './vitals';

// Enums matching backend
export enum DialysisMode {
  HOME = 'home',
  CLINIC = 'clinic',
}

export enum DialysisType {
  IN_CENTER_HD = 'in_center_hd',
  HOME_HD = 'home_hd',
  PD_CAPD = 'pd_capd',
  PD_APD = 'pd_apd',
  PRE_DIALYSIS = 'pre_dialysis',
}

export enum SessionStatus {
  STARTED = 'started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  STOPPED = 'stopped',
  CANCELLED = 'cancelled',
}

export enum SessionRating {
  GOOD = 'good',
  OK = 'ok',
  BAD = 'bad',
}

export enum EventType {
  VITAL_CHECK = 'vital_check',
  MEDICATION = 'medication',
  SYMPTOM = 'symptom',
  NOTE = 'note',
  ALARM = 'alarm',
  INTERVENTION = 'intervention',
}

export interface DialysisSession {
  _id: string;
  userId: string;
  mode: DialysisMode;
  type: DialysisType;
  locationName?: string;
  machineName?: string;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string;
  plannedDurationMin?: number;
  actualDurationMin?: number;
  preWeightKg?: number;
  postWeightKg?: number;
  targetUfMl?: number;
  actualUfMl?: number;
  preBpSystolic?: number;
  preBpDiastolic?: number;
  postBpSystolic?: number;
  postBpDiastolic?: number;
  preHeartRate?: number;
  postHeartRate?: number;
  sessionRating?: SessionRating;
  notes?: string;
  complications?: string[];
  createdAt: string;
  updatedAt: string;
  // Virtuals
  duration?: number;
  weightLossKg?: number;
  ufEfficiency?: number;
  isActive?: boolean;
}

export interface SessionEvent {
  _id: string;
  sessionId: string;
  timestamp: string;
  eventType: EventType;
  payload: Record<string, any>;
}

export interface CreateSessionData {
  mode: DialysisMode;
  type: DialysisType;
  plannedDurationMin?: number;
  locationName?: string;
  machineName?: string;
}

export interface UpdateSessionData {
  preWeightKg?: number;
  targetUfMl?: number;
  preBpSystolic?: number;
  preBpDiastolic?: number;
  preHeartRate?: number;
  notes?: string;
  locationName?: string;
  machineName?: string;
}

export interface EndSessionData {
  postWeightKg?: number;
  actualUfMl?: number;
  postBpSystolic?: number;
  postBpDiastolic?: number;
  postHeartRate?: number;
  sessionRating?: SessionRating;
  notes?: string;
  complications?: string[];
}

export interface AddEventData {
  eventType: EventType;
  payload: Record<string, any>;
  timestamp?: string;
}

export interface SessionsListResponse {
  sessions: DialysisSession[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface SessionDetailsResponse {
  session: DialysisSession;
  events: SessionEvent[];
  vitals: VitalRecord[];
}

// Create and start a new session
export async function createSession(data: CreateSessionData): Promise<DialysisSession> {
  const result = await authFetch('/dialysis/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.session;
}

// Update session (in-progress fields)
export async function updateSession(sessionId: string, data: UpdateSessionData): Promise<DialysisSession> {
  const result = await authFetch(`/dialysis/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data.session;
}

// Add event to session
export async function addSessionEvent(sessionId: string, data: AddEventData): Promise<SessionEvent> {
  const result = await authFetch(`/dialysis/sessions/${sessionId}/events`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.event;
}

// End session
export async function endSession(sessionId: string, data: EndSessionData): Promise<DialysisSession> {
  const result = await authFetch(`/dialysis/sessions/${sessionId}/end`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.session;
}

// List sessions
export async function listSessions(params?: {
  from?: string;
  to?: string;
  status?: SessionStatus;
  limit?: number;
  offset?: number;
}): Promise<SessionsListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.from) searchParams.append('from', params.from);
  if (params?.to) searchParams.append('to', params.to);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());

  const query = searchParams.toString();
  const result = await authFetch(`/dialysis/sessions${query ? `?${query}` : ''}`);
  return result.data;
}

// Get session details with events
export async function getSessionDetails(sessionId: string): Promise<SessionDetailsResponse> {
  const result = await authFetch(`/dialysis/sessions/${sessionId}`);
  return result.data;
}

// Get active session (if any)
export async function getActiveSession(): Promise<DialysisSession | null> {
  try {
    const result = await listSessions({ status: SessionStatus.IN_PROGRESS, limit: 1 });
    if (result.sessions.length > 0) {
      return result.sessions[0];
    }
    // Also check for started sessions
    const startedResult = await listSessions({ status: SessionStatus.STARTED, limit: 1 });
    if (startedResult.sessions.length > 0) {
      return startedResult.sessions[0];
    }
    return null;
  } catch {
    return null;
  }
}

// Helper to format duration
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// Helper to get status color
export function getStatusColor(status: SessionStatus): string {
  switch (status) {
    case SessionStatus.STARTED:
    case SessionStatus.IN_PROGRESS:
      return 'text-sky-500 bg-sky-500/10';
    case SessionStatus.COMPLETED:
      return 'text-emerald-500 bg-emerald-500/10';
    case SessionStatus.CANCELLED:
      return 'text-slate-400 bg-slate-400/10';
    default:
      return 'text-slate-400 bg-slate-400/10';
  }
}

// Helper to get rating color
export function getRatingColor(rating?: SessionRating): string {
  switch (rating) {
    case SessionRating.GOOD:
      return 'text-emerald-500';
    case SessionRating.OK:
      return 'text-amber-500';
    case SessionRating.BAD:
      return 'text-rose-500';
    default:
      return 'text-slate-400';
  }
}

// Session Analysis Types
export interface SessionAnalysis {
  period: string;
  statistics: {
    totalSessions: number;
    avgDuration: number | null;
    avgWeightLoss: number | null;
    avgUfRemoved: number | null;
    avgPreBp: { systolic: number; diastolic: number } | null;
    avgPostBp: { systolic: number; diastolic: number } | null;
    ratings: { good: number; ok: number; bad: number };
    sessionsWithComplications: number;
    mostCommonComplications: string[];
  };
  analysis: {
    summary: string;
    overallStatus: 'good' | 'fair' | 'concerning';
    sessionAdherence: {
      status: 'excellent' | 'good' | 'needs_improvement';
      insight: string;
    };
    fluidManagement: {
      status: 'well_controlled' | 'moderate' | 'needs_attention';
      avgWeightGain?: string;
      insight: string;
    };
    bloodPressure: {
      preTrend: 'stable' | 'variable' | 'elevated' | 'low';
      postTrend: 'stable' | 'variable' | 'concerning_drops';
      insight: string;
    };
    complications: {
      frequency: 'rare' | 'occasional' | 'frequent' | 'none';
      commonTypes: string[];
      insight: string;
    };
    positives: string[];
    areasToDiscuss: string[];
    suggestions: string[];
    disclaimer: string;
  };
  analyzedAt: string;
  disclaimer: string;
}

// AI-powered session analysis
export async function analyzeSessions(days: number = 30): Promise<SessionAnalysis> {
  const result = await authFetch(`/dialysis/sessions/analyze?days=${days}`);
  return result.data;
}
