import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * NextAuth v5 Proxy 中间件 (Next.js 15+ 推荐)
 * 保护需要认证的路由
 *
 * 注意：Next.js 15+ 推荐使用 Proxy 模式替代传统中间件
 * 但为了兼容性和路由保护，这里仍使用中间件
 */

export async function proxy(request: NextRequest) {
  const session = await auth();

  // 如果用户未登录且尝试访问受保护路由，重定向到登录页
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 如果用户已登录且尝试访问登录页，重定向到仪表板
  if (session && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

/**
 * 配置匹配器
 * 指定哪些路由应该经过中间件
 */
export const config = {
  matcher: [
    /*
     * 匹配所有需要认证的路由
     * - /dashboard 及其子路由
     * - /api/query (我们的查询 API)
     * - /profile 等
     */
    '/dashboard/:path*',
    '/api/query/:path*',
    '/profile/:path*',

    /*
     * 排除静态资源和公共路由
     * - /login, /signup, /api/auth/*
     */
    '/((?!api/auth|login|signup|_next/static|_next/image|favicon.ico|api/health).*)',
  ],
};