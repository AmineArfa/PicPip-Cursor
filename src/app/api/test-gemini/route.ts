import { NextRequest, NextResponse } from 'next/server';
import { isGeminiConfigured, getEnhancedPrompt } from '@/lib/gemini';

export async function GET(request: NextRequest) {
  const testImageUrl = 'https://picsum.photos/id/1/800/600'; // A test image
  const testPrompt = 'Dancing with joy';

  const result = {
    geminiConfigured: isGeminiConfigured(),
    apiKeyPresent: !!process.env.GOOGLE_AI_API_KEY,
    apiKeyLength: process.env.GOOGLE_AI_API_KEY?.length || 0,
  };

  console.log('[Test Gemini] Config check:', result);

  try {
    console.log('[Test Gemini] Testing with image:', testImageUrl);
    const promptResult = await getEnhancedPrompt(testImageUrl, testPrompt);
    
    return NextResponse.json({
      ...result,
      success: true,
      usedGemini: promptResult.usedGemini,
      prompt: promptResult.prompt,
      analysis: promptResult.analysis,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Test Gemini] Error:', errorMessage);
    console.error('[Test Gemini] Stack:', errorStack);
    
    return NextResponse.json({
      ...result,
      success: false,
      error: errorMessage,
      stack: errorStack,
    }, { status: 500 });
  }
}

