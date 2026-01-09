'use client';

import { useEffect } from 'react';
import { useQuery } from '@/lib/hooks/useQuery';
import { Button } from '@radix-ui/themes';
import { QueryResult } from './QueryResult';
import { ReActFlow } from './ReActFlow';
import { QueryHistory } from './QueryHistory';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function ChatInterface() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const {
    query,
    result,
    error,
    isPending,
    activeTab,
    setQuery,
    handleSubmitStream,
    handleQuerySelect,
    setActiveTab,
    streamStatus,
    streamSteps,
  } = useQuery();

  // 使用 useEffect 处理重定向，避免在渲染过程中调用 router.push
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // 如果未登录，显示加载状态
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  // 未登录时显示空状态（重定向由 useEffect 处理）
  if (!session) {
    return null;
  }

  // 流式提交处理
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query || !query.trim() || isPending) return;

    await handleSubmitStream(e);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-30 dark:opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(139,92,246,0.15)_1px,transparent_0)] bg-[length:20px_20px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div className="text-center flex-1">
            <h1 className="text-4xl lg:text-5xl font-bold mb-3 gradient-text">
              数据库查询智能体
            </h1>

            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              使用自然语言描述您的查询需求，AI 智能体将自动分析并执行
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="glass rounded-2xl shadow-2xl shadow-violet-200/50 dark:shadow-violet-900/20 overflow-hidden animate-slide-up border border-white/20 dark:border-slate-700/50">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <nav className="flex gap-1 p-2">
              <Button
                variant={activeTab === 'query' ? 'solid' : 'ghost'}
                size="2"
                onClick={() => setActiveTab('query')}
                className="gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                智能查询
              </Button>

              <Button
                variant={activeTab === 'history' ? 'solid' : 'ghost'}
                size="2"
                onClick={() => setActiveTab('history')}
                className="gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                查询历史
              </Button>
            </nav>
          </div>

          {/* Query Tab */}
          {activeTab === 'query' && (
            <div className="p-6 lg:p-8 space-y-6">
              {/* Input Section */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  📝 自然语言查询
                </label>

                <div className="relative">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="试试这些查询：\n• 查询所有用户\n• 统计产品总数\n• 最贵的产品是什么\n• 销售总额是多少"
                    disabled={isPending}
                    className="w-full min-h-[160px] px-5 py-4 rounded-xl border-2 border-slate-200 dark:border-slate-700
                             bg-white dark:bg-slate-950
                             focus:border-violet-500 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-900/30
                             transition-all duration-200 resize-y font-mono text-sm
                             placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />

                  {query && !isPending && (
                    <button
                      onClick={() => setQuery('')}
                      className="absolute top-3 right-3 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                    >
                      清空
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  type="submit"
                  onClick={handleFormSubmit}
                  disabled={!query || !query.trim() || isPending}
                  variant="solid"
                  size="3"
                  className="gap-2 min-w-[140px] bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 shadow-lg shadow-violet-500/30"
                >
                  {isPending ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      执行查询
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="3"
                  onClick={() => setQuery('')}
                  className="gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  重置
                </Button>
              </div>

              {/* 流式状态显示 */}
              {isPending && streamStatus && (
                <div className="animate-fade-in rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="h-5 w-5 text-violet-500 animate-spin" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">查询进行中</p>
                      <p className="text-sm text-violet-700 dark:text-violet-400 mt-1">{streamStatus}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 流式步骤显示 */}
              {isPending && streamSteps.length > 0 && (
                <div className="animate-fade-in space-y-2">
                  {streamSteps.map((step, idx) => (
                    <div key={idx} className="glass rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                      {step.thought && (
                        <div className="text-xs text-slate-600 dark:text-slate-300 mb-1">
                          <span className="font-semibold text-violet-600 dark:text-violet-400">💡 思考:</span> {step.thought}
                        </div>
                      )}
                      {step.action && (
                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-900/50 dark:bg-slate-800/50 p-2 rounded mt-1 overflow-x-auto">
                          {step.action}
                        </div>
                      )}
                      {step.observation && (
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">📊 观察:</span> {JSON.stringify(JSON.parse(step.observation), null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="animate-fade-in rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-800 dark:text-red-300">查询失败</p>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Result Display */}
              {result && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <QueryResult
                      result={result}
                      loading={isPending}
                    />
                  </div>

                  {/* ReAct Flow Visualization */}
                  {result.steps && result.steps.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                      <ReActFlow steps={result.steps} isStreaming={isPending} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="p-6 lg:p-8">
              <QueryHistory onSelectQuery={handleQuerySelect} />
            </div>
          )}
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8 animate-slide-up">
          <div className="glass rounded-xl p-5 border border-white/20 dark:border-slate-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">智能分析</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              AI 自然语言理解，自动转换为 SQL 查询
            </p>
          </div>

          <div className="glass rounded-xl p-5 border border-white/20 dark:border-slate-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">安全可靠</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              只读访问，SQL 注入防护，查询审计
            </p>
          </div>

          <div className="glass rounded-xl p-5 border border-white/20 dark:border-slate-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">ReAct 模式</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              思考 → 行动 → 观察 → 回答的完整推理链
            </p>
          </div>
        </div>

        {/* Quick Examples */}
        <div className="mt-6 glass rounded-xl p-6 border border-white/20 dark:border-slate-700/50 animate-slide-up">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <span className="text-lg">💡</span>
            快速示例
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              '查询所有用户',
              '统计产品总数',
              '最贵的产品是什么',
              '销售总额是多少',
              '按类别统计销量',
              '最近一周的销售',
            ].map((example, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(example)}
                className="text-left px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/30
                         text-sm text-slate-700 dark:text-slate-300 transition-all duration-200
                         border border-transparent hover:border-violet-300 dark:hover:border-violet-700"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}