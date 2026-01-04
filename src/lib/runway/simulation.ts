// Runway ML Simulation for Development
// Used when RUNWAY_API_KEY is not set

import type { RunwayJobRequest, RunwayJobResponse } from './index';

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
}>();

export class SimulatedRunwayClient {
  async createImageToVideoJob(request: RunwayJobRequest): Promise<RunwayJobResponse> {
    const jobId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();
    
    // Simulate 10-15 seconds processing time
    const processingTime = 10000 + Math.random() * 5000;
    
    simulatedJobs.set(jobId, {
      status: 'PENDING',
      createdAt,
      completionTime: Date.now() + processingTime,
    });

    console.log(`[Runway Simulation] Created job ${jobId} - will complete in ${Math.round(processingTime / 1000)}s`);

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

    console.log(`[Runway Simulation] Job ${taskId} status: ${job.status}`);

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
}

// Get appropriate client based on environment
export function getRunwayClientWithFallback() {
  const apiKey = process.env.RUNWAY_API_KEY;
  
  if (!apiKey) {
    console.warn('[Runway] No API key found - using simulation mode');
    return new SimulatedRunwayClient();
  }
  
  // Use real client
  const { RunwayClient } = require('./index');
  return new RunwayClient(apiKey);
}


