// Runway ML API Client
// Documentation: https://docs.runwayml.com/

export interface RunwayJobRequest {
  promptImage: string;  // URL of the source image
  model?: 'gen3a_turbo';  // Image to video model
  duration?: 5 | 10;  // Video duration in seconds
  watermark?: boolean;
  seed?: number;
}

export interface RunwayJobResponse {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  createdAt: string;
  estimatedTimeToComplete?: number;
  output?: string[];  // Array of video URLs when complete
  failure?: string;
  failureCode?: string;
}

const RUNWAY_API_URL = 'https://api.dev.runwayml.com/v1';

class RunwayClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createImageToVideoJob(request: RunwayJobRequest): Promise<RunwayJobResponse> {
    const response = await fetch(`${RUNWAY_API_URL}/image_to_video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        promptImage: request.promptImage,
        model: request.model || 'gen3a_turbo',
        duration: request.duration || 5,
        watermark: request.watermark ?? false,
        seed: request.seed,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Runway API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async getJobStatus(taskId: string): Promise<RunwayJobResponse> {
    const response = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Runway API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async cancelJob(taskId: string): Promise<void> {
    const response = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Runway API error: ${error.message || response.statusText}`);
    }
  }
}

// Export singleton instance
export function getRunwayClient(): RunwayClient {
  const apiKey = process.env.RUNWAY_API_KEY;
  
  if (!apiKey) {
    throw new Error('RUNWAY_API_KEY environment variable is not set');
  }
  
  return new RunwayClient(apiKey);
}

export { RunwayClient };

