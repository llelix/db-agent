import { cookies } from 'next/headers';
import { db } from './database/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

// 简化的用户会话管理
export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * 获取当前用户会话
 * 注意: 这是一个简化版本，实际项目应使用 NextAuth, Clerk, Auth.js 等
 */
export async function auth(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return null;
    }

    // 解析 session cookie (简化: 假设包含用户 ID)
    const userId = sessionCookie.value;

    // 查询用户
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
      },
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

/**
 * 创建测试会话 (开发环境使用)
 */
export async function createTestSession(): Promise<AuthSession> {
  // 查找或创建测试用户
  const testEmail = 'test@example.com';

  let testUser = await db.query.users.findFirst({
    where: eq(users.email, testEmail),
  });

  if (!testUser) {
    const result = await db.insert(users).values({
      email: testEmail,
      name: '测试用户',
    }).returning();

    testUser = result[0];
  }

  return {
    user: {
      id: testUser.id,
      email: testUser.email,
      name: testUser.name || '',
    },
  };
}
