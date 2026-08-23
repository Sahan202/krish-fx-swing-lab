'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SessionGuard() {
  useEffect(() => {
    let checking = false;

    const publicPaths = [
      '/login',
      '/signup',
      '/google-onboarding',
      '/change-password',
    ];

    const blockContextMenu = (event: MouseEvent) => {
      if (!publicPaths.includes(window.location.pathname)) {
        event.preventDefault();
      }
    };

    const check = async () => {
      if (
        checking ||
        publicPaths.includes(window.location.pathname)
      ) {
        return;
      }

      checking = true;

      try {
        const supabase = createClient();
        const userResult = await supabase.auth.getUser();

        if (userResult.data.user?.user_metadata?.must_change_password) {
          window.location.replace('/change-password');
          return;
        }

        const response = await fetch('/api/session/check', {
          cache: 'no-store',
        });

        if (
          response.status === 401 &&
          window.location.pathname !== '/login'
        ) {
          await supabase.auth.signOut({ scope: 'local' });
          window.location.replace('/login?reason=other-device');
        }
      } finally {
        checking = false;
      }
    };

    const onVisibility = () => {
      if (!document.hidden) {
        void check();
      }
    };

    const timer = window.setInterval(check, 3000);

    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('contextmenu', blockContextMenu);

    void check();

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('contextmenu', blockContextMenu);
    };
  }, []);

  return null;
}