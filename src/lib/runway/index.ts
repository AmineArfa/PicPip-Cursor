// Runway ML API Client
// Documentation: https://docs.runwayml.com/

import type { VideoFormat, QualityMode } from '@/lib/supabase/types';
import { getRunwayRatio } from './formats';

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
// NOTE: Only gen4_turbo is available via the developer API
// gen4 (higher quality model) is only available on the web platform, not API
// High quality mode = longer video duration (10s vs 5s)
export const QUALITY_CONFIG = {
  fast: {
    model: 'gen4_turbo' as RunwayModel,
    duration: 5 as const,  // 5 second video
    credits: 1,
    estimatedTime: 30,  // seconds to generate
    label: 'Standard',
    description: '5 second video',
  },
  high: {
    model: 'gen4_turbo' as RunwayModel,
    duration: 10 as const,  // 10 second video (double length)
    credits: 2,
    estimatedTime: 60,  // seconds to generate
    label: 'Extended',
    description: '10 second video',
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

// Get duration for quality mode (fast=5s, high=10s)
export function getDurationForQuality(qualityMode: QualityMode): 5 | 10 {
  return QUALITY_CONFIG[qualityMode].duration;
}

// Runway API URL - use api.dev.runwayml.com (not api.runwayml.com)
const RUNWAY_API_URL = 'https://api.dev.runwayml.com/v1';

class RunwayClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createImageToVideoJob(request: RunwayJobRequest): Promise<RunwayJobResponse> {
    // Determine model and duration based on quality mode
    const qualityMode = request.qualityMode || 'fast';
    const model = request.model || getModelForQuality(qualityMode);
    const duration = request.duration || getDurationForQuality(qualityMode);
    
    // Get ratio from format or use provided ratio
    let ratio = request.ratio;
    if (!ratio && request.format) {
      ratio = getRunwayRatio(request.format);
    }
    // Default to landscape if nothing specified (must use supported ratio!)
    if (!ratio) {
      ratio = '1280:720';
    }

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
      console.error('[Runway] API error response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        issues: JSON.stringify(errorData.issues, null, 2),
        requestBody,
      });
      
      // Build detailed error message
      let errorMessage = `Runway API error (${response.status}): `;
      if (errorData.error) {
        errorMessage += errorData.error;
      } else if (errorData.message) {
        errorMessage += errorData.message;
      } else {
        errorMessage += response.statusText;
      }
      
      // Include validation issues if present
      if (errorData.issues && Array.isArray(errorData.issues)) {
        const issueDetails = errorData.issues.map((i: { path?: string[]; message?: string }) => 
          `${i.path?.join('.') || 'unknown'}: ${i.message || 'validation error'}`
        ).join('; ');
        errorMessage += ` - ${issueDetails}`;
      }
      
      throw new Error(errorMessage);
    }

    const jobData = await response.json();
    console.log('[Runway] Job created successfully:', jobData.id);
    return jobData;
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
