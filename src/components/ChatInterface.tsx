'use client';

import { useOptimistic } from 'react';
import { useQuery } from '../lib/hooks/useQuery';
import { Button } from './ui/button';
import { QueryResult } from './QueryResult';
import { ReActFlow } from './ReActFlow';
import { QueryHistory } from './QueryHistory';

interface QueryResultData {
  result: string;
  steps: any[];
  sql?: string;
  data?: any[];
  usage?: { input: number; output: number };
}

export function ChatInterface() {
  const {
    query,
    result,
    error,
    isPending,
    activeTab,
    setQuery,
    handleSubmit,
    handleQuerySelect,
    setActiveTab,
  } = useQuery();

  // useOptimistic for instant UI updates
  const [optimisticResult, addOptimisticResult] = useOptimistic(
    result,
    (state, newResult: QueryResultData) => newResult
  );

  // Wrap handleSubmit with optimistic update
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isPending) return;

    // 乐观更新 - 立即显示处理状态
    addOptimisticResult({
      result: '正在处理您的查询，AI 智能体正在思考...',
      steps: [],
    });

    await handleSubmit(e);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">数据库查询智能体</h1>
        <p className="text-gray-600">
          使用自然语言描述您的查询需求，AI 智能体将自动分析并执行
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b px-4">
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab('query')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'query'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              📝 查询
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              📚 历史记录
            </button>
          </nav>
        </div>

        {/* Query Tab */}
        {activeTab === 'query' && (
          <div className="p-6 space-y-6">
            {/* Input Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                  自然语言查询
                </label>
                <textarea
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="例如：
• 查询最近一周的销售总额
• 按产品分类统计销量
• 查找价格高于100的产品
• 统计每个用户的购买次数"
                  className="w-full min-h-[140px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y font-mono text-sm"
                  disabled={isPending}
                />
              </div>

              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  disabled={!query.trim() || isPending}
                  size="lg"
                  className="min-w-[120px]"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      处理中...
                    </span>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      执行查询
                    </>
                  )}
                </Button>

                {query.trim() && !isPending && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    清空
                  </button>
                )}
              </div>
            </form>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <p className="text-sm font-medium text-red-800">查询失败</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Result Display */}
            {(optimisticResult || result) && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-t pt-6">
                  <QueryResult
                    result={result || optimisticResult}
                    loading={isPending}
                  />
                </div>

                {/* ReAct Flow Visualization */}
                {result?.steps && result.steps.length > 0 && (
                  <div className="border-t pt-6">
                    <ReActFlow steps={result.steps} isStreaming={isPending} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="p-6">
            <QueryHistory onSelectQuery={handleQuerySelect} />
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              使用说明
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>使用自然语言描述查询需求</li>
              <li>支持用户、产品、销售数据查询</li>
              <li>AI 自动分析并生成 SQL</li>
              <li>所有查询自动保存到历史</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" />
              </svg>
              ReAct 模式
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Thought: AI 分析用户意图</li>
              <li>Action: 调用数据库工具</li>
              <li>Observation: 分析查询结果</li>
              <li>Final: 生成最终回答</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
