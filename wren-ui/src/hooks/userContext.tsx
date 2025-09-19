import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import useUserId from './useUserId';

type UserContextValue = {
  userId: string | null;
  isUserIdReady: boolean;
  threads: Array<{ thread_id: string; name?: string }>;
  refetchThreads: () => void;
};

const UserContext = createContext<UserContextValue>({
  userId: null,
  isUserIdReady: false,
  threads: [],
  refetchThreads: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { userId, isUserIdReady } = useUserId();
  const [threads, setThreads] = useState<
    Array<{ thread_id: string; name?: string }>
  >([]);

  const rawBaseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.REACT_APP_BASE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const apiBaseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/$/, '') : '';

  const doFetchThreads = async (uid: string) => {
    if (!apiBaseUrl) return;
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/method/frappe_theme.controllers.wren.get_user_threads?user_id=${encodeURIComponent(
          uid,
        )}`,
      );
      if (response.ok) {
        const result = await response.json();
        setThreads(result.message || []);
      } else {
        setThreads([]);
      }
    } catch (err) {
      console.error('fetch user threads failed', err);
      setThreads([]);
    }
  };

  useEffect(() => {
    if (!isUserIdReady || !userId) return;
    doFetchThreads(userId);
  }, [isUserIdReady, userId, apiBaseUrl]);

  const value = useMemo(
    () => ({
      userId,
      isUserIdReady,
      threads,
      refetchThreads: () => userId && doFetchThreads(userId),
    }),
    [userId, isUserIdReady, threads],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export function useUser() {
  return useContext(UserContext);
}
