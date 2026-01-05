// Video format presets for different social media platforms
// Used to configure Runway API calls with the correct aspect ratio and resolution
//
// IMPORTANT: Runway Gen4 API only supports these specific ratios:
// - 1280:720 (16:9 landscape)
// - 720:1280 (9:16 portrait)
// - 1104:832 (~4:3 landscape)
// - 832:1104 (~3:4 portrait)
// - 960:960 (1:1 square)
// - 1584:672 (ultra-wide)

import type { VideoFormat } from '@/lib/supabase/types';

export interface FormatPreset {
  id: VideoFormat;
  name: string;
  description: string;
  icon: string;  // Emoji icon for UI
  aspectRatio: string;  // Display format (e.g., "9:16")
  resolution: string;  // Runway API format - MUST be one of the supported values above
  width: number;
  height: number;
  duration: 5 | 10;
  platforms: string[];  // List of platforms this format works for
}

export const VIDEO_FORMATS: Record<VideoFormat, FormatPreset> = {
  tiktok: {
    id: 'tiktok',
    name: 'TikTok / Reels',
    description: 'Perfect for TikTok, Instagram Reels, and YouTube Shorts',
    icon: '📱',
    aspectRatio: '9:16',
    resolution: '720:1280',  // Runway Gen4 supported ratio
    width: 720,
    height: 1280,
    duration: 10,
    platforms: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
  },
  instagram_reel: {
    id: 'instagram_reel',
    name: 'Instagram Reel',
    description: 'Optimized for Instagram Reels and Stories',
    icon: '🎬',
    aspectRatio: '9:16',
    resolution: '720:1280',  // Runway Gen4 supported ratio
    width: 720,
    height: 1280,
    duration: 10,
    platforms: ['Instagram Reels', 'Instagram Stories'],
  },
  instagram_square: {
    id: 'instagram_square',
    name: 'Instagram Square',
    description: 'Classic square format for Instagram feed posts',
    icon: '📷',
    aspectRatio: '1:1',
    resolution: '960:960',  // Runway Gen4 supported ratio
    width: 960,
    height: 960,
    duration: 10,
    platforms: ['Instagram Feed', 'Facebook'],
  },
  instagram_portrait: {
    id: 'instagram_portrait',
    name: 'Instagram Portrait',
    description: 'Portrait format for Instagram feed (3:4 ratio)',
    icon: '🖼️',
    aspectRatio: '3:4',
    resolution: '832:1104',  // Runway Gen4 supported ratio (closest to 4:5)
    width: 832,
    height: 1104,
    duration: 10,
    platforms: ['Instagram Feed'],
  },
  landscape: {
    id: 'landscape',
    name: 'Landscape (16:9)',
    description: 'Standard widescreen for YouTube and presentations',
    icon: '🖥️',
    aspectRatio: '16:9',
    resolution: '1280:720',  // Runway Gen4 supported ratio
    width: 1280,
    height: 720,
    duration: 10,
    platforms: ['YouTube', 'Website', 'Presentations'],
  },
};

// Default format if none is selected
export const DEFAULT_FORMAT: VideoFormat = 'tiktok';

// Get format preset by ID
export function getFormatPreset(formatId: VideoFormat): FormatPreset {
  return VIDEO_FORMATS[formatId] || VIDEO_FORMATS[DEFAULT_FORMAT];
}

// Get all formats as an array for UI rendering
export function getAllFormats(): FormatPreset[] {
  return Object.values(VIDEO_FORMATS);
}

// Get Runway-compatible ratio string from format
export function getRunwayRatio(formatId: VideoFormat): string {
  const format = getFormatPreset(formatId);
  return format.resolution;
}

// Determine best format based on image dimensions
export function suggestFormatFromImage(imageWidth: number, imageHeight: number): VideoFormat {
  const aspectRatio = imageWidth / imageHeight;
  
  if (aspectRatio > 1.5) {
    // Wide landscape image
    return 'landscape';
  } else if (aspectRatio > 1.1) {
    // Slightly wide, could work as landscape
    return 'landscape';
  } else if (aspectRatio > 0.9) {
    // Nearly square
    return 'instagram_square';
  } else if (aspectRatio > 0.7) {
    // Portrait (4:5 ish)
    return 'instagram_portrait';
  } else {
    // Very tall/narrow - best for vertical video
    return 'tiktok';
  }
}

