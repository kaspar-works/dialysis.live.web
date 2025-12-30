import { authFetch } from './auth';

// ============================================
// Legacy Vital Types (for backward compatibility)
// ============================================

export type VitalType = 'blood_pressure' | 'heart_rate' | 'temperature' | 'spo2';

export interface VitalLog {
  _id: string;
  userId: string;
  loggedAt: string;
  type: VitalType;
  value1: number;
  value2?: number;
  unit: string;
  sessionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVitalData {
  type: VitalType;
  value1: number;
  value2?: number;
  unit: string;
  loggedAt?: string;
  sessionId?: string;
  notes?: string;
}

export interface GetVitalsParams {
  from?: string;
  to?: string;
  type?: VitalType;
  limit?: number;
  offset?: number;
}

export interface VitalsResponse {
  logs: VitalLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

// ============================================
// New Consolidated Vital Record Types
// ============================================

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type BloodSugarUnit = 'mg/dL' | 'mmol/L';
export type WeightUnit = 'kg' | 'lbs';
export type BloodSugarTiming = 'fasting' | 'before_meal' | 'after_meal' | 'bedtime' | 'random';
export type VitalSource = 'manual' | 'device' | 'import';
export type VitalTypeFilter = 'bloodPressure' | 'heartRate' | 'temperature' | 'spo2' | 'bloodSugar' | 'weight' | 'respiratoryRate';

export interface BloodPressure {
  systolic: number;   // mmHg (50-300)
  diastolic: number;  // mmHg (30-200)
}

export interface Temperature {
  value: number;
  unit: TemperatureUnit;
}

export interface BloodSugar {
  value: number;
  unit: BloodSugarUnit;
  timing?: BloodSugarTiming;
}

export interface Weight {
  value: number;
  unit: WeightUnit;
}

export interface VitalRecord {
  _id: string;
  userId: string;
  loggedAt: string;
  sessionId?: string;
  bloodPressure?: BloodPressure;
  heartRate?: number;           // bpm (20-300)
  temperature?: Temperature;
  spo2?: number;                // percentage (0-100)
  bloodSugar?: BloodSugar;
  weight?: Weight;
  respiratoryRate?: number;     // breaths per minute (0-100)
  notes?: string;
  source?: VitalSource;
  createdAt: string;
  updatedAt: string;
}

// Input type for creating/updating vital records
export interface VitalRecordInput {
  loggedAt?: string;
  sessionId?: string;
  bloodPressure?: BloodPressure;
  heartRate?: number;
  temperature?: Temperature;
  spo2?: number;
  bloodSugar?: BloodSugar;
  weight?: Weight;
  respiratoryRate?: number;
  notes?: string;
  source?: VitalSource;
}

export interface GetVitalRecordsParams {
  from?: string;
  to?: string;
  sessionId?: string;
  hasVital?: VitalTypeFilter;
  limit?: number;
  offset?: number;
}

export interface VitalRecordsResponse {
  records: VitalRecord[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface LatestVitals {
  bloodPressure: { systolic: number; diastolic: number; loggedAt: string } | null;
  heartRate: { value: number; loggedAt: string } | null;
  temperature: { value: number; unit: string; loggedAt: string } | null;
  spo2: { value: number; loggedAt: string } | null;
  bloodSugar: { value: number; unit: string; timing?: string; loggedAt: string } | null;
  weight: { value: number; unit: string; loggedAt: string } | null;
}

export interface TodayVitalsResponse {
  date: string;
  totalRecords: number;
  latestVitals: LatestVitals;
  records: VitalRecord[];
}

export interface VitalSummary {
  period: string;
  totalRecords: number;
  bloodPressure: {
    count: number;
    avgSystolic: number;
    avgDiastolic: number;
    range: {
      systolic: { min: number; max: number };
      diastolic: { min: number; max: number };
    };
  } | null;
  heartRate: {
    count: number;
    avg: number;
    min: number;
    max: number;
  } | null;
  spo2: {
    count: number;
    avg: number;
    min: number;
    max: number;
  } | null;
  bloodSugar: {
    count: number;
    avg: number;
    min: number;
    max: number;
  } | null;
  temperature: {
    count: number;
    avgCelsius: number;
    minCelsius: number;
    maxCelsius: number;
  } | null;
}

export async function createVitalLog(data: CreateVitalData): Promise<VitalLog> {
  const result = await authFetch('/vitals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.vitalLog;
}

export async function getVitalLogs(params: GetVitalsParams = {}): Promise<VitalsResponse> {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.type) searchParams.append('type', params.type);
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/vitals?${queryString}` : '/vitals';

  const result = await authFetch(endpoint);
  return result.data;
}

export async function getLatestVitals(): Promise<VitalLog[]> {
  const result = await authFetch('/vitals?limit=50');
  return result.data.logs;
}

// ============================================
// New Consolidated Vital Record API Functions
// ============================================

/**
 * Create a vital record with any combination of vitals
 * POST /api/v1/vitals/record
 *
 * @example
 * // Log blood pressure and heart rate together
 * await createVitalRecord({
 *   bloodPressure: { systolic: 120, diastolic: 80 },
 *   heartRate: 72,
 *   notes: "Morning check"
 * });
 *
 * @example
 * // Log blood sugar with timing
 * await createVitalRecord({
 *   bloodSugar: { value: 110, unit: 'mg/dL', timing: 'fasting' }
 * });
 */
export async function createVitalRecord(data: VitalRecordInput): Promise<VitalRecord> {
  const result = await authFetch('/vitals/record', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.vitalRecord;
}

/**
 * Get vital records with optional filtering
 * GET /api/v1/vitals/records
 *
 * @param params - Filter options
 * @param params.from - Start date (ISO string)
 * @param params.to - End date (ISO string)
 * @param params.sessionId - Filter by dialysis session
 * @param params.hasVital - Filter by vital type presence
 * @param params.limit - Max results (default 50, max 200)
 * @param params.offset - Pagination offset
 */
export async function getVitalRecords(params: GetVitalRecordsParams = {}): Promise<VitalRecordsResponse> {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.sessionId) searchParams.append('sessionId', params.sessionId);
  if (params.hasVital) searchParams.append('hasVital', params.hasVital);
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/vitals/records?${queryString}` : '/vitals/records';

  const result = await authFetch(endpoint);
  return {
    records: result.data.records,
    pagination: result.meta?.pagination,
  };
}

/**
 * Get a single vital record by ID
 * GET /api/v1/vitals/records/:recordId
 */
export async function getVitalRecord(recordId: string): Promise<VitalRecord> {
  const result = await authFetch(`/vitals/records/${recordId}`);
  return result.data.record;
}

/**
 * Update a vital record
 * PATCH /api/v1/vitals/records/:recordId
 */
export async function updateVitalRecord(recordId: string, data: Partial<VitalRecordInput>): Promise<VitalRecord> {
  const result = await authFetch(`/vitals/records/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data.record;
}

/**
 * Delete a vital record
 * DELETE /api/v1/vitals/records/:recordId
 */
export async function deleteVitalRecord(recordId: string): Promise<void> {
  await authFetch(`/vitals/records/${recordId}`, {
    method: 'DELETE',
  });
}

/**
 * Get today's vital records with latest values for each vital type
 * GET /api/v1/vitals/records/today
 *
 * Returns all records for today plus extracted latest values for quick display
 */
export async function getTodayVitals(): Promise<TodayVitalsResponse> {
  const result = await authFetch('/vitals/records/today');
  return result.data;
}

/**
 * Get vital statistics summary for a date range
 * GET /api/v1/vitals/records/summary
 *
 * @param days - Number of days to include (default 7, max 365)
 * @returns Statistics including averages, min/max for each vital type
 */
export async function getVitalSummary(days: number = 7): Promise<VitalSummary> {
  const result = await authFetch(`/vitals/records/summary?days=${days}`);
  return result.data.summary;
}

// ============================================
// Convenience functions for common operations
// ============================================

/**
 * Quick log blood pressure
 */
export async function logBloodPressure(
  systolic: number,
  diastolic: number,
  options?: { notes?: string; sessionId?: string }
): Promise<VitalRecord> {
  return createVitalRecord({
    bloodPressure: { systolic, diastolic },
    ...options,
  });
}

/**
 * Quick log heart rate
 */
export async function logHeartRate(
  bpm: number,
  options?: { notes?: string; sessionId?: string }
): Promise<VitalRecord> {
  return createVitalRecord({
    heartRate: bpm,
    ...options,
  });
}

/**
 * Quick log blood sugar
 */
export async function logBloodSugar(
  value: number,
  unit: BloodSugarUnit = 'mg/dL',
  timing?: BloodSugarTiming,
  options?: { notes?: string }
): Promise<VitalRecord> {
  return createVitalRecord({
    bloodSugar: { value, unit, timing },
    ...options,
  });
}

/**
 * Quick log weight
 */
export async function logWeight(
  value: number,
  unit: WeightUnit = 'kg',
  options?: { notes?: string; sessionId?: string }
): Promise<VitalRecord> {
  return createVitalRecord({
    weight: { value, unit },
    ...options,
  });
}

/**
 * Quick log SpO2
 */
export async function logSpO2(
  percentage: number,
  options?: { notes?: string; sessionId?: string }
): Promise<VitalRecord> {
  return createVitalRecord({
    spo2: percentage,
    ...options,
  });
}

/**
 * Quick log temperature
 */
export async function logTemperature(
  value: number,
  unit: TemperatureUnit = 'celsius',
  options?: { notes?: string; sessionId?: string }
): Promise<VitalRecord> {
  return createVitalRecord({
    temperature: { value, unit },
    ...options,
  });
}

/**
 * Log multiple vitals at once (common for dialysis sessions)
 */
export async function logDialysisVitals(data: {
  bloodPressure?: BloodPressure;
  heartRate?: number;
  weight?: Weight;
  spo2?: number;
  temperature?: Temperature;
  sessionId?: string;
  notes?: string;
}): Promise<VitalRecord> {
  return createVitalRecord(data);
}
