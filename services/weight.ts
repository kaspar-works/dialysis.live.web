import { authFetch } from './auth';

export type WeightContext = 'morning' | 'pre_dialysis' | 'post_dialysis';

export interface WeightLog {
  _id: string;
  userId: string;
  loggedAt: string;
  weightKg: number;
  context: WeightContext;
  sessionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWeightData {
  weightKg: number;
  context: WeightContext;
  loggedAt?: string;
  sessionId?: string;
  notes?: string;
}

export interface GetWeightsParams {
  from?: string;
  to?: string;
  context?: WeightContext;
  limit?: number;
  offset?: number;
}

export interface WeightsResponse {
  logs: WeightLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export async function createWeightLog(data: CreateWeightData): Promise<WeightLog> {
  const result = await authFetch('/weights', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.weightLog;
}

export async function getWeightLogs(params: GetWeightsParams = {}): Promise<WeightsResponse> {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.context) searchParams.append('context', params.context);
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/weights?${queryString}` : '/weights';

  const result = await authFetch(endpoint);
  return {
    logs: result.data?.logs || [],
    pagination: result.meta?.pagination || result.data?.pagination || { total: 0, limit: 10, offset: 0 },
  };
}

export async function deleteWeightLog(logId: string): Promise<void> {
  await authFetch(`/weights/${logId}`, {
    method: 'DELETE',
  });
}

export interface DeleteAllParams {
  from?: string;
  to?: string;
  context?: WeightContext;
}

export interface DeleteAllResponse {
  deletedCount: number;
}

export async function deleteAllWeightLogs(params: DeleteAllParams = {}): Promise<DeleteAllResponse> {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.context) searchParams.append('context', params.context);

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/weights?${queryString}` : '/weights';

  const result = await authFetch(endpoint, {
    method: 'DELETE',
  });
  return result.data;
}

export interface WeightAnalysis {
  statistics: {
    period: string;
    totalEntries: number;
    averageWeight: number;
    minWeight: number;
    maxWeight: number;
    weightChange: number;
    avgPreDialysisWeight: number | null;
    avgPostDialysisWeight: number | null;
    avgFluidRemoval: number | null;
  };
  analysis: string;
  disclaimer: string;
}

export async function analyzeWeightLogs(days: number = 30): Promise<WeightAnalysis> {
  const result = await authFetch(`/weights/analyze?days=${days}`);
  return result.data;
}

export interface ExportParams {
  from?: string;
  to?: string;
  format?: 'json' | 'csv';
  context?: WeightContext;
}

export async function exportWeightLogs(params: ExportParams = {}): Promise<Blob> {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.format) searchParams.append('format', params.format);
  if (params.context) searchParams.append('context', params.context);

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/weights/export?${queryString}` : '/weights/export';

  const token = localStorage.getItem('auth_token');
  const apiBase = import.meta.env.DEV ? '/api/v1' : 'https://api.dialysis.live/api/v1';
  const response = await fetch(`${apiBase}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Export failed');
  }

  return response.blob();
}
