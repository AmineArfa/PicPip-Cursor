import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

/**
 * Facebook Data Deletion Callback
 * 
 * This endpoint is called when a user removes our app from their Facebook account
 * and requests their data to be deleted. Facebook sends a signed request containing
 * the user's app-scoped ID.
 * 
 * Required by Meta Platform Terms for apps using Facebook Login.
 */

interface ParsedSignedRequest {
  algorithm: string;
  expires: number;
  issued_at: number;
  user_id: string;
}

function base64UrlDecode(input: string): Buffer {
  // Convert base64url to base64
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if necessary
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

function parseSignedRequest(signedRequest: string, appSecret: string): ParsedSignedRequest | null {
  try {
    const [encodedSig, payload] = signedRequest.split('.', 2);
    
    if (!encodedSig || !payload) {
      console.error('[FB Deletion] Invalid signed request format');
      return null;
    }

    // Decode the signature
    const sig = base64UrlDecode(encodedSig);
    
    // Decode the payload
    const data = JSON.parse(base64UrlDecode(payload).toString('utf8')) as ParsedSignedRequest;
    
    // Verify the algorithm
    if (data.algorithm?.toUpperCase() !== 'HMAC-SHA256') {
      console.error('[FB Deletion] Unknown algorithm:', data.algorithm);
      return null;
    }

    // Verify the signature
    const expectedSig = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest();

    if (!crypto.timingSafeEqual(sig, expectedSig)) {
      console.error('[FB Deletion] Bad signed request signature!');
      return null;
    }

    return data;
  } catch (error) {
    console.error('[FB Deletion] Error parsing signed request:', error);
    return null;
  }
}

function generateConfirmationCode(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    // Get the Facebook App Secret from environment
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    
    if (!appSecret) {
      console.error('[FB Deletion] FACEBOOK_APP_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const signedRequest = formData.get('signed_request');

    if (!signedRequest || typeof signedRequest !== 'string') {
      console.error('[FB Deletion] Missing signed_request in POST body');
      return NextResponse.json(
        { error: 'Missing signed_request' },
        { status: 400 }
      );
    }

    // Parse and verify the signed request
    const data = parseSignedRequest(signedRequest, appSecret);

    if (!data) {
      return NextResponse.json(
        { error: 'Invalid signed request' },
        { status: 400 }
      );
    }

    const userId = data.user_id;
    console.log('[FB Deletion] Processing deletion request for user:', userId);

    // Generate a unique confirmation code
    const confirmationCode = generateConfirmationCode();

    // Store the deletion request in database
    const supabase = await createServiceRoleClient();
    
    const { error: insertError } = await supabase
      .from('data_deletion_requests')
      .insert({
        confirmation_code: confirmationCode,
        facebook_user_id: userId,
        status: 'pending',
      });

    if (insertError) {
      console.error('[FB Deletion] Error storing deletion request:', insertError);
      // Still return success to Facebook, but log the error
      // We can manually process based on logs if DB insert fails
    }

    // Build the status URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://picpip.co';
    const statusUrl = `${appUrl}/data-deletion/status?code=${confirmationCode}`;

    // Return the response in the format Facebook expects
    const response = {
      url: statusUrl,
      confirmation_code: confirmationCode,
    };

    console.log('[FB Deletion] Deletion request created:', {
      userId,
      confirmationCode,
      statusUrl,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[FB Deletion] Error processing deletion request:', error);
    return NextResponse.json(
      { error: 'Failed to process deletion request' },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

