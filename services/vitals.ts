import { authFetch } from './auth';

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
