import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DatabaseDashboard } from '@/components/dashboard/db/DatabaseDashboard';
import { Suspense } from 'react';

export default async function DatabasePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

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
              数据库管理
            </h1>

            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              配置和管理您的数据库连接，浏览表结构，执行SQL查询
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="glass rounded-2xl shadow-2xl shadow-violet-200/50 dark:shadow-violet-900/20 overflow-hidden animate-slide-up border border-white/20 dark:border-slate-700/50">
          <div className="p-6 lg:p-8">
            <Suspense fallback={
              <div className="min-h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <div className="h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-400">正在加载...</p>
                </div>
              </div>
            }>
              <DatabaseDashboard />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
