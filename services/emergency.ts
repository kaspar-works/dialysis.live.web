import { authFetch } from './auth';

export interface EmergencyCard {
  _id: string;
  userId: string;
  shareToken: string;
  isActive: boolean;
  showBloodType: boolean;
  showAllergies: boolean;
  showMedications: boolean;
  showDialysisInfo: boolean;
  showEmergencyContact: boolean;
  showAccessType: boolean;
  showNephrologist: boolean;
  lastAccessedAt?: string;
  accessCount: number;
  expiresAt?: string;
}

export interface CreateEmergencyCardData {
  showBloodType?: boolean;
  showAllergies?: boolean;
  showMedications?: boolean;
  showDialysisInfo?: boolean;
  showEmergencyContact?: boolean;
  showAccessType?: boolean;
  showNephrologist?: boolean;
  expiresAt?: string;
}

export interface SharedEmergencyData {
  bloodType?: string;
  allergies?: string[];
  dialysisCenterName?: string;
  dialysisType?: string;
  accessType?: string;
  nephrologistName?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medications?: { name: string; dose: string; route: string; instructions?: string }[];
}

// Get own emergency card
export async function getEmergencyCard(): Promise<EmergencyCard | null> {
  const result = await authFetch('/emergency/card');
  return result.data.card;
}

// Create or update emergency card
export async function createOrUpdateEmergencyCard(data: CreateEmergencyCardData): Promise<EmergencyCard> {
  const result = await authFetch('/emergency/card', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.card;
}

// Deactivate emergency card
export async function deactivateEmergencyCard(): Promise<void> {
  await authFetch('/emergency/card', { method: 'DELETE' });
}

// Regenerate share token
export async function regenerateShareToken(): Promise<EmergencyCard> {
  const result = await authFetch('/emergency/card/regenerate', { method: 'POST' });
  return result.data.card;
}

// View shared emergency card (PUBLIC - no auth)
export async function viewSharedEmergencyCard(token: string): Promise<SharedEmergencyData> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  const response = await fetch(`${baseUrl}/emergency/shared/${token}`);
  if (!response.ok) {
    throw new Error('Emergency card not found or inactive');
  }
  const result = await response.json();
  return result.data;
}
