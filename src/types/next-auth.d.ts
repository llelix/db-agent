/**
 * NextAuth v5 类型扩展
 * 为 session 和 JWT 添加自定义字段
 */

import NextAuth, { DefaultSession, DefaultJWT } from 'next-auth';
import { JWT } from 'next-auth/jwt';

// 扩展默认的 Session 类型
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

// 扩展默认的 JWT 类型
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
  }
}