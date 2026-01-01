import { authFetch } from './auth';

// Types
export type AppointmentType =
  | 'dialysis'
  | 'nephrologist'
  | 'lab_work'
  | 'checkup'
  | 'specialist'
  | 'surgery'
  | 'follow_up'
  | 'other';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export interface Provider {
  name: string;
  specialty?: string;
  phone?: string;
  email?: string;
}

export interface RecurringPattern {
  frequency: 'weekly' | 'biweekly' | 'monthly';
  endDate?: string;
  daysOfWeek?: number[];
}

export interface Appointment {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  type: AppointmentType;
  status: AppointmentStatus;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  location?: string;
  address?: string;
  provider?: Provider;
  notes?: string;
  reminderEnabled: boolean;
  reminderMinutesBefore?: number;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentData {
  title: string;
  description?: string;
  type: AppointmentType;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  location?: string;
  address?: string;
  provider?: Provider;
  notes?: string;
  reminderEnabled?: boolean;
  reminderMinutesBefore?: number;
}

export interface UpdateAppointmentData extends Partial<CreateAppointmentData> {
  status?: AppointmentStatus;
}

export interface AppointmentStats {
  total: number;
  upcoming: number;
  thisMonth: number;
  byType: Record<AppointmentType, number>;
  byStatus: Record<AppointmentStatus, number>;
}

// API Functions

/**
 * Create a new appointment
 */
export async function createAppointment(data: CreateAppointmentData): Promise<Appointment> {
  const result = await authFetch('/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.appointment;
}

/**
 * Get all appointments
 */
export async function getAppointments(params?: {
  type?: AppointmentType;
  status?: AppointmentStatus;
  from?: string;
  to?: string;
  upcoming?: boolean;
}): Promise<Appointment[]> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.append('type', params.type);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.from) searchParams.append('from', params.from);
  if (params?.to) searchParams.append('to', params.to);
  if (params?.upcoming) searchParams.append('upcoming', 'true');

  const queryString = searchParams.toString();
  const result = await authFetch(`/appointments${queryString ? `?${queryString}` : ''}`);
  return result.data.appointments;
}

/**
 * Get a single appointment
 */
export async function getAppointment(appointmentId: string): Promise<Appointment> {
  const result = await authFetch(`/appointments/${appointmentId}`);
  return result.data.appointment;
}

/**
 * Update an appointment
 */
export async function updateAppointment(
  appointmentId: string,
  data: UpdateAppointmentData
): Promise<Appointment> {
  const result = await authFetch(`/appointments/${appointmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data.appointment;
}

/**
 * Delete an appointment
 */
export async function deleteAppointment(appointmentId: string): Promise<void> {
  await authFetch(`/appointments/${appointmentId}`, {
    method: 'DELETE',
  });
}

/**
 * Get upcoming appointments
 */
export async function getUpcomingAppointments(days: number = 7): Promise<Appointment[]> {
  const result = await authFetch(`/appointments/upcoming?days=${days}`);
  return result.data.appointments;
}

/**
 * Get today's appointments
 */
export async function getTodayAppointments(): Promise<Appointment[]> {
  const result = await authFetch('/appointments/today');
  return result.data.appointments;
}

/**
 * Get appointments by month
 */
export async function getAppointmentsByMonth(
  year: number,
  month: number
): Promise<{ appointments: Appointment[]; groupedByDate: Record<string, Appointment[]> }> {
  const result = await authFetch(`/appointments/month/${year}/${month}`);
  return {
    appointments: result.data.appointments,
    groupedByDate: result.data.groupedByDate,
  };
}

/**
 * Get appointment statistics
 */
export async function getAppointmentStats(): Promise<AppointmentStats> {
  const result = await authFetch('/appointments/stats');
  return result.data.stats;
}

/**
 * Get appointments by type
 */
export async function getAppointmentsByType(type: AppointmentType): Promise<Appointment[]> {
  const result = await authFetch(`/appointments/type/${type}`);
  return result.data.appointments;
}

/**
 * Confirm an appointment
 */
export async function confirmAppointment(appointmentId: string): Promise<Appointment> {
  const result = await authFetch(`/appointments/${appointmentId}/confirm`, {
    method: 'POST',
  });
  return result.data.appointment;
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(appointmentId: string, reason?: string): Promise<Appointment> {
  const result = await authFetch(`/appointments/${appointmentId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return result.data.appointment;
}

/**
 * Reschedule an appointment
 */
export async function rescheduleAppointment(
  appointmentId: string,
  date: string,
  startTime: string,
  endTime?: string
): Promise<Appointment> {
  const result = await authFetch(`/appointments/${appointmentId}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ date, startTime, endTime }),
  });
  return result.data.appointment;
}

/**
 * Complete an appointment
 */
export async function completeAppointment(appointmentId: string, notes?: string): Promise<Appointment> {
  const result = await authFetch(`/appointments/${appointmentId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
  return result.data.appointment;
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<Appointment> {
  const result = await authFetch(`/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return result.data.appointment;
}

// Helper Functions

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  dialysis: 'Dialysis Session',
  nephrologist: 'Nephrologist Visit',
  lab_work: 'Lab Work',
  checkup: 'Check-up',
  specialist: 'Specialist',
  surgery: 'Surgery',
  follow_up: 'Follow-up',
  other: 'Other',
};

export const APPOINTMENT_TYPE_ICONS: Record<AppointmentType, string> = {
  dialysis: '🏥',
  nephrologist: '👨‍⚕️',
  lab_work: '🧪',
  checkup: '🩺',
  specialist: '👩‍⚕️',
  surgery: '🔪',
  follow_up: '📋',
  other: '📅',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
  rescheduled: 'Rescheduled',
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: 'sky',
  confirmed: 'emerald',
  in_progress: 'amber',
  completed: 'slate',
  cancelled: 'rose',
  no_show: 'red',
  rescheduled: 'purple',
};

export function formatAppointmentTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function formatAppointmentDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatAppointmentDateTime(dateString: string, time: string): string {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return `${formattedDate} at ${formatAppointmentTime(time)}`;
}

export function isUpcoming(appointment: Appointment): boolean {
  const appointmentDate = new Date(appointment.date);
  const [hours, minutes] = appointment.startTime.split(':').map(Number);
  appointmentDate.setHours(hours, minutes, 0, 0);
  return appointmentDate > new Date();
}

export function isPast(appointment: Appointment): boolean {
  return !isUpcoming(appointment);
}

export function getRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return formatAppointmentDate(dateString);
}

export function getDurationString(minutes?: number): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}
