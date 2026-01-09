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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">数据库管理</h1>
        <p className="text-gray-600 mt-2">
          配置和管理您的数据库连接，浏览表结构，执行SQL查询
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-8">加载中...</div>}>
        <DatabaseDashboard />
      </Suspense>
    </div>
  );
}
