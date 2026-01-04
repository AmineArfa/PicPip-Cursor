'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * SessionProvider - Keeps user session alive across navigation
 * Refreshes session on route changes and periodically
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Refresh session on route change
    const refreshSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Refresh the session to extend expiration
        await supabase.auth.refreshSession();
      }
    };

    refreshSession();
  }, [pathname]);

  useEffect(() => {
    // Set up periodic session refresh (every 30 minutes)
    const interval = setInterval(async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Refresh the session to extend expiration
        await supabase.auth.refreshSession();
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}



