'use client';

import { AuthProvider } from '@/lib/auth';
import { NotificationProvider } from '@/lib/notifications';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </AuthProvider>
  );
}
