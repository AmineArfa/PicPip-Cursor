import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Verify webhook signature from Runway
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

interface RunwayWebhookPayload {
  id: string;
  status: 'SUCCEEDED' | 'FAILED';
  output?: string[];
  failure?: string;
  failureCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-runway-signature');
    const webhookSecret = process.env.RUNWAY_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const payload: RunwayWebhookPayload = JSON.parse(rawBody);
    const { id: runwayJobId, status, output, failure } = payload;

    console.log('Runway webhook received:', { runwayJobId, status });

    const supabase = await createServiceRoleClient();

    // Find the animation by Runway job ID
    const { data: animation, error: findError } = await supabase
      .from('animations')
      .select('*')
      .eq('runway_job_id', runwayJobId)
      .single();

    if (findError || !animation) {
      console.error('Animation not found for Runway job:', runwayJobId);
      return NextResponse.json(
        { error: 'Animation not found' },
        { status: 404 }
      );
    }

    if (status === 'SUCCEEDED' && output?.[0]) {
      const videoUrl = output[0];

      // Download the video and create watermarked version
      // For MVP, we'll use the same URL for both
      // TODO: Implement proper watermarking with ffmpeg

      await supabase
        .from('animations')
        .update({
          status: 'completed',
          video_url: videoUrl,
          watermarked_video_url: videoUrl, // Would be different in production
        })
        .eq('id', animation.id);

      console.log('Animation completed:', animation.id);
    } else if (status === 'FAILED') {
      console.error('Runway job failed:', failure);
      
      await supabase
        .from('animations')
        .update({ status: 'failed' })
        .eq('id', animation.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Runway webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

