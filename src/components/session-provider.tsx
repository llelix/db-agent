'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { DbContextProvider } from '@/lib/db-context';

/**
 * NextAuth SessionProvider 组件
 * 使用 proxy 模式提供会话状态
 * 同时提供数据库连接上下文
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <DbContextProvider>
        {children}
      </DbContextProvider>
    </NextAuthSessionProvider>
  );
}