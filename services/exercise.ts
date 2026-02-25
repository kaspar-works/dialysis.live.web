import { authFetch } from './auth';

export type ExerciseType = 'walking' | 'running' | 'cycling' | 'swimming' | 'other';

export interface ExerciseLog {
  _id: string;
  userId: string;
  loggedAt: string;
  exerciseType: ExerciseType;
  durationMinutes: number;
  steps?: number;
  distanceMeters?: number;
  activeCalories?: number;
  activeMinutes?: number;
  heartRateAvg?: number;
  notes?: string;
  source?: string;
  healthKitWorkoutId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExerciseData {
  exerciseType: ExerciseType;
  durationMinutes: number;
  loggedAt?: string;
  steps?: number;
  distanceMeters?: number;
  activeCalories?: number;
  activeMinutes?: number;
  heartRateAvg?: number;
  notes?: string;
  source?: string;
}

export interface GetExercisesParams {
  from?: string;
  to?: string;
  exerciseType?: ExerciseType;
  limit?: number;
  offset?: number;
}

export interface ExercisesResponse {
  logs: ExerciseLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ExerciseStats {
  todaySteps: number;
  todayActiveMinutes: number;
  todayCalories: number;
  weeklyAvgSteps: number;
  weeklyAvgActiveMinutes: number;
  history: {
    date: string;
    steps: number;
    activeMinutes: number;
    calories: number;
    workouts: number;
  }[];
}

export async function createExerciseLog(data: CreateExerciseData): Promise<ExerciseLog> {
  const result = await authFetch('/exercises', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.exerciseLog;
}

export async function getExerciseLogs(params: GetExercisesParams = {}): Promise<ExercisesResponse> {
  const searchParams = new URLSearchParams();
  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.exerciseType) searchParams.append('exerciseType', params.exerciseType);
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());
  const queryString = searchParams.toString();
  const endpoint = queryString ? `/exercises?${queryString}` : '/exercises';
  const result = await authFetch(endpoint);
  return {
    logs: result.data?.logs || [],
    pagination: result.meta?.pagination || result.data?.pagination || { total: 0, limit: 10, offset: 0 },
  };
}

export async function getExerciseStats(): Promise<ExerciseStats> {
  const result = await authFetch('/exercises/stats');
  return result.data;
}

export async function updateExerciseLog(logId: string, data: Partial<CreateExerciseData>): Promise<ExerciseLog> {
  const result = await authFetch(`/exercises/${logId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data.exerciseLog;
}

export async function deleteExerciseLog(logId: string): Promise<void> {
  await authFetch(`/exercises/${logId}`, { method: 'DELETE' });
}
