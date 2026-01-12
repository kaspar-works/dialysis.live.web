/**
 * Help Chat Service
 * Handles support chat sessions with AI assistant
 */

import { authFetch } from './auth';

// Types
export interface HelpChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface HelpChatSession {
  _id: string;
  sessionId: string;
  title: string;
  messages: HelpChatMessage[];
  status: 'active' | 'resolved' | 'closed';
  category?: string;
  metadata?: {
    userAgent?: string;
    platform?: string;
    appVersion?: string;
    currentPage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HelpChatSessionSummary {
  sessionId: string;
  title: string;
  status: string;
  messageCount: number;
  lastMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StartSessionResponse {
  sessionId: string;
  message: HelpChatMessage;
  title: string;
}

export interface SendMessageResponse {
  sessionId: string;
  message: HelpChatMessage;
  title: string;
}

export interface SessionsListResponse {
  sessions: HelpChatSessionSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

// Helper to get browser metadata
function getBrowserMetadata(): HelpChatSession['metadata'] {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    currentPage: window.location.pathname,
  };
}

/**
 * Start a new help chat session
 */
export async function startHelpChatSession(message: string): Promise<StartSessionResponse> {
  const result = await authFetch('/help-chat/sessions', {
    method: 'POST',
    body: JSON.stringify({
      message,
      metadata: getBrowserMetadata(),
    }),
  });
  return result.data;
}

/**
 * Send a message to an existing chat session
 */
export async function sendHelpChatMessage(
  sessionId: string,
  message: string
): Promise<SendMessageResponse> {
  const result = await authFetch(`/help-chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  return result.data;
}

/**
 * Get all chat sessions for the current user
 */
export async function getHelpChatSessions(options?: {
  limit?: number;
  offset?: number;
  status?: 'active' | 'resolved' | 'closed';
}): Promise<SessionsListResponse> {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());
  if (options?.status) params.append('status', options.status);

  const queryString = params.toString();
  const result = await authFetch(`/help-chat/sessions${queryString ? `?${queryString}` : ''}`);
  return result.data;
}

/**
 * Get a specific chat session with all messages
 */
export async function getHelpChatSession(sessionId: string): Promise<HelpChatSession> {
  const result = await authFetch(`/help-chat/sessions/${sessionId}`);
  return result.data.session;
}

/**
 * Get the active chat session for the current user
 */
export async function getActiveHelpChatSession(): Promise<HelpChatSession | null> {
  const result = await authFetch('/help-chat/active');
  return result.data.session;
}

/**
 * Close a chat session
 */
export async function closeHelpChatSession(sessionId: string): Promise<HelpChatSession> {
  const result = await authFetch(`/help-chat/sessions/${sessionId}/close`, {
    method: 'POST',
  });
  return result.data.session;
}

/**
 * Mark a chat session as resolved
 */
export async function resolveHelpChatSession(sessionId: string): Promise<HelpChatSession> {
  const result = await authFetch(`/help-chat/sessions/${sessionId}/resolve`, {
    method: 'POST',
  });
  return result.data.session;
}

/**
 * Delete a chat session
 */
export async function deleteHelpChatSession(sessionId: string): Promise<void> {
  await authFetch(`/help-chat/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

// Quick help suggestions
export const QUICK_HELP_SUGGESTIONS = [
  { icon: '📊', label: 'How to log sessions', message: 'How do I log my dialysis sessions?' },
  { icon: '💊', label: 'Medication tracking', message: 'How do I track my medications?' },
  { icon: '📅', label: 'Appointments', message: 'How do I schedule appointments?' },
  { icon: '📈', label: 'View reports', message: 'How can I generate reports for my doctor?' },
  { icon: '⚙️', label: 'Account settings', message: 'How do I change my account settings?' },
  { icon: '💳', label: 'Subscription', message: 'What are the subscription plans and features?' },
];
