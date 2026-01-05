import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = process.env.RUNWAY_API_KEY;
  
  const result = {
    apiKeyPresent: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    apiKeyPrefix: apiKey?.substring(0, 10) + '...' || 'N/A',
  };

  console.log('[Test Runway] Config check:', result);

  if (!apiKey) {
    return NextResponse.json({
      ...result,
      success: false,
      error: 'RUNWAY_API_KEY not configured',
    });
  }

  // Test with a simple picsum image
  const testImageUrl = 'https://picsum.photos/id/1/800/600';
  
  try {
    console.log('[Test Runway] Testing API with minimal request...');
    
    // Try the simplest possible request to see what error we get
    // Using Runway Gen4 supported ratio: 1280:720 (16:9 landscape)
    const requestBody = {
      model: 'gen4_turbo',
      promptImage: testImageUrl,
      ratio: '1280:720',
      duration: 5,
      promptText: 'A gentle breeze moves across the scene',
    };
    
    console.log('[Test Runway] Request body:', JSON.stringify(requestBody));
    
    const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[Test Runway] Response status:', response.status);
    
    const responseData = await response.json().catch(() => ({}));
    console.log('[Test Runway] Response:', JSON.stringify(responseData, null, 2));
    
    if (!response.ok) {
      return NextResponse.json({
        ...result,
        success: false,
        httpStatus: response.status,
        httpStatusText: response.statusText,
        error: responseData,
      });
    }
    
    return NextResponse.json({
      ...result,
      success: true,
      jobCreated: true,
      job: responseData,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Test Runway] Error:', errorMessage);
    
    return NextResponse.json({
      ...result,
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}

