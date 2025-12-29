
// Use relative URL in development (for Vite proxy), full URL in production
const API_BASE_URL = import.meta.env.DEV ? '/api/v1' : 'https://api.dialysis.live/api/v1';

export interface HealthResponse {
  success: boolean;
  status: string;
  timestamp: string;
}

export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
}
