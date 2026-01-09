import { handlers } from '@/lib/auth';

/**
 * NextAuth v5 API 路由 - Proxy 模式 (Next.js 15+ 推荐)
 * 处理所有认证相关的请求
 *
 * 自动处理以下路径：
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/callback
 * - /api/auth/session
 * - /api/auth/csrf
 * - /api/auth/providers
 */
export const { GET, POST } = handlers;
