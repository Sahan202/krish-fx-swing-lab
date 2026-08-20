'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export default function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !container.current) return;
    let widgetId: string | undefined;
    const render = () => {
      if (!container.current || !window.turnstile || widgetId) return;
      widgetId = window.turnstile.render(container.current, {
        sitekey: siteKey,
        theme: 'dark',
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    };
    const existing = document.getElementById('cloudflare-turnstile');
    if (existing) existing.addEventListener('load', render);
    else {
      const script = document.createElement('script');
      script.id = 'cloudflare-turnstile';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', render);
      document.head.appendChild(script);
    }
    render();
    return () => {
      if (widgetId) window.turnstile?.remove(widgetId);
      existing?.removeEventListener('load', render);
    };
  }, [siteKey, onToken]);

  if (!siteKey) return <p className="text-sm text-rose-300">Security check is not configured. Please contact support.</p>;
  return <div ref={container} aria-label="Security verification" />;
}
