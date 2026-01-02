export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          credits: number;
          subscription_status: 'none' | 'trial' | 'active' | 'cancelled';
          stripe_customer_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          credits?: number;
          subscription_status?: 'none' | 'trial' | 'active' | 'cancelled';
          stripe_customer_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          credits?: number;
          subscription_status?: 'none' | 'trial' | 'active' | 'cancelled';
          stripe_customer_id?: string | null;
          created_at?: string;
        };
      };
      animations: {
        Row: {
          id: string;
          user_id: string | null;
          guest_session_id: string | null;
          title: string | null;
          original_photo_url: string;
          video_url: string | null;
          watermarked_video_url: string | null;
          thumbnail_url: string | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          is_paid: boolean;
          runway_job_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          guest_session_id?: string | null;
          title?: string | null;
          original_photo_url: string;
          video_url?: string | null;
          watermarked_video_url?: string | null;
          thumbnail_url?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          is_paid?: boolean;
          runway_job_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          guest_session_id?: string | null;
          title?: string | null;
          original_photo_url?: string;
          video_url?: string | null;
          watermarked_video_url?: string | null;
          thumbnail_url?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          is_paid?: boolean;
          runway_job_id?: string | null;
          created_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string | null;
          animation_id: string | null;
          stripe_session_id: string | null;
          product_type: 'single' | 'bundle' | 'subscription';
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          animation_id?: string | null;
          stripe_session_id?: string | null;
          product_type: 'single' | 'bundle' | 'subscription';
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          animation_id?: string | null;
          stripe_session_id?: string | null;
          product_type?: 'single' | 'bundle' | 'subscription';
          amount?: number;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      subscription_status: 'none' | 'trial' | 'active' | 'cancelled';
      animation_status: 'pending' | 'processing' | 'completed' | 'failed';
      product_type: 'single' | 'bundle' | 'subscription';
    };
  };
};

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Animation = Database['public']['Tables']['animations']['Row'];
export type Purchase = Database['public']['Tables']['purchases']['Row'];

export type AnimationInsert = Database['public']['Tables']['animations']['Insert'];
export type AnimationUpdate = Database['public']['Tables']['animations']['Update'];

