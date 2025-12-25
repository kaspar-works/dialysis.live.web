import { authFetch } from './auth';
import { SymptomType } from '../types';

export interface SymptomLog {
  _id: string;
  userId: string;
  loggedAt: string;
  symptomType: SymptomType;
  severity: number; // 1-5
  sessionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSymptomData {
  symptomType: SymptomType;
  severity: number;
  loggedAt?: string;
  sessionId?: string;
  notes?: string;
}

export interface GetSymptomsParams {
  from?: string;
  to?: string;
  symptomType?: string;
  limit?: number;
  offset?: number;
}

export interface SymptomsResponse {
  logs: SymptomLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export async function createSymptomLog(data: CreateSymptomData): Promise<SymptomLog> {
  const result = await authFetch('/symptoms', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.symptomLog;
}

export async function getSymptomLogs(params: GetSymptomsParams = {}): Promise<SymptomsResponse> {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.symptomType) searchParams.append('symptomType', params.symptomType);
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/symptoms?${queryString}` : '/symptoms';

  const result = await authFetch(endpoint);
  return result.data;
}
