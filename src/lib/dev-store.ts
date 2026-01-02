// In-memory store for development mode with file persistence
// This allows the app to work without Supabase configured

import * as fs from 'fs';
import * as path from 'path';

interface DevAnimation {
  id: string;
  guest_session_id: string | null;
  user_id: string | null;
  original_photo_url: string;
  thumbnail_url: string | null;
  video_url: string | null;
  watermarked_video_url: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  is_paid: boolean;
  runway_job_id: string | null;
  title: string | null;
  created_at: string;
}

// Demo video URLs for development
const DEMO_VIDEOS = [
  'https://res.cloudinary.com/demo/video/upload/dog.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
];

// File path for persistence
const DEV_STORE_PATH = path.join(process.cwd(), '.dev-store.json');

class DevStore {
  private animations: Map<string, DevAnimation> = new Map();
  private initialized = false;

  private load(): void {
    if (this.initialized) return;
    this.initialized = true;
    
    try {
      if (fs.existsSync(DEV_STORE_PATH)) {
        const data = fs.readFileSync(DEV_STORE_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        if (parsed.animations) {
          for (const [key, value] of Object.entries(parsed.animations)) {
            this.animations.set(key, value as DevAnimation);
          }
        }
        console.log(`[DevStore] Loaded ${this.animations.size} animations from disk`);
      }
    } catch (error) {
      console.warn('[DevStore] Failed to load from disk:', error);
    }
  }

  private save(): void {
    try {
      const data = {
        animations: Object.fromEntries(this.animations),
        savedAt: new Date().toISOString(),
      };
      fs.writeFileSync(DEV_STORE_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn('[DevStore] Failed to save to disk:', error);
    }
  }

  createAnimation(data: Omit<DevAnimation, 'status' | 'video_url' | 'watermarked_video_url' | 'created_at'>): DevAnimation {
    this.load();
    
    const animation: DevAnimation = {
      ...data,
      status: 'pending',
      video_url: null,
      watermarked_video_url: null,
      created_at: new Date().toISOString(),
    };
    
    this.animations.set(animation.id, animation);
    this.save();
    
    // Auto-process after a delay
    this.startProcessing(animation.id);
    
    return animation;
  }

  getAnimation(id: string): DevAnimation | null {
    this.load();
    return this.animations.get(id) || null;
  }

  updateAnimation(id: string, updates: Partial<DevAnimation>): DevAnimation | null {
    this.load();
    const animation = this.animations.get(id);
    if (!animation) return null;
    
    const updated = { ...animation, ...updates };
    this.animations.set(id, updated);
    this.save();
    return updated;
  }

  startProcessing(id: string): void {
    // Set to processing after 1 second
    setTimeout(() => {
      const current = this.getAnimation(id);
      if (current && current.status === 'pending') {
        this.updateAnimation(id, { status: 'processing' });
        console.log(`[DevStore] Animation ${id} processing...`);
      }
    }, 1000);

    // Complete after 8-12 seconds
    const processingTime = 8000 + Math.random() * 4000;
    setTimeout(() => {
      const current = this.getAnimation(id);
      if (current && (current.status === 'pending' || current.status === 'processing')) {
        const demoVideo = DEMO_VIDEOS[Math.floor(Math.random() * DEMO_VIDEOS.length)];
        this.updateAnimation(id, {
          status: 'completed',
          video_url: demoVideo,
          watermarked_video_url: demoVideo,
        });
        console.log(`[DevStore] Animation ${id} completed with video: ${demoVideo}`);
      }
    }, processingTime);
  }

  // Get all animations for a guest session
  getAnimationsByGuestSession(guestSessionId: string): DevAnimation[] {
    this.load();
    return Array.from(this.animations.values())
      .filter(a => a.guest_session_id === guestSessionId);
  }

  // Check if we should use dev mode
  static shouldUseDevMode(): boolean {
    return !process.env.SUPABASE_SERVICE_ROLE_KEY || 
           process.env.USE_DEV_STORE === 'true';
  }
}

// Singleton instance
export const devStore = new DevStore();
