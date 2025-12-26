
const API_BASE_URL = 'https://api.dialysis.live/api/v1';

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
