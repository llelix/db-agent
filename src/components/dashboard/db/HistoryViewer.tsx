'use client';

import { useState, useEffect } from 'react';
import { Loader2, History, Trash2, Filter, Database, RefreshCw, AlertCircle } from 'lucide-react';

interface HistoryEntry {
  id: string;
  connectionId: string | null;
  action: string;
  details: any;
  createdAt: string;
}

export function HistoryViewer() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [connections, setConnections] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterConnection, setFilterConnection] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');

  useEffect(() => {
    loadHistory();
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const res = await fetch('/api/db/connections');
      const data = await res.json();
      if (data.success) {
        setConnections(data.data);
      }
    } catch (err) {
      console.error('加载连接失败:', err);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterConnection !== 'all') params.set('connectionId', filterConnection);
      if (filterAction !== 'all') params.set('action', filterAction);

      const res = await fetch(`/api/db/history?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setHistory(data.data.history);
      } else {
        throw new Error(data.error || '加载历史失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载历史失败');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('确定要清空所有历史记录吗？此操作不可恢复。')) return;

    try {
      const params = new URLSearchParams();
      if (filterConnection !== 'all') params.set('connectionId', filterConnection);

      const res = await fetch(`/api/db/history?${params.toString()}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setHistory([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '清空历史失败');
    }
  };

  const getActionBadgeColor = (action: string) => {
    const colors = {
      create: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      update: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      delete: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      test: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      browse: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      query: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
      security: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    } as const;
    return colors[action as keyof typeof colors] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
  };

  const getConnectionName = (connectionId: string | null) => {
    if (!connectionId) return '系统';
    return connections.find(c => c.id === connectionId)?.name || connectionId;
  };

  const formatDetails = (details: any) => {
    if (!details) return '-';
    if (typeof details === 'string') return details;
    return JSON.stringify(details);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {/* Main Card */}
      <div className="glass rounded-xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-violet-600" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">操作历史记录</h3>
            </div>
            <button
              onClick={clearHistory}
              disabled={history.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              清空记录
            </button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            查看所有数据库连接操作的历史记录
          </p>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Connection Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex gap-1">
                <button
                  onClick={() => setFilterConnection('all')}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    filterConnection === 'all'
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  所有连接
                </button>
                {connections.map((conn) => (
                  <button
                    key={conn.id}
                    onClick={() => setFilterConnection(conn.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      filterConnection === conn.id
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {conn.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Filter */}
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-gray-500" />
              <div className="flex gap-1">
                {[
                  { value: 'all', label: '所有操作' },
                  { value: 'create', label: '创建' },
                  { value: 'update', label: '更新' },
                  { value: 'delete', label: '删除' },
                  { value: 'test', label: '测试' },
                  { value: 'browse', label: '浏览' },
                  { value: 'query', label: '查询' },
                  { value: 'security', label: '安全' },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setFilterAction(item.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      filterAction === item.value
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadHistory}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              刷新
            </button>
          </div>
        </div>

        {/* History Table */}
        <div className="px-6 py-6">
          {history.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p>暂无历史记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">时间</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">连接</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">操作</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">详情</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {getConnectionName(item.connectionId)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getActionBadgeColor(item.action)}`}>
                          {item.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-700 dark:text-slate-300" style={{ maxWidth: 300, wordBreak: 'break-all' }}>
                          {formatDetails(item.details)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="px-6 py-6 border-t border-slate-200 dark:border-slate-700 bg-white/30 dark:bg-slate-900/30">
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">统计信息</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {history.filter(h => h.action === 'create').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">创建连接</div>
            </div>
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {history.filter(h => h.action === 'test').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">连接测试</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {history.filter(h => h.action === 'browse').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">浏览操作</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {history.filter(h => h.action === 'query').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">SQL查询</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}