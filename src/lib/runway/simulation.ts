// Runway ML Simulation for Development
// Used when RUNWAY_API_KEY is not set

import type { RunwayJobRequest, RunwayJobResponse } from './index';
import { QUALITY_CONFIG } from './index';
import type { QualityMode } from '@/lib/supabase/types';

const DEMO_VIDEOS = [
  'https://res.cloudinary.com/demo/video/upload/dog.mp4',
  'https://res.cloudinary.com/demo/video/upload/sea-turtle.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
];

// In-memory job storage for simulation
const simulatedJobs = new Map<string, {
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  createdAt: string;
  output?: string[];
  completionTime: number;
  qualityMode: QualityMode;
}>();

export class SimulatedRunwayClient {
  async createImageToVideoJob(request: RunwayJobRequest): Promise<RunwayJobResponse> {
    const jobId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const createdAt = new Date().toISOString();
    const qualityMode = request.qualityMode || 'fast';
    
    // Simulate processing time based on quality mode
    // Fast: 10-15 seconds, High: 20-30 seconds (simulated, real is much longer)
    const baseTime = qualityMode === 'high' ? 20000 : 10000;
    const randomExtra = Math.random() * (qualityMode === 'high' ? 10000 : 5000);
    const processingTime = baseTime + randomExtra;
    
    simulatedJobs.set(jobId, {
      status: 'PENDING',
      createdAt,
      completionTime: Date.now() + processingTime,
      qualityMode,
    });

    console.log(`[Runway Simulation] Created ${qualityMode} job ${jobId} - will complete in ${Math.round(processingTime / 1000)}s`);
    console.log(`[Runway Simulation] Format: ${request.format || 'default'}, Ratio: ${request.ratio || 'auto'}`);

    return {
      id: jobId,
      status: 'PENDING',
      createdAt,
      estimatedTimeToComplete: Math.round(processingTime / 1000),
    };
  }

  async getJobStatus(taskId: string): Promise<RunwayJobResponse> {
    const job = simulatedJobs.get(taskId);
    
    if (!job) {
      throw new Error(`Job ${taskId} not found`);
    }

    const now = Date.now();
    const elapsed = now - new Date(job.createdAt).getTime();
    const remainingTime = job.completionTime - now;

    // Update status based on time
    if (remainingTime <= 0) {
      job.status = 'SUCCEEDED';
      job.output = [DEMO_VIDEOS[Math.floor(Math.random() * DEMO_VIDEOS.length)]];
    } else if (elapsed > 2000) {
      job.status = 'RUNNING';
    }

    console.log(`[Runway Simulation] Job ${taskId} status: ${job.status} (${job.qualityMode} mode)`);

    return {
      id: taskId,
      status: job.status,
      createdAt: job.createdAt,
      estimatedTimeToComplete: Math.max(0, Math.round(remainingTime / 1000)),
      output: job.output,
    };
  }

  async cancelJob(taskId: string): Promise<void> {
    const job = simulatedJobs.get(taskId);
    if (job) {
      job.status = 'FAILED';
      console.log(`[Runway Simulation] Cancelled job ${taskId}`);
    }
  }

  isSimulationMode(): boolean {
    return true;
  }
}

// Get appropriate client based on environment
export function getRunwayClientWithFallback() {
  const apiKey = process.env.RUNWAY_API_KEY;
  
  if (!apiKey) {
    console.warn('[Runway] No API key found - using simulation mode');
    return new SimulatedRunwayClient();
  }
  
  // Use real client - dynamic import to avoid circular dependency
  const { RunwayClient } = require('./index');
  return new RunwayClient(apiKey);
}
