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
import useUserId from '@/hooks/useUserId';

export default function useHomeSidebar(externalUserId?: string) {
  const { userId: internalUserId, isUserIdReady } = useUserId();
  const userId = externalUserId || internalUserId;
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
    if (!isUserIdReady || !userId) return;

    const uid = encodeURIComponent(userId);

    const fetchUserThreads = async () => {
      try {
        const response = await fetch(
          `http://wren.localhost:8000/api/method/frappe_theme.controllers.wren.get_user_threads?user_id=${uid}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (response.ok) {
          const result = await response.json();
          setUserThreads(result.message || []);
        } else {
          setUserThreads([]);
        }
      } catch (error) {
        console.error('Error fetching user threads:', error);
        setUserThreads([]);
      }
    };

    fetchUserThreads();
  }, [userId, isUserIdReady]);

  const threads = useMemo(() => {
    const allThreads = data?.threads || [];

    if (!isUserIdReady || !userId) return [];

    if (userThreads.length === 0) return [];

    const userThreadIds = userThreads.map((ut) => ut.thread_id);

    return allThreads
      .filter((t) => userThreadIds.includes(t.id.toString()))
      .map((t) => ({ id: t.id.toString(), name: t.summary }));
  }, [data, userThreads, isUserIdReady, userId]);

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
