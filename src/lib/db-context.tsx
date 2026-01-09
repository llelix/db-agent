'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { DbConnection } from '@db/schema';

interface DbContextType {
  connections: DbConnection[];
  selectedConnectionId: string | null;
  selectedConnection: DbConnection | null;
  loading: boolean;
  error: string | null;
  selectConnection: (id: string | null) => void;
  refreshConnections: () => Promise<void>;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

/**
 * 数据库连接上下文提供者
 * 管理全局数据库连接状态
 */
export function DbContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [connections, setConnections] = useState<DbConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从localStorage加载保存的选择
  useEffect(() => {
    if (status === 'authenticated') {
      const saved = localStorage.getItem('selectedConnectionId');
      if (saved) {
        setSelectedConnectionId(saved);
      }
    }
  }, [status]);

  // 加载连接列表
  const loadConnections = async () => {
    if (status !== 'authenticated') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/db/connections');
      if (res.ok) {
        const data = await res.json();
        setConnections(data.data || []);
      } else {
        setError('加载连接失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载连接失败');
      console.error('加载连接失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, [status, session]);

  const selectConnection = (id: string | null) => {
    setSelectedConnectionId(id);
    // 保存到localStorage
    if (id) {
      localStorage.setItem('selectedConnectionId', id);
    } else {
      localStorage.removeItem('selectedConnectionId');
    }
  };

  const refreshConnections = async () => {
    await loadConnections();
  };

  const selectedConnection = connections.find(c => c.id === selectedConnectionId) || null;

  const value: DbContextType = {
    connections,
    selectedConnectionId,
    selectedConnection,
    loading,
    error,
    selectConnection,
    refreshConnections,
  };

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

/**
 * 使用数据库连接上下文的hook
 */
export function useDbContext() {
  const context = useContext(DbContext);
  if (context === undefined) {
    throw new Error('useDbContext 必须在 DbContextProvider 内使用');
  }
  return context;
}