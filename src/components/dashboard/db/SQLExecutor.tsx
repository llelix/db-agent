'use client';

import { useState } from 'react';
import { Loader2, Terminal, Play, History, Trash2, Info, X, AlertCircle } from 'lucide-react';

interface SQLExecutorProps {
  connectionId: string;
}

interface QueryResult {
  rows: any[];
  executionTime: number;
  rowCount: number;
}

interface QueryHistory {
  id: string;
  query: string;
  executionTime: number;
  rowCount: number;
  createdAt: string;
  success: boolean;
}

export function SQLExecutor({ connectionId }: SQLExecutorProps) {
  const [sql, setSql] = useState('SELECT * FROM your_table LIMIT 10;');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const executeQuery = async () => {
    if (!sql.trim()) {
      setError('请输入SQL查询语句');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await fetch(`/api/db/${connectionId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sql.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '查询执行失败');
      }

      if (data.success) {
        setResult(data.data);
        loadHistory();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询执行失败');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(`/api/db/history?limit=20`);
      const data = await res.json();

      if (data.success) {
        setHistory(
          data.data.history
            .filter((h: any) => h.action === 'query')
            .map((h: any) => ({
              id: h.id,
              query: h.details?.sql || h.action,
              executionTime: h.details?.executionTime || 0,
              rowCount: h.details?.rowCount || 0,
              createdAt: h.createdAt,
              success: h.details?.success !== false,
            }))
        );
      }
    } catch (err) {
      console.error('加载历史失败:', err);
    }
  };

  const clearHistory = async () => {
    try {
      const res = await fetch(`/api/db/history?action=query`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setHistory([]);
      }
    } catch (err) {
      console.error('清空历史失败:', err);
    }
  };

  const loadHistoryFromDialog = () => {
    loadHistory();
    setShowHistory(true);
  };

  return (
    <div className="space-y-4">
      {/* Main Card */}
      <div className="glass rounded-xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-violet-600" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">SQL查询编辑器</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadHistoryFromDialog}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <History className="h-4 w-4" />
                历史记录
              </button>
              <button
                onClick={executeQuery}
                disabled={loading || !sql.trim()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors shadow-lg shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                执行查询
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            输入SQL查询语句，支持SELECT、WITH等查询操作
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          {/* SQL Input */}
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="输入SQL查询语句..."
            disabled={loading}
            className="w-full min-h-[128px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30 transition-all disabled:opacity-50"
          />

          {/* Error Alert */}
          {error && (
            <div className="animate-fade-in rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">错误</p>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Query Result */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <span className="px-2 py-1 text-xs rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium">
                    执行时间: {result.executionTime}ms
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    返回行数: {result.rowCount}
                  </span>
                </div>
                <button
                  onClick={() => setResult(null)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  清除结果
                </button>
              </div>

              {result.rowCount === 0 ? (
                <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Info className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 dark:text-blue-300">查询执行成功，但未返回任何数据</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                        <tr>
                          {Object.keys(result.rows[0] || {}).map((key) => (
                            <th key={key} className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {result.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            {Object.values(row).map((val, i) => (
                              <td key={i} className="px-4 py-2 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap" title={String(val)}>
                                {val === null ? (
                                  <span className="text-gray-400">NULL</span>
                                ) : typeof val === 'object' ? (
                                  <span className="text-gray-500">[Object]</span>
                                ) : (
                                  String(val)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Safety Info */}
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p><strong>支持的操作：</strong> SELECT, WITH, EXPLAIN, DESCRIBE, SHOW</p>
            <p><strong>限制：</strong> 禁止执行 INSERT, UPDATE, DELETE, DROP 等修改操作</p>
            <p><strong>安全：</strong> 所有查询都会被记录，包含敏感操作的查询将被阻止</p>
          </div>
        </div>
      </div>

      {/* History Dialog */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div className="glass rounded-2xl shadow-2xl max-w-2xl w-full max-h-[600px] border border-white/20 dark:border-slate-700/50 overflow-hidden flex flex-col">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">查询历史记录</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">最近执行的SQL查询记录</p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <p>暂无查询历史</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${item.success ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                          {item.success ? '成功' : '失败'}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <code className="block font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded text-xs break-all text-slate-700 dark:text-slate-300 mb-2">
                        {item.query}
                      </code>
                      <div className="flex gap-3 text-xs text-slate-600 dark:text-slate-400">
                        <span>耗时: {item.executionTime}ms</span>
                        <span>行数: {item.rowCount}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 flex justify-end">
              <button
                onClick={clearHistory}
                disabled={history.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
                清空历史
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}