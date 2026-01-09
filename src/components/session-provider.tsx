'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

/**
 * NextAuth SessionProvider 组件
 * 使用 proxy 模式提供会话状态
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}