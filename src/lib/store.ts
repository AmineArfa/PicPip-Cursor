import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Animation } from './supabase/types';

export type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

interface PicPipState {
  // Guest session management
  guestSessionId: string | null;
  
  // Current animation in progress
  currentAnimation: Animation | null;
  
  // Processing state
  processingStatus: ProcessingStatus;
  processingMessage: string;
  processingProgress: number;
  
  // User state
  isAuthenticated: boolean;
  isSubscribed: boolean;
  credits: number;
  
  // Actions
  setGuestSession: (id: string) => void;
  clearGuestSession: () => void;
  setAnimation: (animation: Animation | null) => void;
  setProcessingStatus: (status: ProcessingStatus, message?: string) => void;
  setProcessingProgress: (progress: number) => void;
  setUserState: (isAuthenticated: boolean, isSubscribed: boolean, credits: number) => void;
  setCredits: (credits: number) => void;
  decrementCredits: () => void;
  reset: () => void;
}

const initialState = {
  guestSessionId: null,
  currentAnimation: null,
  processingStatus: 'idle' as ProcessingStatus,
  processingMessage: '',
  processingProgress: 0,
  isAuthenticated: false,
  isSubscribed: false,
  credits: 0,
};

export const usePicPipStore = create<PicPipState>()(
  persist(
    (set) => ({
      ...initialState,

      setGuestSession: (id: string) => 
        set({ guestSessionId: id }),

      clearGuestSession: () => 
        set({ guestSessionId: null }),

      setAnimation: (animation: Animation | null) => 
        set({ currentAnimation: animation }),

      setProcessingStatus: (status: ProcessingStatus, message?: string) =>
        set({ 
          processingStatus: status, 
          processingMessage: message || '',
          // Reset progress when changing status
          processingProgress: status === 'idle' ? 0 : undefined,
        }),

      setProcessingProgress: (progress: number) =>
        set({ processingProgress: Math.min(100, Math.max(0, progress)) }),

      setUserState: (isAuthenticated: boolean, isSubscribed: boolean, credits: number) =>
        set({ isAuthenticated, isSubscribed, credits }),

      setCredits: (credits: number) =>
        set({ credits }),

      decrementCredits: () =>
        set((state) => ({ credits: Math.max(0, state.credits - 1) })),

      reset: () => set(initialState),
    }),
    {
      name: 'picpip-storage',
      partialize: (state) => ({
        guestSessionId: state.guestSessionId,
        currentAnimation: state.currentAnimation,
      }),
    }
  )
);

// Helper hook to get or create guest session ID
export function useGuestSession(): string {
  const { guestSessionId, setGuestSession } = usePicPipStore();
  
  if (!guestSessionId) {
    // Generate a new UUID
    const newId = crypto.randomUUID();
    setGuestSession(newId);
    return newId;
  }
  
  return guestSessionId;
}

