const API_BASE_URL = import.meta.env.DEV
  ? '/api/v1'
  : `${import.meta.env.VITE_API_URL || 'https://api.dialysis.live'}/api/v1`;

const recentMessages = new Map<string, number>();

export function reportError(
  error: Error | string,
  metadata?: Record<string, unknown>
): void {
  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? undefined : error.stack;

  // Deduplicate: skip if same message reported in last 60s
  const now = Date.now();
  const lastReported = recentMessages.get(message);
  if (lastReported && now - lastReported < 60_000) {
    return;
  }
  recentMessages.set(message, now);

  // Prune old entries
  if (recentMessages.size > 50) {
    for (const [key, ts] of recentMessages) {
      if (now - ts > 60_000) recentMessages.delete(key);
    }
  }

  // Fire-and-forget
  fetch(`${API_BASE_URL}/errors/report`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message.slice(0, 2000),
      stack,
      level: 'error',
      source: 'web',
      metadata,
    }),
  }).catch(() => {
    // Silently fail — don't cause cascading errors
  });
}
