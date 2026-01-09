'use client';

import { useState, useEffect } from 'react';
import { getQueryHistoryAction } from '@/lib/actions/query-action';
import { Button } from '@radix-ui/themes';

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
      completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      no_sql: 'bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-400',
    };
    return styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-400';
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
      <div className="glass rounded-xl p-8 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-violet-500 animate-pulse-glow" />
            <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse-glow" style={{ animationDelay: '0.1s' }} />
            <div className="h-3 w-3 rounded-full bg-cyan-500 animate-pulse-glow" style={{ animationDelay: '0.2s' }} />
          </div>
          <div className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">
            正在加载查询历史...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">加载失败</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="glass rounded-xl p-8 border border-slate-200 dark:border-slate-700 text-center">
        <svg className="mx-auto h-12 w-12 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-slate-600 dark:text-slate-400">暂无查询历史</p>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">执行查询后，历史记录将显示在这里</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent dark:via-violet-700 flex-1" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            📜 查询历史
          </span>
          <div className="h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent dark:via-violet-700 flex-1" />
        </div>
        <Button
          variant="ghost"
          size="2"
          onClick={() => loadHistory(pagination.page)}
          disabled={loading}
          className="gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新
        </Button>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {history.map((item, idx) => (
          <div
            key={item.id}
            className="glass rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-200 cursor-pointer animate-fade-in hover:scale-[1.01]"
            style={{ animationDelay: `${idx * 0.05}s` }}
            onClick={() => onSelectQuery(item.naturalLanguageQuery)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">
                  {item.naturalLanguageQuery}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(item.createdAt).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span className={`ml-2 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${getStatusBadge(item.status)}`}>
                {getStatusText(item.status)}
              </span>
            </div>

            {item.generatedSql && (
              <div className="mt-3 bg-slate-900 rounded-lg p-3 overflow-x-auto border border-slate-700">
                <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
                  {item.generatedSql}
                </pre>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              {item.executionTimeMs && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800/50">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {item.executionTimeMs}ms
                </span>
              )}
              {item.result && Array.isArray(item.result) && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800/50">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
        <div className="glass rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <Button
            variant="outline"
            size="2"
            disabled={pagination.page === 1}
            onClick={() => loadHistory(pagination.page - 1)}
            className="gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            上一页
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              第 {pagination.page} 页
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              / 共 {pagination.pages} 页
            </span>
          </div>

          <Button
            variant="outline"
            size="2"
            disabled={pagination.page === pagination.pages}
            onClick={() => loadHistory(pagination.page + 1)}
            className="gap-2"
          >
            下一页
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
}
