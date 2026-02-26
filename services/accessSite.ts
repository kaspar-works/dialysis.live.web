import { authFetch } from './auth';

export enum AccessSiteEventType {
  ASSESSMENT = 'assessment',
  COMPLICATION = 'complication',
  MAINTENANCE = 'maintenance',
}

export enum AccessType {
  FISTULA = 'fistula',
  GRAFT = 'graft',
  CATHETER = 'catheter',
}

export enum AccessSiteLocation {
  LEFT_UPPER_ARM = 'left_upper_arm',
  LEFT_FOREARM = 'left_forearm',
  RIGHT_UPPER_ARM = 'right_upper_arm',
  RIGHT_FOREARM = 'right_forearm',
  CHEST = 'chest',
  NECK = 'neck',
  GROIN = 'groin',
  OTHER = 'other',
}

export enum ComplicationSeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

export interface AccessSiteEvent {
  _id: string;
  userId: string;
  eventType: AccessSiteEventType;
  date: string;
  accessType: AccessType;
  site: AccessSiteLocation;
  thrillPresent?: boolean;
  bruitPresent?: boolean;
  signsOfInfection?: boolean;
  swelling?: boolean;
  pain?: boolean;
  bleeding?: boolean;
  clotting?: boolean;
  stenosis?: boolean;
  infiltration?: boolean;
  severity?: ComplicationSeverity;
  needleSiteUsed?: string;
  needleGauge?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccessSiteEventData {
  eventType: AccessSiteEventType;
  accessType: AccessType;
  site: AccessSiteLocation;
  date?: string;
  thrillPresent?: boolean;
  bruitPresent?: boolean;
  signsOfInfection?: boolean;
  swelling?: boolean;
  pain?: boolean;
  bleeding?: boolean;
  clotting?: boolean;
  stenosis?: boolean;
  infiltration?: boolean;
  severity?: ComplicationSeverity;
  needleSiteUsed?: string;
  needleGauge?: number;
  notes?: string;
}

export interface AccessSiteEventsListResponse {
  events: AccessSiteEvent[];
  pagination: { total: number; limit: number; offset: number };
}

export async function createAccessSiteEvent(data: CreateAccessSiteEventData): Promise<AccessSiteEvent> {
  const result = await authFetch('/access-site', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.event;
}

export async function listAccessSiteEvents(params?: {
  from?: string;
  to?: string;
  eventType?: AccessSiteEventType;
  accessType?: AccessType;
  limit?: number;
  offset?: number;
}): Promise<AccessSiteEventsListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.from) searchParams.append('from', params.from);
  if (params?.to) searchParams.append('to', params.to);
  if (params?.eventType) searchParams.append('eventType', params.eventType);
  if (params?.accessType) searchParams.append('accessType', params.accessType);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());

  const query = searchParams.toString();
  const result = await authFetch(`/access-site${query ? `?${query}` : ''}`);
  return result.data;
}

export async function updateAccessSiteEvent(
  eventId: string,
  data: Partial<CreateAccessSiteEventData>
): Promise<AccessSiteEvent> {
  const result = await authFetch(`/access-site/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data.event;
}

export async function deleteAccessSiteEvent(eventId: string): Promise<void> {
  await authFetch(`/access-site/${eventId}`, { method: 'DELETE' });
}

// Display helpers
export function getEventTypeLabel(type: AccessSiteEventType): string {
  const labels: Record<AccessSiteEventType, string> = {
    [AccessSiteEventType.ASSESSMENT]: 'Assessment',
    [AccessSiteEventType.COMPLICATION]: 'Complication',
    [AccessSiteEventType.MAINTENANCE]: 'Maintenance',
  };
  return labels[type] || type;
}

export function getAccessTypeLabel(type: AccessType): string {
  const labels: Record<AccessType, string> = {
    [AccessType.FISTULA]: 'AV Fistula',
    [AccessType.GRAFT]: 'AV Graft',
    [AccessType.CATHETER]: 'Catheter',
  };
  return labels[type] || type;
}

export function getSiteLabel(site: AccessSiteLocation): string {
  const labels: Record<AccessSiteLocation, string> = {
    [AccessSiteLocation.LEFT_UPPER_ARM]: 'Left Upper Arm',
    [AccessSiteLocation.LEFT_FOREARM]: 'Left Forearm',
    [AccessSiteLocation.RIGHT_UPPER_ARM]: 'Right Upper Arm',
    [AccessSiteLocation.RIGHT_FOREARM]: 'Right Forearm',
    [AccessSiteLocation.CHEST]: 'Chest',
    [AccessSiteLocation.NECK]: 'Neck',
    [AccessSiteLocation.GROIN]: 'Groin',
    [AccessSiteLocation.OTHER]: 'Other',
  };
  return labels[site] || site;
}
