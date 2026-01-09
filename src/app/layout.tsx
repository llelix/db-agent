import { ReactNode } from 'react';
import { UserMenu } from '@/components/user-menu';
import { SessionProvider } from '@/components/session-provider';
import Link from 'next/link';
import { Database, Terminal } from 'lucide-react';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <SessionProvider>
          <div className="min-h-screen bg-gray-50">
            {/* 顶部导航栏 */}
            <header className="bg-white border-b">
              <div className="container mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                      <Database className="h-6 w-6 text-blue-600" />
                      <span>数据库管理</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6">
                      <Link
                        href="/"
                        className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2"
                      >
                        <Database className="h-4 w-4" />
                        连接管理
                      </Link>
                      <Link
                        href="/agent"
                        className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2"
                      >
                        <Terminal className="h-4 w-4" />
                        AI查询
                      </Link>
                    </nav>
                  </div>

                  <div className="flex items-center gap-4">
                    <UserMenu />
                  </div>
                </div>
              </div>
            </header>

            {/* 主内容区 */}
            <main className="container mx-auto px-6 py-8">
              {children}
            </main>

            {/* 页脚 */}
            <footer className="border-t mt-12">
              <div className="container mx-auto px-6 py-6 text-center text-sm text-gray-500">
                <p>数据库管理工具 © 2026 - 支持 PostgreSQL 连接管理与查询</p>
              </div>
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
