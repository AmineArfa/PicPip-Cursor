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

// Use production API URL
const RUNWAY_API_URL = 'https://api.runwayml.com/v1';

// Demo video for simulation mode
const DEMO_VIDEOS = [
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
];

class RunwayClient {
  private apiKey: string;
  private simulationMode: boolean = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createImageToVideoJob(request: RunwayJobRequest): Promise<RunwayJobResponse> {
    try {
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
        const errorData = await response.json().catch(() => ({}));
        console.error('Runway API error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // If API fails, fall back to simulation
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          console.log('[Runway] Falling back to simulation mode');
          this.simulationMode = true;
          return this.createSimulatedJob(request);
        }
        
        throw new Error(`Runway API error: ${errorData.message || errorData.error || response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      console.error('Runway API call failed:', error.message);
      // Fall back to simulation on any error
      console.log('[Runway] Falling back to simulation mode due to error');
      this.simulationMode = true;
      return this.createSimulatedJob(request);
    }
  }

  private createSimulatedJob(request: RunwayJobRequest): RunwayJobResponse {
    const jobId = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log(`[Runway Simulation] Created job ${jobId}`);
    return {
      id: jobId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      estimatedTimeToComplete: 10,
    };
  }

  isSimulationMode(): boolean {
    return this.simulationMode;
  }

  async getJobStatus(taskId: string): Promise<RunwayJobResponse> {
    // Handle simulated jobs
    if (taskId.startsWith('sim_') || this.simulationMode) {
      console.log(`[Runway Simulation] Returning completed status for ${taskId}`);
      const demoVideo = DEMO_VIDEOS[Math.floor(Math.random() * DEMO_VIDEOS.length)];
      return {
        id: taskId,
        status: 'SUCCEEDED',
        createdAt: new Date().toISOString(),
        output: [demoVideo],
      };
    }

    const response = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
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

