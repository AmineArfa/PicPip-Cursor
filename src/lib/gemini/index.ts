/**
 * Gemini Flash Integration for PicPip
 * 
 * Uses Google's Gemini 2.0 Flash model to analyze uploaded images and generate
 * optimized prompts for Runway video generation.
 * 
 * The Gemini-enhanced prompt is saved to the animations.ai_enhanced_prompt column
 * in Supabase for debugging and improvement purposes.
 * 
 * SETUP:
 * 1. Install the package: npm install @google/generative-ai
 * 2. Add GOOGLE_AI_API_KEY to your environment variables
 * 3. The service will automatically use Gemini when the API key is present
 */

// Types for Gemini response
export interface ImageAnalysis {
  subject: string;
  setting: string;
  lighting: string;
  features: string[];
  suggestedPrompt: string;
}

export interface EnhancedPromptResult {
  prompt: string;
  analysis?: ImageAnalysis;
  usedGemini: boolean;
}

// Enhanced static prompts (fallback when Gemini is not configured)
const ENHANCED_PROMPTS: Record<string, string> = {
  'Dancing with joy, rhythmic movements, happy celebration': 
    'The subject starts dancing joyfully, swaying their body side to side with fluid movements, arms moving expressively. The camera slowly pushes in while maintaining focus on their expression.',
  'Warm embrace, hugging motion, affectionate gesture': 
    'The subject opens their arms wide and wraps them around in a warm embracing motion, eyes closing gently with a peaceful smile. The camera holds steady with a subtle dolly forward.',
  'Waving hello, friendly greeting, hand gesture': 
    'The subject raises their right hand and waves enthusiastically back and forth, their expression brightening with a friendly smile. The camera remains still, capturing the natural movement.',
  'Laughing out loud, joyful expression, genuine happiness': 
    'The subject bursts into genuine laughter, their shoulders shaking slightly, eyes crinkling with joy, mouth opening wide. The camera holds steady as their expression transforms to pure joy.',
  'Jumping with excitement, bouncing motion, energetic leap': 
    'The subject bends their knees and leaps upward with excited energy, arms throwing upward, landing with a bounce. The camera tracks their upward motion smoothly.',
  'Blowing a kiss, romantic gesture, sending love': 
    'The subject brings their hand to their lips, kisses their palm gently, then extends their arm forward releasing the kiss with a playful wink. The camera slowly dollies in toward their face.',
  'Cheering celebration, arms raised, victorious moment': 
    'The subject throws both arms up triumphantly above their head, fists clenched in celebration, face beaming with victorious joy. The camera pushes in dynamically as they pump their arms.',
  'Playful wink, subtle expression, charming gesture': 
    'The subject tilts their head slightly and closes one eye in a charming wink, corner of their mouth curling into a knowing smile. The camera holds steady, capturing the subtle expression.',
};

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GOOGLE_AI_API_KEY;
}

/**
 * Build the system prompt for Gemini
 */
function buildSystemPrompt(userAction: string): string {
  return `You are an expert at creating video generation prompts for AI video models.
Your task is to analyze the provided image and create a detailed, specific prompt for generating a video.

The user wants the subject in the image to: "${userAction}"

Instructions:
1. First, describe what you see in the image:
   - Who/what is the main subject (person, animal, object)
   - The setting/environment
   - Lighting conditions
   - Notable features (clothing, expressions, etc.)

2. Then, create a detailed video prompt that:
   - Describes the specific motion/action clearly
   - Includes camera movement suggestions
   - Maintains consistency with the image's style and mood
   - Uses positive, specific language (avoid "no" or "don't")

3. Format your response as JSON:
{
  "subject": "brief description of main subject",
  "setting": "description of environment",
  "lighting": "description of lighting",
  "features": ["notable feature 1", "notable feature 2"],
  "suggestedPrompt": "Your detailed video generation prompt here"
}

The suggestedPrompt should be 2-3 sentences, focused on motion and camera movement.`;
}

/**
 * Analyze image and generate enhanced prompt using Gemini Flash
 */
async function analyzeWithGemini(
  imageUrl: string, 
  userAction: string
): Promise<ImageAnalysis | null> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.log('[Gemini] API key not configured, skipping');
    return null;
  }

  try {
    // Dynamic import to avoid errors when package isn't installed
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use Gemini 2.0 Flash (fast and cheap)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Create the content with image
    const result = await model.generateContent([
      buildSystemPrompt(userAction),
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ]);

    const responseText = result.response.text();
    
    // Parse the JSON response
    // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    const analysis: ImageAnalysis = JSON.parse(jsonStr);
    console.log('[Gemini] Successfully analyzed image:', analysis.subject);
    
    return analysis;
  } catch (error) {
    console.error('[Gemini] Error analyzing image:', error);
    return null;
  }
}

/**
 * Get enhanced prompt for video generation
 * Uses Gemini if configured, otherwise falls back to static enhanced prompts
 */
export async function getEnhancedPrompt(
  imageUrl: string,
  userAction: string
): Promise<EnhancedPromptResult> {
  // Try Gemini first if configured
  if (isGeminiConfigured()) {
    try {
      const analysis = await analyzeWithGemini(imageUrl, userAction);
      
      if (analysis?.suggestedPrompt) {
        return {
          prompt: analysis.suggestedPrompt,
          analysis,
          usedGemini: true,
        };
      }
    } catch (error) {
      console.error('[Gemini] Failed, falling back to static prompts:', error);
    }
  }

  // Fallback to enhanced static prompts
  const enhancedPrompt = ENHANCED_PROMPTS[userAction];
  
  if (enhancedPrompt) {
    return {
      prompt: enhancedPrompt,
      usedGemini: false,
    };
  }

  // Default enhancement for custom prompts
  return {
    prompt: `${userAction}. The camera holds steady, capturing smooth and natural movement with subtle motion.`,
    usedGemini: false,
  };
}

/**
 * Build complete prompt with image analysis
 * Combines Gemini analysis with user action for optimal Runway results
 */
export async function buildCompletePrompt(
  imageUrl: string,
  userAction: string
): Promise<{ prompt: string; analysis?: ImageAnalysis; usedGemini: boolean }> {
  const result = await getEnhancedPrompt(imageUrl, userAction);
  
  // If we got a full analysis from Gemini, we can build an even richer prompt
  if (result.usedGemini && result.analysis) {
    // The Gemini prompt already incorporates the image analysis
    return result;
  }
  
  return result;
}

