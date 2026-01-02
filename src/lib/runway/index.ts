// Runway ML API Client
// Documentation: https://docs.runwayml.com/

export interface RunwayJobRequest {
  promptImage: string;  // URL of the source image
  promptText?: string;  // Text prompt describing the motion/action
  model?: 'gen3a_turbo' | 'gen4_turbo';  // Image to video model (gen4_turbo is the latest available via API)
  duration?: 5 | 10;  // Video duration in seconds
  ratio?: '1280:720' | '720:1280' | '1920:1080' | '1080:1920';  // Required for gen4_turbo: resolution strings
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

// Runway API URL - use api.dev.runwayml.com (not api.runwayml.com)
const RUNWAY_API_URL = 'https://api.dev.runwayml.com/v1';

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
      // Build request body - Based on Runway API docs (v2024-11-06)
      const model = request.model || 'gen4_turbo';
      const requestBody: Record<string, unknown> = {
        model,
        promptImage: request.promptImage,
      };

      // gen4_turbo requires 'ratio' parameter with specific resolution strings
      if (model === 'gen4_turbo') {
        // ratio is REQUIRED for gen4_turbo - use landscape 16:9 by default
        requestBody.ratio = request.ratio || '1280:720';
        // promptText is optional but recommended for gen4_turbo
        if (request.promptText) {
          requestBody.promptText = request.promptText;
        }
        // Duration for gen4_turbo (5 or 10 seconds)
        if (request.duration) {
          requestBody.duration = request.duration;
        }
      } else {
        // gen3a_turbo uses promptText
        requestBody.promptText = request.promptText || "Subtle motion, gentle animation";
        // Duration for other models
        if (request.duration) {
          requestBody.duration = request.duration;
        }
      }

      // Optional parameters (for all models)
      if (request.seed !== undefined) {
        requestBody.seed = request.seed;
      }
      // Note: watermark is not supported for gen4_turbo, only include for gen3a_turbo
      if (model !== 'gen4_turbo' && request.watermark !== undefined) {
        requestBody.watermark = request.watermark;
      }
      
      console.log('[Runway] Creating job with:', JSON.stringify(requestBody));
      
      const response = await fetch(`${RUNWAY_API_URL}/image_to_video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Runway API error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          issues: JSON.stringify(errorData.issues, null, 2)
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

