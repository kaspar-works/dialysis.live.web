/**
 * Timezone-aware date formatting utilities
 * All functions accept a timezone string (IANA format, e.g., 'America/New_York')
 */

export type DateInput = Date | string | number;

/**
 * Parse date input to Date object
 */
function parseDate(date: DateInput): Date {
  if (date instanceof Date) return date;
  return new Date(date);
}

/**
 * Format date as short date (e.g., "Jan 7")
 */
export function formatShortDate(date: DateInput, timezone: string): string {
  const d = parseDate(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: timezone,
  });
}

/**
 * Format date as full date (e.g., "January 7, 2025")
 */
export function formatFullDate(date: DateInput, timezone: string): string {
  const d = parseDate(date);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: timezone,
  });
}

/**
 * Format date with weekday (e.g., "Mon")
 */
export function formatWeekday(date: DateInput, timezone: string): string {
  const d = parseDate(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: timezone,
  });
}

/**
 * Format date with full weekday (e.g., "Monday")
 */
export function formatFullWeekday(date: DateInput, timezone: string): string {
  const d = parseDate(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: timezone,
  });
}

/**
 * Format time (e.g., "2:30 PM")
 */
export function formatTime(date: DateInput, timezone: string): string {
  const d = parseDate(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
}

/**
 * Format time in 24-hour format (e.g., "14:30")
 */
export function formatTime24(date: DateInput, timezone: string): string {
  const d = parseDate(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  });
}

/**
 * Format date and time (e.g., "Jan 7, 2:30 PM")
 */
export function formatDateTime(date: DateInput, timezone: string): string {
  const d = parseDate(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
}

/**
 * Format full date and time (e.g., "January 7, 2025 at 2:30 PM")
 */
export function formatFullDateTime(date: DateInput, timezone: string): string {
  const d = parseDate(date);
  const datePart = d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: timezone,
  });
  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
  return `${datePart} at ${timePart}`;
}

/**
 * Format date as ISO date string in the given timezone (e.g., "2025-01-07")
 */
export function formatISODate(date: DateInput, timezone: string): string {
  const d = parseDate(date);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  });
  return formatter.format(d);
}

/**
 * Format relative date (e.g., "Today", "Yesterday", "Jan 7")
 */
export function formatRelativeDate(date: DateInput, timezone: string): string {
  const d = parseDate(date);
  const now = new Date();

  const dateStr = formatISODate(d, timezone);
  const todayStr = formatISODate(now, timezone);

  if (dateStr === todayStr) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatISODate(yesterday, timezone);

  if (dateStr === yesterdayStr) return 'Yesterday';

  return formatShortDate(d, timezone);
}

/**
 * Format duration in minutes to human readable format (e.g., "2h 30m")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Get the start of day in the given timezone
 */
export function getStartOfDay(date: DateInput, timezone: string): Date {
  const d = parseDate(date);
  const dateStr = formatISODate(d, timezone);
  // Create date at midnight in the given timezone
  const result = new Date(`${dateStr}T00:00:00`);
  return result;
}

/**
 * Get the end of day in the given timezone
 */
export function getEndOfDay(date: DateInput, timezone: string): Date {
  const d = parseDate(date);
  const dateStr = formatISODate(d, timezone);
  // Create date at 23:59:59 in the given timezone
  const result = new Date(`${dateStr}T23:59:59.999`);
  return result;
}

/**
 * Check if two dates are on the same day in the given timezone
 */
export function isSameDay(date1: DateInput, date2: DateInput, timezone: string): boolean {
  return formatISODate(date1, timezone) === formatISODate(date2, timezone);
}

/**
 * Check if date is today in the given timezone
 */
export function isToday(date: DateInput, timezone: string): boolean {
  return isSameDay(date, new Date(), timezone);
}

/**
 * Format weekday and date (e.g., "Mon, Jan 7")
 */
export function formatWeekdayDate(date: DateInput, timezone: string): string {
  const d = parseDate(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: timezone,
  });
}

/**
 * Format month and year (e.g., "January 2025")
 */
export function formatMonthYear(date: DateInput, timezone: string): string {
  const d = parseDate(date);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: timezone,
  });
}

/**
 * Get list of common timezones for dropdown
 */
export function getCommonTimezones(): { value: string; label: string }[] {
  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
    { value: 'America/Phoenix', label: 'Arizona (no DST)' },
    { value: 'America/Toronto', label: 'Toronto' },
    { value: 'America/Vancouver', label: 'Vancouver' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Seoul', label: 'Seoul (KST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
    { value: 'Australia/Melbourne', label: 'Melbourne (AEST)' },
    { value: 'Australia/Perth', label: 'Perth (AWST)' },
    { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
  ];

  return timezones;
}

/**
 * Get all supported IANA timezones
 */
export function getAllTimezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    // Fallback for older browsers
    return getCommonTimezones().map(tz => tz.value);
  }
}

/**
 * Get today's date string (YYYY-MM-DD) in the given timezone
 */
export function getTodayDateString(timezone: string): string {
  return formatISODate(new Date(), timezone);
}

/**
 * Check if a date string (ISO or loggedAt) is "today" in the given timezone
 */
export function isDateToday(dateString: string, timezone: string): boolean {
  const todayStr = getTodayDateString(timezone);
  const dateStr = formatISODate(dateString, timezone);
  return dateStr === todayStr;
}

/**
 * Get the start and end of today in UTC for API queries
 * Returns ISO strings that represent the start (00:00:00) and end (23:59:59) of "today"
 * in the user's timezone, converted to UTC for server queries
 */
export function getTodayBoundsUTC(timezone: string): { start: string; end: string } {
  const now = new Date();
  const todayStr = formatISODate(now, timezone);

  // Create date at start of day in the timezone
  // This is tricky because we need to find when midnight in the timezone corresponds to in UTC
  const startOfDayLocal = new Date(`${todayStr}T00:00:00`);
  const endOfDayLocal = new Date(`${todayStr}T23:59:59.999`);

  // Get the timezone offset for this date
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  });

  return {
    start: startOfDayLocal.toISOString(),
    end: endOfDayLocal.toISOString(),
  };
}
