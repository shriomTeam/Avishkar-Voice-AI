'use client';
import type { ReactNode } from 'react';
import type { AuthState } from '@/lib/auth/types';
import { AuthProvider } from '@/lib/auth/provider';
import { DemoProvider } from '@/lib/demo/provider';
import { Shell } from './shell';
export function AuthenticatedWorkspace({
  initial,
  children,
}: {
  initial: AuthState;
  children: ReactNode;
}) {
  return (
    <AuthProvider initial={initial}>
      <DemoProvider identity={initial}>
        <Shell>{children}</Shell>
      </DemoProvider>
    </AuthProvider>
  );
}
