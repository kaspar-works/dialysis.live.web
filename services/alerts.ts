import { authFetch } from './auth';

export type AlertType =
  | 'weight_gain'
  | 'weight_above_dry'
  | 'fluid_limit_exceeded'
  | 'fluid_limit_warning'
  | 'bp_high'
  | 'bp_low'
  | 'heart_rate_high'
  | 'heart_rate_low'
  | 'spo2_low'
  | 'blood_sugar_high'
  | 'blood_sugar_low'
  | 'temperature_high'
  | 'symptom_severe'
  | 'symptom_recurring'
  | 'missed_dialysis'
  | 'session_overdue';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'dismissed' | 'resolved';
export type AlertCategory = 'weight' | 'fluid' | 'vitals' | 'symptoms' | 'session';

export interface Alert {
  _id: string;
  userId: string;
  type: AlertType;
  category: AlertCategory;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  sourceId?: string;
  sourceType?: string;
  value?: number;
  threshold?: number;
  unit?: string;
  acknowledgedAt?: string;
  dismissedAt?: string;
  resolvedAt?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertCounts {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface DashboardAlertsResponse {
  alerts: Alert[];
  counts: AlertCounts;
  hasUrgent: boolean;
  total: number;
}

export interface GetAlertsParams {
  status?: AlertStatus;
  category?: AlertCategory;
  severity?: AlertSeverity;
  limit?: number;
  offset?: number;
}

export interface AlertsResponse {
  alerts: Alert[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Get dashboard alerts summary
 * GET /api/v1/alerts/dashboard
 */
export async function getDashboardAlerts(): Promise<DashboardAlertsResponse> {
  const result = await authFetch('/alerts/dashboard');
  return result.data;
}

/**
 * Get alert counts by severity
 * GET /api/v1/alerts/counts
 */
export async function getAlertCounts(): Promise<{ counts: AlertCounts; total: number; hasUrgent: boolean }> {
  const result = await authFetch('/alerts/counts');
  return result.data;
}

/**
 * Get all alerts with filtering
 * GET /api/v1/alerts
 */
export async function getAlerts(params: GetAlertsParams = {}): Promise<AlertsResponse> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.append('status', params.status);
  if (params.category) searchParams.append('category', params.category);
  if (params.severity) searchParams.append('severity', params.severity);
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());

  const query = searchParams.toString();
  const result = await authFetch(`/alerts${query ? `?${query}` : ''}`);
  return result.data;
}

/**
 * Get alerts by category
 * GET /api/v1/alerts/category/:category
 */
export async function getAlertsByCategory(category: AlertCategory): Promise<{ alerts: Alert[]; category: string }> {
  const result = await authFetch(`/alerts/category/${category}`);
  return result.data;
}

/**
 * Get single alert
 * GET /api/v1/alerts/:id
 */
export async function getAlert(id: string): Promise<Alert> {
  const result = await authFetch(`/alerts/${id}`);
  return result.data.alert;
}

/**
 * Acknowledge an alert
 * POST /api/v1/alerts/:id/acknowledge
 */
export async function acknowledgeAlert(id: string): Promise<Alert> {
  const result = await authFetch(`/alerts/${id}/acknowledge`, {
    method: 'POST',
  });
  return result.data.alert;
}

/**
 * Mark an alert as read (alias for acknowledge)
 * POST /api/v1/alerts/:id/acknowledge
 */
export async function markAsRead(id: string): Promise<Alert> {
  return acknowledgeAlert(id);
}

/**
 * Mark all alerts as read
 * POST /api/v1/alerts/acknowledge-all (bulk)
 */
export async function markAllAsRead(): Promise<{ acknowledgedCount: number }> {
  const result = await authFetch('/alerts/acknowledge-all', {
    method: 'POST',
  });
  return result.data;
}

/**
 * Dismiss an alert
 * POST /api/v1/alerts/:id/dismiss
 */
export async function dismissAlert(id: string): Promise<Alert> {
  const result = await authFetch(`/alerts/${id}/dismiss`, {
    method: 'POST',
  });
  return result.data.alert;
}

/**
 * Dismiss all alerts (optionally by category)
 * POST /api/v1/alerts/dismiss-all
 */
export async function dismissAllAlerts(category?: AlertCategory): Promise<{ dismissedCount: number }> {
  const result = await authFetch('/alerts/dismiss-all', {
    method: 'POST',
    body: category ? JSON.stringify({ category }) : undefined,
  });
  return result.data;
}

/**
 * Generate/refresh alerts based on current health data
 * POST /api/v1/alerts/refresh
 */
export async function refreshAlerts(): Promise<{ newAlerts: Alert[]; count: number }> {
  const result = await authFetch('/alerts/refresh', {
    method: 'POST',
  });
  return result.data;
}

/**
 * Get alert history
 * GET /api/v1/alerts/history
 */
export async function getAlertHistory(days: number = 30, limit: number = 100): Promise<{
  alerts: Alert[];
  byDate: Record<string, Alert[]>;
  total: number;
}> {
  const result = await authFetch(`/alerts/history?days=${days}&limit=${limit}`);
  return result.data;
}

/**
 * Helper to get severity color
 */
export function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return 'rose';
    case 'high':
      return 'orange';
    case 'medium':
      return 'amber';
    case 'low':
    default:
      return 'sky';
  }
}

/**
 * Helper to get severity icon
 */
export function getSeverityIcon(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return '🚨';
    case 'high':
      return '⚠️';
    case 'medium':
      return '⚡';
    case 'low':
    default:
      return 'ℹ️';
  }
}

/**
 * Helper to get category icon
 */
export function getCategoryIcon(category: AlertCategory): string {
  switch (category) {
    case 'weight':
      return '⚖️';
    case 'fluid':
      return '💧';
    case 'vitals':
      return '❤️';
    case 'symptoms':
      return '🩺';
    case 'session':
      return '🏥';
    default:
      return '📋';
  }
}
