import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DatabaseDashboard } from './DatabaseDashboard';

/**
 * 服务端包装器，用于处理认证和初始数据加载
 */
export default async function DatabaseDashboardWrapper() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return <DatabaseDashboard />;
}
