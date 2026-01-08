'use client';

import { useState } from 'react';
import { Button } from './ui/button';

interface QueryResultData {
  result: string;
  steps: any[];
  sql?: string;
  data?: any[];
  usage?: { input: number; output: number };
}

interface QueryResultProps {
  result: QueryResultData | null;
  loading?: boolean;
}

type ViewMode = 'summary' | 'table' | 'json' | 'sql';

export function QueryResult({ result, loading = false }: QueryResultProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('summary');

  if (loading) {
    return (
      <div className="glass rounded-xl p-8 border border-violet-200 dark:border-violet-800/50">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-violet-500 animate-pulse-glow" />
            <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse-glow" style={{ animationDelay: '0.1s' }} />
            <div className="h-3 w-3 rounded-full bg-cyan-500 animate-pulse-glow" style={{ animationDelay: '0.2s' }} />
          </div>
          <div className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">
            AI 智能体正在思考...
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500">
            正在分析查询、生成 SQL 并执行
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const hasData = result.data && result.data.length > 0;
  const hasSql = !!result.sql;

  // 获取可用的视图模式
  const availableViews: ViewMode[] = ['summary'];
  if (hasSql) availableViews.push('sql');
  if (hasData) availableViews.push('table', 'json');

  const renderView = () => {
    switch (viewMode) {
      case 'summary':
        return (
          <div className="space-y-4">
            <div className="glass rounded-xl p-5 border border-violet-200 dark:border-violet-800/50">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="font-semibold text-slate-900 dark:text-slate-100">执行结果</div>
              </div>
              <div className="text-slate-800 dark:text-slate-200 leading-relaxed text-lg">
                {result.result}
              </div>
            </div>

            {result.usage && (
              <div className="grid grid-cols-3 gap-3">
                <div className="glass rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">输入 Tokens</div>
                  <div className="text-lg font-bold text-violet-600 dark:text-violet-400">
                    {result.usage.input}
                  </div>
                </div>
                <div className="glass rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">输出 Tokens</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {result.usage.output}
                  </div>
                </div>
                <div className="glass rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">预估成本</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    ${(result.usage.input * 0.003 + result.usage.output * 0.015).toFixed(4)}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'sql':
        if (!result.sql) return null;
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <div className="font-semibold text-slate-900 dark:text-slate-100">生成的 SQL</div>
            </div>
            <div className="bg-slate-900 rounded-xl p-5 overflow-x-auto border border-slate-700">
              <pre className="text-sm text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
                {result.sql}
              </pre>
            </div>
          </div>
        );

      case 'table':
        if (!hasData) return null;
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                数据表格 <span className="text-slate-500 dark:text-slate-400 font-normal">({result.data!.length} 行)</span>
              </div>
            </div>
            <div className="glass rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      {Object.keys(result.data![0]).map((key) => (
                        <th
                          key={key}
                          className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-950 divide-y divide-slate-200 dark:divide-slate-700">
                    {result.data!.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        {Object.values(row).map((val, vIdx) => (
                          <td key={vIdx} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">
                            {typeof val === 'object' ? (
                              <pre className="text-xs text-slate-600 dark:text-slate-400">{JSON.stringify(val, null, 2)}</pre>
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
          </div>
        );

      case 'json':
        if (!hasData) return null;
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <div className="font-semibold text-slate-900 dark:text-slate-100">JSON 视图</div>
            </div>
            <div className="bg-slate-900 rounded-xl p-5 overflow-x-auto border border-slate-700">
              <pre className="text-xs text-purple-300 font-mono leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* View Mode Tabs */}
      <div className="flex flex-wrap items-center gap-2 glass rounded-lg p-1 border border-slate-200 dark:border-slate-700">
        {availableViews.map((view) => (
          <button
            key={view}
            onClick={() => setViewMode(view)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === view
                ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {view === 'summary' && '📊 摘要'}
            {view === 'sql' && '💾 SQL'}
            {view === 'table' && '📋 表格'}
            {view === 'json' && '🔧 JSON'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-fade-in">{renderView()}</div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            if (result.sql) {
              navigator.clipboard.writeText(result.sql);
              alert('✅ SQL 已复制到剪贴板');
            }
          }}
          disabled={!result.sql}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          复制 SQL
        </Button>
        {hasData && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              const csv = convertToCSV(result.data!);
              navigator.clipboard.writeText(csv);
              alert('✅ CSV 数据已复制到剪贴板');
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5 3a7 7 0 11-14 0 7 7 0 0114 0zM19 21l-6-6m2 5a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            复制 CSV
          </Button>
        )}
      </div>
    </div>
  );
}

// 辅助函数：将 JSON 数据转换为 CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(header => {
      const value = row[header];
      const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return `\"${str.replace(/\"/g, '\"\"')}\"`;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
