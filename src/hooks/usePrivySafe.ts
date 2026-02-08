'use client';

import { usePrivy as usePrivyOriginal } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';

// Safe wrapper for usePrivy that handles cases where Privy isn't initialized
export function usePrivySafe() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Try to use Privy, but catch errors if not in context
  try {
    if (!isClient) {
      return {
        ready: false,
        authenticated: false,
        user: null,
        login: () => {},
        logout: () => {},
        linkTwitter: () => Promise.resolve(),
      };
    }
    
    const privy = usePrivyOriginal();
    return privy;
  } catch (error) {
    // Return safe defaults if Privy isn't available
    return {
      ready: true, // Mark as ready so UI doesn't show loading forever
      authenticated: false,
      user: null,
      login: () => {
        // Fallback: reload page to try again
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      },
      logout: () => {},
      linkTwitter: () => Promise.resolve(),
    };
  }
}
