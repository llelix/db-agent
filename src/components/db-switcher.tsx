'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Database, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useDbContext } from '@/lib/db-context';

/**
 * 数据库切换器组件
 * 显示在导航栏中，允许用户快速切换数据库连接
 * 使用全局状态管理
 */
export function DbSwitcher() {
  const { data: session, status } = useSession();
  const { connections, selectedConnection, selectConnection, loading } = useDbContext();
  const [open, setOpen] = useState(false);

  const handleSelect = (connectionId: string) => {
    setOpen(false);
    selectConnection(connectionId);
  };

  const handleClear = () => {
    setOpen(false);
    selectConnection(null);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">加载中...</span>
      </div>
    );
  }

  if (!session || connections.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* 触发按钮 - 显示当前选择的数据库 */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded transition-colors text-sm border ${
          selectedConnection
            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700'
            : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700'
        }`}
      >
        <Database className="h-4 w-4" />
        <span className="max-w-[120px] truncate font-medium">
          {selectedConnection ? selectedConnection.name : '选择数据库'}
        </span>
        {selectedConnection && (
          <CheckCircle2 className="h-3 w-3 text-green-600" />
        )}
        <ChevronDown className="h-3 w-3" />
      </button>

      {/* 下拉菜单 */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="py-1 max-h-80 overflow-y-auto">
            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-600">数据库连接 ({connections.length})</p>
            </div>

            {connections.map((conn) => (
              <button
                key={conn.id}
                onClick={() => handleSelect(conn.id)}
                className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 hover:bg-blue-50 transition-colors ${
                  selectedConnection?.id === conn.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
              >
                <Database className="h-3.5 w-3.5" />
                <span className="flex-1 truncate">{conn.name}</span>
                <span className="text-xs text-gray-400 truncate max-w-[80px]">
                  {conn.host}:{conn.port}
                </span>
                {selectedConnection?.id === conn.id && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                )}
              </button>
            ))}

            {selectedConnection && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleClear}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <span>清除选择</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}