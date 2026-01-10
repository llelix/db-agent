'use client';

import { useState, useEffect } from 'react';
import { useDbContext } from '@/lib/db-context';
import { Loader2, Table as TableIcon, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface TableInfo {
  name: string;
  rowCount: number;
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: any;
  }>;
}

interface TableData {
  rows: any[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export function TableBrowser() {
  const { selectedConnectionId, selectedConnection } = useDbContext();
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'structure' | 'data'>('list');

  useEffect(() => {
    if (selectedConnectionId) {
      validateAndClearCache(selectedConnectionId);
      loadTables();
      setSelectedTable(null);
      setTableInfo(null);
      setTableData(null);
      setActiveTab('list');
    }
  }, [selectedConnectionId]);

  const validateAndClearCache = async (connId: string) => {
    try {
      const res = await fetch(`/api/db/${connId}/validate`);
      if (res.ok) {
        const data = await res.json();
        if (data.cleared) {
          console.log('已清除连接缓存:', connId);
        }
      }
    } catch (err) {
      console.warn('连接验证失败:', err);
    }
  };

  useEffect(() => {
    if (selectedTable) {
      if (activeTab === 'structure') {
        loadTableStructure();
      } else if (activeTab === 'data') {
        loadTableData();
      }
    }
  }, [selectedTable, activeTab]);

  const loadTables = async () => {
    if (!selectedConnectionId) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/db/${selectedConnectionId}/tables`);
      if (!res.ok) {
        throw new Error('加载表列表失败');
      }

      const data = await res.json();
      if (data.success) {
        setTables(data.data);
      } else {
        throw new Error(data.error || '加载表列表失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载表列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTableStructure = async () => {
    if (!selectedConnectionId || !selectedTable) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/db/${selectedConnectionId}/tables/${selectedTable}`);
      if (!res.ok) {
        throw new Error('加载表结构失败');
      }

      const data = await res.json();
      if (data.success) {
        setTableInfo(data.data);
      } else {
        throw new Error(data.error || '加载表结构失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载表结构失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (offset = 0) => {
    if (!selectedConnectionId || !selectedTable) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/db/${selectedConnectionId}/data/${selectedTable}?limit=50&offset=${offset}`);
      if (!res.ok) {
        throw new Error('加载表数据失败');
      }

      const data = await res.json();
      if (data.success) {
        setTableData(data.data);
      } else {
        throw new Error(data.error || '加载表数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载表数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newOffset: number) => {
    loadTableData(newOffset);
  };

  if (loading && !tables.length) {
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

      {/* No Connection */}
      {!selectedConnectionId && (
        <div className="flex flex-col items-center justify-center py-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
          <p className="text-slate-600 dark:text-slate-400">请在导航栏的数据库切换器中选择一个数据库连接</p>
        </div>
      )}

      {/* Main Content */}
      {selectedConnectionId && selectedConnection && (
        <>
          {/* Table List Card */}
          <div className="glass rounded-xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">数据表列表</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">选择要浏览的表，查看结构或数据</p>
            </div>

            <div className="px-6 py-6">
              {tables.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <p>该数据库暂无表</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {tables.map((table) => (
                    <button
                      key={table}
                      onClick={() => setSelectedTable(table)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                        selectedTable === table
                          ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-500/30'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <TableIcon className="h-4 w-4" />
                      {table}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table Details */}
          {selectedTable && (
            <div className="glass rounded-xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TableIcon className="h-5 w-5 text-violet-600" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedTable}</h3>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {tableInfo?.rowCount ?? 0} 行
                  </span>
                </div>
              </div>

              <div className="px-6 py-6 space-y-4">
                {/* Tabs */}
                <div className="flex gap-2">
                  {[
                    { id: 'list', label: '列表' },
                    { id: 'structure', label: '结构' },
                    { id: 'data', label: '数据' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        activeTab === tab.id
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div>
                  {activeTab === 'list' && (
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <p>点击上方标签页查看：</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>结构</strong>：查看表的列定义、数据类型、约束等</li>
                        <li><strong>数据</strong>：浏览表中的实际数据（最多50行/页）</li>
                      </ul>
                    </div>
                  )}

                  {activeTab === 'structure' && (
                    <>
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                          <span className="ml-2 text-gray-500">加载结构中...</span>
                        </div>
                      ) : tableInfo ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              总行数: {tableInfo.rowCount}
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                              {tableInfo.columns.length} 列
                            </span>
                          </div>

                          <div className="overflow-x-auto max-h-[400px]">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                                <tr>
                                  <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">列名</th>
                                  <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">类型</th>
                                  <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">可空</th>
                                  <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">默认值</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {tableInfo.columns.map((col) => (
                                  <tr key={col.column_name} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">{col.column_name}</td>
                                    <td className="px-4 py-2">
                                      <span className="px-2 py-0.5 text-xs rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                                        {col.data_type}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2">
                                      {col.is_nullable === 'YES' ? (
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">是</span>
                                      ) : (
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">否</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                                      {col.column_default || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          <p>请选择一个表查看结构</p>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'data' && (
                    <>
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                          <span className="ml-2 text-gray-500">加载数据中...</span>
                        </div>
                      ) : tableData ? (
                        <div className="space-y-4">
                          {tableData.rows.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                              <p>表中无数据</p>
                            </div>
                          ) : (
                            <>
                              <div className="overflow-x-auto max-h-[400px]">
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                                    <tr>
                                      {Object.keys(tableData.rows[0] || {}).map((key) => (
                                        <th key={key} className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                                          {key}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {tableData.rows.map((row, idx) => (
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

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                  显示 {tableData.pagination.offset + 1} -{' '}
                                  {Math.min(
                                    tableData.pagination.offset + tableData.rows.length,
                                    tableData.pagination.total
                                  )}{' '}
                                  条，共 {tableData.pagination.total} 条
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handlePageChange(tableData.pagination.offset - 50)}
                                    disabled={tableData.pagination.offset === 0}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                    上一页
                                  </button>
                                  <button
                                    onClick={() => handlePageChange(tableData.pagination.offset + 50)}
                                    disabled={!tableData.pagination.hasMore}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    下一页
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          <p>点击"数据"标签页加载表数据</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}