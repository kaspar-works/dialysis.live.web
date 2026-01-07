
import { authFetch } from './auth';

export type FluidSource = 'water' | 'tea' | 'coffee' | 'juice' | 'soup' | 'other';

export interface FluidLog {
  _id: string;
  userId: string;
  loggedAt: string;
  amountMl: number;
  source: FluidSource;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFluidLogData {
  amountMl: number;
  source: FluidSource;
  loggedAt?: string;
  notes?: string;
}

export interface TodayFluidResponse {
  logs: FluidLog[];
  totalMl: number;
  date: string;
}

export interface FluidPagination {
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface FluidLogsResponse {
  logs: FluidLog[];
  pagination: FluidPagination;
}

// Create a new fluid log
export async function createFluidLog(data: CreateFluidLogData): Promise<FluidLog> {
  const result = await authFetch('/fluids', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.fluidLog;
}

// Get today's fluid intake
export async function getTodayFluidIntake(timezone?: string): Promise<TodayFluidResponse> {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const result = await authFetch(`/fluids/today?timezone=${encodeURIComponent(tz)}`);
  return result.data;
}

// Get fluid logs with optional filters
export async function getFluidLogs(params?: {
  from?: string;
  to?: string;
  source?: FluidSource;
  limit?: number;
  offset?: number;
}): Promise<FluidLogsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.from) searchParams.append('from', params.from);
  if (params?.to) searchParams.append('to', params.to);
  if (params?.source) searchParams.append('source', params.source);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());

  const query = searchParams.toString();
  const result = await authFetch(`/fluids${query ? `?${query}` : ''}`);
  return {
    logs: result.data.logs,
    pagination: result.meta.pagination,
  };
}

// Delete a fluid log
export async function deleteFluidLog(logId: string): Promise<void> {
  await authFetch(`/fluids/${logId}`, {
    method: 'DELETE',
  });
}
