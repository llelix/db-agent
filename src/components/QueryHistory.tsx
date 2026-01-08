'use client';

import { useState, useEffect } from 'react';
import { getQueryHistoryAction } from '../lib/actions/query-action';
import { Button } from './ui/button';

interface QueryHistoryItem {
  id: string;
  naturalLanguageQuery: string;
  generatedSql?: string;
  result?: any[];
  status: string;
  createdAt: Date;
  executionTimeMs?: number;
}

interface QueryHistoryProps {
  onSelectQuery: (query: string) => void;
}

export function QueryHistory({ onSelectQuery }: QueryHistoryProps) {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const loadHistory = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getQueryHistoryAction(page, pagination.limit);

      if (response.error) {
        setError(response.error);
      } else {
        setHistory(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1);
  }, []);

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      no_sql: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      completed: '成功',
      error: '失败',
      no_sql: '无SQL',
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (loading && history.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-600">加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        错误: {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>暂无查询历史</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">查询历史</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadHistory(pagination.page)}
          disabled={loading}
        >
          刷新
        </Button>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-white"
            onClick={() => onSelectQuery(item.naturalLanguageQuery)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {item.naturalLanguageQuery}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(item.createdAt).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full whitespace-nowrap ${getStatusBadge(item.status)}`}>
                {getStatusText(item.status)}
              </span>
            </div>

            {item.generatedSql && (
              <div className="mt-2 bg-gray-50 rounded p-2 text-xs overflow-x-auto">
                <code className="text-blue-700 font-mono">{item.generatedSql}</code>
              </div>
            )}

            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              {item.executionTimeMs && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {item.executionTimeMs}ms
                </span>
              )}
              {item.result && Array.isArray(item.result) && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  {item.result.length} 行
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => loadHistory(pagination.page - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-gray-600">
            第 {pagination.page} / {pagination.pages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.pages}
            onClick={() => loadHistory(pagination.page + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
