import { authFetch, apiFetch } from './auth';

export type PlanType = 'free' | 'basic' | 'premium';

export interface UserSubscription {
  plan: PlanType;
  status: string;
}

export interface AdminUser {
  _id: string;
  email: string;
  status: string;
  isAdmin: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  subscription?: UserSubscription;
}

export interface SystemStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
  };
  alerts: {
    total: number;
    active: number;
  };
  userGrowth: Array<{ _id: string; count: number }>;
}

export interface SystemAlert {
  _id: string;
  userId: { email: string } | null;
  type: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  category: string;
  createdAt: string;
}

export interface SystemAnnouncement {
  _id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  dismissible: boolean;
  isActive: boolean;
  priority: number;
  startDate: string | null;
  endDate: string | null;
  linkUrl?: string;
  linkText?: string;
  createdBy?: { email: string };
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  _id: string;
  userId: { email: string } | null;
  action: string;
  details: string;
  createdAt: string;
}

export interface ErrorLogEntry {
  _id: string;
  level: 'error' | 'warn' | 'critical';
  message: string;
  stack?: string;
  code?: string;
  endpoint?: string;
  method?: string;
  userId?: string;
  userEmail?: string;
  ip?: string;
  userAgent?: string;
  requestBody?: object;
  metadata?: object;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorLogStats {
  critical: number;
  error: number;
  warn: number;
  unresolved: number;
}

// Verify admin status
export async function verifyAdmin(): Promise<{ isAdmin: boolean; email: string }> {
  const response = await authFetch('/admin/verify');
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to verify admin status');
  }
  return response.data;
}

// Get system statistics
export async function getSystemStats(): Promise<SystemStats> {
  const response = await authFetch('/admin/stats');
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to get system stats');
  }
  return response.data;
}

// Get all users
export async function getUsers(params?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ users: AdminUser[]; pagination: { total: number; limit: number; offset: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  const queryString = searchParams.toString();
  const response = await authFetch(`/admin/users${queryString ? `?${queryString}` : ''}`);
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to get users');
  }
  return response.data;
}

// Get all alerts
export async function getAllAlerts(params?: {
  status?: string;
  severity?: string;
  limit?: number;
  offset?: number;
}): Promise<{ alerts: SystemAlert[]; pagination: { total: number; limit: number; offset: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.severity) searchParams.set('severity', params.severity);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  const queryString = searchParams.toString();
  const response = await authFetch(`/admin/alerts${queryString ? `?${queryString}` : ''}`);
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to get alerts');
  }
  return response.data;
}

// Get activity logs
export async function getActivityLogs(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ logs: ActivityLog[]; pagination: { total: number; limit: number; offset: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  const queryString = searchParams.toString();
  const response = await authFetch(`/admin/activity${queryString ? `?${queryString}` : ''}`);
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to get activity logs');
  }
  return response.data;
}

