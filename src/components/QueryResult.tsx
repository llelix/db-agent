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
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="h-4 w-4 bg-blue-500 rounded-full animate-bounce" />
          <div className="h-4 w-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="h-4 w-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <span className="ml-3 text-gray-600">正在执行查询...</span>
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
          <div className="space-y-3">
            <div className="bg-white border rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">执行结果</div>
              <div className="text-gray-900">{result.result}</div>
            </div>

            {result.usage && (
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 flex gap-4">
                <span>💡 输入: {result.usage.input} tokens</span>
                <span>📤 输出: {result.usage.output} tokens</span>
                <span>💰 估算: ${(result.usage.input * 0.003 + result.usage.output * 0.015).toFixed(4)}</span>
              </div>
            )}
          </div>
        );

      case 'sql':
        if (!result.sql) return null;
        return (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">生成的 SQL</div>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-green-400 font-mono leading-relaxed">
                {result.sql}
              </pre>
            </div>
          </div>
        );

      case 'table':
        if (!hasData) return null;
        return (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">数据表格 ({result.data!.length} 行)</div>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(result.data![0]).map((key) => (
                        <th
                          key={key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.data!.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {Object.values(row).map((val, vIdx) => (
                          <td key={vIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {typeof val === 'object' ? (
                              <pre className="text-xs text-gray-600">{JSON.stringify(val, null, 2)}</pre>
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
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">JSON 视图</div>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-blue-300 font-mono leading-relaxed">
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
      <div className="flex items-center gap-2 border-b">
        {availableViews.map((view) => (
          <button
            key={view}
            onClick={() => setViewMode(view)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              viewMode === view
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {view === 'summary' && '摘要'}
            {view === 'sql' && 'SQL'}
            {view === 'table' && '表格'}
            {view === 'json' && 'JSON'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-fade-in">{renderView()}</div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (result.sql) {
              navigator.clipboard.writeText(result.sql);
              alert('SQL 已复制到剪贴板');
            }
          }}
          disabled={!result.sql}
        >
          复制 SQL
        </Button>
        {hasData && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const csv = convertToCSV(result.data!);
              navigator.clipboard.writeText(csv);
              alert('CSV 数据已复制到剪贴板');
            }}
          >
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
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
