import { useState, useEffect } from 'react';

export default function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isUserIdReady, setIsUserIdReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const REQUEST_EVENT = 'WRENAI_REQUEST_USER';
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

    // Actively request user info from the parent if we are inside an iframe
    const requestUser = () => {
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: REQUEST_EVENT }, '*');
        }
      } catch (err) {
        console.warn('Unable to postMessage to parent:', err);
      }
    };

    // Initial request
    requestUser();

    // Retry a few times in case parent is not ready yet
    let attempts = 0;
    const maxAttempts = 10;
    const intervalId = window.setInterval(() => {
      if (isUserIdReady) {
        window.clearInterval(intervalId);
        return;
      }
      attempts += 1;
      if (attempts > maxAttempts) {
        window.clearInterval(intervalId);
        return;
      }
      requestUser();
    }, 1000);

    return () => {
      window.removeEventListener('message', handler);
      window.clearInterval(intervalId);
    };
  }, [isUserIdReady]);

  return { userId, isUserIdReady };
}
