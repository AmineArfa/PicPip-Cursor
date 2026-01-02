import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getRunwayClient } from '@/lib/runway';

export async function POST(request: NextRequest) {
  try {
    const { animationId, imageUrl } = await request.json();

    if (!animationId || !imageUrl) {
      return NextResponse.json(
        { error: 'Animation ID and image URL required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();
    
    // Update status to processing
    await supabase
      .from('animations')
      .update({ status: 'processing' })
      .eq('id', animationId);

    // Check if we have a Runway API key (if not, simulate processing)
    const runwayApiKey = process.env.RUNWAY_API_KEY;
    
    if (!runwayApiKey) {
      // Simulate processing for development
      console.log('No Runway API key - simulating video processing');
      
      // Simulate a 10-second delay then mark as complete with demo video
      setTimeout(async () => {
        try {
          const supabaseUpdate = await createServiceRoleClient();
          await supabaseUpdate
            .from('animations')
            .update({
              status: 'completed',
              video_url: imageUrl,
              watermarked_video_url: imageUrl,
            })
            .eq('id', animationId);
          
          console.log('Simulated processing complete for:', animationId);
        } catch (err) {
          console.error('Error updating animation:', err);
        }
      }, 10000);

      return NextResponse.json({
        success: true,
        message: 'Processing started (simulated)',
        animationId,
      });
    }

    // Real Runway API integration
    const runway = getRunwayClient();
    
    const job = await runway.createImageToVideoJob({
      promptImage: imageUrl,
      model: 'gen3a_turbo',
      duration: 5,
      watermark: false,
    });

    // Store the Runway job ID
    await supabase
      .from('animations')
      .update({ runway_job_id: job.id })
      .eq('id', animationId);

    // Start polling for completion (in production, use webhooks)
    pollRunwayJob(animationId, job.id);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      animationId,
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
  const maxAttempts = 60; // 5 minutes max
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
      const runway = getRunwayClient();
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
