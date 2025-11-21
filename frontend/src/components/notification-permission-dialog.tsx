'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export function NotificationPermissionDialog() {
  const { permission, requestPermission } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if we've already shown the dialog in this session
    const shown = sessionStorage.getItem('notification_dialog_shown');
    if (shown) {
      setHasShown(true);
      return;
    }

    // Show dialog after a short delay if permission is default
    if (permission === 'default' && !hasShown) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
        sessionStorage.setItem('notification_dialog_shown', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [permission, hasShown]);

  const handleEnable = async () => {
    await requestPermission();
    setIsOpen(false);
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  // Don't show if already granted or denied
  if (permission !== 'default') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-500"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            Enable Notifications
          </DialogTitle>
          <DialogDescription className="pt-2">
            Get instant alerts when new orders arrive. You&apos;ll hear a sound and see a notification so you never miss an order.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-500 mt-0.5"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <p className="text-sm font-medium">Real-time order alerts</p>
              <p className="text-xs text-gray-500">Know immediately when a new order comes in</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-500 mt-0.5"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <p className="text-sm font-medium">Sound notifications</p>
              <p className="text-xs text-gray-500">Audio alert even when the tab is in background</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="outline" onClick={handleDismiss}>
            Maybe Later
          </Button>
          <Button onClick={handleEnable}>
            Enable Notifications
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
