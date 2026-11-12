import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/notifications';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export function useNotificationsList(params = {}) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => api.getNotifications(params),
    enabled: !!isAuthenticated,
  });
}

export function useUnreadCount() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: api.getUnreadCount,
    enabled: !!isAuthenticated,
    refetchInterval: 60000,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.markAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.markAllAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Main push notification & unread notifications hook
 */
export function useNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const unreadQuery = useUnreadCount();
  const unreadCount = unreadQuery.data?.count || 0;

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription);
        });
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast.error('Push notifications are not supported in this browser');
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Notification permission was not granted');
        return false;
      }

      // Get VAPID public key from backend
      const { publicKey } = await api.getVapidKey();

      if (!publicKey) {
        toast.error('Web Push is unavailable: the server has no VAPID public key configured');
        return false;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to backend
      await api.subscribe(subscription);

      setIsSubscribed(true);
      toast.success('Push reminders enabled on this device');
      return true;
    } catch (err) {
      console.error('Subscription error:', err);
      toast.error('Could not activate push notifications: ' + err.message);
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await api.unsubscribe(subscription.endpoint);
        }
      }
      setIsSubscribed(false);
      toast.success('Push reminders unsubscribed');
    } catch (err) {
      console.error('Unsubscribe error:', err);
    }
  }, []);

  return {
    isSubscribed,
    subscribe,
    unsubscribe,
    unreadCount,
  };
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
