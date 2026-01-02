import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { uploadRatelimit, checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { validateFileType, rateLimitResponse, handleCorsPreFlight } from '@/lib/security';
import { devStore } from '@/lib/dev-store';
import { v4 as uuidv4 } from 'uuid';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types (also validated server-side via magic bytes)
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request) || NextResponse.json({});
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (skip in development if no Redis)
    if (process.env.NODE_ENV === 'production' || uploadRatelimit) {
      const clientIP = getClientIP(request);
      const rateLimit = await checkRateLimit(uploadRatelimit, clientIP);
      
      if (!rateLimit.success) {
        console.warn(`Rate limit exceeded for IP: ${clientIP}`);
        return rateLimitResponse(rateLimit.reset);
      }
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const guestSessionId = formData.get('guestSessionId') as string | null;

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Validate MIME type (basic check)
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.' },
        { status: 400 }
      );
    }

    // Validate file type using magic bytes (security check)
    const fileValidation = await validateFileType(file);
    if (!fileValidation.valid) {
      console.warn(`File type validation failed: ${fileValidation.error}`);
      return NextResponse.json(
        { error: fileValidation.error || 'Invalid file type' },
        { status: 400 }
      );
    }

    // Validate guest session ID
    if (!guestSessionId) {
      return NextResponse.json(
        { error: 'Guest session ID required' },
        { status: 400 }
      );
    }

    // Validate guest session ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(guestSessionId)) {
      return NextResponse.json(
        { error: 'Invalid guest session ID format' },
        { status: 400 }
      );
    }

    // Generate IDs
    const animationId = uuidv4();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExtension = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExtension) 
      ? fileExtension 
      : 'jpg';
    const fileName = `${guestSessionId}/${animationId}.${safeExtension}`;

    // Try to use Supabase, fall back to dev mode
    let useDevMode = false;
    let publicUrl: string = '';
    let supabase: any;

    try {
      supabase = await createServiceRoleClient();
      
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Try to upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('guest-uploads')
        .upload(fileName, buffer, {
          contentType: fileValidation.detectedType || file.type,
          upsert: false,
        });

      if (uploadError) {
        console.warn('Storage upload failed:', uploadError.message);
        useDevMode = true;
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('guest-uploads')
          .getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      }
    } catch (err: any) {
      console.warn('Supabase not available:', err.message);
      useDevMode = true;
    }

    // Development mode fallback
    if (useDevMode) {
      console.log('[Dev Mode] Using in-memory store for animation');
      publicUrl = `https://picsum.photos/seed/${animationId}/800/600`;
      
      const animation = devStore.createAnimation({
        id: animationId,
        guest_session_id: guestSessionId,
        user_id: null,
        original_photo_url: publicUrl,
        thumbnail_url: publicUrl,
        runway_job_id: null,
        title: null,
        is_paid: false,
      });

      return NextResponse.json({
        success: true,
        animation,
        devMode: true,
      });
    }

    // Production mode - create database record
    const { data: animation, error: dbError } = await supabase
      .from('animations')
      .insert({
        id: animationId,
        guest_session_id: guestSessionId,
        original_photo_url: publicUrl,
        thumbnail_url: publicUrl,
        status: 'pending',
        is_paid: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('guest-uploads').remove([fileName]);
      return NextResponse.json(
        { error: 'Failed to create animation record' },
        { status: 500 }
      );
    }

    // Trigger Runway ML processing
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    fetch(`${appUrl}/api/runway/create-job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        animationId: animation.id,
        imageUrl: publicUrl,
      }),
    }).catch((err) => {
      console.error('Failed to trigger Runway job:', err);
    });

    return NextResponse.json({
      success: true,
      animation,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
