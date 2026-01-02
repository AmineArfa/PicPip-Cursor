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
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          credits?: number;
          subscription_status?: 'none' | 'trial' | 'active' | 'cancelled';
          stripe_customer_id?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          credits?: number;
          subscription_status?: 'none' | 'trial' | 'active' | 'cancelled';
          stripe_customer_id?: string | null;
          is_admin?: boolean;
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
      support_tickets: {
        Row: {
          id: string;
          ticket_number: string;
          email: string;
          subject: string | null;
          status: 'open' | 'in_progress' | 'resolved' | 'closed';
          user_id: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          ticket_number: string;
          email: string;
          subject?: string | null;
          status?: 'open' | 'in_progress' | 'resolved' | 'closed';
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          ticket_number?: string;
          email?: string;
          subject?: string | null;
          status?: 'open' | 'in_progress' | 'resolved' | 'closed';
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
      };
      support_messages: {
        Row: {
          id: string;
          ticket_id: string;
          sender_type: 'user' | 'admin';
          sender_email: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          sender_type: 'user' | 'admin';
          sender_email: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          sender_type?: 'user' | 'admin';
          sender_email?: string;
          message?: string;
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
      ticket_status: 'open' | 'in_progress' | 'resolved' | 'closed';
      sender_type: 'user' | 'admin';
    };
  };
};

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Animation = Database['public']['Tables']['animations']['Row'];
export type Purchase = Database['public']['Tables']['purchases']['Row'];
export type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];
export type SupportMessage = Database['public']['Tables']['support_messages']['Row'];

export type AnimationInsert = Database['public']['Tables']['animations']['Insert'];
export type AnimationUpdate = Database['public']['Tables']['animations']['Update'];
export type SupportTicketInsert = Database['public']['Tables']['support_tickets']['Insert'];
export type SupportTicketUpdate = Database['public']['Tables']['support_tickets']['Update'];
export type SupportMessageInsert = Database['public']['Tables']['support_messages']['Insert'];

