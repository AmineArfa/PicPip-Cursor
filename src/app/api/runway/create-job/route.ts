import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getRunwayClientWithFallback } from '@/lib/runway/simulation';
import { getFormatPreset } from '@/lib/runway/formats';
import { QUALITY_CONFIG, getCreditCost } from '@/lib/runway/index';
import { getEnhancedPrompt, isGeminiConfigured } from '@/lib/gemini';
import type { VideoFormat, QualityMode } from '@/lib/supabase/types';

interface CreateJobRequest {
  animationId: string;
  imageUrl: string;
  promptText?: string;
  format?: VideoFormat;
  qualityMode?: QualityMode;
  duration?: 5 | 10;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateJobRequest = await request.json();
    const { 
      animationId, 
      imageUrl, 
      promptText,
      format = 'tiktok',
      qualityMode = 'fast',
      duration,
    } = body;

    if (!animationId || !imageUrl) {
      return NextResponse.json(
        { error: 'Animation ID and image URL required' },
        { status: 400 }
      );
    }
    
    // Get format preset for resolution
    const formatPreset = getFormatPreset(format);
    const videoDuration = duration || formatPreset.duration;
    
    // Build the action prompt
    const actionPrompt = promptText || 'Subtle motion, gentle animation';
    
    // Get enhanced prompt (uses Gemini if configured, otherwise static prompts)
    console.log(`[Create Job] Gemini configured: ${isGeminiConfigured()}`);
    const promptResult = await getEnhancedPrompt(imageUrl, actionPrompt);
    const enhancedPrompt = promptResult.prompt;
    
    console.log(`[Create Job] Enhanced prompt (Gemini: ${promptResult.usedGemini}):`, enhancedPrompt.slice(0, 100) + '...');

    const supabase = await createServiceRoleClient();
    
    // Update animation with status, format, quality, and prompts
    await supabase
      .from('animations')
      .update({ 
        status: 'processing',
        format,
        quality_mode: qualityMode,
        duration: videoDuration,
        prompt_text: actionPrompt,
        ai_enhanced_prompt: enhancedPrompt,
        credits_used: getCreditCost(qualityMode),
      })
      .eq('id', animationId);

    // Get Runway client (real or simulated based on API key)
    const runway = getRunwayClientWithFallback();
    
    const job = await runway.createImageToVideoJob({
      promptImage: imageUrl,
      promptText: enhancedPrompt,
      format,
      qualityMode,
      ratio: formatPreset.resolution,
      duration: videoDuration,
    });

    // Store the Runway job ID
    await supabase
      .from('animations')
      .update({ runway_job_id: job.id })
      .eq('id', animationId);

    // Calculate estimated time based on quality mode
    const estimatedTime = QUALITY_CONFIG[qualityMode].estimatedTime;

    // Start polling for completion (in production, use webhooks)
    pollRunwayJob(animationId, job.id);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      animationId,
      format,
      qualityMode,
      estimatedTime,
      creditsUsed: getCreditCost(qualityMode),
    });
  } catch (error) {
    console.error('Runway job creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create video job' },
      { status: 500 }
    );
  }
}

// Poll Runway for job completion
async function pollRunwayJob(animationId: string, jobId: string) {
  const maxAttempts = 120; // 10 minutes max (for high quality mode)
  let attempts = 0;

  const poll = async () => {
    if (attempts >= maxAttempts) {
      console.error('Runway job timed out:', jobId);
      const supabase = await createServiceRoleClient();
      await supabase
        .from('animations')
        .update({ status: 'failed' })
        .eq('id', animationId);
      return;
    }

    attempts++;

    try {
      const runway = getRunwayClientWithFallback();
      const job = await runway.getJobStatus(jobId);

      if (job.status === 'SUCCEEDED' && job.output?.[0]) {
        const videoUrl = job.output[0];
        
        const supabase = await createServiceRoleClient();
        await supabase
          .from('animations')
          .update({
            status: 'completed',
            video_url: videoUrl,
            watermarked_video_url: videoUrl,
          })
          .eq('id', animationId);

        console.log('Runway job completed:', jobId);
      } else if (job.status === 'FAILED') {
        console.error('Runway job failed:', job.failure);
        const supabase = await createServiceRoleClient();
        await supabase
          .from('animations')
          .update({ status: 'failed' })
          .eq('id', animationId);
      } else {
        // Still processing, poll again
        setTimeout(poll, 5000);
      }
    } catch (error) {
      console.error('Poll error:', error);
      setTimeout(poll, 5000);
    }
  };

  // Start polling after initial delay
  setTimeout(poll, 5000);
}
