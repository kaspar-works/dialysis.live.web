import { authFetch } from './auth';

// ============================================
// Types
// ============================================

export enum MedicationRoute {
  ORAL = 'oral',
  SUBLINGUAL = 'sublingual',
  INJECTION = 'injection',
  INTRAVENOUS = 'intravenous',
  TOPICAL = 'topical',
  INHALATION = 'inhalation',
  RECTAL = 'rectal',
  OPHTHALMIC = 'ophthalmic',
  OTIC = 'otic',
  NASAL = 'nasal',
  OTHER = 'other',
}

export enum ScheduleType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  DIALYSIS_DAYS = 'dialysis_days',
  NON_DIALYSIS_DAYS = 'non_dialysis_days',
  AS_NEEDED = 'as_needed',
  CUSTOM = 'custom',
}

export enum DoseStatus {
  SCHEDULED = 'scheduled',
  TAKEN = 'taken',
  SKIPPED = 'skipped',
  MISSED = 'missed',
}

export interface Medication {
  _id: string;
  userId: string;
  name: string;
  dose: string;
  route: MedicationRoute;
  instructions?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationSchedule {
  _id: string;
  medicationId: string;
  scheduleType: ScheduleType;
  times: string[];           // Array of times like ["08:00", "20:00"]
  daysOfWeek?: number[];     // [0-6] where 0 is Sunday
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationDose {
  _id: string;
  userId: string;
  medicationId: string | Medication;  // Can be populated
  scheduledFor: string;
  takenAt?: string;
  status: DoseStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Input types
export interface CreateMedicationInput {
  name: string;
  dose: string;
  route: MedicationRoute;
  instructions?: string;
}

export interface UpdateMedicationInput {
  name?: string;
  dose?: string;
  route?: MedicationRoute;
  instructions?: string;
  active?: boolean;
}

export interface CreateScheduleInput {
  scheduleType: ScheduleType;
  times: string[];
  daysOfWeek?: number[];
  startDate?: string;
  endDate?: string;
}

// ============================================
// Medication CRUD
// ============================================

/**
 * Create a new medication
 * POST /api/v1/medications
 */
export async function createMedication(data: CreateMedicationInput): Promise<Medication> {
  const result = await authFetch('/medications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.medication;
}

/**
 * Get all medications for the current user
 * GET /api/v1/medications
 *
 * @param active - Filter by active status (optional)
 */
export async function getMedications(active?: boolean): Promise<Medication[]> {
  let endpoint = '/medications';
  if (active !== undefined) {
    endpoint += `?active=${active}`;
  }
  const result = await authFetch(endpoint);
  return result.data.medications;
}

/**
 * Get only active medications
 */
export async function getActiveMedications(): Promise<Medication[]> {
  return getMedications(true);
}

/**
 * Update a medication
 * PATCH /api/v1/medications/:medicationId
 */
export async function updateMedication(
  medicationId: string,
  data: UpdateMedicationInput
): Promise<Medication> {
  const result = await authFetch(`/medications/${medicationId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data.medication;
}

/**
 * Delete (deactivate) a medication
 * DELETE /api/v1/medications/:medicationId
 */
export async function deleteMedication(medicationId: string): Promise<void> {
  await authFetch(`/medications/${medicationId}`, {
    method: 'DELETE',
  });
}

// ============================================
// Medication Schedules
// ============================================

/**
 * Create a schedule for a medication
 * POST /api/v1/medications/:medicationId/schedule
 *
 * @example
 * // Daily at 8am and 8pm
 * await createSchedule('med123', {
 *   scheduleType: ScheduleType.DAILY,
 *   times: ['08:00', '20:00']
 * });
 *
 * @example
 * // Monday, Wednesday, Friday (dialysis days)
 * await createSchedule('med123', {
 *   scheduleType: ScheduleType.WEEKLY,
 *   times: ['09:00'],
 *   daysOfWeek: [1, 3, 5]
 * });
 */
export async function createSchedule(
  medicationId: string,
  data: CreateScheduleInput
): Promise<MedicationSchedule> {
  const result = await authFetch(`/medications/${medicationId}/schedule`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.schedule;
}

/**
 * Get schedules for a medication
 * GET /api/v1/medications/:medicationId/schedule
 */
export async function getSchedule(medicationId: string): Promise<MedicationSchedule[]> {
  const result = await authFetch(`/medications/${medicationId}/schedule`);
  return result.data.schedules;
}

// ============================================
// Medication Doses
// ============================================

/**
 * Get today's scheduled doses
 * GET /api/v1/medications/doses/today
 *
 * Returns doses with medication info populated
 */
export async function getTodayDoses(): Promise<MedicationDose[]> {
  const result = await authFetch('/medications/doses/today');
  return result.data.doses;
}

/**
 * Mark a dose as taken
 * POST /api/v1/medications/doses/:doseId/take
 */
export async function markDoseTaken(doseId: string): Promise<MedicationDose> {
  const result = await authFetch(`/medications/doses/${doseId}/take`, {
    method: 'POST',
  });
  return result.data.dose;
}

/**
 * Mark a dose as skipped
 * POST /api/v1/medications/doses/:doseId/skip
 *
 * @param doseId - The dose ID
 * @param notes - Optional reason for skipping
 */
export async function markDoseSkipped(doseId: string, notes?: string): Promise<MedicationDose> {
  const result = await authFetch(`/medications/doses/${doseId}/skip`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
  return result.data.dose;
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Quick create a daily medication
 */
export async function createDailyMedication(
  name: string,
  dose: string,
  times: string[],
  options?: {
    route?: MedicationRoute;
    instructions?: string;
  }
): Promise<{ medication: Medication; schedule: MedicationSchedule }> {
  const medication = await createMedication({
    name,
    dose,
    route: options?.route || MedicationRoute.ORAL,
    instructions: options?.instructions,
  });

  const schedule = await createSchedule(medication._id, {
    scheduleType: ScheduleType.DAILY,
    times,
  });

  return { medication, schedule };
}

/**
 * Quick create a dialysis-day only medication
 */
export async function createDialysisDayMedication(
  name: string,
  dose: string,
  times: string[],
  options?: {
    route?: MedicationRoute;
    instructions?: string;
  }
): Promise<{ medication: Medication; schedule: MedicationSchedule }> {
  const medication = await createMedication({
    name,
    dose,
    route: options?.route || MedicationRoute.ORAL,
    instructions: options?.instructions,
  });

  const schedule = await createSchedule(medication._id, {
    scheduleType: ScheduleType.DIALYSIS_DAYS,
    times,
  });

  return { medication, schedule };
}

/**
 * Get medication with its schedule
 */
export async function getMedicationWithSchedule(
  medicationId: string
): Promise<{ medication: Medication; schedules: MedicationSchedule[] }> {
  const medications = await getMedications();
  const medication = medications.find(m => m._id === medicationId);

  if (!medication) {
    throw new Error('Medication not found');
  }

  const schedules = await getSchedule(medicationId);
  return { medication, schedules };
}

/**
 * Get all medications with their schedules
 */
export async function getAllMedicationsWithSchedules(): Promise<
  Array<{ medication: Medication; schedules: MedicationSchedule[] }>
> {
  const medications = await getActiveMedications();

  const results = await Promise.all(
    medications.map(async (medication) => {
      const schedules = await getSchedule(medication._id);
      return { medication, schedules };
    })
  );

  return results;
}

/**
 * Get dose completion stats for today
 */
export async function getTodayDoseStats(): Promise<{
  total: number;
  taken: number;
  skipped: number;
  scheduled: number;
  missed: number;
  completionRate: number;
}> {
  const doses = await getTodayDoses();

  const stats = {
    total: doses.length,
    taken: doses.filter(d => d.status === DoseStatus.TAKEN).length,
    skipped: doses.filter(d => d.status === DoseStatus.SKIPPED).length,
    scheduled: doses.filter(d => d.status === DoseStatus.SCHEDULED).length,
    missed: doses.filter(d => d.status === DoseStatus.MISSED).length,
    completionRate: 0,
  };

  if (stats.total > 0) {
    stats.completionRate = Math.round((stats.taken / stats.total) * 100);
  }

  return stats;
}
