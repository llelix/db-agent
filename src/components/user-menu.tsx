'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * 用户菜单组件
 * 显示当前登录用户和退出登录按钮
 */
export function UserMenu() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="relative">
        <button className="px-4 py-2 text-gray-600 bg-gray-100 rounded">
          加载中...
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative">
        <button
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          登录
        </button>
      </div>
    );
  }

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors">
        <span className="font-medium text-gray-700">
          {session.user.name || session.user.email}
        </span>
        <svg
          className="w-4 h-4 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉菜单 */}
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="py-1">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
            <p className="text-xs text-gray-500">{session.user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}