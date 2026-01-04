// Video format presets for different social media platforms
// Used to configure Runway API calls with the correct aspect ratio and resolution

import type { VideoFormat } from '@/lib/supabase/types';

export interface FormatPreset {
  id: VideoFormat;
  name: string;
  description: string;
  icon: string;  // Emoji icon for UI
  aspectRatio: string;  // Display format (e.g., "9:16")
  resolution: string;  // Runway API format (e.g., "1080:1920")
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
    resolution: '1080:1920',
    width: 1080,
    height: 1920,
    duration: 10,
    platforms: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
  },
  instagram_reel: {
    id: 'instagram_reel',
    name: 'Instagram Reel',
    description: 'Optimized for Instagram Reels and Stories',
    icon: '🎬',
    aspectRatio: '9:16',
    resolution: '1080:1920',
    width: 1080,
    height: 1920,
    duration: 10,
    platforms: ['Instagram Reels', 'Instagram Stories'],
  },
  instagram_square: {
    id: 'instagram_square',
    name: 'Instagram Square',
    description: 'Classic square format for Instagram feed posts',
    icon: '📷',
    aspectRatio: '1:1',
    resolution: '1080:1080',
    width: 1080,
    height: 1080,
    duration: 10,
    platforms: ['Instagram Feed', 'Facebook'],
  },
  instagram_portrait: {
    id: 'instagram_portrait',
    name: 'Instagram Portrait',
    description: 'Portrait format for Instagram feed (4:5 ratio)',
    icon: '🖼️',
    aspectRatio: '4:5',
    resolution: '1080:1350',
    width: 1080,
    height: 1350,
    duration: 10,
    platforms: ['Instagram Feed'],
  },
  landscape: {
    id: 'landscape',
    name: 'Landscape (16:9)',
    description: 'Standard widescreen for YouTube and presentations',
    icon: '🖥️',
    aspectRatio: '16:9',
    resolution: '1920:1080',
    width: 1920,
    height: 1080,
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

