'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useTheme } from './use-theme';
import type { OtherUserPresence } from '@/types/kanban';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useThrottle } from './use-throttle';

export function useLiveCursors(projectId: string) {
  const { user } = useAuth();
  const { accentColor } = useTheme();
  const [otherUsers, setOtherUsers] = useState<OtherUserPresence[]>([]);

  const getPresenceDocRef = useCallback((pId: string, uId: string) => {
    return doc(db, 'projectPresence', pId, 'users', uId);
  }, []);

  const getPresenceCollectionRef = useCallback((pId: string) => {
    return collection(db, 'projectPresence', pId, 'users');
  }, []);

  const throttledUpdatePresence = useThrottle((cursor: { x: number; y: number }) => {
    if (user && projectId) {
      const presenceRef = getPresenceDocRef(projectId, user.uid);
      setDoc(
        presenceRef,
        {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          theme: accentColor,
          cursor,
          lastActive: serverTimestamp(),
        },
        { merge: true },
      );
    }
  }, 50);

  useEffect(() => {
    if (!user || !projectId) return;

    const presenceRef = getPresenceDocRef(projectId, user.uid);

    const handlePointerMove = (event: PointerEvent) => {
      throttledUpdatePresence({ x: event.clientX, y: event.clientY });
    };

    const handlePointerLeave = () => {
      setDoc(presenceRef, { cursor: null }, { merge: true });
    };

    window.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
      deleteDoc(presenceRef);
    };
  }, [user, projectId, accentColor, throttledUpdatePresence, getPresenceDocRef]);

  useEffect(() => {
    if (!user || !projectId) return;

    const usersRef = getPresenceCollectionRef(projectId);
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const users: OtherUserPresence[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        if (doc.id !== user.uid && data.cursor) {
          users.push({
            uid: doc.id,
            displayName: data.displayName,
            photoURL: data.photoURL,
            theme: data.theme,
            cursor: data.cursor,
          });
        }
      });
      setOtherUsers(users);
    });

    return () => unsubscribe();
  }, [user, projectId, getPresenceCollectionRef]);

  return otherUsers;
}
