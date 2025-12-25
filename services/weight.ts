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
  return result.data;
}

export async function deleteWeightLog(logId: string): Promise<void> {
  await authFetch(`/weights/${logId}`, {
    method: 'DELETE',
  });
}
