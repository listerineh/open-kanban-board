'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import type { Notification } from '@/types/kanban';
import { useKanbanStore } from './use-kanban-store';
import { toast } from './use-toast';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const handleInvitation = useKanbanStore((state) => state.actions.handleInvitation);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedNotifications = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Notification,
        );

        setNotifications(fetchedNotifications);
        setUnreadCount(fetchedNotifications.filter((n) => !n.read).length);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    const batch = writeBatch(db);
    notifications.forEach((notification) => {
      if (!notification.read) {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { read: true });
      }
    });
    await batch.commit();
  }, [user, notifications]);

  const handleInvitationAction = useCallback(
    async (action: 'accept' | 'decline', projectId: string, invitationId: string, notificationId: string) => {
      try {
        await handleInvitation(action, projectId, invitationId);
        await deleteDoc(doc(db, 'notifications', notificationId));
        toast({
          title: `Invitation ${action === 'accept' ? 'Accepted' : 'Declined'}`,
          description: `You have ${action === 'accept' ? 'joined' : 'declined to join'} the project.`,
          variant: 'default',
        });
      } catch (error) {
        console.error(`Error ${action}ing invitation:`, error);
        toast({
          title: 'Error',
          description: 'There was an error processing your response. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [handleInvitation],
  );

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, handleInvitationAction };
}
