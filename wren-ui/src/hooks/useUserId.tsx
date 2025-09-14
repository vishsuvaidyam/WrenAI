import { useState, useEffect } from 'react';

export default function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isUserIdReady, setIsUserIdReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (event: MessageEvent) => {
      // Only process events that have a proper userId
      if (
        event.data &&
        typeof event.data === 'object' &&
        'userId' in event.data
      ) {
        console.log('Data from parent:', event.data);
        const newUserId = event.data.userId;
        setUserId(newUserId);
        setIsUserIdReady(true);

        if (
          event.source &&
          typeof (event.source as WindowProxy).postMessage === 'function'
        ) {
          (event.source as WindowProxy).postMessage(
            { success: true, message: 'Received user info' },
            event.origin,
          );
        }
      } else {
        console.warn('Ignored irrelevant message:', event.data);
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, []);

  return { userId, isUserIdReady };
}
