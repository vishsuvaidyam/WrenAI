// import { useMemo } from 'react';
// import { useRouter } from 'next/router';
// import { Path } from '@/utils/enum';
// import {
//   useDeleteThreadMutation,
//   useThreadsQuery,
//   useUpdateThreadMutation,
// } from '@/apollo/client/graphql/home.generated';

// export default function useHomeSidebar() {
//   const router = useRouter();
//   const { data, refetch } = useThreadsQuery({
//     fetchPolicy: 'cache-and-network',
//   });
//   const [updateThread] = useUpdateThreadMutation({
//     onError: (error) => console.error(error),
//   });
//   const [deleteThread] = useDeleteThreadMutation({
//     onError: (error) => console.error(error),
//   });

//   const threads = useMemo(
//     () =>
//       (data?.threads || []).map((thread) => ({
//         id: thread.id.toString(),
//         name: thread.summary,
//       })),
//     [data],
//   );

//   const onSelect = (selectKeys: string[]) => {
//     router.push(`${Path.Home}/${selectKeys[0]}`);
//   };

//   const onRename = async (id: string, newName: string) => {
//     await updateThread({
//       variables: { where: { id: Number(id) }, data: { summary: newName } },
//     });
//     refetch();
//   };

//   const onDelete = async (id) => {
//     await deleteThread({ variables: { where: { id: Number(id) } } });
//     refetch();
//   };

//   return {
//     data: { threads },
//     onSelect,
//     onRename,
//     onDelete,
//     refetch,
//   };
// }
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Path } from '@/utils/enum';
import {
  useDeleteThreadMutation,
  useThreadsQuery,
  useUpdateThreadMutation,
} from '@/apollo/client/graphql/home.generated';

type UseHomeSidebarProps = {
  userId?: string;
  apiBaseUrl?: string;
};
let uid = '';

// Backward compatible signature: string userId OR props object
export default function useHomeSidebar(arg?: string | UseHomeSidebarProps) {
  const userId = typeof arg === 'string' ? arg : arg?.userId;
  const apiBaseUrl =
    (typeof arg === 'object' && arg?.apiBaseUrl) ||
    'http://test.localhost:8000';

  console.log('userId:', userId);
  const router = useRouter();
  const [userThreads, setUserThreads] = useState<any[]>([]);
  const { data, refetch } = useThreadsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [updateThread] = useUpdateThreadMutation({
    onError: (error) => console.error(error),
  });
  const [deleteThread] = useDeleteThreadMutation({
    onError: (error) => console.error(error),
  });

  // Fetch threads from Frappe based on userId
  useEffect(() => {
    uid = encodeURIComponent(userId);
    if (!userId) return;
    console.log('userId:', userId);
    const fetchUserThreads = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/method/my_test.wren_app.wren_ai.get_user_threads?user_id=${uid}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (response.ok) {
          const result = await response.json();
          console.log('result:', result);
          setUserThreads(result.message || []);
        } else {
          console.error('Failed to fetch user threads');
          setUserThreads([]);
        }
      } catch (error) {
        console.error('Error fetching user threads:', error);
        setUserThreads([]);
      }
    };

    fetchUserThreads();
  }, [userId, apiBaseUrl]);

  const threads = useMemo(() => {
    const allThreads = data?.threads || [];
    console.log('useHomeSidebar - allThreads:', allThreads);
    console.log('useHomeSidebar - userId:', userId);
    console.log('useHomeSidebar - userThreads:', userThreads);

    // If no userId provided, return all threads (for backward compatibility)
    if (!userId) {
      console.log('useHomeSidebar - returning all threads (no userId)');
      return allThreads.map((thread) => ({
        id: thread.id.toString(),
        name: thread.summary,
      }));
    }

    // If userId is provided but no userThreads yet, return empty array
    // This prevents showing all threads before user-specific threads are loaded
    if (userThreads.length === 0) {
      console.log(
        'useHomeSidebar - returning empty array (no userThreads yet)',
      );
      return [];
    }

    // Filter threads based on userThreads from Frappe
    const userThreadIds = userThreads.map((ut) => ut.thread_id);
    console.log('useHomeSidebar - userThreadIds:', userThreadIds);

    const filteredThreads = allThreads
      .filter((thread) => userThreadIds.includes(thread.id.toString()))
      .map((thread) => ({
        id: thread.id.toString(),
        name: thread.summary,
      }));

    console.log('useHomeSidebar - filteredThreads:', filteredThreads);
    return filteredThreads;
  }, [data, userId, userThreads]);

  const onSelect = (selectKeys: string[]) => {
    router.push(`${Path.Home}/${selectKeys[0]}`);
  };

  const onRename = async (id: string, newName: string) => {
    await updateThread({
      variables: { where: { id: Number(id) }, data: { summary: newName } },
    });
    refetch();
  };

  const onDelete = async (id: string) => {
    await deleteThread({ variables: { where: { id: Number(id) } } });
    refetch();
  };

  return {
    data: { threads },
    onSelect,
    onRename,
    onDelete,
    refetch,
  };
}
