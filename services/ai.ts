import { authFetch } from './auth';

// Types

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  response: string;
  disclaimer: string;
}

export interface SymptomAnalysis {
  response: string;
  severity: 'mild' | 'moderate' | 'severe' | 'emergency';
  possibleCauses: string[];
  recommendations: string[];
  seekMedicalAttention: boolean;
  confidence: 'high' | 'medium' | 'low';
  disclaimer: string;
}

export interface LabResult {
  name: string;
  value: number;
  unit: string;
}

export interface OutOfRangeItem {
  name: string;
  value: string;
  status: 'low' | 'high' | 'critical';
}

export interface LabAnalysis {
  response: string;
  interpretation: string;
  outOfRange: OutOfRangeItem[];
  recommendations: string[];
  disclaimer: string;
}

export interface MedicationCheckResponse {
  response: string;
  category: 'medication';
  disclaimer: string;
}

export interface AnalyzedData {
  recentSessions: number;
  averageUf: number;
  weightTrend: 'stable' | 'increasing' | 'decreasing';
  missedMedications: number;
  symptoms: string[];
}

export interface HealthInsights {
  response: string;
  category: 'insights';
  analyzedData: AnalyzedData;
  disclaimer: string;
}

export interface EducationTopics {
  dialysisBasics: string[];
  nutrition: string[];
  medications: string[];
  lifestyle: string[];
  complications: string[];
  labWork: string[];
}

export interface AIUsage {
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
}

// API Functions

/**
 * Chat with AI assistant
 * POST /api/v1/ai/chat
 * Requires: Basic+ plan
 */
export async function chat(message: string, conversationHistory?: ChatMessage[]): Promise<ChatResponse> {
  const result = await authFetch('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, conversationHistory }),
  });
  return result.data;
}

/**
 * Analyze symptoms
 * POST /api/v1/ai/analyze-symptoms
 * Requires: Basic+ plan
 */
export async function analyzeSymptoms(symptoms: string): Promise<SymptomAnalysis> {
  const result = await authFetch('/ai/analyze-symptoms', {
    method: 'POST',
    body: JSON.stringify({ symptoms }),
  });
  return result.data;
}

/**
 * Analyze lab results
 * POST /api/v1/ai/analyze-labs
 * Requires: Premium plan
 */
export async function analyzeLabs(labResults: LabResult[]): Promise<LabAnalysis> {
  const result = await authFetch('/ai/analyze-labs', {
    method: 'POST',
    body: JSON.stringify({ labResults }),
  });
  return result.data;
}

/**
 * Check medication interactions
 * POST /api/v1/ai/medication-check
 * Requires: Premium plan
 */
export async function checkMedications(medications: string[]): Promise<MedicationCheckResponse> {
  const result = await authFetch('/ai/medication-check', {
    method: 'POST',
    body: JSON.stringify({ medications }),
  });
  return result.data;
}

/**
 * Get personalized health insights
 * GET /api/v1/ai/insights
 * Requires: Premium plan
 */
export async function getInsights(): Promise<HealthInsights> {
  const result = await authFetch('/ai/insights');
  return result.data;
}

/**
 * Get education topics (no AI usage)
 * GET /api/v1/ai/topics
 */
export async function getEducationTopics(): Promise<EducationTopics> {
  const result = await authFetch('/ai/topics');
  return result.data;
}

/**
 * Get AI usage statistics
 * GET /api/v1/ai/usage
 */
export async function getAIUsage(): Promise<AIUsage> {
  const result = await authFetch('/ai/usage');
  return result.data;
}

// Helper functions

/**
 * Get severity color class
 */
export function getSeverityColor(severity: SymptomAnalysis['severity']): string {
  switch (severity) {
    case 'mild':
      return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    case 'moderate':
      return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'severe':
      return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    case 'emergency':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    default:
      return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
  }
}

/**
 * Get severity label
 */
export function getSeverityLabel(severity: SymptomAnalysis['severity']): string {
  switch (severity) {
    case 'mild':
      return 'Mild';
    case 'moderate':
      return 'Moderate';
    case 'severe':
      return 'Severe';
    case 'emergency':
      return 'Emergency';
    default:
      return severity;
  }
}

/**
 * Get lab status color class
 */
export function getLabStatusColor(status: OutOfRangeItem['status']): string {
  switch (status) {
    case 'low':
      return 'text-blue-500 bg-blue-500/10';
    case 'high':
      return 'text-amber-500 bg-amber-500/10';
    case 'critical':
      return 'text-red-500 bg-red-500/10';
    default:
      return 'text-slate-500 bg-slate-500/10';
  }
}

/**
 * Get weight trend icon
 */
export function getWeightTrendIcon(trend: AnalyzedData['weightTrend']): string {
  switch (trend) {
    case 'increasing':
      return '↗';
    case 'decreasing':
      return '↘';
    case 'stable':
    default:
      return '→';
  }
}

/**
 * Medical disclaimer text
 */
export const MEDICAL_DISCLAIMER =
  'This AI-generated content is for informational purposes only and should not replace professional medical advice. ' +
  'Always consult with your healthcare provider before making any changes to your treatment plan.';