// Get all announcements (admin)
export async function getAnnouncements(params?: {
  isActive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ announcements: SystemAnnouncement[]; pagination: { total: number; limit: number; offset: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  const queryString = searchParams.toString();
  const response = await authFetch(`/admin/announcements${queryString ? `?${queryString}` : ''}`);
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to get announcements');
  }
  return response.data;
}

// Create announcement
export async function createAnnouncement(data: {
  type?: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  dismissible?: boolean;
  isActive?: boolean;
  priority?: number;
  startDate?: string | null;
  endDate?: string | null;
  linkUrl?: string;
  linkText?: string;
}): Promise<{ announcement: SystemAnnouncement }> {
  const response = await authFetch('/admin/announcements', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to create announcement');
  }
  return response.data;
}

// Update announcement
export async function updateAnnouncement(id: string, data: Partial<{
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  dismissible: boolean;
  isActive: boolean;
  priority: number;
  startDate: string | null;
  endDate: string | null;
  linkUrl: string;
  linkText: string;
}>): Promise<{ announcement: SystemAnnouncement }> {
  const response = await authFetch(`/admin/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to update announcement');
  }
  return response.data;
}

// Delete announcement
export async function deleteAnnouncement(id: string): Promise<void> {
  const response = await authFetch(`/admin/announcements/${id}`, {
    method: 'DELETE',
  });
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to delete announcement');
  }
}

// Public announcement interface (for dashboard)
export interface PublicAnnouncement {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  dismissible: boolean;
  linkUrl?: string;
  linkText?: string;
}

// Get active announcements (public - for dashboard)
export async function getActiveAnnouncements(): Promise<{ announcements: PublicAnnouncement[] }> {
  const response = await apiFetch('/announcements');
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to get announcements');
  }
  return response.data;
}

// Get error logs
export async function getErrorLogs(params?: {
  level?: 'error' | 'warn' | 'critical';
  resolved?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{
  errors: ErrorLogEntry[];
  stats: ErrorLogStats;
  pagination: { total: number; limit: number; offset: number };
}> {
  const searchParams = new URLSearchParams();
  if (params?.level) searchParams.set('level', params.level);
  if (params?.resolved !== undefined) searchParams.set('resolved', String(params.resolved));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  const queryString = searchParams.toString();
  const response = await authFetch(`/admin/errors${queryString ? `?${queryString}` : ''}`);
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to get error logs');
  }
  return response.data;
}

// Get error log by ID
export async function getErrorLogById(id: string): Promise<{ error: ErrorLogEntry }> {
  const response = await authFetch(`/admin/errors/${id}`);
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to get error log');
  }
  return response.data;
}

// Resolve error
export async function resolveError(id: string): Promise<{ error: ErrorLogEntry }> {
  const response = await authFetch(`/admin/errors/${id}/resolve`, {
    method: 'PUT',
  });
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to resolve error');
  }
  return response.data;
}

// Delete error log
export async function deleteErrorLog(id: string): Promise<void> {
  const response = await authFetch(`/admin/errors/${id}`, {
    method: 'DELETE',
  });
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to delete error log');
  }
}

// Delete all resolved errors
export async function deleteResolvedErrors(): Promise<{ deletedCount: number }> {
  const response = await authFetch('/admin/errors/resolved', {
    method: 'DELETE',
  });
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to delete resolved errors');
  }
  return response.data;
}

// Page Settings
export interface PageSetting {
  path: string;
  name: string;
  enabled: boolean;
  category: 'health' | 'tracking' | 'ai' | 'settings' | 'other';
}

// Get page settings (admin)
export async function getPageSettings(): Promise<{ pages: PageSetting[] }> {
  const response = await authFetch('/admin/page-settings');
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to get page settings');
  }
  return response.data;
}

// Update all page settings
export async function updatePageSettings(pages: PageSetting[]): Promise<{ pages: PageSetting[] }> {
  const response = await authFetch('/admin/page-settings', {
    method: 'PUT',
    body: JSON.stringify({ pages }),
  });
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to update page settings');
  }
  return response.data;
}

// Toggle single page setting
export async function togglePageSetting(path: string, enabled: boolean): Promise<{ page: PageSetting }> {
  const encodedPath = encodeURIComponent(path);
  const response = await authFetch(`/admin/page-settings/${encodedPath}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to toggle page setting');
  }
  return response.data;
}

// Get public page settings (for frontend routing)
export async function getPublicPageSettings(): Promise<{ pages: Record<string, { enabled: boolean; name: string }> }> {
  const response = await apiFetch('/page-settings');
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to get page settings');
  }
  return response.data;
}

// Update user subscription (admin only)
export async function updateUserSubscription(
  userId: string,
  plan: PlanType
): Promise<{ subscription: UserSubscription }> {
  const response = await authFetch(`/admin/users/${userId}/subscription`, {
    method: 'PUT',
    body: JSON.stringify({ plan }),
  });
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to update user subscription');
  }
  return response.data;
}
