import { authFetch } from './auth';

// Types
export type ReminderType =
  | 'medication'
  | 'dialysis_session'
  | 'weight_log'
  | 'fluid_log'
  | 'vital_check'
  | 'appointment'
  | 'custom';

export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

export type ReminderStatus = 'active' | 'snoozed' | 'completed' | 'dismissed';

export interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
}

export interface Reminder {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  type: ReminderType;
  frequency: ReminderFrequency;
  time: string;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  enabled: boolean;
  status: ReminderStatus;
  lastTriggered?: string;
  nextTrigger?: string;
  snoozedUntil?: string;
  linkedEntityId?: string;
  linkedEntityType?: string;
  notificationSettings: NotificationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderData {
  title: string;
  description?: string;
  type: ReminderType;
  frequency: ReminderFrequency;
  time: string;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  notificationSettings?: Partial<NotificationSettings>;
  linkedEntityId?: string;
  linkedEntityType?: string;
}

export interface UpdateReminderData extends Partial<CreateReminderData> {
  enabled?: boolean;
}

export interface ReminderStats {
  total: number;
  enabled: number;
  disabled: number;
  byType: Record<ReminderType, number>;
  byFrequency: Record<ReminderFrequency, number>;
}

// API Functions

/**
 * Create a new reminder
 */
export async function createReminder(data: CreateReminderData): Promise<Reminder> {
  const result = await authFetch('/reminders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.reminder;
}

/**
 * Get all reminders
 */
export async function getReminders(params?: {
  type?: ReminderType;
  enabled?: boolean;
  status?: ReminderStatus;
}): Promise<Reminder[]> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.append('type', params.type);
  if (params?.enabled !== undefined) searchParams.append('enabled', String(params.enabled));
  if (params?.status) searchParams.append('status', params.status);

  const queryString = searchParams.toString();
  const result = await authFetch(`/reminders${queryString ? `?${queryString}` : ''}`);
  return result.data.reminders;
}

/**
 * Get a single reminder
 */
export async function getReminder(reminderId: string): Promise<Reminder> {
  const result = await authFetch(`/reminders/${reminderId}`);
  return result.data.reminder;
}

/**
 * Update a reminder
 */
export async function updateReminder(reminderId: string, data: UpdateReminderData): Promise<Reminder> {
  const result = await authFetch(`/reminders/${reminderId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data.reminder;
}

/**
 * Delete a reminder
 */
export async function deleteReminder(reminderId: string): Promise<void> {
  await authFetch(`/reminders/${reminderId}`, {
    method: 'DELETE',
  });
}

/**
 * Toggle reminder enabled/disabled
 */
export async function toggleReminder(reminderId: string): Promise<Reminder> {
  const result = await authFetch(`/reminders/${reminderId}/toggle`, {
    method: 'POST',
  });
  return result.data.reminder;
}

/**
 * Snooze a reminder
 */
export async function snoozeReminder(reminderId: string, minutes: number = 30): Promise<Reminder> {
  const result = await authFetch(`/reminders/${reminderId}/snooze`, {
    method: 'POST',
    body: JSON.stringify({ minutes }),
  });
  return result.data.reminder;
}

/**
 * Mark reminder as completed
 */
export async function completeReminder(reminderId: string): Promise<Reminder> {
  const result = await authFetch(`/reminders/${reminderId}/complete`, {
    method: 'POST',
  });
  return result.data.reminder;
}

/**
 * Dismiss a reminder
 */
export async function dismissReminder(reminderId: string): Promise<Reminder> {
  const result = await authFetch(`/reminders/${reminderId}/dismiss`, {
    method: 'POST',
  });
  return result.data.reminder;
}

/**
 * Get upcoming reminders
 */
export async function getUpcomingReminders(hours: number = 24): Promise<Reminder[]> {
  const result = await authFetch(`/reminders/upcoming?hours=${hours}`);
  return result.data.reminders;
}

/**
 * Get reminders by type
 */
export async function getRemindersByType(type: ReminderType): Promise<Reminder[]> {
  const result = await authFetch(`/reminders/type/${type}`);
  return result.data.reminders;
}

/**
 * Get reminder statistics
 */
export async function getReminderStats(): Promise<ReminderStats> {
  const result = await authFetch('/reminders/stats');
  return result.data.stats;
}

/**
 * Bulk update reminders
 */
export async function bulkUpdateReminders(
  reminderIds: string[],
  enabled: boolean
): Promise<number> {
  const result = await authFetch('/reminders/bulk', {
    method: 'PATCH',
    body: JSON.stringify({ reminderIds, enabled }),
  });
  return result.data.modifiedCount;
}

// Helper Functions

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  medication: 'Medication',
  dialysis_session: 'Dialysis Session',
  weight_log: 'Weight Log',
  fluid_log: 'Fluid Intake',
  vital_check: 'Vital Check',
  appointment: 'Appointment',
  custom: 'Custom',
};

export const REMINDER_TYPE_ICONS: Record<ReminderType, string> = {
  medication: '💊',
  dialysis_session: '🏥',
  weight_log: '⚖️',
  fluid_log: '💧',
  vital_check: '❤️',
  appointment: '📅',
  custom: '🔔',
};

export const FREQUENCY_LABELS: Record<ReminderFrequency, string> = {
  once: 'One Time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatReminderTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function formatNextTrigger(dateString?: string): string {
  if (!dateString) return 'Not scheduled';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 0) return 'Overdue';
  if (diffMins < 60) return `In ${diffMins} min`;
  if (diffHours < 24) return `In ${diffHours} hours`;

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getScheduleDescription(reminder: Reminder): string {
  const time = formatReminderTime(reminder.time);

  switch (reminder.frequency) {
    case 'once':
      return `Once at ${time}`;
    case 'daily':
      return `Daily at ${time}`;
    case 'weekly':
      if (reminder.daysOfWeek && reminder.daysOfWeek.length > 0) {
        if (reminder.daysOfWeek.length === 7) return `Every day at ${time}`;
        if (reminder.daysOfWeek.length === 5 && !reminder.daysOfWeek.includes(0) && !reminder.daysOfWeek.includes(6)) {
          return `Weekdays at ${time}`;
        }
        const days = reminder.daysOfWeek.map((d) => DAY_NAMES[d]).join(', ');
        return `${days} at ${time}`;
      }
      return `Weekly at ${time}`;
    case 'monthly':
      if (reminder.dayOfMonth) {
        const suffix = getOrdinalSuffix(reminder.dayOfMonth);
        return `${reminder.dayOfMonth}${suffix} of each month at ${time}`;
      }
      return `Monthly at ${time}`;
    default:
      return time;
  }
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
