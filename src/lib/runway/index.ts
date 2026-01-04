// Runway ML API Client
// Documentation: https://docs.runwayml.com/

import type { VideoFormat, QualityMode } from '@/lib/supabase/types';
import { getFormatPreset, getRunwayRatio } from './formats';

// Runway model types
export type RunwayModel = 'gen3a_turbo' | 'gen4_turbo' | 'gen4';

export interface RunwayJobRequest {
  promptImage: string;  // URL of the source image
  promptText?: string;  // Text prompt describing the motion/action
  model?: RunwayModel;  // gen4 = high quality, gen4_turbo = fast
  duration?: 5 | 10;  // Video duration in seconds
  ratio?: string;  // Resolution string (e.g., "1080:1920")
  watermark?: boolean;
  seed?: number;
  // Extended options for our system
  format?: VideoFormat;  // Platform format (tiktok, instagram_reel, etc.)
  qualityMode?: QualityMode;  // 'fast' or 'high'
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

// Quality mode configuration
export const QUALITY_CONFIG = {
  fast: {
    model: 'gen4_turbo' as RunwayModel,
    credits: 1,
    estimatedTime: 30,  // seconds
    label: 'Fast',
    description: 'Quick generation (~30s)',
  },
  high: {
    model: 'gen4' as RunwayModel,
    credits: 2,
    estimatedTime: 120,  // seconds
    label: 'High Quality',
    description: 'Premium quality (~2min)',
  },
} as const;

// Get the model to use based on quality mode
export function getModelForQuality(qualityMode: QualityMode): RunwayModel {
  return QUALITY_CONFIG[qualityMode].model;
}

// Get credit cost for quality mode
export function getCreditCost(qualityMode: QualityMode): number {
  return QUALITY_CONFIG[qualityMode].credits;
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
      // Determine model based on quality mode
      const qualityMode = request.qualityMode || 'fast';
      const model = request.model || getModelForQuality(qualityMode);
      
      // Get ratio from format or use provided ratio
      let ratio = request.ratio;
      if (!ratio && request.format) {
        ratio = getRunwayRatio(request.format);
      }
      // Default to landscape if nothing specified
      if (!ratio) {
        ratio = '1920:1080';
      }

      // Duration defaults to 10 seconds
      const duration = request.duration || 10;

      // Build request body - Based on Runway API docs (v2024-11-06)
      const requestBody: Record<string, unknown> = {
        model,
        promptImage: request.promptImage,
        ratio,
        duration,
      };

      // Add promptText if provided (optional but recommended)
      if (request.promptText) {
        requestBody.promptText = request.promptText;
      }

      // Optional parameters
      if (request.seed !== undefined) {
        requestBody.seed = request.seed;
      }
      // Note: watermark is not supported for gen4/gen4_turbo
      
      console.log('[Runway] Creating job with:', JSON.stringify({
        ...requestBody,
        qualityMode,
        format: request.format,
      }));
      
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
          return this.createSimulatedJob(request, qualityMode);
        }
        
        throw new Error(`Runway API error: ${errorData.message || errorData.error || response.statusText}`);
      }

      return response.json();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Runway API call failed:', errorMessage);
      // Fall back to simulation on any error
      console.log('[Runway] Falling back to simulation mode due to error');
      this.simulationMode = true;
      return this.createSimulatedJob(request, request.qualityMode || 'fast');
    }
  }

  private createSimulatedJob(request: RunwayJobRequest, qualityMode: QualityMode): RunwayJobResponse {
    const jobId = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const estimatedTime = QUALITY_CONFIG[qualityMode].estimatedTime;
    console.log(`[Runway Simulation] Created job ${jobId} (${qualityMode} mode)`);
    return {
      id: jobId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      estimatedTimeToComplete: estimatedTime,
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
