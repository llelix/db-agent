import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * NextAuth v5 Proxy API 路由 (Next.js 15+ 推荐)
 * 用于保护路由和获取认证状态
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  return NextResponse.json({
    authenticated: !!session,
    session: session ? {
      user: {
        id: session.user?.id,
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image,
      },
      expires: session.expires,
    } : null,
  });
}

export async function POST(request: NextRequest) {
  // 处理认证相关的 POST 请求
  const session = await auth();
  return NextResponse.json({
    authenticated: !!session,
    session,
  });
}
